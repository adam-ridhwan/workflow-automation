import { ConvexError } from 'convex/values';

/**
 * AES-256-GCM helpers for workspace secrets, built on the Web Crypto API so they
 * run in any Convex runtime. The 32-byte master key comes from the SECRETS_KEY
 * env var (base64) and is never persisted. Web Crypto's AES-GCM appends the auth
 * tag to the ciphertext, so there's no separate tag to store.
 */

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function masterKey(): Promise<CryptoKey> {
  const encoded = process.env.SECRETS_KEY;
  if (!encoded) {
    throw new ConvexError(
      'Secrets are not configured. Set SECRETS_KEY (a 32-byte base64 key) ' +
        'with: npx convex env set SECRETS_KEY "$(openssl rand -base64 32)"'
    );
  }
  const raw = base64ToBytes(encoded);
  if (raw.length !== 32) {
    throw new ConvexError('SECRETS_KEY must be a 32-byte base64 value.');
  }
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Encrypts a plaintext secret; returns base64 ciphertext (tag appended) + iv. */
export async function encryptSecret(
  plaintext: string
): Promise<EncryptedSecret> {
  const key = await masterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

/** Decrypts a secret produced by `encryptSecret`. Throws if the master key is
 * wrong or the ciphertext was tampered with. */
export async function decryptSecret(secret: EncryptedSecret): Promise<string> {
  const key = await masterKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(secret.iv) },
    key,
    base64ToBytes(secret.ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}
