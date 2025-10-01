/**
 * @param {string} feedId
 * @returns {string}
 */
export default function buildFeedImageExternalId(feedId) {
  return `feed-favicon-${feedId}`;
}
