// Smoke test: load every page in a real browser and fail on any script error.
// Optionally saves screenshots for design review.
//
//   node tests/smoke.mjs                 # check all pages
//   node tests/smoke.mjs --shots out/    # also save light, dark and phone screenshots
//   node tests/smoke.mjs --only bohr-spectra
//
// Needs Playwright (npm i -D playwright && npx playwright install chromium).
// Three.js is served from node_modules/three if it is installed, so the
// test also works without internet access.

import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "site");
const THREE = join(HERE, "..", "node_modules", "three");

const args = process.argv.slice(2);
const shotsDir = args.includes("--shots") ? args[args.indexOf("--shots") + 1] : null;
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png" };

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(SITE, path));
  if (!file.startsWith(SITE)) return res.writeHead(403).end();
  try {
    await stat(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const { INTERACTIVE } = await import(join(SITE, "assets/js/course.js"));
let pages = [
  { name: "home", path: "/index.html" },
  ...INTERACTIVE.map((l) => ({ name: l.slug, path: `/lessons/${l.slug}/` })),
  { name: "formulas", path: "/formulas/" },
  { name: "wave-packet", path: "/formulas/wave-packet/" },
  { name: "transition", path: "/formulas/transition/" },
];
if (only) pages = pages.filter((p) => p.name === only);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
let failures = 0;

for (const page of pages) {
  const exists = await stat(join(SITE, page.path.endsWith("/") ? page.path + "index.html" : page.path)).then(() => true, () => false);
  if (!exists) {
    console.log(`skip  ${page.name} (not built yet)`);
    continue;
  }
  const variants = shotsDir
    ? [
        { tag: "light", viewport: { width: 1280, height: 860 }, colorScheme: "light" },
        { tag: "dark", viewport: { width: 1280, height: 860 }, colorScheme: "dark" },
        { tag: "phone", viewport: { width: 390, height: 844 }, colorScheme: "light", isMobile: true, hasTouch: true },
      ]
    : [{ tag: "light", viewport: { width: 1280, height: 860 }, colorScheme: "light" }];

  for (const v of variants) {
    const ctx = await browser.newContext({ viewport: v.viewport, colorScheme: v.colorScheme, isMobile: v.isMobile, hasTouch: v.hasTouch, deviceScaleFactor: 1 });
    const tab = await ctx.newPage();
    const errors = [];
    tab.on("pageerror", (e) => errors.push(e.message));
    tab.on("console", (m) => m.type() === "error" && !/fonts\.g|Failed to load resource/.test(m.text()) && errors.push(m.text()));
    // Serve Three.js locally when the CDN is unreachable.
    await tab.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)$/, async (route) => {
      const rel = route.request().url().replace(/^.*\/npm\/three@[^/]+\//, "");
      try { await route.fulfill({ body: await readFile(join(THREE, rel)), contentType: "text/javascript" }); }
      catch { await route.continue(); }
    });
    await tab.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await tab.goto(base + page.path, { waitUntil: "load" });
    await tab.waitForTimeout(1500);
    if (shotsDir) {
      await mkdir(shotsDir, { recursive: true });
      await tab.screenshot({ path: join(shotsDir, `${page.name}-${v.tag}.png`), fullPage: false });
    }
    if (errors.length) {
      failures++;
      console.log(`FAIL  ${page.name} [${v.tag}]\n      ${errors.join("\n      ")}`);
    } else {
      console.log(`ok    ${page.name} [${v.tag}]`);
    }
    await ctx.close();
  }
}

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
