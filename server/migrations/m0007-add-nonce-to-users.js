export const name = "m0007-add-nonce-to-users";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema.table("users", (table) => {
    table.integer("nonce").defaultTo(0).notNullable();
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema.table("users", (table) => {
    table.dropColumn("nonce");
  });
}

export default {
  name,
  up,
  down,
};
