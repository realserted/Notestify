import { NextResponse } from 'next/server';
import { ContentBlockedError, ResponseTruncatedError } from './gemini';

/**
 * Turns a generation failure into something the user can act on.
 *
 * Every generation route previously ended in `catch` -> "Generation failed",
 * which is the same message whether the model refused the content, ran out of
 * budget mid-answer, or the database write failed. The three have different
 * remedies, and collapsing them cost real debugging time: a truncated response
 * surfaced as an unexplained failure with nothing naming the cause.
 *
 * Shared rather than inlined so a sixth route cannot quietly reintroduce the
 * blind catch.
 */
export const generationFailureResponse = (scope: string, error: unknown) => {
  // Never the error object: prompts contain the user's own study material.
  console.error(`[${scope}]`, error instanceof Error ? error.name : 'unknown');

  if (error instanceof ContentBlockedError) {
    return NextResponse.json(
      {
        error:
          'That content was blocked by the AI safety filter. Try a different document or a smaller section.',
      },
      { status: 422 }
    );
  }

  if (error instanceof ResponseTruncatedError) {
    return NextResponse.json(
      {
        error:
          'That was too long to finish in one go. Try fewer questions, or a shorter section of the document.',
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 });
};
