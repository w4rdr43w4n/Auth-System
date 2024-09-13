import crypto from "crypto";

export const generateSecureKey = (): string => {
  return crypto.randomBytes(24).toString("base64").slice(0, 32);
};