// @ts-check

export const name = "m0011-add-user-agent-to-feeds";

/**
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable("feeds", (t) => {
    t.string("user_agent").nullable();
  });
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable("feeds", (t) => {
    t.dropColumn("user_agent");
  });
}

export default {
  name,
  up,
  down,
};
