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
   * @param {object} opts
   * @param {string[]} [opts.feedIds=[]]
   * @param {string} [opts.search]
   * @param {"all"|"read"|"unread"} [opts.status="all"]
   * @returns {Promise<number>}
   */
  async countEntries({ feedIds = [], search, status = "all" }) {
    const q = this.knex("entries");
    switch (status) {
      case "all":
        break;
      case "read":
        q.whereNotNull("read_at");
        break;
      case "unread":
        q.whereNull("read_at");
        break;
    }
    if (feedIds.length > 0) q.whereIn("feed_id", feedIds);
    if (search) {
      const uppered = search.toUpperCase();
      q.where((builder) =>
        builder
          .where(this.knex.raw(`upper(title)`), "like", `%${uppered}%`)
          .orWhere(this.knex.raw(`upper(description)`), "like", `%${uppered}%`),
      );
    }
    const result = await q.count({ count: "*" }).first();
    return result ? Number(result.count) : 0;
  }

  /**
   * @param {string[]} feedIds
   * @returns {Promise<Record<string,number>>}
   */
  async countEntriesByFeedIds(feedIds) {
    if (feedIds.length === 0) return {};

    /** @type {Array<{ feed_id: string, count: number }>} */
    const rows = await this.knex("entries")
      .select("feed_id")
      .count({ count: "*" })
      .whereIn("feed_id", feedIds)
      .groupBy("feed_id");

    /** @type {Record<string,number>} */
    const counts = {};
    for (const row of rows) {
      counts[row.feed_id] = Number(row.count);
    }
    return counts;
  }

  /**
   * @param {string} id
   * @returns {Promise<string|undefined>}
   */
  async findEntryContentById(id) {
    const row = await this.knex("entries").where({ id }).first();
    if (!row) return undefined;
    return row.description;
  }

  /**
   *
   * @param {string} feedId
   * @returns {Promise<FeedMetadataEntity|undefined>}
   */
  async findFeedMetadataByFeedId(feedId) {
    const row = await this.knex("feed_metadata").where({ feed_id: feedId }).first();
    if (!row) return undefined;

    return new FeedMetadataEntity({
      feedId: row.feed_id,
      etag: row.etag,
      lastModified: row.last_modified,
    });
  }

  /**
   * @param {string} externalId
   * @returns {Promise<ImageEntity|undefined>}
   */
  async findImageByExternalId(externalId) {
    const row = await this.knex("image").where({ external_id: externalId }).first();
    if (!row) return undefined;
    return new ImageEntity({
      externalId: row.external_id,
      url: row.url,
      blob: row.blob,
      contentType: row.content_type,
      etag: row.etag,
      lastModified: row.last_modified,
    });
  }

  /**
   * @param {object} opts
   * @param {string[]} [opts.feedIds]
   * @param {number} [opts.limit=100]
   * @param {number} [opts.offset=0]
   * @param {string} [opts.search]
   * @param {"all"|"read"|"unread"} [opts.status="all"]
   * @returns {Promise<EntryEntity[]>}
   */
  async listEntries({ feedIds = [], limit = 100, offset = 0, search, status = "all" }) {
    let q = this.knex("entries").select([
      "feed_id",
      "guid",
      "title",
      "link",
      "date",
      "author",
      "read_at",
      "starred_at",
    ]);
    switch (status) {
      case "all":
        break;
      case "read":
        q.whereNotNull("read_at");
        break;
      case "unread":
        q.whereNull("read_at");
        break;
    }
    if (feedIds.length > 0) q.whereIn("feed_id", feedIds);
    if (search) {
      const uppered = search.toUpperCase();
      q.where((builder) =>
        builder
          .where(this.knex.raw(`upper(title)`), "like", `%${uppered}%`)
          .orWhere(this.knex.raw(`upper(description)`), "like", `%${uppered}%`),
      );
    }

    const rows = await q.orderBy("date", "desc").limit(limit).offset(offset);
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
  async listImagePks() {
    const rows = await this.knex("image").select();
    return rows.map((row) => row.external_id);
  }

  /**
   * @returns {Promise<FeedMetadataEntity[]>}
   */
  async listFeedMetadata() {
    const rows = await this.knex("feed_metadata").select();
    return rows.map(
      (row) =>
        new FeedMetadataEntity({
          feedId: row.feed_id,
          fetchedAt: row.fetched_at,
          etag: row.etag,
          lastModified: row.last_modified,
        }),
    );
  }

  /**
   * @param {string} id
   * @returns {Promise<Date|undefined>}
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
      return undefined;
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
