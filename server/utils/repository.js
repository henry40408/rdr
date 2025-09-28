import knex from "knex";
import chunk from "lodash/chunk";
import get from "lodash/get";

export class Repository {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {import('pino').Logger} opts.logger
   */
  constructor({ config, logger }) {
    this.logger = logger.child({ context: "repository" });

    this.knex = knex({
      client: "sqlite3",
      connection: { filename: config.cachePath },
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
      etag: row.etag || null,
      lastModified: row.last_modified || null,
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
   * @returns {Promise<import('../utils/entities').FeedMetadata[]>}
   */
  async listFeedMetadata() {
    const rows = await this.knex("feed_metadata").select();
    return rows.map(
      (row) =>
        new FeedMetadata({
          feedId: row.feed_id,
          fetchedAt: row.fetched_at || null,
          etag: row.etag || null,
          lastModified: row.last_modified || null,
        }),
    );
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
    if (entries.length === 0) {
      this.logger.info({ msg: "No entries to upsert", feedId: feed.id });
      return;
    }

    const now = new Date();
    this.logger.debug({ msg: "Upserting entries", feedId: feed.id, count: entries.length });

    const chunks = chunk(entries, 10);
    for (const chunk of chunks) {
      await this.knex("entries")
        .insert(
          chunk.map((e) => ({
            feed_id: feed.id,
            guid: e.guid,
            title: e.title || "(no title)",
            link: e.link,
            date: this.itemDate(e).toISOString(),
            summary: e.summary || "(no summary)",
            description: e.description,
            author: e.author,
          })),
        )
        .onConflict(["feed_id", "guid"])
        .merge();
      this.logger.debug({ msg: "Upserted chunk of entries", feedId: feed.id, count: chunk.length });
    }
    this.logger.info({ msg: "Upserted entries", feedId: feed.id, count: entries.length });

    await this.knex("feed_metadata")
      .insert({ feed_id: feed.id, fetched_at: now.toISOString() })
      .onConflict("feed_id")
      .merge();
    this.logger.info({ msg: "Updated feed metadata", feedId: feed.id, fetchedAt: now });
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
        etag: image.etag,
        last_modified: image.lastModified,
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
    if (item.pubdate && !isNaN(item.pubdate.valueOf())) {
      this.logger.debug({ msg: "Using pubdate", date: item.pubdate });
      return item.pubdate;
    }
    if (item.date && !isNaN(item.date.valueOf())) {
      this.logger.debug({ msg: "Using date", date: item.date });
      return item.date;
    }

    /** @type {string} */
    const raw = get(item, ["rss:pubdate", "#"], "");

    const normalized = normalizeDatetime(raw);
    if (normalized) {
      this.logger.debug({ msg: "Using normalized date", date: normalized });
      return normalized;
    }

    throw new Error("Item has no pubdate or date");
  }
}
