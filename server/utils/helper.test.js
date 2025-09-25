import assert from "node:assert";
import { describe, it } from "node:test";

import { generateId } from "./helper.js";

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
