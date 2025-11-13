// @ts-check

import { describe, it } from "vitest";
import {
  digestUrl,
  normalizeDatetime,
  parseDataURL,
  removePixelTrackers,
  removeTrackingParameters,
} from "../../server/utils/helper.js";
import assert from "node:assert";
import { highlightKeyword } from "../../app/utils/index.js";
import { replaceForTiddlyWiki } from "../../shared/utils/index.js";

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

describe("replaceForTiddlyWiki", () => {
  it("should replace pipe and brackets correctly", () => {
    const input = "This|is[a]{test}";
    const expected = "This-is(a)(test)";
    const output = replaceForTiddlyWiki(input);
    assert.strictEqual(output, expected);
  });

  it("should handle strings without special characters", () => {
    const input = "Just a normal string.";
    const expected = "Just a normal string.";
    const output = replaceForTiddlyWiki(input);
    assert.strictEqual(output, expected);
  });
});

describe("mark text", () => {
  it("marks keyword in plain text", () => {
    const text = "This is a simple test. Testing the mark function.";
    const keyword = "test";
    const result = highlightKeyword(text, keyword);
    const expected = "This is a simple <mark>test</mark>. <mark>Test</mark>ing the mark function.";
    assert.strictEqual(result, expected);
  });

  it("does not break existing HTML tags", () => {
    const text = "This is a <strong>test</strong> of the mark function.";
    const keyword = "test";
    const result = highlightKeyword(text, keyword);
    const expected = "This is a <strong><mark>test</mark></strong> of the mark function.";
    assert.strictEqual(result, expected);
  });

  it("does not mark keywords inside URLs", () => {
    const text = "Visit https://example.com/test for more info.";
    const keyword = "test";
    const result = highlightKeyword(text, keyword);
    const expected = "Visit https://example.com/test for more info.";
    assert.strictEqual(result, expected);
  });

  it("handles mixed content with HTML and URLs", () => {
    const text = 'Check <a href="https://example.com/test">this link</a> and the test word.';
    const keyword = "test";
    const result = highlightKeyword(text, keyword);
    const expected = 'Check <a href="https://example.com/test">this link</a> and the <mark>test</mark> word.';
    assert.strictEqual(result, expected);
  });

  it("handles keywords in anchor tags but not in href attributes", () => {
    const text = 'Check out <a href="https://example.com/test">this test</a> for the info.';
    const keyword = "test";
    const result = highlightKeyword(text, keyword);
    const expected = 'Check out <a href="https://example.com/test">this <mark>test</mark></a> for the info.';
    assert.strictEqual(result, expected);
  });

  it("is case insensitive when marking keywords", () => {
    const text = "This is a Test of the MARK function.";
    const keyword = "mark";
    const result = highlightKeyword(text, keyword);
    const expected = "This is a Test of the <mark>MARK</mark> function.";
    assert.strictEqual(result, expected);
  });
});

describe("remove tracking parameters", () => {
  const tests = [
    {
      name: "URL with tracking parameters",
      input: "https://example.com/page?id=123&utm_source=newsletter&utm_medium=email&fbclid=abc123",
      expected: "https://example.com/page?id=123",
    },
    {
      name: "URL with only tracking parameters",
      input: "https://example.com/page?utm_source=newsletter&utm_medium=email",
      expected: "https://example.com/page",
    },
    {
      name: "URL with no tracking parameters",
      input: "https://example.com/page?id=123&foo=bar",
      expected: "https://example.com/page?id=123&foo=bar",
    },
    {
      name: "URL with no parameters",
      input: "https://example.com/page",
      expected: "https://example.com/page",
      strictComparison: true,
    },
    {
      name: "URL with mixed case tracking parameters",
      input: "https://example.com/page?UTM_SOURCE=newsletter&utm_MEDIUM=email",
      expected: "https://example.com/page",
    },
    {
      name: "URL with tracking parameters and fragments",
      input: "https://example.com/page?id=123&utm_source=newsletter#section1",
      expected: "https://example.com/page?id=123#section1",
    },
    {
      name: "URL with only tracking parameters and fragments",
      input: "https://example.com/page?utm_source=newsletter#section1",
      expected: "https://example.com/page#section1",
    },
    {
      name: "URL with only one tracking parameter",
      input: "https://example.com/page?utm_source=newsletter",
      expected: "https://example.com/page",
    },
    {
      name: "URL with encoded characters",
      input: "https://example.com/page?name=John%20Doe&utm_source=newsletter",
      expected: "https://example.com/page?name=John+Doe",
    },
  ];

  tests.forEach((test) => {
    it(test.name, () => {
      const result = removeTrackingParameters(test.input);
      assert.strictEqual(result, test.expected);
    });
  });
});

describe("remove pixel trackers", () => {
  it("1x1 pixel tracker removal", () => {
    const input = `<p><img src="https://tracker1.example.org/" height="1" width="1"> and <img src="https://tracker2.example.org/" height="1" width="1"/></p>`;
    const expected = `<p> and </p>`;
    const output = removePixelTrackers(input);
    assert.strictEqual(output, expected);
  });

  it("0x0 pixel tracker removal", () => {
    const input = `<p><img src="https://tracker1.example.org/" height="0" width="0"> and <img src="https://tracker2.example.org/" height="0" width="0"/></p>`;
    const expected = `<p> and </p>`;
    const output = removePixelTrackers(input);
    assert.strictEqual(output, expected);
  });
});
