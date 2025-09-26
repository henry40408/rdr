export class MigrationSource {
    /**
     * @returns {Promise<string[]>}
     */
    async getMigrations() {
        return [];
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
        throw new Error('Not implemented');
    }
}