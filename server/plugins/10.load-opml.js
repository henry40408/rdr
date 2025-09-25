import { resolve } from "node:path";
import fs from "node:fs/promises";
import xml2js from "xml2js";
import { Category, Feed } from "../utils/entities";

export default defineNitroPlugin(
  /** @param {import('nitropack/types').NitroApp} nitroApp */
  async (nitroApp) => {
    nitroApp.categories = [];

    const config = useRuntimeConfig();
    const opmlPath = config.opmlPath;

    nitroApp.logger.debug(`Loading OPML from ${opmlPath}`);

    const content = await fs.readFile(resolve(opmlPath), "utf-8");
    const parsed = await xml2js.parseStringPromise(content);

    for (const outline of parsed.opml.body[0].outline) {
      const categoryName = outline.$.text;
      const category = new Category({ name: categoryName });

      if (outline.outline) {
        for (const feedOutline of outline.outline) {
          const feed = new Feed({
            title: feedOutline.$.title || feedOutline.$.text,
            xmlUrl: feedOutline.$.xmlUrl,
            htmlUrl: feedOutline.$.htmlUrl,
          });
          category.feeds.push(feed);
        }
      }
      nitroApp.categories.push(category);
    }

    nitroApp.logger.info(
      `Loaded ${nitroApp.categories.length} categories from OPML`
    );
  }
);
