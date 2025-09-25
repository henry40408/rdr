import crypto from "node:crypto";

/**
 * @param {string} input
 * @returns {string}
 */
export function generateId(input) {
  return crypto
    .createHash("shake256", { outputLength: 8 })
    .update(input)
    .digest("hex");
}
