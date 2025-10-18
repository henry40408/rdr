import { CategoryEntity, EntryEntity, FeedEntity, ImageEntity, UserEntity } from "./entities.js";
import { afterEach, beforeEach, describe, it } from "vitest";
import { MigrationSource } from "./migration-source.js";
import { Repository } from "./repository.js";
import assert from "node:assert";
import knex from "knex";
import pino from "pino";

describe("Repository", () => {
  /** @type {Repository} */
  let repository;

  beforeEach(async () => {
    const db = knex({
      client: "sqlite3",
      connection: { filename: ":memory:" },
      migrations: { migrationSource: new MigrationSource() },
      useNullAsDefault: true,
    });
    repository = new Repository({
      knex: db,
      logger: pino({ level: "silent" }),
    });
  });

  afterEach(async () => {
    await repository.knex.destroy();
  });

  it("should migrate the database", async () => {
    await repository.init();
  });

  describe("methods", () => {
    beforeEach(async () => {
      await repository.init();
    });

    it("should create user", async () => {
      const user = new UserEntity({ id: 0, username: "testuser" });
      await repository.createUser(user, "password123");
      assert.ok(typeof user.id === "number");
    });

    it("should authenticate user", async () => {
      const user = new UserEntity({ id: 0, username: "authuser" });
      const password = "securepassword";
      await repository.createUser(user, password);

      const authenticatedUser = await repository.authenticate("authuser", password);
      assert.ok(authenticatedUser instanceof UserEntity);
      assert.strictEqual(authenticatedUser.username, "authuser");

      const failedAuth = await repository.authenticate("authuser", "wrongpassword");
      assert.strictEqual(failedAuth, undefined);
    });

    /**
     * @param {string} username
     * @param {string} password
     * @returns {Promise<UserEntity>}
     */
    async function createUser(username, password) {
      const user = new UserEntity({ id: 0, username });
      await repository.createUser(user, password);
      return user;
    }

    /**
     * @param {Repository} repository
     * @param {UserEntity} user
     */
    async function createEntries(repository, user) {
      const [categoryId] = await repository.knex("categories").insert({
        user_id: user.id,
        name: "Test Category",
      });
      const [feedId] = await repository.knex("feeds").insert({
        category_id: categoryId,
        title: "Test Feed",
        xml_url: "http://example.com/feed",
        html_url: "http://example.com",
      });

      const now = new Date().toISOString();
      const [entryId] = await repository.knex("entries").insert([
        {
          feed_id: feedId,
          guid: "entry-1",
          title: "Entry 1",
          link: "http://example.com/entry1",
          summary: "Content 1",
          description: "Content 1",
          date: now,
          read_at: null,
          starred_at: null,
        },
        {
          feed_id: feedId,
          guid: "entry-2",
          title: "Entry 2",
          link: "http://example.com/entry2",
          summary: "Content 2",
          description: "Content 2",
          date: now,
          read_at: now,
          starred_at: null,
        },
        {
          feed_id: feedId,
          guid: "entry-3",
          title: "Entry 3",
          link: "http://example.com/entry3",
          summary: "Content 3",
          description: "Content 3",
          date: now,
          read_at: null,
          starred_at: now,
        },
      ]);

      return { categoryId, feedId, entryId };
    }

    it("should count entries with various filters", async () => {
      const alice = await createUser("entryuser", "entrypassword");
      const eve = await createUser("otheruser", "otherpassword");

      const { feedId } = await createEntries(repository, alice);

      const total = await repository.countEntries({ userId: alice.id });
      assert.strictEqual(total, 3);

      // other user
      {
        const otherTotal = await repository.countEntries({ userId: eve.id });
        assert.strictEqual(otherTotal, 0);
      }

      const unread = await repository.countEntries({ userId: alice.id, status: "unread" });
      assert.strictEqual(unread, 2);

      const read = await repository.countEntries({ userId: alice.id, status: "read" });
      assert.strictEqual(read, 1);

      const starred = await repository.countEntries({ userId: alice.id, status: "starred" });
      assert.strictEqual(starred, 1);

      const searched = await repository.countEntries({ userId: alice.id, search: "Entry 2" });
      assert.strictEqual(searched, 1);

      const countByFeed = await repository.countEntriesByFeedIds(alice.id, [feedId]);
      assert.deepStrictEqual(countByFeed, {
        [feedId]: { total: 3, unread: 2 },
      });

      // other user
      {
        const otherCountByFeed = await repository.countEntriesByFeedIds(eve.id, [feedId]);
        assert.deepStrictEqual(otherCountByFeed, {});
      }
    });

    it("should return user count", async () => {
      const count1 = await repository.countUsers();
      assert.strictEqual(count1, 0);

      await createUser("user1", "password1");

      const count2 = await repository.countUsers();
      assert.strictEqual(count2, 1);

      await createUser("user2", "password2");
      await createUser("user3", "password3");

      const count3 = await repository.countUsers();
      assert.strictEqual(count3, 3);
    });

    it("should return categories with feed", async () => {
      const alice = await createUser("feeduser", "feedpassword");
      const eve = await createUser("nofeeduser", "nofeedpassword");

      const { feedId } = await createEntries(repository, alice);

      const categories = await repository.findCategoriesWithFeed(alice.id);
      assert.strictEqual(categories.length, 1);
      assert.strictEqual(categories[0].id, feedId);
      assert.strictEqual(categories[0].userId, alice.id);

      // other user
      {
        const noCategories = await repository.findCategoriesWithFeed(eve.id);
        assert.strictEqual(noCategories.length, 0);
      }
    });

    it("should return entries", async () => {
      const alice = await createUser("listuser", "listpassword");
      const eve = await createUser("emptyuser", "emptypassword");

      const { feedId } = await createEntries(repository, alice);

      const entries = await repository.findEntries({
        userId: alice.id,
        feedIds: [feedId],
        status: "unread",
        search: "Entry",
        limit: 10,
        offset: 0,
      });
      assert.strictEqual(entries.length, 2);
      for (const entry of entries) {
        assert.strictEqual(entry.feedId, feedId);
        assert.strictEqual(entry.readAt, null);
      }

      {
        const readEntries = await repository.findEntries({
          userId: alice.id,
          feedIds: [feedId],
          status: "read",
          limit: 10,
          offset: 0,
        });
        assert.strictEqual(readEntries.length, 1);
        assert.strictEqual(typeof readEntries[0].readAt, "string");
      }

      {
        const starredEntries = await repository.findEntries({
          userId: alice.id,
          feedIds: [feedId],
          status: "starred",
          limit: 10,
          offset: 0,
        });
        assert.strictEqual(starredEntries.length, 1);
        assert.strictEqual(typeof starredEntries[0].starredAt, "string");
      }

      const entry = await repository.findEntryById(alice.id, entries[0].id);
      assert.ok(entry instanceof EntryEntity);
      assert.strictEqual(entry.id, entries[0].id);

      const content = await repository.findEntryContentById(alice.id, entries[0].id);
      assert.strictEqual(typeof content, "string");
      assert.strictEqual(content, "Content 1");

      // other user
      {
        const noEntries = await repository.findEntries({ userId: eve.id });
        assert.strictEqual(noEntries.length, 0);

        const noEntry = await repository.findEntryById(eve.id, entries[0].id);
        assert.strictEqual(noEntry, undefined);

        const noContent = await repository.findEntryContentById(eve.id, entries[0].id);
        assert.strictEqual(noContent, undefined);
      }
    });

    it("should return feeds", async () => {
      const alice = await createUser("feeduser", "feedpassword");
      const eve = await createUser("nofeeduser", "nofeedpassword");

      const { categoryId, feedId } = await createEntries(repository, alice);

      {
        const feeds = await repository.findFeeds();
        assert.strictEqual(feeds.length, 1);
      }

      const feed = await repository.findFeedById(alice.id, feedId);
      assert.ok(feed instanceof FeedEntity);
      assert.strictEqual(feed.id, feedId);

      const feeds = await repository.findFeedsWithCategoryId(alice.id, categoryId);
      assert.strictEqual(feeds.length, 1);
      assert.ok(feeds[0] instanceof FeedEntity);
      assert.strictEqual(feeds[0].id, feedId);

      // other user
      {
        const noFeed = await repository.findFeedById(eve.id, feedId);
        assert.strictEqual(noFeed, undefined);

        const noFeeds = await repository.findFeedsWithCategoryId(eve.id, categoryId);
        assert.strictEqual(noFeeds.length, 0);
      }
    });

    it("should return image", async () => {
      const alice = await createUser("imageuser", "imagepassword");
      const eve = await createUser("noimageuser", "noimagepassword");

      const externalId = "test-image-123";
      const imageData = {
        user_id: alice.id,
        external_id: externalId,
        url: "http://example.com/image.jpg",
        blob: Buffer.from("fake-image-data"),
        content_type: "image/jpeg",
        etag: "etag-123",
        last_modified: "Wed, 21 Oct 2015 07:28:00 GMT",
      };

      await repository.knex("images").insert(imageData);

      const image = await repository.findImageByExternalId(alice.id, externalId);
      assert.ok(image);
      assert.strictEqual(image.externalId, externalId);
      assert.strictEqual(image.url, imageData.url);
      assert.strictEqual(image.contentType, imageData.content_type);
      assert.strictEqual(image.etag, imageData.etag);
      assert.strictEqual(image.lastModified, imageData.last_modified);

      const notFound = await repository.findImageByExternalId(alice.id, "non-existent");
      assert.strictEqual(notFound, undefined);

      const imagePks = await repository.findImagePks(alice.id);
      assert.strictEqual(imagePks.length, 1);
      assert.strictEqual(imagePks[0], image.externalId);

      // other user
      {
        const noImage = await repository.findImageByExternalId(eve.id, externalId);
        assert.strictEqual(noImage, undefined);
      }
    });

    it("should returns jobs", async () => {
      const jobs = await repository.findJobs();
      assert.ok(jobs);
      assert.strictEqual(jobs.length, 0);
    });

    it("should mark entries as read", async () => {
      const alice = await createUser("imageuser", "imagepassword");
      const eve = await createUser("noimageuser", "noimagepassword");

      const { feedId } = await createEntries(repository, alice);

      // other user
      {
        const otherUpdated = await repository.markEntriesAsRead({ userId: eve.id, feedIds: [feedId] });
        assert.strictEqual(otherUpdated, 0);
      }

      const updated = await repository.markEntriesAsRead({ userId: alice.id, feedIds: [feedId] });
      assert.strictEqual(updated, 2);

      const unreadBefore = await repository.countEntries({ userId: alice.id, status: "unread" });
      assert.strictEqual(unreadBefore, 0);

      // Test marking entries older than one day
      {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);
        await repository
          .knex("entries")
          .where({ feed_id: feedId, guid: "entry-1" })
          .update({ date: yesterday.toISOString(), read_at: null });

        const updated = await repository.markEntriesAsRead({
          userId: alice.id,
          feedIds: [feedId],
          olderThan: "day",
        });
        assert.strictEqual(updated, 1);
      }

      // Test marking entries older than one week
      {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 8);
        await repository
          .knex("entries")
          .where({ feed_id: feedId, guid: "entry-3" })
          .update({ date: lastWeek.toISOString(), read_at: null });

        const updated = await repository.markEntriesAsRead({
          userId: alice.id,
          feedIds: [feedId],
          olderThan: "week",
        });
        assert.strictEqual(updated, 1);
      }

      // Test marking entries older than one month
      {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 2);
        await repository
          .knex("entries")
          .where({ feed_id: feedId, guid: "entry-1" })
          .update({ date: lastMonth.toISOString(), read_at: null });

        const updated = await repository.markEntriesAsRead({
          userId: alice.id,
          feedIds: [feedId],
          olderThan: "month",
        });
        assert.strictEqual(updated, 1);
      }

      // Test marking entries older than one year
      {
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 2);
        await repository
          .knex("entries")
          .where({ feed_id: feedId, guid: "entry-3" })
          .update({ date: lastYear.toISOString(), read_at: null });

        const updated = await repository.markEntriesAsRead({
          userId: alice.id,
          feedIds: [feedId],
          olderThan: "year",
        });
        assert.strictEqual(updated, 1);
      }

      // Test with search parameter
      {
        await repository.knex("entries").where({ feed_id: feedId }).update({ read_at: null });

        const updated = await repository.markEntriesAsRead({
          userId: alice.id,
          feedIds: [feedId],
          search: "Entry 1",
        });
        assert.strictEqual(updated, 1);
      }
    });

    it("should toggle read entry", async () => {
      const alice = await createUser("toggleuser", "togglepassword");
      const eve = await createUser("notoggleuser", "notogglepassword");
      const { entryId } = await createEntries(repository, alice);
      {
        const res = await repository.toggleReadEntry(alice.id, entryId);
        assert.ok(res instanceof Date);
        assert.ok(res.valueOf() > 0);
      }
      {
        const res = await repository.toggleReadEntry(alice.id, entryId);
        assert.strictEqual(res, undefined);
      }
      // other user
      await assert.rejects(() => repository.toggleReadEntry(eve.id, entryId), {
        name: "Error",
        message: `Entry with id ${entryId} not found`,
      });
    });

    it("should toggle star entry", async () => {
      const alice = await createUser("togglestaruser", "togglestarpassword");
      const eve = await createUser("notogglestaruser", "notogglestarpassword");
      const { entryId } = await createEntries(repository, alice);
      {
        const res = await repository.toggleStarEntry(alice.id, entryId);
        assert.strictEqual(res, undefined);
      }
      {
        const res = await repository.toggleStarEntry(alice.id, entryId);
        assert.ok(res instanceof Date);
        assert.ok(res.valueOf() > 0);
      }
      // other user
      await assert.rejects(() => repository.toggleStarEntry(eve.id, entryId), {
        name: "Error",
        message: `Entry with id ${entryId} not found`,
      });
    });

    it("should upsert categories", async () => {
      const user = await createUser("categoryuser", "categorypassword");

      const [feed1, feed2] = [
        new FeedEntity({
          id: 0,
          categoryId: 0,
          title: "Feed 1",
          xmlUrl: "http://example.com/feed1.xml",
          htmlUrl: "http://example.com/feed1",
        }),
        new FeedEntity({
          id: 0,
          categoryId: 0,
          title: "Feed 2",
          xmlUrl: "http://example.com/feed2.xml",
          htmlUrl: "http://example.com/feed2",
        }),
      ];

      const category = new CategoryEntity({
        id: 0,
        userId: user.id,
        name: "Tech News",
      });
      category.feeds.push(feed1, feed2);

      await repository.upsertCategories(user.id, [category]);

      const categories = await repository.findCategoriesWithFeed(user.id);
      assert.strictEqual(categories.length, 1);

      assert.ok(categories[0].id !== 0);
      assert.strictEqual(categories[0].name, "Tech News");
      assert.strictEqual(categories[0].feeds.length, 2);

      assert.ok(categories[0].feeds[0].id !== 0);
      assert.strictEqual(categories[0].feeds[0].title, "Feed 1");

      assert.ok(categories[0].feeds[1].id !== 0);
      assert.strictEqual(categories[0].feeds[1].title, "Feed 2");

      // Test idempotency - upserting again should not create duplicates
      await repository.upsertCategories(user.id, [category]);

      const categoriesAfterSecondUpsert = await repository.findCategoriesWithFeed(user.id);
      assert.strictEqual(categoriesAfterSecondUpsert.length, 1);
      assert.strictEqual(categoriesAfterSecondUpsert[0].id, categories[0].id);
      assert.strictEqual(categoriesAfterSecondUpsert[0].feeds.length, 2);
    });

    it("should upsert entries", async () => {
      const alice = await createUser("entryupsertuser", "entryupsertpassword");
      const eve = await createUser("noentryupsertuser", "noentryupsertpassword");

      const { feedId } = await createEntries(repository, alice);

      const now = new Date();

      /** @type {import('./repository.js').FeedItem[]} */
      const items = [
        {
          guid: "new-entry-1",
          title: "New Entry 1",
          link: "http://example.com/new-entry-1",
          date: now,
          pubdate: now,
          summary: "This is a new entry",
          description: "This is a new entry",
          author: "New Author",
        },
      ];

      const feed = await repository.findFeedById(alice.id, feedId);
      assert.ok(feed);

      // empty list is a no-op
      await repository.upsertEntries(alice.id, feed, []);

      // upsert new entries
      await repository.upsertEntries(alice.id, feed, items);

      const entries = await repository.findEntries({ userId: alice.id, feedIds: [feedId] });
      assert.strictEqual(entries.length, 4); // 3 existing + 1 new

      const newEntry = entries.find((e) => e.guid === "new-entry-1");
      assert.ok(newEntry);
      assert.strictEqual(newEntry.guid, "new-entry-1");
      assert.strictEqual(newEntry.title, "New Entry 1");
      assert.strictEqual(newEntry.link, "http://example.com/new-entry-1");
      assert.ok(newEntry.date);
      assert.strictEqual(newEntry.author, "New Author");
      assert.strictEqual(newEntry.readAt, null);
      assert.strictEqual(newEntry.starredAt, null);

      // other user
      {
        await assert.rejects(
          async () => {
            await repository.upsertEntries(eve.id, feed, items);
          },
          {
            name: "Error",
            message: `Feed ${feedId} not found for user ${eve.id}`,
          },
        );
      }

      // upsert entries with date instead of pubdate
      {
        /** @type {import('./repository.js').FeedItem[]} */
        const itemsWithDateOnly = [
          {
            guid: "new-entry-2",
            title: "New Entry 2",
            link: "http://example.com/new-entry-2",
            date: now,
            summary: "This is another new entry",
            description: "This is another new entry",
            author: "Another Author",
            pubdate: null,
          },
        ];

        await repository.upsertEntries(alice.id, feed, itemsWithDateOnly);

        const entriesAfterSecondUpsert = await repository.findEntries({ userId: alice.id, feedIds: [feedId] });
        assert.strictEqual(entriesAfterSecondUpsert.length, 5); // 4 existing + 1 new

        const newEntry = entriesAfterSecondUpsert.find((e) => e.guid === "new-entry-2");
        assert.ok(newEntry);
        assert.strictEqual(newEntry.date, now.toISOString());
      }

      // upsert entries with weird date formats
      {
        /** @type {import('./repository.js').FeedItem[]} */
        const itemsWithWeirdDates = [
          {
            guid: "new-entry-3",
            title: "New Entry 3",
            link: "http://example.com/new-entry-3",
            date: null,
            summary: "This is yet another new entry",
            description: "This is yet another new entry",
            author: "Yet Another Author",
            pubdate: null,
            "rss:pubdate": { "#": "週五, 26 九月 2025 06:29:00 +0000" },
          },
        ];

        await repository.upsertEntries(alice.id, feed, itemsWithWeirdDates);

        const entriesAfterThirdUpsert = await repository.findEntries({ userId: alice.id, feedIds: [feedId] });
        assert.strictEqual(entriesAfterThirdUpsert.length, 6); // 5 existing + 1 new

        const newEntry = entriesAfterThirdUpsert.find((e) => e.guid === "new-entry-3");
        assert.ok(newEntry);
        assert.strictEqual(newEntry.date, "2025-09-26T06:29:00.000Z");
      }
    });

    it("should upsert image", async () => {
      const user = await createUser("upsertimageuser", "upsertimagepassword");

      const externalId = "test-upsert-image";
      const imageData = new ImageEntity({
        externalId,
        url: "http://example.com/image.jpg",
        blob: Buffer.from("fake-image-data"),
        contentType: "image/jpeg",
        etag: "etag-123",
        lastModified: "Wed, 21 Oct 2015 07:28:00 GMT",
      });

      // First upsert
      await repository.upsertImage(user.id, imageData);

      let image = await repository.findImageByExternalId(user.id, externalId);
      assert.ok(image);
      assert.strictEqual(image.externalId, externalId);
      assert.strictEqual(image.url, imageData.url);
      assert.strictEqual(image.contentType, imageData.contentType);
      assert.strictEqual(image.etag, imageData.etag);
      assert.strictEqual(image.lastModified, imageData.lastModified);

      // Second upsert with updated data
      const updatedImageData = new ImageEntity({
        externalId,
        url: imageData.url,
        blob: Buffer.from("updated-image-data"),
        contentType: imageData.contentType,
        etag: "etag-456",
        lastModified: "Thu, 22 Oct 2015 08:30:00 GMT",
      });

      await repository.upsertImage(user.id, updatedImageData);

      image = await repository.findImageByExternalId(user.id, externalId);
      assert.ok(image);
      assert.strictEqual(image.externalId, externalId);
      assert.strictEqual(image.etag, "etag-456");
      assert.strictEqual(image.lastModified, "Thu, 22 Oct 2015 08:30:00 GMT");

      // Verify only one image exists
      const imagePks = await repository.findImagePks(user.id);
      assert.strictEqual(imagePks.length, 1);
    });

    it("should update feed metadata", async () => {
      const user = await createUser("updatefeeduser", "updatefeedpassword");
      const { feedId } = await createEntries(repository, user);

      const feed = await repository.findFeedById(user.id, feedId);
      assert.ok(feed);

      // no-op
      {
        const updated = await repository.updateFeedMetadata(feedId, feed);
        assert.strictEqual(updated, 0);
      }

      feed.etag = "new-etag-456";
      feed.lastModified = "Fri, 23 Oct 2015 09:31:00 GMT";

      const updated = await repository.updateFeedMetadata(feedId, feed);
      assert.strictEqual(updated, 1);

      const updatedFeed = await repository.findFeedById(user.id, feedId);
      assert.ok(updatedFeed);
      assert.strictEqual(updatedFeed.etag, "new-etag-456");
      assert.strictEqual(updatedFeed.lastModified, "Fri, 23 Oct 2015 09:31:00 GMT");
    });

    it("should upsert job", async () => {
      const jobName = "test-job";

      // First upsert
      await repository.upsertJob(jobName);

      let jobs = await repository.findJobs();
      assert.strictEqual(jobs.length, 1);
      assert.strictEqual(jobs[0].name, jobName);

      // Second upsert
      await repository.upsertJob(jobName);

      jobs = await repository.findJobs();
      assert.strictEqual(jobs.length, 1);
      assert.strictEqual(jobs[0].name, jobName);
    });

    it("should upsert job execution", async () => {
      const jobName = "execution-time-job";

      // Upsert job first
      await repository.upsertJob(jobName);

      // Upsert execution time
      const duration1 = 1;
      await repository.upsertJobExecution(jobName, duration1, null);

      let jobs = await repository.findJobs();
      assert.strictEqual(jobs.length, 1);
      assert.strictEqual(jobs[0].name, jobName);
      assert.strictEqual(jobs[0].lastDurationMs, duration1);
      assert.strictEqual(jobs[0].lastError, null);

      // Upsert updated execution time and error message
      const duration2 = 2;
      await repository.upsertJobExecution(jobName, duration2, "Some error occurred");

      jobs = await repository.findJobs();
      assert.strictEqual(jobs.length, 1);
      assert.strictEqual(jobs[0].name, jobName);
      assert.strictEqual(jobs[0].lastDurationMs, duration2);
      assert.strictEqual(jobs[0].lastError, "Some error occurred");
    });
  });
});
