import knex from "knex";
import chunk from "lodash/chunk.js";
import get from "lodash/get.js";
import { ImageEntity, PartialEntryEntity } from "../utils/entities";

export class Repository {
  /**
   * @param {object} opts
   * @param {import('knex').Knex} opts.knex
   * @param {import('pino').Logger} opts.logger
   */
  constructor({ knex, logger }) {
    this.logger = logger.child({ context: "repository" });
    this.knex = knex;
  }

  async init() {
    await this.knex.migrate.latest();
    this.logger.info("Database migrated");
  }

  /**
   * @returns {Promise<number>}
   */
  async countEntries() {
    const result = await this.knex("entries").count({ count: "*" }).first();
    return result ? Number(result.count) : 0;
  }

  /**
   *
   * @param {string} feedId
   * @returns {Promise<import('../utils/entities').FeedMetadataEntity|null>}
   */
  async findFeedMetadataByFeedId(feedId) {
    const row = await this.knex("feed_metadata").where({ feed_id: feedId }).first();
    if (!row) return null;

    return new FeedMetadataEntity({
      feedId: row.feed_id,
      etag: row.etag || null,
      lastModified: row.last_modified || null,
    });
  }

  /**
   * @param {string} externalId
   * @returns {Promise<ImageEntity|null>}
   */
  async findImageByExternalId(externalId) {
    const row = await this.knex("image").where({ external_id: externalId }).first();
    if (!row) return null;
    return new ImageEntity({
      externalId: row.external_id,
      url: row.url,
      blob: row.blob,
      contentType: row.content_type,
      etag: row.etag || null,
      lastModified: row.last_modified || null,
    });
  }

  /**
   * @param {string} url
   * @returns {Promise<ImageEntity|null>}
   */
  async findImageByUrl(url) {
    const row = await this.knex("image").where({ url }).first();
    if (!row) return null;
    return new ImageEntity({
      externalId: row.external_id,
      url: row.url,
      blob: row.blob,
      contentType: row.content_type,
      etag: row.etag || null,
      lastModified: row.last_modified || null,
    });
  }

  /**
   * @param {object} opts
   * @param {number} [opts.offset=0]
   * @param {number} [opts.limit=100]
   * @returns {Promise<import('../utils/entities').PartialEntryEntity[]>}
   */
  async listEntries({ offset = 0, limit = 100 }) {
    const rows = await this.knex("entries")
      .select(["feed_id", "guid", "title", "link", "date", "author", "read_at", "starred_at"])
      .orderBy("date", "desc")
      .limit(limit)
      .offset(offset);
    return rows.map(
      (row) =>
        new PartialEntryEntity({
          feedId: row.feed_id,
          guid: row.guid,
          title: row.title,
          link: row.link,
          date: row.date,
          author: row.author,
          readAt: row.read_at,
          starredAt: row.starred_at,
        }),
    );
  }

  /**
   * @returns {Promise<string[]>}
   */
  async imagePks() {
    const rows = await this.knex("image").select();
    return rows.map((row) => row.external_id);
  }

  /**
   * @returns {Promise<import('../utils/entities').FeedMetadataEntity[]>}
   */
  async listFeedMetadata() {
    const rows = await this.knex("feed_metadata").select();
    return rows.map(
      (row) =>
        new FeedMetadataEntity({
          feedId: row.feed_id,
          fetchedAt: row.fetched_at || null,
          etag: row.etag || null,
          lastModified: row.last_modified || null,
        }),
    );
  }

  /**
   * @param {import('../utils/entities').FeedEntity} feed
   * @param {import('feedparser').Item[]} items
   */
  async upsertEntries(feed, items) {
    if (items.length === 0) {
      this.logger.info({ msg: "No entries to upsert", feedId: feed.id });
      return;
    }

    const now = new Date();
    this.logger.debug({ msg: "Upserting entries", feedId: feed.id, count: items.length });

    const chunks = chunk(items, 10);
    for (const chunk of chunks) {
      await this.knex("entries")
        .insert(
          chunk.map((e) => ({
            feed_id: feed.id,
            guid: e.guid,
            title: e.title || "(no title)",
            link: e.link,
            date: this._itemDate(e).toISOString(),
            summary: e.summary || "(no summary)",
            description: e.description,
            author: e.author,
          })),
        )
        .onConflict(["feed_id", "guid"])
        .merge();
      this.logger.debug({ msg: "Upserted chunk of entries", feedId: feed.id, count: chunk.length });
    }
    this.logger.info({ msg: "Upserted entries", feedId: feed.id, count: items.length });

    await this.knex("feed_metadata")
      .insert({ feed_id: feed.id, fetched_at: now.toISOString() })
      .onConflict("feed_id")
      .merge();
    this.logger.info({ msg: "Updated feed metadata", feedId: feed.id, fetchedAt: now });
  }

  /**
   * @param {import('../utils/entities').ImageEntity} image
   */
  async upsertImage(image) {
    this.logger.debug({ msg: "Upserting image", externalId: image.externalId });
    await this.knex("image")
      .insert({
        external_id: image.externalId,
        url: image.url,
        blob: image.blob,
        content_type: image.contentType,
        etag: image.etag,
        last_modified: image.lastModified,
      })
      .onConflict("external_id")
      .merge();
    this.logger.info({ msg: "Upserted image", externalId: image.externalId });
  }

  /**
   * @param {import('../utils/entities').FeedMetadataEntity} metadata
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
  _itemDate(item) {
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
