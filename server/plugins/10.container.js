import pino from "pino";
import { createContainer, asClass, asValue } from "awilix";
import { AwilixManager } from "awilix-manager";
import knex from "knex";
import { DownloadService } from "../utils/download-service";

export default defineNitroPlugin(
  /** @param {import('nitropack/types').NitroApp} nitroApp */
  async (nitroApp) => {
    const config = useRuntimeConfig();

    const logger = pino(getLoggerOptions(config));
    logger.debug("Dependency injection container initializing");

    if (!globalThis.__knex__) {
      globalThis.__knex__ = knex({
        client: "sqlite3",
        connection: { filename: config.cachePath },
        migrations: { migrationSource: new MigrationSource() },
        useNullAsDefault: true,
      });
      logger.debug("Created new Knex instance");
    } else {
      logger.debug("Reusing existing Knex instance");
    }

    const diContainer = createContainer();
    diContainer.register({
      config: asValue(config),
      downloadService: asClass(DownloadService).singleton(),
      feedService: asClass(FeedService).singleton(),
      imageService: asClass(ImageService).singleton(),
      jobService: asClass(JobService, { asyncInit: "init", asyncDispose: "dispose" }).singleton(),
      knex: asValue(globalThis.__knex__),
      logger: asValue(logger),
      opmlService: asClass(OpmlService).singleton(),
      repository: asClass(Repository, { asyncInit: "init" }).singleton(),
    });

    const manager = new AwilixManager({
      diContainer,
      asyncInit: true,
      asyncDispose: true,
    });
    await manager.executeInit();
    logger.info("Dependency injection container initialized");

    nitroApp.container = diContainer;

    nitroApp.hooks.hookOnce("close", async () => {
      logger.debug("Dependency injection container disposing");
      await manager.executeDispose();
      await globalThis.__knex__?.destroy();
      logger.info("Dependency injection container disposed");
    });
  },
);
