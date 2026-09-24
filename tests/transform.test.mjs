import test from "node:test";
import assert from "node:assert/strict";
import { formatJson, encodeBase64, decodeBase64, convertTimestamp } from "../src/lib/transform.ts";

test("JSON formats and compacts without changing data", () => {
  const value = '{"a":1,"b":[true,null]}';
  assert.match(formatJson(value), /\n  "a": 1/);
  assert.equal(formatJson(value, true), value);
  assert.throws(() => formatJson("{broken}"));
});

test("Base64 round-trips Unicode, including emoji", () => {
  const text = "你好，Paistar 🌟";
  assert.equal(decodeBase64(encodeBase64(text)), text);
  assert.throws(() => decodeBase64("%%%%"));
});

test("timestamps handle seconds, milliseconds and invalid dates", () => {
  assert.equal(convertTimestamp("0").utc, "1970-01-01T00:00:00.000Z");
  assert.equal(convertTimestamp("1750000000").milliseconds, "1750000000000");
  assert.equal(convertTimestamp("1750000000000").seconds, "1750000000");
  assert.throws(() => convertTimestamp("not-a-date"));
});
