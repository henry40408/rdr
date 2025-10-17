import assert from "node:assert";
import { describe, it } from "node:test";

import { generateId, normalizeDatetime, parseDataURL } from "./helper.js";

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

describe("parseDataURL", () => {
  it("should parse a base64-encoded data URL", () => {
    const url = "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==";
    const result = parseDataURL(url);
    assert.strictEqual(result.mediaType, "text/plain");
    assert.strictEqual(result.encoding, "base64");
    assert.strictEqual(result.data.toString("utf-8"), "Hello, World!");
  });

  it("should parse a percent-encoded data URL", () => {
    const url = "data:text/plain,Hello%2C%20World!";
    const result = parseDataURL(url);
    assert.strictEqual(result.mediaType, "text/plain");
    assert.strictEqual(result.encoding, "utf8");
    assert.strictEqual(result.data.toString("utf-8"), "Hello, World!");
  });
});
