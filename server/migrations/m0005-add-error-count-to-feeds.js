export const name = "m0005-add-error-count-to-feeds";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema.alterTable("feeds", (t) => {
    t.integer("error_count").notNullable().defaultTo(0);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema.alterTable("feeds", (t) => {
    t.dropColumn("error_count");
  });
}

export default {
  up,
  down,
  name,
};
