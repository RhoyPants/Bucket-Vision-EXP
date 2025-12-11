import crypto from "crypto";

const algorithm = "aes-256-cbc";

const INT_KEY = process.env.NEXT_PUBLIC_INT_KEY;
const INT_IV = process.env.NEXT_PUBLIC_INT_IV;

if (!INT_KEY || !INT_IV) {
  throw new Error("Missing INT_KEY or INT_IV in environment variables");
}

const p_int_key = Buffer.from(INT_KEY, "hex");
const p_int_iv = Buffer.from(INT_IV, "hex");

export function aes_int_encrypt(text: string): string {
  let cipher = crypto.createCipheriv(algorithm, p_int_key, p_int_iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function aes_int_decrypt(encrypted: string): string {
  try {
    const decipher = crypto.createDecipheriv(algorithm, p_int_key, p_int_iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    //   console.error('Decryption error:', error);
    throw new Error("unable to decrypt data");
  }
}
