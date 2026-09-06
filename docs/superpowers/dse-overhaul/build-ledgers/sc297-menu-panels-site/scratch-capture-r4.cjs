/* SC-297 round 4 — required evidence shots. */
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");

function resolvePlaywrightCore() {
  try { return require("playwright-core"); } catch (_) {}
  const npx = path.join(os.homedir(), ".npm", "_npx");
  let best = null, bestVer = "";
  for (const hash of fs.readdirSync(npx)) {
    const dir = path.join(npx, hash, "node_modules", "playwright-core");
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(pkg)) {
      const ver = JSON.parse(fs.readFileSync(pkg, "utf8")).version || "";
      if (ver > bestVer) { bestVer = ver; best = dir; }
    }
  }
  if (best) return require(best);
  throw new Error("playwright-core not found");
}

const BASE = "http://127.0.0.1:8124";
const OUT = "/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots";

async function hoverShot(browser, url, card, outfile, cs) {
  const ctx = await browser.newContext({ colorScheme: cs || "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const cr = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }, card);
  await page.mouse.move(cr.x + cr.w / 2, cr.y + 60);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${outfile}` });
  await ctx.close();
}

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: "/opt/brave.com/brave/brave", headless: true, args: ["--no-sandbox"] });

  // sc297-r4-minion-razor-dark-hover.png — plate present, head clean
  await hoverShot(browser, "/Browse/monster/retainer/summoner/minion/razor/", ".sb-wrap", "sc297-r4-minion-razor-dark-hover.png", "dark");

  // sc297-r4-kit-dark-hover.png — copy-link + pin in the plate
  await hoverShot(browser, "/Browse/kit/cloak-and-dagger/", ".md-typeset > .sc-kit", "sc297-r4-kit-dark-hover.png", "dark");

  // sc297-r4-trait-light-hover.png
  await hoverShot(browser, "/Browse/feature/trait/orc/glowing-recovery/", ".md-typeset > .sc-trait", "sc297-r4-trait-light-hover.png", "light");

  // sc297-r4-minion-gorrre-export.png — the PNG export output with no stray chips.
  // Drive the real PNG export button (sc-export.js) and save what it produces.
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Browse/monster/retainer/summoner/minion/gorrre/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    // hover to reveal the plate, then click PNG
    const cr = await page.evaluate(() => { const r = document.querySelector(".sb-wrap").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
    await page.mouse.move(cr.x + cr.w / 2, cr.y + 60);
    await page.waitForTimeout(400);
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      page.click(".sc-chrome .sc-export__png"),
    ]);
    const dlPath = await download.path();
    fs.copyFileSync(dlPath, `${OUT}/sc297-r4-minion-gorrre-export.png`);
    await ctx.close();
  }

  await browser.close();
  console.log("capture r4 done");
})();
