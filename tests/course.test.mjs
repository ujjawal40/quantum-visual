// Keeps the course map honest: unique IDs, outlines that exist, and a page
// for every lesson marked interactive.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { MODULES, INTERACTIVE } from "../site/assets/js/course.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("modules are numbered 0..7 in order", () => {
  assert.deepEqual(MODULES.map((m) => m.n), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("lesson ids are unique and belong to their module", () => {
  const ids = new Set();
  for (const m of MODULES) {
    for (const l of m.lessons) {
      assert.ok(!ids.has(l.id), `duplicate lesson id ${l.id}`);
      ids.add(l.id);
      assert.equal(l.id.split(".")[0], String(m.n), `${l.id} is listed under module ${m.n}`);
    }
  }
});

test("every module outline file exists", () => {
  for (const m of MODULES) assert.ok(existsSync(join(ROOT, m.outline)), `missing ${m.outline}`);
});

test("every interactive lesson has a page and a summary", () => {
  const slugs = new Set();
  for (const l of INTERACTIVE) {
    assert.ok(!slugs.has(l.slug), `duplicate slug ${l.slug}`);
    slugs.add(l.slug);
    assert.ok(l.summary, `${l.slug} needs a summary for the course map`);
    assert.ok(existsSync(join(ROOT, "site/lessons", l.slug, "index.html")), `missing page for ${l.slug}`);
  }
});
