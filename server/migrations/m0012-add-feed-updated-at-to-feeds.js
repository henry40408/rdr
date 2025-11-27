export const name = "m0012-add-feed-updated-at-to-feeds";

/**
 * @param {import("knex").Knex} knex
 */
export function up(knex) {
  return knex.schema.alterTable("feeds", (table) => {
    table.timestamp("feed_updated_at").nullable();
  });
}

/**
 * @param {import("knex").Knex} knex
 */
export function down(knex) {
  return knex.schema.alterTable("feeds", (table) => {
    table.dropColumn("feed_updated_at");
  });
}

export default {
  name,
  up,
  down,
};
