// @ts-check

/**
 * @param {number} feedId
 * @returns {string}
 */
export function buildFeedImageKey(feedId) {
  return `feed:${feedId}`;
}

/**
 * @param {string} text
 * @returns {string}
 */
export function replaceForTiddlyWiki(text) {
  // TiddlyWiki 5 does not allow |, [, ], {, } in titles
  return (
    text
      .replace("|", "-")
      // eslint-disable-next-line no-useless-escape
      .replace(/[\[\]{}]/g, (c) => (c === "[" || c === "{" ? "(" : ")"))
      .trim()
  );
}
