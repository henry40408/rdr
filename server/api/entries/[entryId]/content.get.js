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
 * @return {string}
 */
function proxyImages(content) {
  const config = useRuntimeConfig();

  const $ = cheerio.load(content);
  $("img").each(function () {
    const src = $(this).attr("src");
    if (src && srcPattern.test(src)) {
      const digest = digestUrl(config.imageDigestSecret, src);
      const proxiedUrl = `/api/images/proxy/${digest}?url=${encodeURIComponent(src)}`;
      $(this).attr("src", proxiedUrl);
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

  const content = await repository.findEntryContentById(userId, entryId);
  if (!content && content !== "") throw createError({ statusCode: 404, message: "Entry not found" });

  const trimmed = content.trim();
  if (trimmed === "") return { content: "" };

  const sanitized = sanitizeHtml(rewriteContent(trimmed), {
    allowedAttributes,
    allowedTags,
  });
  const proxied = proxyImages(sanitized);

  return {
    content: proxied,
  };
});
