import { resolve } from "node:path";
import fs from "node:fs/promises";
import xml2js from "xml2js";
import { Category, Feed } from "../utils/entities";

export class OpmlService {
  /**
   * @param {object} opts
   * @param {import('pino').Logger} opts.logger
   * @param {string} opts.opmlPath
   */
  constructor({ logger, opmlPath }) {
    /** @type {import('../utils/entities').Category[]} */
    this.categories = [];
    this.logger = logger.child({ context: "opml-service" });
    this.opmlPath = opmlPath;
  }

  async init() {
    const content = await fs.readFile(resolve(this.opmlPath), "utf-8");
    this.logger.debug({ msg: "Loading OPML", opmlPath: this.opmlPath });

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
   * @param {string} feedId
   * @returns {Feed | undefined}
   */
  findFeedById(feedId) {
    return this.categories.flatMap((c) => c.feeds).find((f) => f.id === feedId);
  }
}

export default defineNitroPlugin(
  /** @param {import('nitropack/types').NitroApp} nitroApp */
  async (nitroApp) => {
    const logger = nitroApp.logger;

    const config = useRuntimeConfig();
    const opmlPath = config.opmlPath;

    nitroApp.opmlService = new OpmlService({ logger, opmlPath });
    await nitroApp.opmlService.init();

    nitroApp.hooks.hook("close", () => {
      nitroApp.opmlService.dispose().catch((err) => logger.error(err));
    });
  },
);
