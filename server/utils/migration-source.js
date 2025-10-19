import { migrationNames, migrations } from "./migrations/index.js";

export class MigrationSource {
  /**
   * @returns {Promise<string[]>}
   */
  async getMigrations() {
    return migrationNames;
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
    const mig = migrations[migration];
    if (!mig) throw new Error(`Migration not found: ${migration}`);
    return {
      up: mig.up,
      down: mig.down,
    };
  }
}
