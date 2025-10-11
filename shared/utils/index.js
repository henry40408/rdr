/**
 * @param {number} feedId
 * @returns {string}
 */
export function buildFeedImageKey(feedId) {
  return `feed-${feedId}`;
}
