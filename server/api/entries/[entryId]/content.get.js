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

const srcPattern = /^https?:\/\//;

/**
 * @param {string} content
 * @param {string} baseUrl
 * @return {string}
 */
function proxyImages(content, baseUrl) {
  const config = useRuntimeConfig();

  const $ = cheerio.load(content);
  $("img").each(function () {
    let src = $(this).attr("src");
    if (src) {
      // some src are relative paths, convert them to absolute using the feed's base URL
      if (!srcPattern.test(src)) src = String(new URL(src, baseUrl));
      if (srcPattern.test(src)) {
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
        if (srcPattern.test(url)) {
          const digest = digestUrl(config.imageDigestSecret, url);
          const proxiedUrl = `/api/images/proxy/${digest}?url=${encodeURIComponent(url)}`;
          return descriptor ? `${proxiedUrl} ${descriptor}` : proxiedUrl;
        }
        return entry;
      });
      $(this).attr("srcset", proxiedEntries.join(", "));
    }

    $(this).attr("loading", "lazy").attr("decoding", "async");
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
  if (!content && content !== "") throw createError({ statusCode: 404, message: "Entry not found" });

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
