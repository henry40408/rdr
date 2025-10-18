import { afterEach, beforeEach, describe, it } from "node:test";
import { Repository } from "./repository.js";
import pino from "pino";
import knex from "knex";
import { MigrationSource } from "./migration-source.js";

describe("Repository", () => {
  /** @type {Repository} */
  let repository;

  beforeEach(async () => {
    const db = knex({
      client: "sqlite3",
      connection: { filename: ":memory:" },
      migrations: { migrationSource: new MigrationSource() },
      useNullAsDefault: true,
    });
    repository = new Repository({
      knex: db,
      logger: pino(),
    });
  });

  afterEach(async () => {
    await repository.knex.destroy();
  });

  it("should migrate the database", async () => {
    await repository.init();
  });
});
