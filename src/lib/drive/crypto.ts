import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Envelope encryption for Drive refresh tokens.
 *
 * A refresh token is a long-lived credential to a user's Google account, so it
 * never sits in Postgres in the clear. RLS scopes the row to its owner; this
 * makes the row inert even to someone holding it.
 *
 * AES-256-GCM rather than CBC: GCM is authenticated, so a tampered ciphertext
 * fails loudly on decrypt instead of producing garbage that gets sent to
 * Google as a token.
 */

const ALGORITHM = 'aes-256-gcm';

/** 96 bits is the GCM-recommended IV size, and what every implementation expects. */
const IV_BYTES = 12;

const KEY_BYTES = 32;

export interface SealedToken {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Read the key at call time, not module load. A missing key should fail the
 * one request that needed it, not crash the process on import and take down
 * every unrelated route with it.
 */
const getKey = (): Buffer => {
  const raw = process.env.DRIVE_TOKEN_KEY;
  if (!raw) {
    throw new Error('DRIVE_TOKEN_KEY is not set');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    // Base64 decoding never throws on bad input, it just produces short
    // output — so the length check is the only real validation available.
    throw new Error(`DRIVE_TOKEN_KEY must decode to ${KEY_BYTES} bytes`);
  }

  return key;
};

export const sealToken = (plaintext: string): SealedToken => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
};

/** Throws if the ciphertext was tampered with or the key has changed. */
export const openToken = ({ ciphertext, iv, authTag }: SealedToken): string => {
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};
