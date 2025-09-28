import assert from "node:assert";
import { describe, it } from "node:test";

import { generateId, normalizeDatetime } from "./helper.js";

describe("generateId", () => {
  it("should generate an 8 character hex string", () => {
    const id = generateId("test");
    assert.match(id, /^[a-f0-9]{16}$/);
  });

  it("should generate a unique ID", () => {
    const id1 = generateId("a");
    const id2 = generateId("b");
    assert.notStrictEqual(id1, id2);
  });

  it("should generate the same hash from the same input", () => {
    const id1 = generateId("test");
    const id2 = generateId("test");
    assert.strictEqual(id1, id2);
  });
});

describe("normalizeDatetime", () => {
  it("should parse standard date strings", () => {
    const date = new Date("2023-10-01T12:00:00Z");
    const normalized = normalizeDatetime("2023-10-01T12:00:00Z");
    assert.strictEqual(normalized?.toISOString(), date.toISOString());
  });

  it("should parse date strings with Chinese weekdays and months", () => {
    const date = new Date("2025-09-26T06:29:00Z");
    const normalized = normalizeDatetime("週五, 26 九月 2025 06:29:00 +0000");
    assert.strictEqual(normalized?.toISOString(), date.toISOString());
  });
});
