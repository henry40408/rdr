export const name = "m0008-add-passkeys";

/**
 * @param {import("knex").Knex} knex
 */
export function up(knex) {
  return knex.schema.createTable("passkeys", (t) => {
    t.increments("id").primary();
    t.string("credential_id").notNullable();
    t.integer("user_id").notNullable();
    t.string("public_key").notNullable();
    t.integer("counter").notNullable();
    t.boolean("backed_up").notNullable().defaultTo(false);
    t.string("transports").notNullable(); // JSON string array

    t.timestamps(true, true);
  });
}

/**
 * @param {import("knex").Knex} knex
 */
export function down(knex) {
  return knex.schema.dropTable("passkeys");
}

export default {
  name,
  up,
  down,
};
