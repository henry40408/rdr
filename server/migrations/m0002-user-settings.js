export const name = "m0002-user-settings";

/**
 * @param {import('knex').Knex} knex
 */
export function up(knex) {
  return knex.schema.createTable("user_settings", (t) => {
    t.increments("id").primary();

    t.integer("user_id").notNullable();
    t.string("name").notNullable();

    t.string("value").notNullable();

    t.timestamps(true, true);

    t.unique(["user_id", "name"]);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export function down(knex) {
  return knex.schema.dropTable("user_settings");
}

export default {
  up,
  down,
  name,
};
