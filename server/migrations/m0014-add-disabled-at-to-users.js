export const name = "m0014-add-disabled-at-to-users";

export function up(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.timestamp("disabled_at").nullable().defaultTo(null);
  });
}

export function down(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("disabled_at");
  });
}

export default {
  name,
  up,
  down,
};
