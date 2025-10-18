declare global {
  var __knex__: import("knex").Knex | undefined;
}

declare module "#auth-utils" {
  interface User {
    id: number;
    username: string;
  }

  interface UserSession {
    loggedInAt: Date;
  }
}

declare module "nitropack" {
  interface NitroApp {
    container: import("awilix").AwilixContainer;
  }
}

export {};
