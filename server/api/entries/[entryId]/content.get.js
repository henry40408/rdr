// @ts-check

import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

const defaults = sanitizeHtml.defaults;
const allowedAttributes = {
  ...defaults.allowedAttributes,
  a: [...(defaults.allowedAttributes.a ?? []), "href", "name", "target", "rel"],
  img: [...(defaults.allowedAttributes.img ?? []), "src", "alt", "title", "width", "height"],
};
const allowedTags = [...defaults.allowedTags, "img"];

/**
 * @param {string} content
 * @return {string}
 */
function rewriteContent(content) {
  // Open links in a new tab and add noopener noreferrer for security
  const $ = cheerio.load(content);
  $("a").replaceWith(function () {
    return $(this).attr("rel", "noopener noreferrer").attr("target", "_blank").clone();
  });
  return $.html();
}

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const entry = await repository.findEntryById(userId, entryId);
  if (!entry) throw createError({ statusCode: 404, message: "Entry not found" });

  const feed = await repository.findFeedById(userId, entry.feedId);
  if (!feed) throw createError({ statusCode: 404, message: "Feed not found" });

  const content = await repository.findEntryContentById(userId, entryId);
  if (!content) return { content: "" };

  const trimmed = content.trim();
  if (trimmed === "") return { content: "" };

  const sanitized = sanitizeHtml(rewriteContent(trimmed), {
    allowedAttributes,
    allowedTags,
  });
  const proxied = proxyImages(sanitized, feed.htmlUrl);
  return {
    content: proxied,
  };
});
