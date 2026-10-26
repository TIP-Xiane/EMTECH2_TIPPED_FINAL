import assert from "node:assert/strict";
import test from "node:test";
import {
  createToken,
  escapeHtml,
  hashToken,
  matchesTipDomain,
} from "../src/security.js";

test("opaque tokens are high-entropy and only stored as deterministic hashes", () => {
  const token = createToken();
  assert.equal(token.length, 43);
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token), hashToken(token));
  assert.notEqual(hashToken(token), hashToken(createToken()));
});

test("TIP email matching requires an exact approved domain", () => {
  assert.equal(matchesTipDomain("student@tip.edu.ph", ["tip.edu.ph"]), true);
  assert.equal(
    matchesTipDomain("student@sub.tip.edu.ph", ["tip.edu.ph"]),
    false,
  );
  assert.equal(
    matchesTipDomain("student@not-tip.edu.ph", ["tip.edu.ph"]),
    false,
  );
});

test("email HTML escapes user-controlled content", () => {
  assert.equal(
    escapeHtml(`<script a="b">&'`),
    "&lt;script a=&quot;b&quot;&gt;&amp;&#39;",
  );
});
