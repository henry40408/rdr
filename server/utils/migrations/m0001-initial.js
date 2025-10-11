export const name = "0001-initial";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema
    .createTable("categories", (t) => {
      t.increments("id").primary();

      t.string("name").notNullable().unique();

      t.timestamps(true, true);
    })
    .createTable("feeds", (t) => {
      t.increments("id").primary();
      t.integer("category_id").notNullable();

      t.string("title").notNullable();
      t.string("xml_url").notNullable().unique();
      t.string("html_url").notNullable();

      t.timestamp("fetched_at").index();
      t.string("etag");
      t.string("last_modified");

      t.timestamps(true, true);
    })
    .createTable("entries", (t) => {
      t.increments("id").primary();

      t.integer("feed_id").notNullable().index();
      t.string("guid").notNullable().index();
      t.unique(["feed_id", "guid"]);

      t.string("title").notNullable();
      t.string("link").notNullable();
      t.timestamp("date").notNullable().index();
      t.string("summary").notNullable();

      t.string("description");
      t.string("author");

      t.timestamp("read_at").index();
      t.timestamp("starred_at").index();

      t.timestamps(true, true);
    })
    .createTable("image", (t) => {
      t.string("external_id").primary().notNullable();

      t.string("url").notNullable();
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
  return knex.schema.dropTable("image").dropTable("entries").dropTable("feeds").dropTable("categories");
}

export default {
  name,
  up,
  down,
};
