export const name = "0001-initial";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema.createTable("entries", (t) => {
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
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema.dropTable("entries");
}

export default {
  name,
  up,
  down,
};
