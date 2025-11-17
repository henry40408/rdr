// @ts-check

export const name = "m0001-initial";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema
    .createTable("users", (t) => {
      t.increments("id").primary();

      t.string("username").notNullable().unique();
      t.string("password_hash").notNullable();
      t.boolean("is_admin").notNullable().defaultTo(false);

      t.timestamps(true, true);
    })
    .createTable("categories", (t) => {
      t.increments("id").primary();

      t.integer("user_id").notNullable().index();
      t.string("name").notNullable();

      t.timestamps(true, true);

      t.unique(["user_id", "name"]);
    })
    .createTable("feeds", (t) => {
      t.increments("id").primary();
      t.integer("category_id").notNullable();

      t.string("title").notNullable();
      t.string("xml_url").notNullable();
      t.string("html_url").notNullable();

      t.timestamp("fetched_at").index();
      t.string("etag");
      t.string("last_modified");

      t.timestamps(true, true);

      t.unique(["category_id", "xml_url"]);
    })
    .createTable("entries", (t) => {
      t.increments("id").primary();

      t.integer("feed_id").notNullable();
      t.string("guid").notNullable();

      t.string("title").notNullable();
      t.string("link").notNullable();
      t.timestamp("date").notNullable().index();
      t.string("author");

      t.string("summary").notNullable();
      t.string("description");

      t.timestamp("read_at").index();
      t.timestamp("starred_at").index();

      t.timestamps(true, true);

      t.unique(["feed_id", "guid"]);
    })
    .createTable("images", (t) => {
      t.string("external_id").notNullable();
      t.integer("user_id").notNullable();

      t.string("url").notNullable();
      t.binary("blob").notNullable();
      t.string("content_type").notNullable();

      t.string("etag");
      t.string("last_modified");

      t.timestamps(true, true);

      t.primary(["external_id", "user_id"]);
    })
    .createTable("jobs", (t) => {
      t.increments("id").primary();

      t.string("name").notNullable().unique();

      t.timestamp("last_date").index();
      t.integer("last_duration_ms");
      t.text("last_error");

      t.timestamps(true, true);
    });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema
    .dropTable("jobs")
    .dropTable("images")
    .dropTable("entries")
    .dropTable("feeds")
    .dropTable("categories")
    .dropTable("users");
}

export default {
  name,
  up,
  down,
};
