export const name = "0001-initial";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema
    .createTable("entries", (t) => {
      t.increments("id").primary();

      t.string("feed_id").notNullable();
      t.string("guid").notNullable();

      t.string("title").notNullable();
      t.string("link").notNullable();
      t.timestamp("date").notNullable();
      t.string("summary").notNullable();

      t.string("description");
      t.string("author");

      t.timestamp("read_at");
      t.timestamp("starred_at");

      t.timestamps(true, true);

      t.unique(["feed_id", "guid"]);

      t.index("feed_id");
      t.index("guid");
      t.index("date");
      t.index("read_at");
      t.index("starred_at");
    })
    .createTable("feed_metadata", (t) => {
      t.string("feed_id").primary().notNullable();

      t.timestamp("fetched_at");

      t.string("etag");
      t.string("last_modified");

      t.timestamps(true, true);

      t.index("fetched_at");
    })
    .createTable("feed_image", (t) => {
      t.string("feed_id").primary().notNullable();

      t.binary("blob").notNullable();
      t.string("content_type").notNullable();

      t.string("etag");
      t.string("last_modified");

      t.timestamps(true, true);
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema.dropTable("feed_metadata").dropTable("entries");
}

export default {
  name,
  up,
  down,
};
