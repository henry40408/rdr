// @ts-check

export const name = "m0006-index-id-date-on-entries";

/**
 * @param {import("knex").Knex} knex
 */
export function up(knex) {
  return knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS entries_feed_id_id_date_idx ON entries (feed_id, date, id);
    CREATE INDEX IF NOT EXISTS entries_feed_id_id_date_desc_idx ON entries (feed_id, date DESC, id DESC);
  `);
}

/**
 * @param {import("knex").Knex} knex
 */
export function down(knex) {
  return knex.schema.raw(`
    DROP INDEX IF EXISTS entries_feed_id_id_date_idx;
    DROP INDEX IF EXISTS entries_feed_id_id_date_desc_idx;
  `);
}

export default {
  up,
  down,
  name,
};
