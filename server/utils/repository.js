import chunk from "lodash/chunk.js";
import get from "lodash/get.js";

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
    await this._setPragmas();
    this.logger.info("Database pragmas set");

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
   * @param {string} id
   * @returns {Promise<string|null>}
   */
  async findEntryContentById(id) {
    const row = await this.knex("entries").where({ id }).first();
    if (!row) return null;
    return row.description;
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
   * @returns {Promise<import('../utils/entities').EntryEntity[]>}
   */
  async listEntries({ offset = 0, limit = 100 }) {
    const rows = await this.knex("entries")
      .select(["feed_id", "guid", "title", "link", "date", "author", "read_at", "starred_at"])
      .orderBy("date", "desc")
      .limit(limit)
      .offset(offset);
    return rows.map(
      (row) =>
        new EntryEntity({
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
   * @param {string} id
   * @returns {Promise<Date|null>}
   */
  async toggleEntry(id) {
    const logger = this.logger.child({ entryId: id });

    const row = await this.knex("entries").where({ id }).first();
    if (!row) throw new Error(`Entry with id ${id} not found`);

    const now = new Date();
    const isoNow = now.toISOString();
    if (row.read_at) {
      await this.knex("entries").where({ id }).update({ read_at: null, updated_at: isoNow });
      logger.info({ msg: "Marked entry as unread" });
      return null;
    } else {
      await this.knex("entries").where({ id }).update({ read_at: isoNow, updated_at: isoNow });
      logger.info({ msg: "Marked entry as read" });
      return now;
    }
  }

  /**
   * @param {FeedEntity} feed
   * @param {import('feedparser').Item[]} items
   */
  async upsertEntries(feed, items) {
    const logger = this.logger.child({ feedId: feed.id });

    if (items.length === 0) {
      logger.warn({ msg: "No entries to upsert" });
      return;
    }

    const now = new Date();
    logger.debug({ msg: "Upserting entries", count: items.length });

    const chunks = chunk(items, 10);
    for (const chunk of chunks) {
      await this.knex("entries")
        .insert(
          chunk.map((e) => ({
            id: generateEntryId(feed.id, e.guid),
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
      logger.debug({ msg: "Upserted chunk of entries", count: chunk.length });
    }
    logger.info({ msg: "Upserted entries", count: items.length });

    await this.knex("feed_metadata")
      .insert({ feed_id: feed.id, fetched_at: now.toISOString() })
      .onConflict("feed_id")
      .merge();
    logger.info({ msg: "Updated feed metadata", feedId: feed.id, fetchedAt: now });
  }

  /**
   * @param {ImageEntity} image
   */
  async upsertImage(image) {
    const logger = this.logger.child({ externalId: image.externalId });

    logger.debug("Upserting image");
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
    logger.info("Upserted image");
  }

  /**
   * @param {FeedMetadataEntity} metadata
   */
  async upsertFeedMetadata(metadata) {
    const logger = this.logger.child({ feedId: metadata.feedId });

    logger.debug({ msg: "Upserting feed metadata", metadata });
    await this.knex("feed_metadata")
      .insert({ feed_id: metadata.feedId, etag: metadata.etag, last_modified: metadata.lastModified })
      .onConflict("feed_id")
      .merge();
    logger.info({ msg: "Upserted feed metadata", metadata });
  }

  async _setPragmas() {
    await this.knex.raw("PRAGMA busy_timeout = 5000");
    await this.knex.raw("PRAGMA journal_mode = WAL");
    await this.knex.raw("PRAGMA foreign_keys = OFF");
    await this.knex.raw("PRAGMA synchronous = NORMAL");
  }

  /**
   * @param {import('feedparser').Item} item
   * @returns {Date}
   */
  _itemDate(item) {
    if (item.pubdate && !isNaN(item.pubdate.valueOf())) return item.pubdate;
    if (item.date && !isNaN(item.date.valueOf())) return item.date;

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
