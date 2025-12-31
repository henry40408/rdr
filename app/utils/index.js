// @ts-check

import mitt from "mitt";

/**
 * @param {number} entryId
 * @returns {string}
 */
export function buildEventToScrollToEntry(entryId) {
  return `entry-item:${entryId}:scroll`;
}

export const eventBus = mitt();

/**
 * Marks all occurrences of keyword in HTML with <mark> tags
 * but don't break existing HTML tags or URLs.
 * @param {string} text
 * @param {string} keyword
 * @returns {string}
 */
export function highlightKeyword(text, keyword) {
  if (!keyword) return text;

  const escapedKeyword = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(https?://[^\\s<]+|<[^>]+>)|(${escapedKeyword})`, "gi");
  return text.replace(regex, (match, p1, p2) => {
    if (p1) {
      // It's a URL or HTML tag, return as is
      return match;
    } else if (p2) {
      // It's a keyword match, wrap in <mark>
      return `<mark>${match}</mark>`;
    }
    return match;
  });
}
