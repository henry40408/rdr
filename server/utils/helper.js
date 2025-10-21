import { createHash } from "node:crypto";

/**
 * @param {string} secret
 * @param {string} url
 * @return {string}
 */
export function digestUrl(secret, url) {
  const hasher = createHash("shake256", { outputLength: 8 });
  hasher.update(url);
  hasher.update(secret);
  return hasher.digest("hex");
}

const replacements = {
  週日: "Sun",
  週一: "Mon",
  週二: "Tue",
  週三: "Wed",
  週四: "Thu",
  週五: "Fri",
  週六: "Sat",
  一月: "Jan",
  二月: "Feb",
  三月: "Mar",
  四月: "Apr",
  五月: "May",
  六月: "Jun",
  七月: "Jul",
  八月: "Aug",
  九月: "Sep",
  十月: "Oct",
  十一月: "Nov",
  十二月: "Dec",
};

/**
 * @param {string} dt
 * @returns {Date|undefined}
 */
export function normalizeDatetime(dt) {
  let normalized = dt;
  for (const [key, value] of Object.entries(replacements)) {
    normalized = normalized.replace(key, value);
  }
  const date = new Date(normalized);
  return isNaN(date.valueOf()) ? undefined : date;
}

/**
 * @typedef {object} ParseDataURLResult
 * @property {string} mediaType
 * @property {string} encoding
 * @property {Buffer} data
 *
 * Parse a Data URL and return its media type, encoding, and binary data.
 *
 * @param {string} url A complete `data:` URL
 * @returns {ParseDataURLResult} The parsed components of the Data URL
 * @throws {Error} If the URL does not start with `data:` or is malformed
 *
 * The function follows the syntax defined in RFC 2397 and handles both
 * Base64‑encoded and percent‑encoded data.
 */
export function parseDataURL(url) {
  if (!url.startsWith("data:")) {
    throw new Error("Invalid Data URL");
  }

  const withoutPrefix = url.slice(5); // remove "data:"
  const commaIndex = withoutPrefix.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Malformed Data URL");
  }

  const meta = withoutPrefix.slice(0, commaIndex);
  const dataPart = withoutPrefix.slice(commaIndex + 1);

  let mediaType = "text/plain;charset=US-ASCII";
  let encoding = "utf8";

  if (meta) {
    const parts = meta.split(";");
    if (parts[0] && parts[0] !== "base64" && !parts[0].includes("=")) {
      let shifted = parts.shift(); // explicit MIME type
      if (shifted) mediaType = shifted;
    }
    if (parts.includes("base64")) encoding = "base64";
  }

  const buffer =
    encoding === "base64" ? Buffer.from(dataPart, "base64") : Buffer.from(decodeURIComponent(dataPart), "utf8");

  return { mediaType, encoding, data: buffer };
}
