import migration1 from "./migrations/m0001-initial.js";

export class MigrationSource {
  /**
   * @returns {Promise<string[]>}
   */
  async getMigrations() {
    return [migration1.name];
  }

  /**
   * @param {string} migration
   * @returns {string}
   */
  getMigrationName(migration) {
    return migration;
  }

  /**
   * @param {string} migration
   * @returns {Promise<{up: (knex: import('knex').Knex) => Promise<void>, down: (knex: import('knex').Knex) => Promise<void>}>}
   */
  async getMigration(migration) {
    switch (migration) {
      case migration1.name:
        return migration1;
      default:
        throw new Error(`Unknown migration: ${migration}`);
    }
  }
}
