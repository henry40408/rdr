import fs from "node:fs/promises";
import { resolve } from "node:path";
import xml2js from "xml2js";

export class OpmlService {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {import('pino').Logger} opts.logger
   */
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger.child({ context: "opml-service" });
    /** @type {import('../utils/entities').CategoryEntity[]} */
    this.categories = [];
  }

  async init() {
    const content = await fs.readFile(resolve(this.config.opmlPath), "utf-8");
    this.logger.debug({ msg: "Loading OPML", opmlPath: this.config.opmlPath });

    const parsed = await xml2js.parseStringPromise(content);
    for (const outline of parsed.opml.body[0].outline) {
      const categoryName = outline.$.text;
      const category = new CategoryEntity({ name: categoryName });

      if (outline.outline) {
        for (const feedOutline of outline.outline) {
          const feed = new FeedEntity({
            title: feedOutline.$.title || feedOutline.$.text,
            xmlUrl: feedOutline.$.xmlUrl,
            htmlUrl: feedOutline.$.htmlUrl,
          });
          category.feeds.push(feed);
        }
      }
      this.categories.push(category);
    }

    this.logger.info({
      msg: "Loaded categories from OPML",
      categoriesCount: this.categories.length,
      feedsCount: this.categories.flatMap((c) => c.feeds).length,
    });
  }

  async dispose() {
    this.categories = [];
    this.logger.info("Categories are cleared");
  }

  /**
   * @param {string} categoryId
   * @returns {Category | undefined}
   */
  findCategoryById(categoryId) {
    return this.categories.find((c) => c.id === categoryId);
  }

  /**
   * @param {string} feedId
   * @returns {Feed | undefined}
   */
  findFeedById(feedId) {
    return this.categories.flatMap((c) => c.feeds).find((f) => f.id === feedId);
  }
}
