// @ts-check

export const name = "m0009-add-display-name-to-passkeys";

/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable("passkeys", (t) => {
    t.text("display_name").nullable();
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable("passkeys", (t) => {
    t.dropColumn("display_name");
  });
}

export default {
  name,
  up,
  down,
};
