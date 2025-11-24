// @ts-check

import xml2js from "xml2js";

export class OpmlService {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ config, logger, repository }) {
    this.config = config;
    this.logger = logger.child({ context: "opml-service" });
    this.repository = repository;
  }

  /**
   * @param {number} userId
   * @param {string} content
   * @returns {Promise<CategoryEntity[]>}
   */
  async importOpml(userId, content) {
    /** @type {NewCategoryEntity[]} */
    const categories = [];

    const parsed = await xml2js.parseStringPromise(content);
    for (const outline of parsed.opml.body[0].outline) {
      const categoryName = outline.$.text;
      const category = new NewCategoryEntity({ userId, name: categoryName });

      if (outline.outline) {
        for (const feedOutline of outline.outline) {
          const feed = new NewCategoryFeedEntity({
            title: feedOutline.$.title ?? feedOutline.$.text,
            xmlUrl: feedOutline.$.xmlUrl,
            htmlUrl: feedOutline.$.htmlUrl,
          });
          category.feeds.push(feed);
        }
      }
      categories.push(category);
    }

    this.logger.info({
      msg: "Imported categories from OPML",
      categoriesCount: categories.length,
      feedsCount: categories.flatMap((c) => c.feeds).length,
    });

    return await this.repository.upsertCategories(userId, categories);
  }

  /**
   * @param {number} userId
   * @returns {Promise<string>}
   */
  async exportOpml(userId) {
    const now = new Date();
    const builder = new xml2js.Builder({ headless: true, rootName: "opml" });
    const categories = await this.repository.findCategoriesWithFeed(userId);
    const opmlObj = {
      $: { version: "2.0" },
      head: [{ title: `Exported OPML (${now.toISOString()})` }],
      body: [
        {
          outline: categories.map((category) => ({
            $: { text: category.name },
            outline: category.feeds.map((feed) => ({
              $: {
                text: feed.title,
                title: feed.title,
                type: "rss",
                xmlUrl: feed.xmlUrl,
                htmlUrl: feed.htmlUrl ?? "",
              },
            })),
          })),
        },
      ],
    };
    return builder.buildObject(opmlObj);
  }
}
