// @ts-check

import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import sanitizeHtml from "sanitize-html";

const defaults = sanitizeHtml.defaults;
const allowedAttributes = {
  ...defaults.allowedAttributes,
  a: [...(defaults.allowedAttributes.a ?? []), "href", "name", "target"],
  img: [...(defaults.allowedAttributes.img ?? []), "src", "alt", "title", "width", "height"],
};
const allowedTags = [...defaults.allowedTags, "img"];

export const DIGEST_CONTENT_LENGTH = 16;

/**
 * @param {string} secret
 * @param {string} url
 * @return {string}
 */
export function digestUrl(secret, url) {
  const hasher = createHash("shake256", { outputLength: DIGEST_CONTENT_LENGTH });
  hasher.update(url);
  hasher.update(secret);
  return hasher.digest("hex");
}

const DATE_PART_REPLACEMENTS = {
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
  for (const [key, value] of Object.entries(DATE_PART_REPLACEMENTS)) {
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

const ABSOLUTE_URL_PATTERN = /^https?:\/\//;
const SRC_PATTERN = /^(https?:)?\/\//;

/**
 * @param {string} url
 * @param {string} baseUrl
 * @return {string}
 */
function normalizeUrl(url, baseUrl) {
  // handle protocol-relative URLs
  if (url.startsWith("//")) {
    const baseProtocol = new URL(baseUrl).protocol;
    return `${baseProtocol}${url}`;
  }
  // handle relative URLs
  if (!SRC_PATTERN.test(url)) {
    return String(new URL(url, baseUrl));
  }
  return url;
}

/**
 * @param {string} content
 * @param {string} baseUrl
 * @return {string}
 */
export function proxyImages(content, baseUrl) {
  const config = useRuntimeConfig();

  const $ = cheerio.load(content);
  $("img").each(function () {
    let src = $(this).attr("src");
    if (src) {
      src = normalizeUrl(src, baseUrl);
      if (ABSOLUTE_URL_PATTERN.test(src)) {
        const digest = digestUrl(config.imageDigestSecret, src);
        const proxiedUrl = `/api/images/proxy/${digest}?url=${encodeURIComponent(src)}`;
        $(this).attr("src", proxiedUrl);
      }
    }

    const srcset = $(this).attr("srcset");
    if (srcset) {
      const entries = srcset.split(",").map((entry) => entry.trim());
      const proxiedEntries = entries.map((entry) => {
        const [url, descriptor] = entry.split(" ");
        if (url) {
          const normalizedUrl = normalizeUrl(url, baseUrl);
          if (ABSOLUTE_URL_PATTERN.test(normalizedUrl)) {
            const digest = digestUrl(config.imageDigestSecret, normalizedUrl);
            const proxiedUrl = `/api/images/proxy/${digest}?url=${encodeURIComponent(normalizedUrl)}`;
            return descriptor ? `${proxiedUrl} ${descriptor}` : proxiedUrl;
          }
        }
        return entry;
      });
      $(this).attr("srcset", proxiedEntries.join(", "));
    }

    $(this).attr("loading", "lazy").attr("decoding", "async");
  });
  $("source").each(function () {
    let srcset = $(this).attr("srcset");
    if (srcset) {
      const entries = srcset.split(",").map((entry) => entry.trim());
      const proxiedEntries = entries.map((entry) => {
        const [url, descriptor] = entry.split(" ");
        if (url) {
          const normalizedUrl = normalizeUrl(url, baseUrl);
          if (ABSOLUTE_URL_PATTERN.test(normalizedUrl)) {
            const digest = digestUrl(config.imageDigestSecret, normalizedUrl);
            const proxiedUrl = `/api/images/proxy/${digest}?url=${encodeURIComponent(normalizedUrl)}`;
            return descriptor ? `${proxiedUrl} ${descriptor}` : proxiedUrl;
          }
        }
        return entry;
      });
      $(this).attr("srcset", proxiedEntries.join(", "));
    }
  });

  return $.html();
}

/**
 * @param {string} content
 * @return {string}
 */
export function rewriteContent(content) {
  // Open links in a new tab and add noopener noreferrer for security
  const $ = cheerio.load(content);
  $("a").replaceWith(function () {
    return $(this)
      .attr("rel", "noopener noreferrer")
      .attr("referrerpolicy", "no-referrer")
      .attr("target", "_blank")
      .clone();
  });
  return $.html();
}

/**
 * @param {string} content
 * @returns {string}
 */
export function rewriteSanitizedContent(content) {
  const sanitized = sanitizeHtml(content, { allowedAttributes, allowedTags });
  return rewriteContent(sanitized);
}
