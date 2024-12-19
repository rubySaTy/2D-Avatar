import crypto from "crypto";

if (!process.env.CRYPTO_SECRET) throw new Error("Missing CRYPTO_SECRET");

// Set a consistent key and IV length for AES
const ALGORITHM = "aes-256-cbc"; // AES encryption with 256-bit key and CBC mode
const KEY = crypto
  .createHash("sha256")
  .update(process.env.CRYPTO_SECRET)
  .digest(); // Derive 256-bit key from the secret
const IV_LENGTH = 16; // Initialization Vector length for AES

export function encrypt(value: string) {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(value, "utf8", "base64");
  encrypted += cipher.final("base64");
  return `${iv.toString("base64")}:${encrypted}`; // Return IV and ciphertext separated by a colon
}

export function decrypt(encryptedValue: string): string {
  const [ivBase64, encrypted] = encryptedValue.split(":");
  if (!ivBase64 || !encrypted)
    throw new Error("Invalid encrypted value format");

  const iv = Buffer.from(ivBase64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
