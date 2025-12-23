// @ts-check

import {
  CategoryEntity,
  EntryEntity,
  FeedEntity,
  ImageEntity,
  JobEntity,
  PasskeyEntity,
  UserEntity,
} from "./entities.js";
import { compare, hash } from "bcrypt";
import { LRUCache } from "lru-cache";
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
    /** @type {LRUCache<number, number>} */
    this.nonceCache = new LRUCache({ max: 100 });
  }

  async init() {
    await this._setPragmas();
    this.logger.info("Database pragmas set");

    await this._fixMigrations();

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

    // Disabled users cannot authenticate
    if (row.disabled_at) return undefined;

    return new UserEntity({
      id: row.id,
      username: row.username,
      nonce: row.nonce,
      isAdmin: !!row.is_admin,
      disabledAt: row.disabled_at,
    });
  }

  /**
   * @param {string|null|undefined} dateString
   * @returns {string}
   */
  convertSqliteDate(dateString) {
    if (!dateString || typeof dateString !== "string") throw new Error("Invalid date string");

    const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
    if (!pattern.test(dateString)) throw new Error("Invalid date string format");

    const date = new Date(`${dateString.replace(" ", "T")}Z`);
    if (isNaN(date.valueOf())) throw new Error("Invalid date string");

    return date.toISOString();
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
      const escapedSearch = search.replace(/[%_\\]/g, "\\$&");
      const searchPattern = `%${escapedSearch}%`;
      q.where((builder) =>
        builder
          .where(this.knex.raw("upper(title) like upper(?)", [searchPattern]))
          .orWhere(this.knex.raw("upper(description) like upper(?)", [searchPattern])),
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

  /**
   * @param {number} userId
   * @param {"all"|"error"} [status="all"]
   * @returns {Promise<number>}
   */
  async countFeeds(userId, status = "all") {
    let q = this.knex("feeds").whereIn("category_id", (builder) => {
      builder.select("id").from("categories").where("user_id", userId);
    });
    switch (status) {
      case "all":
        break;
      case "error":
        q = q.whereNotNull("last_error");
        break;
    }
    const result = await q.count({ count: "*" }).first();
    return result ? Number(result.count) : 0;
  }

  /** @returns {Promise<number>} */
  async countUsers() {
    const result = await this.knex("users").count({ count: "*" }).first();
    return result ? Number(result.count) : 0;
  }

  /**
   * @param {number} userId
   * @param {string} categoryName
   * @param {NewCategoryFeedEntity} feed
   * @returns {Promise<FeedEntity>}
   */
  async createFeed(userId, categoryName, feed) {
    return await this.knex.transaction(async (tx) => {
      const category = await this.findOrCreateCategory(tx, userId, categoryName);

      await tx("feeds")
        .insert({
          category_id: category.id,
          title: feed.title,
          xml_url: feed.xmlUrl,
          html_url: feed.htmlUrl,
          disable_http2: feed.disableHttp2 ?? false,
        })
        .onConflict(["category_id", "xml_url"])
        .ignore();

      const created = await tx("feeds").where({ category_id: category.id, xml_url: feed.xmlUrl }).first();
      if (!created) throw new Error("Failed to find or create feed");

      this.logger.info({ msg: "Created feed", userId, feedId: created.id, categoryId: category.id });
      return new FeedEntity({
        id: created.id,
        categoryId: created.category_id,
        title: created.title,
        xmlUrl: created.xml_url,
        htmlUrl: created.html_url,
        disableHttp2: created.disable_http2 === 0 ? false : true,
        userAgent: created.user_agent,
        feedUpdatedAt: created.feed_updated_at,
      });
    });
  }

  /**
   * @param {NewPasskeyEntity} passkey
   * @returns {Promise<PasskeyEntity>}
   */
  async createPasskey(passkey) {
    return await this.knex.transaction(async (tx) => {
      await tx("passkeys").insert({
        user_id: passkey.userId,
        credential_id: passkey.credentialId,
        public_key: passkey.publicKey,
        counter: passkey.counter,
        backed_up: passkey.backedUp,
        transports: JSON.stringify(passkey.transports),
        display_name: passkey.displayName,
      });

      const created = await tx("passkeys").where({ user_id: passkey.userId }).first();
      if (!created) throw new Error("Failed to create passkey");

      this.logger.info({ msg: "Created passkey", userId: passkey.userId, passkeyId: created.id });
      return new PasskeyEntity({
        id: created.id,
        credentialId: created.credential_id,
        userId: created.user_id,
        publicKey: created.public_key,
        counter: created.counter,
        backedUp: created.backed_up,
        transports: JSON.parse(created.transports),
        displayName: created.display_name,
        createdAt: this.convertSqliteDate(created.created_at),
      });
    });
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

      await tx("users").insert({
        username: user.username,
        password_hash: passwordHash,
        nonce: user.nonce,
        is_admin: isFirstUser ? 1 : 0,
      });

      const created = await tx("users").where({ username: user.username }).first();
      if (!created) throw new Error("Failed to create user");

      this.logger.info({ msg: "Created user", username: user.username, id: user.id, isAdmin: isFirstUser });
      return new UserEntity({
        id: created.id,
        username: created.username,
        nonce: created.nonce,
        isAdmin: !!created.is_admin,
        disabledAt: created.disabled_at,
      });
    });
  }

  /**
   * @param {number} userId
   * @param {number} categoryId
   * @return {Promise<number|undefined>}
   */
  async deleteCategory(userId, categoryId) {
    const logger = this.logger.child({ userId, categoryId });

    const deletedCount = await this.knex.transaction(async (tx) => {
      const feeds = await tx("feeds").where({ category_id: categoryId });
      for (const feed of feeds) {
        const deletedEntries = await tx("entries").where({ feed_id: feed.id }).del();
        logger.info({ msg: "Deleted entries for feed", feedId: feed.id, deletedEntries });

        const imageExternalId = buildFeedImageKey(feed.id);
        const deletedImage = await tx("images").where({ user_id: userId, external_id: imageExternalId }).del();
        logger.info({ msg: "Deleted feed image", feedId: feed.id, deletedImage });
      }

      const deletedFeeds = await tx("feeds").where({ category_id: categoryId }).del();
      logger.info({ msg: "Deleted feeds for category", categoryId, deletedFeeds });

      const deletedCategory = await tx("categories").where({ id: categoryId }).del();
      logger.info({ msg: "Deleted category", categoryId, deletedCategory });

      return deletedCategory;
    });

    logger.info({ msg: "Deleted category transaction completed" });
    return deletedCount;
  }

  /**
   * @param {import('knex').Knex.Transaction} tx
   * @param {number} userId
   * @param {number} categoryId
   * @return {Promise<number|undefined>}
   */
  async deleteCategoryIfEmpty(tx, userId, categoryId) {
    const feedCount = await tx("feeds").where({ category_id: categoryId }).count({ count: "*" }).first();
    if (feedCount && Number(feedCount.count) > 0) return;

    const deleted = await tx("categories").where({ id: categoryId, user_id: userId }).del();
    this.logger.info({ msg: "Deleted empty category", userId, categoryId, deleted });
    return deleted;
  }

  /**
   * @param {number} userId
   * @param {number} feedId
   * @return {Promise<number|undefined>}
   */
  async deleteFeed(userId, feedId) {
    const logger = this.logger.child({ userId, feedId });

    const deletedFeeds = await this.knex.transaction(async (tx) => {
      const feed = await tx("feeds")
        .whereIn("category_id", (builder) => {
          builder.select("id").from("categories").where("user_id", userId);
        })
        .where({ id: feedId })
        .first();
      if (!feed) {
        logger.warn({ msg: "Feed not found" });
        return;
      }

      const deletedEntries = await tx("entries").where({ feed_id: feedId }).del();
      logger.info({ msg: "Deleted entries for feed", deletedEntries });

      const deletedFeed = await tx("feeds").where({ id: feedId }).del();
      logger.info({ msg: "Deleted feed", deletedFeed });

      const imageExternalId = buildFeedImageKey(feed.id);
      const deletedImage = await tx("images").where({ user_id: userId, external_id: imageExternalId }).del();
      logger.info({ msg: "Deleted feed image", deletedImage });

      const deletedCategory = await this.deleteCategoryIfEmpty(tx, userId, feed.category_id);
      if (deletedCategory) {
        logger.info({ msg: "Deleted empty category", categoryId: feed.category_id });
      }

      return deletedFeed;
    });

    logger.info({ msg: "Deleted feed transaction completed" });
    return deletedFeeds;
  }

  /**
   * @param {number} userId
   * @param {number} id
   * @returns {Promise<number|undefined>}
   */
  async deletePasskeyById(userId, id) {
    const deletedCount = await this.knex("passkeys").where({ user_id: userId, id }).del();
    this.logger.info({ msg: "Deleted passkey", userId, id, deletedCount });
    return deletedCount;
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
        this.knex.ref("feeds.last_error").as("feed_last_error"),
        this.knex.ref("feeds.error_count").as("feed_error_count"),
        this.knex.ref("feeds.disable_http2").as("feed_disable_http2"),
        this.knex.ref("feeds.user_agent").as("feed_user_agent"),
        this.knex.ref("feeds.feed_updated_at").as("feed_feed_updated_at"),
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
            lastError: row.feed_last_error,
            errorCount: row.feed_error_count,
            disableHttp2: row.feed_disable_http2 === 0 ? false : true,
            userAgent: row.feed_user_agent,
            feedUpdatedAt: row.feed_feed_updated_at,
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
            lastError: row.feed_last_error,
            disableHttp2: row.feed_disable_http2 === 0 ? false : true,
            userAgent: row.feed_user_agent,
            feedUpdatedAt: row.feed_feed_updated_at,
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
   * @param {string} [opts.cursor]
   * @param {"asc"|"desc"} [opts.direction="desc"]
   * @param {number[]} [opts.feedIds]
   * @param {number} [opts.id]
   * @param {number} [opts.limit=100]
   * @param {"date"} [opts.order="date"]
   * @param {string} [opts.search]
   * @param {"all"|"read"|"unread"|"starred"} [opts.status="all"]
   * @returns {Promise<EntryEntity[]>}
   */
  async findEntries({
    userId,
    cursor,
    direction = "desc",
    feedIds = [],
    id,
    limit = 100,
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
      const escapedSearch = search.replace(/[%_\\]/g, "\\$&");
      const searchPattern = `%${escapedSearch}%`;
      q.where((builder) =>
        builder
          .where(this.knex.raw("upper(title) like upper(?)", [searchPattern]))
          .orWhere(this.knex.raw("upper(description) like upper(?)", [searchPattern])),
      );
    }

    if (cursor) {
      if (direction === "asc")
        q = q.where((builder) => {
          builder.where("date", ">", cursor);
          builder.orWhere((dateBuilder) => {
            dateBuilder.where("date", "=", cursor);
            if (id) dateBuilder.where("id", ">", id);
          });
        });
      else
        q = q.where((builder) => {
          builder.where("date", "<", cursor);
          builder.orWhere((dateBuilder) => {
            dateBuilder.where("date", "=", cursor);
            if (id) dateBuilder.where("id", "<", id);
          });
        });
    }

    switch (order) {
      case "date":
      default:
        q = q.orderBy("date", direction).orderBy("id", direction);
    }

    const rows = await q.limit(limit);
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
      lastError: row.last_error,
      errorCount: row.error_count,
      disableHttp2: row.disable_http2 === 0 ? false : true,
      userAgent: row.user_agent,
      feedUpdatedAt: row.feed_updated_at,
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
          lastError: row.last_error,
          disableHttp2: row.disable_http2 === 0 ? false : true,
          userAgent: row.user_agent,
          feedUpdatedAt: row.feed_updated_at,
        }),
    );
  }

  /**
   * @param {number} userId
   * @param {number} bucket
   * @returns {Promise<FeedEntity[]>}
   */
  async findFeedsByBucket(userId, bucket) {
    const rows = await this.knex("feeds")
      .where({ bucket })
      .whereIn("category_id", (builder) => {
        builder.select("id").from("categories").where("user_id", userId);
      })
      .orderBy("fetched_at", "asc") // Fetch older feeds first
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
          lastError: row.last_error,
          disableHttp2: row.disable_http2 === 0 ? false : true,
          userAgent: row.user_agent,
          feedUpdatedAt: row.feed_updated_at,
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
          lastError: row.last_error,
          disableHttp2: row.disable_http2 === 0 ? false : true,
          userAgent: row.user_agent,
          feedUpdatedAt: row.feed_updated_at,
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
   * @param {import('knex').Knex.Transaction} tx
   * @param {number} userId
   * @param {string} categoryName
   * @returns {Promise<CategoryEntity>}
   */
  async findOrCreateCategory(tx, userId, categoryName) {
    await tx("categories").insert({ user_id: userId, name: categoryName }).onConflict(["user_id", "name"]).ignore();
    const category = await tx("categories").where({ user_id: userId, name: categoryName }).first();
    if (!category) throw new Error("Failed to find or create category");
    return new CategoryEntity({ id: category.id, userId: category.user_id, name: category.name });
  }

  /**
   * @param {string} credentialId
   * @returns {Promise<PasskeyEntity|undefined>}
   */
  async findPasskeyByCredentialId(credentialId) {
    const row = await this.knex("passkeys").where({ credential_id: credentialId }).first();
    if (!row) return undefined;
    return new PasskeyEntity({
      id: row.id,
      credentialId: row.credential_id,
      userId: row.user_id,
      publicKey: row.public_key,
      counter: row.counter,
      backedUp: row.backed_up,
      transports: JSON.parse(row.transports),
      createdAt: this.convertSqliteDate(row.created_at),
    });
  }

  /**
   * @param {string} username
   * @returns {Promise<PasskeyEntity[]>}
   */
  async findPasskeysByUsername(username) {
    const user = await this.findUserByUsername(username);
    if (!user) return [];

    const rows = await this.knex("passkeys").where({ user_id: user.id });
    return rows.map(
      (row) =>
        new PasskeyEntity({
          id: row.id,
          credentialId: row.credential_id,
          userId: row.user_id,
          publicKey: row.public_key,
          counter: row.counter,
          backedUp: row.backed_up,
          transports: JSON.parse(row.transports),
          displayName: row.display_name,
          createdAt: this.convertSqliteDate(row.created_at),
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
    return new UserEntity({
      id: row.id,
      username: row.username,
      nonce: row.nonce,
      isAdmin: !!row.is_admin,
      disabledAt: row.disabled_at,
    });
  }

  /**
   * @param {string} username
   * @returns {Promise<UserEntity|undefined>}
   */
  async findUserByUsername(username) {
    const row = await this.knex("users").where({ username }).first();
    if (!row) return undefined;
    return new UserEntity({
      id: row.id,
      username: row.username,
      nonce: row.nonce,
      isAdmin: !!row.is_admin,
      disabledAt: row.disabled_at,
    });
  }

  /**
   * @param {number} id
   * @returns {Promise<number|undefined>}
   **/
  async findUserNonceById(id) {
    if (this.nonceCache.has(id)) return this.nonceCache.get(id);

    const row = await this.knex("users").where({ id }).first();
    if (!row) return undefined;

    this.nonceCache.set(id, row.nonce);
    return row.nonce;
  }

  /**
   * @returns {Promise<UserEntity[]>}
   */
  async findUsers() {
    const rows = await this.knex("users").select();
    return rows.map(
      (row) =>
        new UserEntity({
          id: row.id,
          username: row.username,
          nonce: row.nonce,
          isAdmin: !!row.is_admin,
          disabledAt: row.disabled_at,
        }),
    );
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
   * @param {string} [opts.before]
   * @param {"day"|"week"|"month"|"year"} [opts.olderThan]
   * @param {string} [opts.search]
   * @returns {Promise<number>}
   */
  async markEntriesAsRead({ userId, feedIds, before, olderThan, search }) {
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
    if (before) {
      q.where("date", "<=", before);
    } else {
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
    }
    if (search) {
      const escapedSearch = search.replace(/[%_\\]/g, "\\$&");
      const searchPattern = `%${escapedSearch}%`;
      q.where((builder) =>
        builder
          .where(this.knex.raw("upper(title) like upper(?)", [searchPattern]))
          .orWhere(this.knex.raw("upper(description) like upper(?)", [searchPattern])),
      );
    }

    const updated = await q.update({ read_at: nowISO, updated_at: nowISO });
    this.logger.info({ msg: "Marked entries as read", updated });
    return updated;
  }

  /**
   * @param {string} name
   * @returns {Promise<JobEntity>}
   */
  async registerJob(name) {
    return await this.knex.transaction(async (tx) => {
      await tx("jobs").insert({ name }).onConflict("name").ignore();

      const row = await tx("jobs").where({ name }).first();
      if (!row) throw new Error("Failed to register job");

      this.logger.info({ msg: "Registered job", name });
      return new JobEntity({
        id: row.id,
        name: row.name,
        pausedAt: row.paused_at,
        lastDate: row.last_date,
        lastDurationMs: row.last_duration_ms,
        lastError: row.last_error,
      });
    });
  }

  /**
   * @param {number} userId
   */
  async toggleUser(userId) {
    const user = await this.findUserById(userId);
    if (!user) throw new Error(`User with id ${userId} not found`);

    if (user?.disabledAt) {
      await this.knex("users").where({ id: userId }).update({ disabled_at: null, updated_at: this.knex.fn.now() });
      this.logger.info({ msg: "Enabled user", userId });
    } else {
      await this.knex("users")
        .where({ id: userId })
        .update({ disabled_at: this.knex.fn.now(), updated_at: this.knex.fn.now() });
      this.logger.info({ msg: "Disabled user", userId });
    }
  }

  /**
   * @param {number} userId
   * @param {number[]} entryIds
   * @param {"read"|"unread"|"starred"|"unstarred"} status
   * @returns {Promise<number>}
   */
  async updateEntriesStatus(userId, entryIds, status) {
    const update = {};
    switch (status) {
      case "read":
        update.read_at = this.knex.fn.now();
        break;
      case "unread":
        update.read_at = null;
        break;
      case "starred":
        update.starred_at = this.knex.fn.now();
        break;
      case "unstarred":
        update.starred_at = null;
        break;
    }
    if (Object.keys(update).length === 0) {
      this.logger.debug({ msg: "No entry status to update", entryIds, status });
      return 0;
    }
    update.updated_at = this.knex.fn.now();

    const updated = await this.knex("entries")
      .whereIn("feed_id", (builder) => {
        builder
          .select("id")
          .from("feeds")
          .whereIn("category_id", (builder) => {
            builder.select("id").from("categories").where("user_id", userId);
          });
      })
      .whereIn("id", entryIds)
      .update(update);
    this.logger.info({ msg: "Updated entries status", entryIds, status, updated });
    return updated;
  }

  /**
   * @param {number} userId
   * @param {CategoryEntity} category
   * @returns {Promise<number>}
   */
  async updateCategory(userId, category) {
    const update = {};
    if ("name" in category) update.name = category.name;
    if (Object.keys(update).length === 0) {
      this.logger.debug({ msg: "No category fields to update", categoryId: category.id });
      return 0;
    }
    update.updated_at = this.knex.fn.now();

    const updated = await this.knex("categories").where({ user_id: userId, id: category.id }).update(update);
    this.logger.info({ msg: "Updated category", categoryId: category.id, updated });
    return updated;
  }

  /**
   * @param {number} userId
   * @param {string} categoryName
   * @param {FeedEntity} feed
   * @returns {Promise<number>}
   */
  async updateFeed(userId, categoryName, feed) {
    return await this.knex.transaction(async (tx) => {
      const existing = await tx("feeds")
        .whereIn("category_id", (builder) => {
          builder.select("id").from("categories").where("user_id", userId);
        })
        .where({ id: feed.id })
        .first();
      if (!existing) {
        this.logger.warn({ msg: "Feed not found for update", feedId: feed.id });
        return 0;
      }
      const existingCategoryId = existing.category_id;

      const category = await this.findOrCreateCategory(tx, userId, categoryName);

      const update = {};
      if (category.id !== existing.category_id) update.category_id = category.id; // change category if needed
      if ("title" in feed) update.title = feed.title;
      if ("xmlUrl" in feed) update.xml_url = feed.xmlUrl;
      if ("htmlUrl" in feed) update.html_url = feed.htmlUrl;
      if ("disableHttp2" in feed) update.disable_http2 = feed.disableHttp2 ?? false;
      if ("userAgent" in feed) update.user_agent = feed.userAgent || null;
      if (Object.keys(update).length === 0) {
        this.logger.debug({ msg: "No feed fields to update", feedId: feed.id });
        return 0;
      }
      update.updated_at = tx.fn.now();

      const updated = await tx("feeds")
        .whereIn("category_id", (builder) => {
          builder.select("id").from("categories").where("user_id", userId);
        })
        .where({ id: feed.id })
        .update(update);
      this.logger.info({ msg: "Updated feed", feedId: feed.id, updated });

      await this.deleteCategoryIfEmpty(tx, userId, existingCategoryId); // delete old category if empty

      return updated;
    });
  }

  /**
   * @param {object} opts
   * @param {number} opts.userId
   * @param {FeedEntity} opts.feed
   * @param {string|null} [opts.error]
   * @returns {Promise<number>}
   */
  async updateFeedMetadata({ userId, feed, error }) {
    const logger = this.logger.child({ feedId: feed.id, userId });

    const update = {};
    if (feed.etag) update.etag = feed.etag;
    if (feed.lastModified) update.last_modified = feed.lastModified;
    if (feed.feedUpdatedAt) update.feed_updated_at = feed.feedUpdatedAt;
    if (typeof error !== "undefined") update.last_error = error;
    if (Object.keys(update).length === 0) {
      logger.debug("No metadata to update");
      return 0;
    }
    update.updated_at = this.knex.fn.now();

    logger.debug({ msg: "Update feed metadata", feed });
    const updated = await this.knex.transaction(async (tx) => {
      const updated = await tx("feeds")
        .whereIn("category_id", (builder) => {
          builder.select("id").from("categories").where("user_id", userId);
        })
        .where({ id: feed.id })
        .update(update);

      // Increment error_count if there was an error, otherwise reset it to 0
      if (typeof error !== "undefined" && error !== null)
        await tx("feeds").where({ id: feed.id }).increment("error_count");
      else await tx("feeds").where({ id: feed.id }).update({ error_count: 0, updated_at: tx.fn.now() });

      return updated;
    });

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
    const updated = await this.knex("users")
      .where({ username: authenticated.username })
      .update({ password_hash: passwordHash, nonce: Date.now(), updated_at: this.knex.fn.now() });
    this.logger.info({ msg: "Updated user password", updated });
    this.nonceCache.delete(authenticated.id);
    return updated;
  }

  /**
   * @param {number} userId
   * @param {Record<string,string>} settings
   */
  async updateUserSettings(userId, settings) {
    await this.knex.transaction(async (tx) => {
      for (const [name, value] of Object.entries(settings)) {
        await tx("user_settings").insert({ user_id: userId, name, value }).onConflict(["user_id", "name"]).merge({
          value,
          updated_at: tx.fn.now(),
        });
        this.logger.info({ msg: "Upserted user setting", userId, name });
      }
    });
    this.logger.info({ msg: "Updated user settings", userId, count: Object.keys(settings).length });
  }

  /**
   * @param {number} userId
   * @param {NewCategoryEntity[]} newCategories
   * @returns {Promise<CategoryEntity[]>}
   */
  async upsertCategories(userId, newCategories) {
    /** @type {CategoryEntity[]} */
    const categories = [];

    await this.knex.transaction(async (tx) => {
      for (const newCategory of newCategories) {
        await tx("categories")
          .insert({ user_id: userId, name: newCategory.name })
          .onConflict(["user_id", "name"])
          .merge({ updated_at: tx.fn.now() });
        this.logger.info({ msg: "Upserted category", userId, name: newCategory.name });

        const createdCategory = await tx("categories").where({ user_id: userId, name: newCategory.name }).first();
        if (!createdCategory) throw new Error("Failed to upsert category");

        const categoryEntity = new CategoryEntity({
          id: createdCategory.id,
          userId: createdCategory.user_id,
          name: createdCategory.name,
        });

        for (const feed of newCategory.feeds) {
          await tx("feeds")
            .insert({
              category_id: createdCategory.id,
              title: feed.title,
              xml_url: feed.xmlUrl,
              html_url: feed.htmlUrl,
            })
            .onConflict(["category_id", "xml_url"])
            .merge({ title: feed.title, html_url: feed.htmlUrl, updated_at: tx.fn.now() });

          const createdFeed = await tx("feeds")
            .where({ category_id: createdCategory.id, xml_url: feed.xmlUrl })
            .first();
          if (!createdFeed) throw new Error("Failed to upsert feed");

          const feedEntity = new FeedEntity({
            id: createdFeed.id,
            categoryId: createdFeed.category_id,
            title: createdFeed.title,
            xmlUrl: createdFeed.xml_url,
            htmlUrl: createdFeed.html_url,
            fetchedAt: createdFeed.fetched_at,
            etag: createdFeed.etag,
            lastModified: createdFeed.last_modified,
            lastError: createdFeed.last_error,
            disableHttp2: createdFeed.disable_http2 === 0 ? false : true,
            userAgent: createdFeed.user_agent,
            feedUpdatedAt: createdFeed.feed_updated_at,
          });
          categoryEntity.feeds.push(feedEntity);

          this.logger.info({ msg: "Upserted feed", category: createdCategory.name, title: feed.title });
        }

        categories.push(categoryEntity);
      }
    });

    this.logger.info({ msg: "Upserted categories", count: categories.length });
    return categories;
  }

  /**
   * @param {number} userId
   * @param {FeedEntity} feed
   * @param {FeedItem[]} items
   * @param {import('feedparser').Meta|undefined} [meta]
   * @returns {Promise<EntryEntity[]>}
   */
  async upsertEntries(userId, feed, items, meta) {
    const logger = this.logger.child({ feedId: feed.id, userId });

    if (items.length === 0) {
      logger.warn({ msg: "No entries to upsert" });
      return [];
    }

    const now = new Date();
    logger.debug({ msg: "Upserting entries", count: items.length });

    return await this.knex.transaction(async (tx) => {
      /** @type {EntryEntity[]} */
      const entries = [];

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
              date: this._itemDate(e, meta).toISOString(),
              summary: e.summary ?? "(no summary)",
              description: e.description,
              author: e.author,
            })),
          )
          .onConflict(["feed_id", "guid"])
          .merge({ updated_at: tx.fn.now() });

        const createdEntries = await tx("entries")
          .whereIn("feed_id", [feed.id])
          .whereIn(
            "guid",
            chunk.map((e) => e.guid),
          )
          .select();
        for (const row of createdEntries) {
          entries.push(
            new EntryEntity({
              id: row.id,
              feedId: row.feed_id,
              guid: row.guid,
              title: row.title,
              link: row.link,
              date: row.date,
              author: row.author,
            }),
          );
        }

        logger.debug({ msg: "Upserted chunk of entries", count: chunk.length });
      }

      await tx("feeds").where({ id: feed.id }).update({ fetched_at: now.toISOString(), updated_at: tx.fn.now() });
      logger.info({ msg: "Upserted entries", count: items.length, fetchedAt: now });
      return entries;
    });
  }

  /**
   * @param {number} userId
   * @param {NewImageEntity} image
   * @returns {Promise<ImageEntity>}
   */
  async upsertImage(userId, image) {
    const logger = this.logger.child({ externalId: image.externalId, userId });
    logger.debug("Upserting image");

    return this.knex.transaction(async (tx) => {
      await tx("images")
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
        .merge({
          url: image.url,
          blob: image.blob,
          content_type: image.contentType,
          etag: image.etag,
          last_modified: image.lastModified,
          updated_at: this.knex.fn.now(),
        });

      const upsertedImage = await tx("images").where({ user_id: userId, external_id: image.externalId }).first();
      if (!upsertedImage) throw new Error("Failed to upsert image");

      logger.info("Upserted image");
      return new ImageEntity({
        externalId: upsertedImage.external_id,
        url: upsertedImage.url,
        blob: upsertedImage.blob,
        contentType: upsertedImage.content_type,
        etag: upsertedImage.etag,
        lastModified: upsertedImage.last_modified,
      });
    });
  }

  /**
   * @param {NewJobEntity} job
   * @return {Promise<JobEntity>}
   */
  async upsertJob(job) {
    return this.knex.transaction(async (tx) => {
      await tx("jobs")
        .insert({
          name: job.name,
          paused_at: job.pausedAt,
          last_date: job.lastDate,
          last_duration_ms: job.lastDurationMs,
          last_error: job.lastError,
        })
        .onConflict("name")
        .merge({
          paused_at: job.pausedAt,
          last_date: job.lastDate,
          last_duration_ms: job.lastDurationMs,
          last_error: job.lastError,
          updated_at: this.knex.fn.now(),
        });
      this.logger.debug({ msg: "Upserted job", job });

      const row = await tx("jobs").where({ name: job.name }).first();
      if (!row) throw new Error("Failed to upsert job");

      this.logger.info({ msg: "Upserted job", jobId: row.id });
      return new JobEntity({
        id: row.id,
        name: row.name,
        pausedAt: row.paused_at,
        lastDate: row.last_date,
        lastDurationMs: row.last_duration_ms,
        lastError: row.last_error,
      });
    });
  }

  async _fixMigrations() {
    const exists = await this.knex.schema.hasTable("knex_migrations");
    if (!exists) return;

    const fixed = await this.knex
      .table("knex_migrations")
      .update({ name: "m0001-initial" })
      .where({ name: "0001-initial" });
    this.logger.info({ msg: "Fixed initial migration", fixed });
  }

  /**
   * @param {FeedItem} item
   * @param {import('feedparser').Meta|undefined} meta
   * @returns {Date}
   */
  _itemDate(item, meta) {
    if (item.pubdate && !isNaN(item.pubdate.valueOf())) return item.pubdate;
    if (item.date && !isNaN(item.date.valueOf())) return item.date;

    /** @type {string} */
    const raw = get(item, ["rss:pubdate", "#"], "");

    const normalized = normalizeDatetime(raw);
    if (normalized) {
      this.logger.debug({ msg: "Using normalized date", date: normalized });
      return normalized;
    }

    const date = meta?.date ?? meta?.pubdate;
    if (date) {
      this.logger.debug({ msg: "Using feed date as fallback", date });
      return date;
    }

    throw new Error("Item has no pubdate or date and feed has no date");
  }

  async _setPragmas() {
    await this.knex.raw("PRAGMA busy_timeout = 5000");
    await this.knex.raw("PRAGMA busy_timeout").then(([row]) => {
      this.logger.debug({ msg: "Set PRAGMA busy_timeout", value: row.timeout });
    });

    await this.knex.raw("PRAGMA journal_mode = WAL");
    await this.knex.raw("PRAGMA journal_mode").then(([row]) => {
      this.logger.debug({ msg: "Set PRAGMA journal_mode", value: row.journal_mode });
    });

    await this.knex.raw("PRAGMA foreign_keys = OFF");
    await this.knex.raw("PRAGMA foreign_keys").then(([row]) => {
      this.logger.debug({ msg: "Set PRAGMA foreign_keys", value: row.foreign_keys });
    });

    await this.knex.raw("PRAGMA synchronous = NORMAL");
    await this.knex.raw("PRAGMA synchronous").then(([row]) => {
      this.logger.debug({ msg: "Set PRAGMA synchronous", value: row.synchronous });
    });
  }
}
