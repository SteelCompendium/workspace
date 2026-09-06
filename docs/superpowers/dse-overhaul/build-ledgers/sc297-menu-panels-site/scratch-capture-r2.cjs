/* SC-297 round 2 — screenshot capture for the newly-ported families
 * (featureblock, trait, kit) + one Read-chapter shot confirming no stray
 * chip/copy-link on embedded cards. Same procedure as round 1: playwright-core
 * driving the locally installed Brave, 2x device scale, viewport 1280x1000
 * (phone shots 375x820, isMobile).
 */
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

const FAMILIES = [
  { name: "featureblock", url: "/Browse/monster/ogre/ogre-malice/", card: ".fb-wrap" },
  { name: "trait", url: "/Browse/feature/trait/orc/glowing-recovery/", card: ".md-typeset > .sc-trait" },
  { name: "kit", url: "/Browse/kit/cloak-and-dagger/", card: ".md-typeset > .sc-kit" },
];

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: "/opt/brave.com/brave/brave", headless: true, args: ["--no-sandbox"] });

  for (const fam of FAMILIES) {
    for (const cs of ["dark", "light"]) {
      // hovered, desktop
      const ctx = await browser.newContext({ colorScheme: cs, viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(BASE + fam.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const cr = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }, fam.card);
      await page.mouse.move(cr.x + cr.w / 2, cr.y + 60);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/sc297-r2-${fam.name}-${cs}-hover.png` });
      await ctx.close();

      // phone (always-visible)
      const pctx = await browser.newContext({ colorScheme: cs, viewport: { width: 375, height: 820 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const ppage = await pctx.newPage();
      await ppage.goto(BASE + fam.url, { waitUntil: "networkidle" });
      await ppage.waitForTimeout(500);
      await ppage.screenshot({ path: `${OUT}/sc297-r2-${fam.name}-${cs}-phone.png` });
      await pctx.close();
    }
  }

  // Read-chapter shot: no stray chip/copy-link on embedded cards (D1/D2).
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Read/bestiary/retainers/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    // hover the first embedded statblock's head to prove no chip reveals
    const head = await page.evaluate(() => {
      const h = document.querySelector(".sb-wrap .sb__head");
      const r = h.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width };
    });
    await page.mouse.move(head.x + head.w / 2, head.y + 20);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/sc297-r2-read-chapter-dark-no-stray.png` });
    await ctx.close();
  }

  await browser.close();
  console.log("capture done");
})();
