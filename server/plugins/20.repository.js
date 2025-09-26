import knex from "knex";
import { MigrationSource } from "../utils/migrationSource";

export class Repository {
  /**
   * @param {object} opts
   * @param {string} opts.cachePath
   * @param {import('pino').Logger} opts.logger
   */
  constructor({ cachePath, logger }) {
    this.cachePath = cachePath;
    this.logger = logger.child({ context: "repository" });

    this.knex = knex({
      client: "sqlite3",
      connection: { filename: cachePath },
      migrations: { migrationSource: new MigrationSource() },
      useNullAsDefault: true,
    });
    this.logger.info("Database connected");
  }

  async init() {
    await this.knex.migrate.latest();
    this.logger.info("Database migrated");
  }

  async dispose() {
    this.knex.destroy();
    this.logger.info("Database disconnected");
  }

  /**
   * @param {import('../utils/entities').Feed} feed
   * @param {import('feedparser').Item[]} entries
   */
  async upsertEntries(feed, entries) {
    this.logger.debug({ msg: "Upserting entries", feedId: feed.id, count: entries.length });
    await this.knex("entries")
      .insert(
        entries.map((e) => ({
          feed_id: feed.id,
          guid: e.guid,
          title: e.title || "(no title)",
          link: e.link,
          date: this.itemDate(e),
          summary: e.summary || "(no summary)",
          description: e.description,
          author: e.author,
        })),
      )
      .onConflict(["feed_id", "guid"])
      .merge();
    this.logger.info({ msg: "Upserted entries", feedId: feed.id, count: entries.length });
  }

  /**
   * @param {import('feedparser').Item} item
   * @returns {Date}
   */
  itemDate(item) {
    if (item.pubdate) return new Date(item.pubdate);
    if (item.date) return new Date(item.date);
    throw new Error("Item has no pubdate or date");
  }
}

export default defineNitroPlugin(
  /** @param {import('nitropack/types').NitroApp} nitroApp */
  async (nitroApp) => {
    const config = useRuntimeConfig();
    const cachePath = config.cachePath;

    nitroApp.repository = new Repository({
      cachePath,
      logger: nitroApp.logger,
    });
    await nitroApp.repository.init();

    nitroApp.hooks.hook("close", async () => {
      await nitroApp.repository.dispose();
    });
  },
);
