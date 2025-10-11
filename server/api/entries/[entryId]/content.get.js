import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const schema = z.object({
  entryId: z.coerce.number(),
});

const defaults = sanitizeHtml.defaults;
const allowedAttributes = {
  ...defaults.allowedAttributes,
  a: [...defaults.allowedAttributes.a, "href", "name", "target", "rel"],
  img: [...defaults.allowedAttributes.img, "src", "alt", "title", "width", "height"],
};
const allowedTags = [...defaults.allowedTags, "img"];

/**
 * @param {string} content
 * @return {string}
 */
function rewriteContent(content) {
  // Open links in a new tab and add noopener noreferrer for security
  const parsed = cheerio.load(content);
  parsed("a").replaceWith(function () {
    return parsed(this).attr("rel", "noopener noreferrer").attr("target", "_blank").clone();
  });
  return parsed.html();
}

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const content = await repository.findEntryContentById(entryId);
  if (!content) throw createError({ statusCode: 404, message: "Entry not found" });

  return {
    content: sanitizeHtml(rewriteContent(content), {
      allowedAttributes,
      allowedTags,
    }),
  };
});
