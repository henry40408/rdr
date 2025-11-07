// @ts-check

export const name = "m0003-job-paused-at";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema.alterTable("jobs", (t) => {
    t.timestamp("paused_at").nullable();
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema.alterTable("jobs", (t) => {
    t.dropColumn("paused_at");
  });
}

export default { up, down, name };
