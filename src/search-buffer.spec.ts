import { describe, test } from "node:test";
import * as assert from "node:assert/strict";

import { SearchBuffer } from "./search-buffer.js";

describe("SearchBuffer", () => {
  test("should find single in one chunk", () => {
    const buffer = new SearchBuffer("<start>", "</end>");
    const [rest, found] = buffer.push("<start>Hello</end>");

    assert.equal(rest, "");
    assert.deepEqual(found, ["Hello"]);
  });

  test("should find multiple in one chunk", () => {
    const buffer = new SearchBuffer("<start>", "</end>");
    const [rest, found] = buffer.push("<start>Hello</end><start>World</end>");

    assert.equal(rest, "");
    assert.deepEqual(found, ["Hello", "World"]);
  });

  test("should find one across multiple chunks", () => {
    const buffer = new SearchBuffer("<start>", "</end>");

    let [rest, found] = buffer.push("<sta");
    assert.equal(rest, "");
    assert.deepEqual(found, []);

    [rest, found] = buffer.push("rt");
    assert.equal(rest, "");
    assert.deepEqual(found, []);

    [rest, found] = buffer.push(">Hello</e");
    assert.equal(rest, "");
    assert.deepEqual(found, []);

    [rest, found] = buffer.push("nd>");
    assert.equal(rest, "");
    assert.deepEqual(found, ["Hello"]);
  });

  test("should emit outer content", () => {
    const buffer = new SearchBuffer("<start>", "</end>");
    let [rest, found] = buffer.push(
      "before<start>Hello</end>between<start>World</end>after"
    );
    assert.equal(rest, "beforebetween");
    assert.deepEqual(found, ["Hello", "World"]);

    [rest, found] = buffer.finalize();
    assert.equal(rest, "after");
    assert.deepEqual(found, []);
  });
});
