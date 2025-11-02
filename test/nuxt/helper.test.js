// @ts-check

import { describe, it } from "vitest";
import { digestUrl, normalizeDatetime, parseDataURL } from "../../server/utils/helper.js";
import assert from "node:assert";

describe("digestUrl", () => {
  const secret = "my_secret_key";

  it("should produce a valid hex string of length 16", () => {
    const url = "https://example.com/some/path";
    const hash = digestUrl(secret, url);
    assert.match(hash, /^[a-f0-9]{32}$/);
  });

  it("should produce consistent hashes for the same URL", () => {
    const url = "https://example.com/some/path";
    const hash1 = digestUrl(secret, url);
    const hash2 = digestUrl(secret, url);
    assert.strictEqual(hash1, hash2);
  });

  it("should produce different hashes for different URLs", () => {
    const url1 = "https://example.com/some/path";
    const url2 = "https://example.com/another/path";
    const hash1 = digestUrl(secret, url1);
    const hash2 = digestUrl(secret, url2);
    assert.notStrictEqual(hash1, hash2);
  });

  it("should produce different hashes for the same URL with different secrets", () => {
    const url = "https://example.com/some/path";
    const hash1 = digestUrl("secret_one", url);
    const hash2 = digestUrl("secret_two", url);
    assert.notStrictEqual(hash1, hash2);
  });

  it("should generate the expected hash for a known input", () => {
    const url = "https://nuxt.com/icon.png";
    const expectedHash = "d63a2d96471d54a7b2f6570e47df312b";
    const actualHash = digestUrl(secret, url);
    assert.strictEqual(actualHash, expectedHash);
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
