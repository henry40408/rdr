declare global {
  var __knex__: import("knex").Knex | undefined;
}

declare module "nitropack" {
  interface NitroApp {
    container: import("awilix").AwilixContainer;
  }
}

export {};
