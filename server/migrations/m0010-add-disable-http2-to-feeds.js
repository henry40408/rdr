export const name = "m0010-add-disable-http2-to-feeds";

export async function up(knex) {
  await knex.schema.alterTable("feeds", (table) => {
    table.boolean("disable_http2").notNullable().defaultTo(false);
  });
}

export async function down(knex) {
  await knex.schema.alterTable("feeds", (table) => {
    table.dropColumn("disable_http2");
  });
}

export default {
  name,
  up,
  down,
};
