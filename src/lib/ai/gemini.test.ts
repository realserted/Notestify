import { describe, it, expect } from 'vitest';
import type { EnhancedGenerateContentResponse } from '@google/generative-ai';
import { readResponseText, extractJSON, ContentBlockedError, ResponseTruncatedError } from './gemini';

/**
 * Minimal stand-in for the SDK response. Only the three things
 * readResponseText actually reads are modelled.
 */
const fakeResponse = (opts: {
  text?: string;
  finishReason?: string;
  blockReason?: string;
}): EnhancedGenerateContentResponse =>
  ({
    promptFeedback: opts.blockReason ? { blockReason: opts.blockReason } : undefined,
    candidates: opts.finishReason ? [{ finishReason: opts.finishReason }] : [],
    text: () => opts.text ?? '',
  }) as unknown as EnhancedGenerateContentResponse;

describe('readResponseText', () => {
  it('returns the text on a normal finish', () => {
    expect(readResponseText(fakeResponse({ text: '[{"q":"a"}]', finishReason: 'STOP' }))).toBe(
      '[{"q":"a"}]'
    );
  });

  it('throws on a truncated response rather than returning partial text', () => {
    // The bug this file exists for. gemini-2.5-flash reasons before answering
    // and those tokens count against maxOutputTokens, so a long document left
    // too little budget to finish. The response was a 200 carrying real-looking
    // text, so the half-written JSON flowed into extractJSON and died there as
    // an unexplained parse error — surfacing to users as "Generation failed"
    // with nothing naming the cause.
    const truncated = '[{"question": "What is the first rule", "options": ["a", "b"';

    expect(() => readResponseText(fakeResponse({ text: truncated, finishReason: 'MAX_TOKENS' }))).toThrow(
      ResponseTruncatedError
    );
  });

  it('keeps truncation distinct from a safety block', () => {
    // Different causes, different remedies: send less, versus send something
    // else. Collapsing them is what made this hard to diagnose.
    let truncated: unknown;
    let blocked: unknown;
    try {
      readResponseText(fakeResponse({ text: 'x', finishReason: 'MAX_TOKENS' }));
    } catch (e) {
      truncated = e;
    }
    try {
      readResponseText(fakeResponse({ text: 'x', finishReason: 'SAFETY' }));
    } catch (e) {
      blocked = e;
    }

    expect(truncated).toBeInstanceOf(ResponseTruncatedError);
    expect(blocked).toBeInstanceOf(ContentBlockedError);
    expect(truncated).not.toBeInstanceOf(ContentBlockedError);
  });

  it('throws on a blocked prompt before looking at candidates', () => {
    expect(() => readResponseText(fakeResponse({ blockReason: 'SAFETY' }))).toThrow(
      ContentBlockedError
    );
  });

  it('throws on RECITATION', () => {
    expect(() => readResponseText(fakeResponse({ text: 'x', finishReason: 'RECITATION' }))).toThrow(
      ContentBlockedError
    );
  });

  it('throws on empty text even when the finish looks clean', () => {
    expect(() => readResponseText(fakeResponse({ text: '   ', finishReason: 'STOP' }))).toThrow(
      ContentBlockedError
    );
  });
});

describe('extractJSON', () => {
  it('parses a bare array', () => {
    expect(extractJSON('[{"a":1}]')).toEqual([{ a: 1 }]);
  });

  it('strips a markdown fence the model was told not to add', () => {
    expect(extractJSON('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
  });

  it('ignores prose around the JSON', () => {
    expect(extractJSON('Here you go:\n[{"a":1}]\nHope that helps.')).toEqual([{ a: 1 }]);
  });

  it('throws on truncated JSON rather than returning something partial', () => {
    // readResponseText should stop this reaching here, but if it ever does the
    // failure must be loud rather than a half-built quiz written to the database.
    expect(() => extractJSON('[{"question": "What is', )).toThrow();
  });
});
