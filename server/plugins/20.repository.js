import knex from "knex";
import { MigrationSource } from "../utils/migrationSource";
import { FeedMetadata } from "../utils/entities";

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
   * @param {string} feedId
   * @returns {Promise<import('../utils/entities').FeedImage|null>}
   */
  async findFeedImageByFeedId(feedId) {
    const row = await this.knex("feed_image").where({ feed_id: feedId }).first();
    if (!row) return null;

    return new FeedImage({
      feedId: row.feed_id,
      blob: row.blob,
      contentType: row.content_type,
    });
  }

  /**
   * @returns {Promise<string[]>}
   */
  async listFeedImagePKs() {
    const rows = await this.knex("feed_image").select();
    return rows.map((row) => row.feed_id);
  }

  /**
   *
   * @param {string} feedId
   * @returns {Promise<import('../utils/entities').FeedMetadata|null>}
   */
  async findFeedMetadataByFeedId(feedId) {
    const row = await this.knex("feed_metadata").where({ feed_id: feedId }).first();
    if (!row) return null;

    return new FeedMetadata({
      feedId: row.feed_id,
      etag: row.etag || null,
      lastModified: row.last_modified || null,
    });
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
   * @param {import('../utils/entities').FeedImage} image
   */
  async upsertFeedImage(image) {
    this.logger.debug({ msg: "Upserting feed image", feedId: image.feedId });
    await this.knex("feed_image")
      .insert({
        feed_id: image.feedId,
        blob: image.blob,
        content_type: image.contentType,
      })
      .onConflict("feed_id")
      .merge();
    this.logger.info({ msg: "Upserted feed image", feedId: image.feedId });
  }

  /**
   * @param {import('../utils/entities').FeedMetadata} metadata
   */
  async upsertFeedMetadata(metadata) {
    this.logger.debug({ msg: "Upserting feed metadata", metadata });
    await this.knex("feed_metadata")
      .insert({ feed_id: metadata.feedId, etag: metadata.etag, last_modified: metadata.lastModified })
      .onConflict("feed_id")
      .merge();
    this.logger.info({ msg: "Upserted feed metadata", metadata });
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
