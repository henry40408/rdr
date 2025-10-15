import pino from "pino";
import { createContainer, asClass, asValue } from "awilix";
import { AwilixManager } from "awilix-manager";
import knex from "knex";
import { DownloadService } from "../utils/download-service";
import { FetchEntriesJob } from "../utils/jobs/fetch-entries-job";
import { FetchImagesJob } from "../utils/jobs/fetch-images-job";

export default defineNitroPlugin(
  /** @param {import('nitropack/types').NitroApp} nitroApp */
  async (nitroApp) => {
    const config = useRuntimeConfig();

    const logger = pino(getLoggerOptions(config));
    logger.debug("Dependency injection container initializing");

    if (!globalThis.__knex__) {
      globalThis.__knex__ = knex({
        client: "sqlite3",
        connection: { filename: config.dbPath },
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
      repository: asClass(Repository, { asyncInit: "init", asyncInitPriority: 0 }).singleton(),
      // jobs
      fetchEntriesJob: asClass(FetchEntriesJob, { asyncInit: "init", asyncDispose: "dispose" }).singleton(),
      fetchImagesJob: asClass(FetchImagesJob, { asyncInit: "init", asyncDispose: "dispose" }).singleton(),
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
