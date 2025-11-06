// @ts-check

export const name = "m0004-add-last-error-to-feeds";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema.alterTable("feeds", (t) => {
    t.string("last_error").nullable();
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema.alterTable("feeds", (t) => {
    t.dropColumn("last_error");
  });
}

export default { up, down, name };
