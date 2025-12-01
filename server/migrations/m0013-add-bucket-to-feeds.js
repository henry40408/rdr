// @ts-check

export const name = "m0013-add-bucket-to-feeds";

/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.raw(`
    ALTER TABLE feeds 
    ADD COLUMN bucket INTEGER GENERATED ALWAYS AS (
      (unicode(substr(xml_url, 1, 1)) * 31 + 
        unicode(substr(xml_url, length(xml_url) / 4, 1)) * 29 + 
        unicode(substr(xml_url, length(xml_url) / 2, 1)) * 17 + 
        unicode(substr(xml_url, length(xml_url) * 3 / 4, 1)) * 23 + 
        unicode(substr(xml_url, -1, 1)) * 13 + 
        length(xml_url) * 7
      ) % 60
    ) VIRTUAL
  `);

  return knex.schema.alterTable("feeds", (t) => {
    t.index("bucket");
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.table("feeds", (t) => {
    t.dropIndex("bucket");
  });

  return knex.raw(`
    ALTER TABLE feeds 
    DROP COLUMN bucket
  `);
}

export default {
  name,
  up,
  down,
};
