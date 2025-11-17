declare global {
  var __knex__: import("knex").Knex | undefined;
}

declare module "#auth-utils" {
  interface User {
    id: number;
    username: string;
    nonce: number;
  }

  interface UserSession {
    loggedInAt: string;
  }
}

declare module "nitropack" {
  interface NitroApp {
    container: import("awilix").AwilixContainer;
  }
}

export {};
