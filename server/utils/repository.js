import { CategoryEntity, EntryEntity, FeedEntity, ImageEntity, JobEntity, UserEntity } from "./entities.js";
import { compare, hash } from "bcrypt";
import { add } from "date-fns";
import chunk from "lodash/chunk.js";
import get from "lodash/get.js";
import { normalizeDatetime } from "./helper.js";

export const HASH_ROUNDS = 12;

/**
 * @typedef {Pick<import('feedparser').Item, 'guid'|'title'|'link'|'date'|'summary'|'description'|'author'|'pubdate'> & { 'rss:pubdate'?: { '#': string } }} FeedItem
 */

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
   * @param {string} username
   * @param {string} password
   * @returns {Promise<UserEntity|undefined>}
   */
  async authenticate(username, password) {
    const row = await this.knex("users").where({ username }).first();
    if (!row) return undefined;

    const match = await compare(password, row.password_hash);
    if (!match) return undefined;

    return new UserEntity({ id: row.id, username: row.username, isAdmin: !!row.is_admin });
  }

  /**
   * @param {object} opts
   * @param {number} opts.userId
   * @param {number[]} [opts.feedIds=[]]
   * @param {string} [opts.search]
   * @param {"all"|"read"|"unread"|"starred"} [opts.status="all"]
   * @returns {Promise<number>}
   */
  async countEntries({ userId, feedIds = [], search, status = "all" }) {
    const q = this.knex("entries").whereIn("feed_id", function () {
      this.select("id")
        .from("feeds")
        .whereIn("category_id", (builder) => {
          builder.select("id").from("categories").where("user_id", userId);
        });
    });
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
   * @param {number} userId
   * @param {number[]} feedIds
   * @returns {Promise<Record<string,{ total: number, unread: number }>>}
   */
  async countEntriesByFeedIds(userId, feedIds) {
    if (feedIds.length === 0) return {};

    /** @type {Array<{ feed_id: number, total: number, unread: number }>} */
    const rows = await this.knex("entries")
      .select("feed_id")
      .count({ total: "*" })
      .sum({ unread: this.knex.raw("CASE WHEN read_at IS NULL THEN 1 ELSE 0 END") })
      .whereIn("feed_id", (builder) => {
        builder
          .select("id")
          .from("feeds")
          .whereIn("category_id", (builder) => {
            builder.select("id").from("categories").where("user_id", userId);
          });
      })
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

  /** @returns {Promise<number>} */
  async countUsers() {
    const result = await this.knex("users").count({ count: "*" }).first();
    return result ? Number(result.count) : 0;
  }

  /**
   * @param {UserEntity} user
   * @param {string} password
   * @returns {Promise<UserEntity>}
   */
  async createUser(user, password) {
    return await this.knex.transaction(async (tx) => {
      const passwordHash = await hash(password, HASH_ROUNDS);
      const userCount = await tx("users").count({ count: "*" }).first();
      const isFirstUser = userCount ? Number(userCount.count) === 0 : true;

      const [id] = await tx("users").insert({
        username: user.username,
        password_hash: passwordHash,
        is_admin: isFirstUser ? 1 : 0,
      });
      if (id) user.id = id;
      user.isAdmin = isFirstUser;

      this.logger.info({ msg: "Created user", username: user.username, id: user.id, isAdmin: isFirstUser });
      return user;
    });
  }

  /**
   * @param {number} userId
   * @returns {Promise<CategoryEntity[]>}
   */
  async findCategoriesWithFeed(userId) {
    const rows = await this.knex("categories")
      .join("feeds", "categories.id", "feeds.category_id")
      .select(
        this.knex.ref("categories.id").as("category_id"),
        this.knex.ref("categories.user_id").as("category_user_id"),
        this.knex.ref("categories.name").as("category_name"),
        this.knex.ref("feeds.id").as("feed_id"),
        this.knex.ref("feeds.title").as("feed_title"),
        this.knex.ref("feeds.xml_url").as("feed_xml_url"),
        this.knex.ref("feeds.html_url").as("feed_html_url"),
        this.knex.ref("feeds.fetched_at").as("feed_fetched_at"),
        this.knex.ref("feeds.etag").as("feed_etag"),
        this.knex.ref("feeds.last_modified").as("feed_last_modified"),
      )
      .where("categories.user_id", userId);

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
        const newCategory = new CategoryEntity({
          id: row.category_id,
          userId: row.category_user_id,
          name: row.category_name,
        });
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
   * @param {number} opts.userId
   * @param {"asc"|"desc"} [opts.direction="desc"]
   * @param {number[]} [opts.feedIds]
   * @param {number} [opts.limit=100]
   * @param {number} [opts.offset=0]
   * @param {"date"} [opts.order="date"]
   * @param {string} [opts.search]
   * @param {"all"|"read"|"unread"|"starred"} [opts.status="all"]
   * @returns {Promise<EntryEntity[]>}
   */
  async findEntries({
    userId,
    direction = "desc",
    feedIds = [],
    limit = 100,
    offset = 0,
    order = "date",
    search,
    status = "all",
  }) {
    let q = this.knex("entries")
      .select(["id", "feed_id", "guid", "title", "link", "date", "author", "read_at", "starred_at"])
      .whereIn("feed_id", (builder) => {
        builder
          .select("id")
          .from("feeds")
          .whereIn("category_id", (builder) => {
            builder.select("id").from("categories").where("user_id", userId);
          });
      });
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

    switch (order) {
      case "date":
      default:
        q = q.orderBy("date", direction);
    }

    const rows = await q.limit(limit).offset(offset);
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
   * @param {number} userId
   * @param {number} id
   * @returns {Promise<EntryEntity|undefined>}
   */
  async findEntryById(userId, id) {
    const row = await this.knex("entries")
      .whereIn("feed_id", (builder) => {
        builder
          .select("id")
          .from("feeds")
          .whereIn("category_id", (builder) => {
            builder.select("id").from("categories").where("user_id", userId);
          });
      })
      .where({ id })
      .first();
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
   * @param {number} userId
   * @param {number} id
   * @returns {Promise<string|undefined>}
   */
  async findEntryContentById(userId, id) {
    const row = await this.knex("entries")
      .whereIn("feed_id", (builder) => {
        builder
          .select("id")
          .from("feeds")
          .whereIn("category_id", (builder) => {
            builder.select("id").from("categories").where("user_id", userId);
          });
      })
      .where({ id })
      .first();
    if (!row) return undefined;
    return row.description;
  }

  /**
   * @param {number} userId
   * @param {number} id
   * @returns {Promise<FeedEntity|undefined>}
   */
  async findFeedById(userId, id) {
    const row = await this.knex("feeds")
      .whereIn("category_id", (builder) => {
        builder.select("id").from("categories").where("user_id", userId);
      })
      .where({ id })
      .first();
    if (!row) return undefined;

    return new FeedEntity({
      id: row.id,
      categoryId: row.category_id,
      title: row.title,
      xmlUrl: row.xml_url,
      htmlUrl: row.html_url,
      fetchedAt: row.fetched_at,
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
   * @param {number} userId
   * @param {number} categoryId
   * @returns {Promise<FeedEntity[]>}
   */
  async findFeedsWithCategoryId(userId, categoryId) {
    const rows = await this.knex("feeds")
      .where({ category_id: categoryId })
      .whereIn("category_id", (builder) => {
        builder.select("id").from("categories").where("user_id", userId);
      })
      .select();
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
   * @param {number} userId
   * @param {string} externalId
   * @returns {Promise<ImageEntity|undefined>}
   */
  async findImageByExternalId(userId, externalId) {
    const row = await this.knex("images").where({ user_id: userId, external_id: externalId }).first();
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
   * @param {number} userId
   * @returns {Promise<string[]>}
   */
  async findImagePks(userId) {
    const rows = await this.knex("images").where({ user_id: userId }).select();
    return rows.map((row) => row.external_id);
  }

  /**
   * @param {string} name
   * @returns {Promise<JobEntity|undefined>}
   */
  async findJobByName(name) {
    const row = await this.knex("jobs").where({ name }).first();
    if (!row) return undefined;
    return new JobEntity({
      id: row.id,
      name: row.name,
      pausedAt: row.paused_at,
      lastDate: row.last_date,
      lastDurationMs: row.last_duration_ms,
      lastError: row.last_error,
    });
  }

  /**
   * @returns {Promise<JobEntity[]>}
   */
  async findJobs() {
    const jobs = await this.knex("jobs").select();
    return jobs.map(
      (job) =>
        new JobEntity({
          id: job.id,
          name: job.name,
          pausedAt: job.paused_at,
          lastDate: job.last_date,
          lastDurationMs: job.last_duration_ms,
          lastError: job.last_error,
        }),
    );
  }

  /**
   * @param {number} id
   * @returns {Promise<UserEntity|undefined>}
   */
  async findUserById(id) {
    const row = await this.knex("users").where({ id }).first();
    if (!row) return undefined;
    return new UserEntity({ id: row.id, username: row.username, isAdmin: !!row.is_admin });
  }

  /**
   * @returns {Promise<UserEntity[]>}
   */
  async findUsers() {
    const rows = await this.knex("users").select();
    return rows.map((row) => new UserEntity({ id: row.id, username: row.username, isAdmin: !!row.is_admin }));
  }

  /**
   * @param {number} userId
   * @returns {Promise<Record<string,string>>}
   */
  async findUserSettings(userId) {
    const rows = await this.knex("user_settings").where({ user_id: userId }).select();
    return Object.fromEntries(rows.map((row) => [row.name, row.value]));
  }

  /**
   * @param {object} opts
   * @param {number} opts.userId
   * @param {number[]} [opts.feedIds]
   * @param {"day"|"week"|"month"|"year"} [opts.olderThan]
   * @param {string} [opts.search]
   * @returns {Promise<number>}
   */
  async markEntriesAsRead({ userId, feedIds, olderThan, search }) {
    const now = new Date();
    const nowISO = now.toISOString();

    const q = this.knex("entries")
      .whereNull("read_at")
      .whereIn("feed_id", (builder) => {
        builder
          .select("id")
          .from("feeds")
          .whereIn("category_id", (builder) => {
            builder.select("id").from("categories").where("user_id", userId);
          });
      });
    if (feedIds && feedIds.length > 0) q.whereIn("feed_id", feedIds);
    switch (olderThan) {
      case "day":
        q.where("date", "<", add(now, { days: -1 }).toISOString());
        break;
      case "week":
        q.where("date", "<", add(now, { days: -7 }).toISOString());
        break;
      case "month":
        q.where("date", "<", add(now, { months: -1 }).toISOString());
        break;
      case "year":
        q.where("date", "<", add(now, { years: -1 }).toISOString());
        break;
    }
    if (search) {
      const uppered = search.toUpperCase();
      q.where((builder) =>
        builder
          .where(this.knex.raw(`upper(title)`), "like", `%${uppered}%`)
          .orWhere(this.knex.raw(`upper(description)`), "like", `%${uppered}%`),
      );
    }

    const updated = await q.update({ read_at: nowISO, updated_at: nowISO });
    this.logger.info({ msg: "Marked entries as read", updated });

    return updated;
  }

  /**
   * @param {string} name
   * @returns {Promise<number>}
   */
  async registerJob(name) {
    const [id] = await this.knex("jobs").insert({ name }).onConflict("name").ignore();
    this.logger.info({ msg: "Registered job", name });
    return id;
  }

  /**
   * @param {number} userId
   * @param {number} id
   * @returns {Promise<Date|undefined>}
   */
  async toggleReadEntry(userId, id) {
    const logger = this.logger.child({ entryId: id });
    return await this.knex.transaction(async (tx) => {
      const row = await tx("entries")
        .whereIn("feed_id", (builder) => {
          builder
            .select("id")
            .from("feeds")
            .whereIn("category_id", (builder) => {
              builder.select("id").from("categories").where("user_id", userId);
            });
        })
        .where({ id })
        .first();
      if (!row) throw new Error(`Entry with id ${id} not found`);

      const now = new Date();
      const isoNow = now.toISOString();
      if (row.read_at) {
        await tx("entries").where({ id }).update({ read_at: null, updated_at: isoNow });
        logger.info({ msg: "Marked entry as unread" });
        return undefined;
      } else {
        await tx("entries").where({ id }).update({ read_at: isoNow, updated_at: isoNow });
        logger.info({ msg: "Marked entry as read" });
        return now;
      }
    });
  }

  /**
   * @param {number} userId
   * @param {number} id
   * @returns {Promise<Date|undefined>}
   */
  async toggleStarEntry(userId, id) {
    const logger = this.logger.child({ entryId: id });
    return await this.knex.transaction(async (tx) => {
      const row = await tx("entries")
        .whereIn("feed_id", (builder) => {
          builder
            .select("id")
            .from("feeds")
            .whereIn("category_id", (builder) => {
              builder.select("id").from("categories").where("user_id", userId);
            });
        })
        .where({ id })
        .first();
      if (!row) throw new Error(`Entry with id ${id} not found`);

      const now = new Date();
      const isoNow = now.toISOString();
      if (row.starred_at) {
        await tx("entries").where({ id }).update({ starred_at: null, updated_at: isoNow });
        logger.info({ msg: "Unstarred entry" });
        return undefined;
      } else {
        await tx("entries").where({ id }).update({ starred_at: isoNow, updated_at: isoNow });
        logger.info({ msg: "Starred entry" });
        return now;
      }
    });
  }

  /**
   * @param {number} userId
   * @param {FeedEntity} feed
   * @returns {Promise<number>}
   */
  async updateFeedMetadata(userId, feed) {
    const logger = this.logger.child({ feedId: feed.id, userId });

    const update = {};
    if ("etag" in feed && feed.etag) update.etag = feed.etag;
    if ("lastModified" in feed && feed.lastModified) update.last_modified = feed.lastModified;
    if (Object.keys(update).length === 0) {
      logger.debug("No metadata to update");
      return 0;
    }

    logger.debug({ msg: "Update feed metadata", feed });
    const updated = await this.knex("feeds")
      .whereIn("category_id", (builder) => {
        builder.select("id").from("categories").where("user_id", userId);
      })
      .where({ id: feed.id })
      .update(update);
    logger.info({ msg: "Updated feed metadata", feedId: feed.id, updated });
    return updated;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @param {string} newPassword
   * @returns {Promise<number>}
   */
  async updateUserPassword(username, password, newPassword) {
    const authenticated = await this.authenticate(username, password);
    if (!authenticated) return 0;

    const passwordHash = await hash(newPassword, HASH_ROUNDS);
    const updated = await this.knex("users").where({ username }).update({ password_hash: passwordHash });
    this.logger.info({ msg: "Updated user password", username });
    return updated;
  }

  /**
   * @param {number} userId
   * @param {Record<string,string>} settings
   */
  async updateUserSettings(userId, settings) {
    await this.knex.transaction(async (tx) => {
      for (const [name, value] of Object.entries(settings)) {
        await tx("user_settings").insert({ user_id: userId, name, value }).onConflict(["user_id", "name"]).merge();
        this.logger.info({ msg: "Upserted user setting", userId, name });
      }
    });
    this.logger.info({ msg: "Updated user settings", userId, count: Object.keys(settings).length });
  }

  /**
   * @param {number} userId
   * @param {CategoryEntity[]} categories
   */
  async upsertCategories(userId, categories) {
    await this.knex.transaction(async (tx) => {
      for (const category of categories) {
        const [categoryId] = await tx("categories")
          .insert({ user_id: userId, name: category.name })
          .onConflict(["user_id", "name"])
          .merge();
        this.logger.info({ msg: "Upserted category", userId, name: category.name });
        if (categoryId) category.id = categoryId;

        for (const feed of category.feeds) {
          const [feedId] = await tx("feeds")
            .insert({
              category_id: categoryId,
              title: feed.title,
              xml_url: feed.xmlUrl,
              html_url: feed.htmlUrl,
            })
            .onConflict(["category_id", "xml_url"])
            .merge();
          this.logger.info({ msg: "Upserted feed", category: category.name, title: feed.title });
          if (feedId) feed.id = feedId;
        }
      }
    });
    this.logger.info({ msg: "Upserted categories", count: categories.length });
  }

  /**
   * @param {number} userId
   * @param {FeedEntity} feed
   * @param {FeedItem[]} items
   */
  async upsertEntries(userId, feed, items) {
    const logger = this.logger.child({ feedId: feed.id, userId });

    if (items.length === 0) {
      logger.warn({ msg: "No entries to upsert" });
      return;
    }

    const now = new Date();
    logger.debug({ msg: "Upserting entries", count: items.length });

    await this.knex.transaction(async (tx) => {
      const found = await tx("feeds")
        .whereIn("category_id", (builder) => {
          builder.select("id").from("categories").where("user_id", userId);
        })
        .where({ id: feed.id })
        .first();
      if (!found) throw new Error(`Feed ${feed.id} not found for user ${userId}`);

      const chunks = chunk(items, 10);
      for (const chunk of chunks) {
        await tx("entries")
          .insert(
            chunk.map((e) => ({
              feed_id: feed.id,
              guid: e.guid,
              title: e.title ?? "(no title)",
              link: e.link,
              date: this._itemDate(e).toISOString(),
              summary: e.summary ?? "(no summary)",
              description: e.description,
              author: e.author,
            })),
          )
          .onConflict(["feed_id", "guid"])
          .merge();
        logger.debug({ msg: "Upserted chunk of entries", count: chunk.length });
      }

      await tx("feeds").where({ id: feed.id }).update({ fetched_at: now.toISOString() });
    });

    logger.info({ msg: "Upserted entries", count: items.length, fetchedAt: now });
  }

  /**
   * @param {number} userId
   * @param {ImageEntity} image
   */
  async upsertImage(userId, image) {
    const logger = this.logger.child({ externalId: image.externalId, userId });

    logger.debug("Upserting image");
    await this.knex("images")
      .insert({
        user_id: userId,
        external_id: image.externalId,
        url: image.url,
        blob: image.blob,
        content_type: image.contentType,
        etag: image.etag,
        last_modified: image.lastModified,
      })
      .onConflict(["user_id", "external_id"])
      .merge();
    logger.info("Upserted image");
  }

  /**
   * @param {JobEntity} job
   */
  async upsertJob(job) {
    const [jobId] = await this.knex("jobs")
      .insert({
        name: job.name,
        paused_at: job.pausedAt,
        last_date: job.lastDate,
        last_duration_ms: job.lastDurationMs,
        last_error: job.lastError,
      })
      .onConflict("name")
      .merge();
    if (jobId) job.id = jobId;
    this.logger.debug({ msg: "Upserted job", job });
  }

  async _setPragmas() {
    await this.knex.raw("PRAGMA busy_timeout = 5000");
    await this.knex.raw("PRAGMA journal_mode = WAL");
    await this.knex.raw("PRAGMA foreign_keys = OFF");
    await this.knex.raw("PRAGMA synchronous = NORMAL");
  }

  /**
   * @param {FeedItem} item
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
