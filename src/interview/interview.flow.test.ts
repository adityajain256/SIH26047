import assert from "node:assert/strict";
import test from "node:test";
import { detectRedFlag } from "./redFlag.ts";

test("emergency breathing language creates a critical alert", () => {
  assert.equal(detectRedFlag("I have difficulty breathing")?.severity, "critical");
  assert.equal(detectRedFlag("I would like to do yoga"), null);
});
