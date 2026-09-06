/* SC-297 round 2b — re-shoot trait evidence after the h1+hr hide fix. */
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
const URL = "/Browse/feature/trait/orc/glowing-recovery/";
const CARD = ".md-typeset > .sc-trait";

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: "/opt/brave.com/brave/brave", headless: true, args: ["--no-sandbox"] });

  // desktop, dark, hovered (overwrite sc297-r2-trait-dark-hover.png)
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const cr = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }, CARD);
    await page.mouse.move(cr.x + cr.w / 2, cr.y + 60);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/sc297-r2-trait-dark-hover.png` });
    await ctx.close();
  }

  // desktop, dark, no hover — single title evidence (new: sc297-r2b-trait-dark-title.png)
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/sc297-r2b-trait-dark-title.png` });
    await ctx.close();
  }

  // phone, dark (overwrite sc297-r2-trait-dark-phone.png)
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 375, height: 820 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/sc297-r2-trait-dark-phone.png` });
    await ctx.close();
  }

  await browser.close();
  console.log("capture 2b done");
})();
