// @ts-check

import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import sanitizeHtml from "sanitize-html";

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
  十一月: "Nov",
  十二月: "Dec",
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
};

/**
 * @param {string} dt
 * @returns {Date|undefined}
 */
export function normalizeDatetime(dt) {
  if (!dt || typeof dt !== "string") return undefined;

  let date = new Date(dt);
  if (!isNaN(date.valueOf())) return date;

  let normalized = dt;
  for (const [key, value] of Object.entries(DATE_PART_REPLACEMENTS)) {
    normalized = normalized.replace(key, value);
  }
  date = new Date(normalized);
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
function _normalizeUrl(url, baseUrl) {
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
      src = _normalizeUrl(src, baseUrl);
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
          const normalizedUrl = _normalizeUrl(url, baseUrl);
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
          const normalizedUrl = _normalizeUrl(url, baseUrl);
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

  return $("body").html() || "";
}

/**
 * @param {string} content
 * @returns {string}
 */
export function removePixelTrackers(content) {
  const $ = cheerio.load(content);

  /** @type {(v: string | undefined) => boolean} */
  const isZeroAttr = (v) => {
    if (!v) return false;
    return /^\s*0(?:\.0+)?(?:px)?\s*$/i.test(String(v));
  };

  /** @type {(style: string) => boolean} */
  const styleHasZero = (style) => /(?:^|;)\s*(?:width|height)\s*:\s*0(?:\.0+)?(?:px)?\s*(?:;|$)/i.test(style || "");

  $("img").each(function () {
    const wAttr = $(this).attr("width");
    const hAttr = $(this).attr("height");
    const style = $(this).attr("style") || "";

    // remove obvious pixel trackers or zero-sized images
    if (isZeroAttr(wAttr) || isZeroAttr(hAttr) || styleHasZero(style)) {
      $(this).remove();
      return;
    }

    // also remove common 1x1 pixel images (explicitly sized)
    const w = parseInt(wAttr || "", 10);
    const h = parseInt(hAttr || "", 10);
    if ((w === 1 && h === 1) || (w === 1 && !hAttr) || (h === 1 && !wAttr)) {
      $(this).remove();
    }
  });

  return $("body").html() || "";
}

// Interesting lists:
// https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/TrackParamFilter/sections/general_url.txt
// https://firefox.settings.services.mozilla.com/v1/buckets/main/collections/query-stripping/records
// https://github.com/Smile4ever/Neat-URL/blob/master/data/default-params-by-category.json
// https://github.com/brave/brave-core/blob/master/components/query_filter/utils.cc
// https://developers.google.com/analytics/devguides/collection/ga4/reference/config
const trackingParams = [
  // Facebook Click Identifiers
  "fbclid",
  "_openstat",
  "fb_action_ids",
  "fb_action_types",
  "fb_ref",
  "fb_source",
  "fb_comment_id",

  // Humble Bundles
  "hmb_campaign",
  "hmb_medium",
  "hmb_source",

  // Likely Google as well
  "itm_campaign",
  "itm_medium",
  "itm_source",

  // Google Click Identifiers
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
  "gclsrc",

  // Google Analytics
  "campaign_id",
  "campaign_medium",
  "campaign_name",
  "campaign_source",
  "campaign_term",
  "campaign_content",

  // Google
  "srsltid",

  // Yandex Click Identifiers
  "yclid",
  "ysclid",

  // Twitter Click Identifier
  "twclid",

  // Microsoft Click Identifier
  "msclkid",

  // Mailchimp Click Identifiers
  "mc_cid",
  "mc_eid",
  "mc_tc",

  // Wicked Reports click tracking
  "wickedid",

  // Hubspot Click Identifiers
  "hsa_cam",
  "_hsenc",
  "__hssc",
  "__hstc",
  "__hsfp",
  "_hsmi",
  "hsctatracking",

  // Olytics
  "rb_clickid",
  "oly_anon_id",
  "oly_enc_id",

  // Vero Click Identifier
  "vero_id",
  "vero_conv",

  // Marketo email tracking
  "mkt_tok",

  // Adobe email tracking
  "sc_cid",

  // Beehiiv
  "_bhlid",

  // Branch.io
  "_branch_match_id",
  "_branch_referrer",

  // Readwise
  "__readwiseLocation",
];

const trackingParamPrefixes = [
  "utm_", // https://en.wikipedia.org/wiki/UTM_parameters
  "mtm_", // https://matomo.org/faq/reports/common-campaign-tracking-use-cases-and-examples/
];

// Outbound tracking parameters are appending the website's url to outbound links.
const trackingParamsOutbound = [
  "ref", // Ghost
];

/**
 * @param {string} url
 * @returns {string}
 */
export function removeTrackingParameters(url) {
  if (!url) return url;
  try {
    const parsedUrl = new URL(url);
    for (const key of Array.from(parsedUrl.searchParams.keys())) {
      const lowerKey = key.toLowerCase();
      const value = parsedUrl.searchParams.get(key) || "";
      if (trackingParams.includes(lowerKey) || trackingParamPrefixes.some((p) => lowerKey.startsWith(p))) {
        parsedUrl.searchParams.delete(key);
      } else if (trackingParamsOutbound.includes(lowerKey)) {
        if (value === parsedUrl.hostname) {
          parsedUrl.searchParams.delete(key);
        }
      }
    }
    return String(parsedUrl);
  } catch {
    return url;
  }
}

/**
 * @param {string} content
 * @return {string}
 */
export function rewriteContent(content) {
  // Open links in a new tab and add noopener noreferrer for security
  const $ = cheerio.load(content);
  $("a").replaceWith(function () {
    const href = $(this).attr("href") || "";
    return $(this)
      .attr("rel", "noopener noreferrer")
      .attr("referrerpolicy", "no-referrer")
      .attr("target", "_blank")
      .attr("href", removeTrackingParameters(href))
      .clone();
  });
  return $("body").html() || "";
}

const defaults = sanitizeHtml.defaults;
const allowedAttributes = {
  ...defaults.allowedAttributes,
  a: [...(defaults.allowedAttributes.a ?? []), "href", "name", "target"],
  img: [...(defaults.allowedAttributes.img ?? []), "src", "alt", "title", "width", "height"],
};
const allowedTags = [...defaults.allowedTags, "img"];

/**
 * @param {string} content
 * @returns {string}
 */
export function rewriteSanitizedContent(content) {
  let processed = content;
  processed = sanitizeHtml(processed, { allowedAttributes, allowedTags });
  processed = removePixelTrackers(processed);
  return rewriteContent(processed);
}

/**
 * @param {import('h3').H3Event} event
 */
export async function validateUserNonce(event) {
  const { container } = useNitroApp();

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const user = await repository.findUserById(userId);
  if (!user || user.disabledAt) {
    clearUserSession(event);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const expected = await repository.findUserNonceById(userId);
  const actual = session.user.nonce;
  if (actual !== expected) {
    clearUserSession(event);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  return session;
}
