import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { sealToken, openToken } from './crypto';

const KEY = randomBytes(32).toString('base64');

describe('drive token encryption', () => {
  beforeEach(() => {
    process.env.DRIVE_TOKEN_KEY = KEY;
  });

  afterEach(() => {
    process.env.DRIVE_TOKEN_KEY = KEY;
  });

  it('round-trips a refresh token', () => {
    const token = '1//0abcDEF_ghiJKL-mnoPQR';
    expect(openToken(sealToken(token))).toBe(token);
  });

  it('produces a different ciphertext each time', () => {
    // A fresh IV per seal. Without this, identical tokens would encrypt
    // identically and the table would leak which users share a token state.
    const a = sealToken('same-token');
    const b = sealToken('same-token');
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('refuses a tampered ciphertext instead of returning garbage', () => {
    // This is the reason for GCM over CBC: a modified row must fail loudly,
    // not decrypt to rubbish that then gets sent to Google as a token.
    const sealed = sealToken('a-real-token');
    const bytes = Buffer.from(sealed.ciphertext, 'base64');
    bytes[0] ^= 0xff;

    expect(() =>
      openToken({ ...sealed, ciphertext: bytes.toString('base64') })
    ).toThrow();
  });

  it('refuses a tampered auth tag', () => {
    const sealed = sealToken('a-real-token');
    const tag = Buffer.from(sealed.authTag, 'base64');
    tag[0] ^= 0xff;

    expect(() => openToken({ ...sealed, authTag: tag.toString('base64') })).toThrow();
  });

  it('cannot be decrypted with a different key', () => {
    const sealed = sealToken('a-real-token');
    process.env.DRIVE_TOKEN_KEY = randomBytes(32).toString('base64');
    expect(() => openToken(sealed)).toThrow();
  });

  it('rejects a key that is not 32 bytes', () => {
    // Base64 decoding never throws on bad input — it just yields short output —
    // so the length check is the only validation available, and a 16-byte key
    // would otherwise fail deep inside createCipheriv.
    process.env.DRIVE_TOKEN_KEY = randomBytes(16).toString('base64');
    expect(() => sealToken('x')).toThrow(/32 bytes/);
  });

  it('fails when no key is configured', () => {
    delete process.env.DRIVE_TOKEN_KEY;
    expect(() => sealToken('x')).toThrow(/DRIVE_TOKEN_KEY/);
  });
});
