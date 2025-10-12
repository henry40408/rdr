import chunk from "lodash/chunk.js";
import get from "lodash/get.js";
import { CategoryEntity, EntryEntity, FeedEntity, JobEntity } from "./entities";

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
   * @param {number[]} [opts.feedIds=[]]
   * @param {string} [opts.search]
   * @param {"all"|"read"|"unread"|"starred"} [opts.status="all"]
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
      case "starred":
        q.whereNotNull("starred_at");
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
   * @param {number[]} feedIds
   * @returns {Promise<Record<string,{ total: number, unread: number }>>}
   */
  async countEntriesByFeedIds(feedIds) {
    if (feedIds.length === 0) return {};

    /** @type {Array<{ feed_id: number, total: number, unread: number }>} */
    const rows = await this.knex("entries")
      .select("feed_id")
      .count({ total: "*" })
      .sum({ unread: this.knex.raw("CASE WHEN read_at IS NULL THEN 1 ELSE 0 END") })
      .whereIn("feed_id", feedIds)
      .groupBy("feed_id");

    /** @type {Record<string,{ total: number, unread: number }>} */
    const counts = {};
    for (const row of rows) {
      counts[row.feed_id] = {
        total: Number(row.total),
        unread: Number(row.unread),
      };
    }
    return counts;
  }

  async findCategoriesWithFeed() {
    const rows = await this.knex("categories")
      .join("feeds", "categories.id", "feeds.category_id")
      .select(
        this.knex.ref("categories.id").as("category_id"),
        this.knex.ref("categories.name").as("category_name"),
        this.knex.ref("feeds.id").as("feed_id"),
        this.knex.ref("feeds.title").as("feed_title"),
        this.knex.ref("feeds.xml_url").as("feed_xml_url"),
        this.knex.ref("feeds.html_url").as("feed_html_url"),
        this.knex.ref("feeds.fetched_at").as("feed_fetched_at"),
        this.knex.ref("feeds.etag").as("feed_etag"),
        this.knex.ref("feeds.last_modified").as("feed_last_modified"),
      );

    /** @type {CategoryEntity[]} */
    const categories = [];

    for (const row of rows) {
      const category = categories.find((c) => c.id === row.category_id);
      if (category) {
        category.feeds.push(
          new FeedEntity({
            id: row.feed_id,
            categoryId: row.category_id,
            title: row.feed_title,
            xmlUrl: row.feed_xml_url,
            htmlUrl: row.feed_html_url,
            fetchedAt: row.feed_fetched_at,
            etag: row.feed_etag,
            lastModified: row.feed_last_modified,
          }),
        );
      } else {
        const newCategory = new CategoryEntity({ id: row.category_id, name: row.category_name });
        newCategory.feeds.push(
          new FeedEntity({
            id: row.feed_id,
            categoryId: row.category_id,
            title: row.feed_title,
            xmlUrl: row.feed_xml_url,
            htmlUrl: row.feed_html_url,
            fetchedAt: row.feed_fetched_at,
            etag: row.feed_etag,
            lastModified: row.feed_last_modified,
          }),
        );
        categories.push(newCategory);
      }
    }
    return categories;
  }

  /**
   * @param {object} opts
   * @param {number[]} [opts.feedIds]
   * @param {number} [opts.limit=100]
   * @param {number} [opts.offset=0]
   * @param {string} [opts.search]
   * @param {"all"|"read"|"unread"|"starred"} [opts.status="all"]
   * @returns {Promise<EntryEntity[]>}
   */
  async findEntries({ feedIds = [], limit = 100, offset = 0, search, status = "all" }) {
    let q = this.knex("entries").select([
      "id",
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
      case "starred":
        q.whereNotNull("starred_at");
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
          id: row.id,
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
   * @param {number} id
   * @returns {Promise<EntryEntity|undefined>}
   */
  async findEntryById(id) {
    const row = await this.knex("entries").where({ id }).first();
    if (!row) return undefined;
    return new EntryEntity({
      id: row.id,
      feedId: row.feed_id,
      guid: row.guid,
      title: row.title,
      link: row.link,
      date: row.date,
      author: row.author,
      readAt: row.read_at,
      starredAt: row.starred_at,
    });
  }

  /**
   * @param {number} id
   * @returns {Promise<string|undefined>}
   */
  async findEntryContentById(id) {
    const row = await this.knex("entries").where({ id }).first();
    if (!row) return undefined;
    return row.description;
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<FeedEntity|undefined>}
   */
  async findFeedById(id) {
    const row = await this.knex("feeds").where({ id }).first();
    if (!row) return undefined;

    return new FeedEntity({
      id: row.id,
      categoryId: row.category_id,
      title: row.title,
      xmlUrl: row.xml_url,
      htmlUrl: row.html_url,
      etag: row.etag,
      lastModified: row.last_modified,
    });
  }

  /**
   * @returns {Promise<FeedEntity[]>}
   */
  async findFeeds() {
    const rows = await this.knex("feeds").select();
    return rows.map(
      (row) =>
        new FeedEntity({
          id: row.id,
          categoryId: row.category_id,
          title: row.title,
          xmlUrl: row.xml_url,
          htmlUrl: row.html_url,
          fetchedAt: row.fetched_at,
          etag: row.etag,
          lastModified: row.last_modified,
        }),
    );
  }

  /**
   * @param {number} categoryId
   * @returns {Promise<FeedEntity[]>}
   */
  async findFeedsWithCategoryId(categoryId) {
    const rows = await this.knex("feeds").where({ category_id: categoryId }).select();
    return rows.map(
      (row) =>
        new FeedEntity({
          id: row.id,
          categoryId: row.category_id,
          title: row.title,
          xmlUrl: row.xml_url,
          htmlUrl: row.html_url,
          fetchedAt: row.fetched_at,
          etag: row.etag,
          lastModified: row.last_modified,
        }),
    );
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
   * @returns {Promise<string[]>}
   */
  async findImagePks() {
    const rows = await this.knex("image").select();
    return rows.map((row) => row.external_id);
  }

  /**
   * @returns {Promise<JobEntity[]>}
   */
  async findJobs() {
    const jobs = await this.knex("jobs").select();
    return jobs.map(
      (job) =>
        new JobEntity({
          name: job.name,
          lastDate: job.last_date,
          lastDurationMs: job.last_duration_ms,
          lastError: job.last_error,
        }),
    );
  }

  /**
   * @param {number} id
   * @returns {Promise<Date|undefined>}
   */
  async toggleReadEntry(id) {
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
   * @param {number} id
   * @returns {Promise<Date|undefined>}
   */
  async toggleStarEntry(id) {
    const logger = this.logger.child({ entryId: id });

    const row = await this.knex("entries").where({ id }).first();
    if (!row) throw new Error(`Entry with id ${id} not found`);

    const now = new Date();
    const isoNow = now.toISOString();
    if (row.starred_at) {
      await this.knex("entries").where({ id }).update({ starred_at: null, updated_at: isoNow });
      logger.info({ msg: "Unstarred entry" });
      return undefined;
    } else {
      await this.knex("entries").where({ id }).update({ starred_at: isoNow, updated_at: isoNow });
      logger.info({ msg: "Starred entry" });
      return now;
    }
  }

  /**
   * @param {CategoryEntity[]} categories
   */
  async upsertCategories(categories) {
    this.knex.transaction(async (tx) => {
      for (const category of categories) {
        await tx("categories").insert({ name: category.name }).onConflict("name").merge();
        this.logger.info({ msg: "Upserted category", name: category.name });

        const found = await tx("categories").where({ name: category.name }).first();
        if (!found) throw new Error("Category not found after upsert");

        for (const feed of category.feeds) {
          await tx("feeds")
            .insert({
              category_id: found.id,
              title: feed.title,
              xml_url: feed.xmlUrl,
              html_url: feed.htmlUrl,
            })
            .onConflict("xml_url")
            .merge();

          this.logger.info({ msg: "Upserted feed", category: category.name, title: feed.title });
        }
      }
    });
    this.logger.info({ msg: "Upserted categories", count: categories.length });
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

    await this.knex("feeds").where({ id: feed.id }).update({ fetched_at: now.toISOString() });
    logger.info({ msg: "Updated feed", feedId: feed.id, fetchedAt: now });
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
   * @param {FeedEntity} feed
   */
  async updateFeedMetadata(feed) {
    const logger = this.logger.child({ feedId: feed.id });

    const update = {};
    if (typeof feed.etag !== "undefined") update.etag = feed.etag;
    if (typeof feed.lastModified !== "undefined") update.last_modified = feed.lastModified;
    if (Object.keys(update).length === 0) {
      logger.debug("No metadata to update");
      return;
    }

    logger.debug({ msg: "Update feed metadata", feed });
    await this.knex("feeds").where({ id: feed.id }).update(update);
    logger.info({ msg: "Updated feed metadata", feedId: feed.id });
  }

  /**
   * @param {string} name
   */
  async upsertJob(name) {
    await this.knex("jobs").insert({ name }).onConflict("name").ignore();
  }

  /**
   * @param {string} name
   * @param {number} duration
   * @param {string|null} error
   */
  async upsertJobExecution(name, duration, error) {
    await this.knex("jobs").where({ name }).update({
      last_date: new Date(),
      last_duration_ms: duration,
      last_error: error,
    });
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
