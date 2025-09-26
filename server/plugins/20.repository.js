import knex from 'knex';
import { MigrationSource } from '../utils/migrationSource';

export class Repository {
    /**
     * @param {object} opts
     * @param {string} opts.cachePath
     * @param {import('pino').Logger} opts.logger
     */
    constructor({ cachePath, logger }) {
        this.cachePath = cachePath;
        this.logger = logger.child({ context: "repository" });
    }

    async init() {
        this.knex = knex({
            client: 'sqlite3',
            connection: {
                filename: this.cachePath,
            },
            migrations:{
                migrationSource: new MigrationSource(),
            },
            useNullAsDefault: true,
        });
        this.logger.info('Database connected');

        await this.knex.migrate.latest();
        this.logger.info('Database migrated');
    }

    async dispose(){
        this.knex?.destroy();
        this.logger.info('Database disconnected');
    }
}

export default defineNitroPlugin(
    /** @param {import('nitropack/types').NitroApp} nitroApp */
    async (nitroApp) => {
        const config = useRuntimeConfig();
        const cachePath = config.cachePath;
        
        nitroApp.repository = new Repository({
            cachePath,
            logger: nitroApp.logger,
        });
        await nitroApp.repository.init();

        nitroApp.hooks.hook('close', async () => {
            await nitroApp.repository.dispose();
        });
    },
);