/* SC-297 round 8 — pin flow once more + compact My Table layout shot. */
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

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: "/opt/brave.com/brave/brave", headless: true, args: ["--no-sandbox"] });

  const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + "/Browse/monster/minotaur/minotaur-sunderer/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => localStorage.removeItem("sc-pins"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const cr = await page.evaluate(() => { const r = document.querySelector(".sb-wrap").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
  await page.mouse.move(cr.x + cr.w / 2, cr.y + 60);
  await page.waitForTimeout(400);
  const pinBefore = await page.evaluate(() => document.querySelector(".sc-chrome .sc-pin").getAttribute("aria-pressed"));
  await page.click(".sc-chrome .sc-pin");
  await page.waitForTimeout(200);
  const pinAfter = await page.evaluate(() => document.querySelector(".sc-chrome .sc-pin").getAttribute("aria-pressed"));
  console.log("pin: before=" + pinBefore + " after=" + pinAfter);

  await page.goto(BASE + "/pins/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const boardHas = await page.evaluate(() => {
    const links = [...document.querySelectorAll(".sc-pins-mount a")];
    return links.some(a => /minotaur-sunderer/.test(a.getAttribute("href") || ""));
  });
  console.log("pinboard shows minotaur-sunderer:", boardHas);
  await page.screenshot({ path: `${OUT}/sc297-r8-pinboard.png`, fullPage: true });

  const removed = await page.evaluate(() => {
    const rm = [...document.querySelectorAll(".sc-pins__rm")].find(b => /minotaur-sunderer/.test(b.dataset.path || ""));
    if (!rm) return false;
    rm.click();
    return true;
  });
  await page.waitForTimeout(300);
  const boardHasAfterRemove = await page.evaluate(() => {
    const links = [...document.querySelectorAll(".sc-pins-mount a")];
    return links.some(a => /minotaur-sunderer/.test(a.getAttribute("href") || ""));
  });
  console.log("unpin clicked:", removed, "still on board after unpin:", boardHasAfterRemove);
  await ctx.close();

  await browser.close();
  console.log("r8 pinflow done");
})();
