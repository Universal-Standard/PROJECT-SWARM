import crypto from "crypto";
import { logger } from "../lib/logger";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive and cache the encryption key at module load time.
 * crypto.scryptSync is an intentionally expensive KDF — calling it on every
 * encrypt/decrypt operation would be a significant performance problem.
 */
function deriveEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  const salt = process.env.ENCRYPTION_SALT;

  if (!salt) {
    logger.warn(
      "ENCRYPTION_SALT not set in environment. Using insecure default salt for development only!"
    );
  }

  const effectiveSalt = salt || "dev-only-salt-not-for-production";

  if (!key) {
    logger.warn(
      "ENCRYPTION_KEY not set in environment. Using insecure default key for development only!"
    );
    return crypto.scryptSync("dev-only-key-not-for-production", effectiveSalt, KEY_LENGTH);
  }

  return crypto.scryptSync(key, effectiveSalt, KEY_LENGTH);
}

// Derived once at module load — never recalculated
const ENCRYPTION_KEY: Buffer = deriveEncryptionKey();

/**
 * Encrypt a string value
 * @param text The plaintext to encrypt
 * @returns Base64-encoded encrypted data with IV and auth tag
 */
export function encrypt(text: string): string {
  if (!text) return "";

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "base64")]);

  return combined.toString("base64");
}

/**
 * Decrypt an encrypted string
 * @param encryptedData Base64-encoded encrypted data with IV and auth tag
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return "";

  const combined = Buffer.from(encryptedData, "base64");

  // Extract iv, authTag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString("base64"), "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Mask a token to show only last 4 characters
 * @param token The token to mask
 * @returns Masked token (e.g., "****abcd")
 */
export function maskToken(token: string | null | undefined): string {
  if (!token || token.length < 4) return "****";
  return "****" + token.slice(-4);
}
