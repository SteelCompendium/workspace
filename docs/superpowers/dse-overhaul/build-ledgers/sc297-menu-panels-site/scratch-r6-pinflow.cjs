/* SC-297 round 6 — real pin end-to-end check + required shots. */
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

  // sc297-r6-minion-razor-title.png — one title (the CSS fix)
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Browse/monster/retainer/summoner/minion/razor/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const h1 = await page.evaluate(() => {
      const h = document.querySelector(".md-typeset > h1:first-child");
      return h ? getComputedStyle(h).display : "no-h1";
    });
    console.log("razor h1 display:", h1);
    await page.screenshot({ path: `${OUT}/sc297-r6-minion-razor-title.png` });
    await ctx.close();
  }

  // sc297-r6-statblock-dark-hover.png — post-merge sanity
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/Browse/monster/minotaur/minotaur-sunderer/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const cr = await page.evaluate(() => { const r = document.querySelector(".sb-wrap").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
    await page.mouse.move(cr.x + cr.w / 2, cr.y + 60);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/sc297-r6-statblock-dark-hover.png` });
    await ctx.close();
  }

  // Real pin end-to-end: pin from the card plate, check the pinboard, unpin.
  {
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
    const stored = await page.evaluate(() => localStorage.getItem("sc-pins"));
    console.log("pin: before=" + pinBefore + " after=" + pinAfter + " stored=" + stored);

    // open the pinboard, confirm it appears
    await page.goto(BASE + "/pins/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const boardHas = await page.evaluate(() => {
      const links = [...document.querySelectorAll(".sc-pins-mount a")];
      return links.some(a => /minotaur-sunderer/.test(a.getAttribute("href") || ""));
    });
    console.log("pinboard shows minotaur-sunderer:", boardHas);
    await page.screenshot({ path: `${OUT}/sc297-r6-pin-flow.png` });

    // unpin via the board's remove button
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
  }

  // SC-177's own "section excerpt" feature: add a custom link to a section
  // heading permalink, confirm it renders as an expandable excerpt on the board.
  {
    const ctx = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/pins/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem("sc-pins"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const sectionUrl = BASE + "/scc/mcdm.heroes.v1/kit/cloak-and-dagger/";
    const filled = await page.evaluate((url) => {
      const form = document.querySelector(".sc-pins__form");
      if (!form) return "no-form";
      form.elements.title.value = "R6 check section";
      form.elements.url.value = url;
      form.dispatchEvent(new Event("submit", { cancelable: true }));
      return "submitted";
    }, sectionUrl);
    await page.waitForTimeout(1500);
    const sectionState = await page.evaluate(() => {
      const fold = document.querySelector(".sc-pins__section-fold");
      if (!fold) return { present: false };
      const body = fold.querySelector(".sc-pins__section-body");
      return { present: true, open: fold.open, bodyText: (body && body.textContent || "").slice(0, 120) };
    });
    console.log("section-excerpt form:", filled, JSON.stringify(sectionState));
    await ctx.close();
  }

  await browser.close();
  console.log("r6 pinflow done");
})();
