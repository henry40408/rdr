import pino from "pino";
import { isDevelopment } from "std-env";
import { createContainer, asClass, asValue } from "awilix";
import { OpmlService } from "../utils/opml-service";
import { Repository } from "../utils/repository";
import { AwilixManager } from "awilix-manager";
import { FeedService } from "../utils/feed-service";

export default defineNitroPlugin(
  /** @param {import('nitropack/types').NitroApp} nitroApp */
  async (nitroApp) => {
    const config = useRuntimeConfig();

    const logger = pino({
      level: config.logLevel || (isDevelopment ? "debug" : "info"),
      formatters: {
        bindings: () => ({}),
        level: (label) => ({ level: label }),
      },
    });

    logger.debug("Dependency injection container initializing");
    const diContainer = createContainer();
    diContainer.register({
      config: asValue(config),
      feedService: asClass(FeedService).singleton(),
      logger: asValue(logger),
      opmlService: asClass(OpmlService, { asyncInit: "init", asyncDispose: "dispose" }).singleton(),
      repository: asClass(Repository, { asyncInit: "init", asyncDispose: "dispose" }).singleton(),
    });

    const manager = new AwilixManager({
      diContainer,
      asyncInit: true,
      asyncDispose: true,
    });
    await manager.executeInit();
    logger.info("Dependency injection container initialized");

    nitroApp.container = diContainer;

    nitroApp.hooks.hook("close", async () => {
      logger.debug("Dependency injection container disposing");
      await manager.executeDispose();
      logger.info("Dependency injection container disposed");
    });
  },
);
