declare module "nitropack" {
  interface NitroApp {
    categories: import("../server/utils/entities").Category[];
    logger: import("pino").Logger;
  }
}

export {};
