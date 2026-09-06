/* SC-297 round 1 geometry + behaviour gate (the site twin of the plugin's
   assertChromePlacement). */
const { chromium } = require('/home/scott/.npm/_npx/e5af6bbc29da0270/node_modules/playwright-core');
const BASE = 'http://127.0.0.1:8137';
const PAGES = [
  { name: 'statblock', url: '/Browse/monster/minotaur/minotaur-sunderer/', card: '.sb-wrap' },
  { name: 'ability', url: '/Browse/feature/ability/dragon-knight/dragon-breath/', card: '.md-typeset > .sc-ability' },
];
let fails = 0;
function ok(cond, msg) { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; }

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/brave.com/brave/brave', headless: true, args: ['--no-sandbox'] });
  for (const pg of PAGES) {
    for (const cs of ['dark', 'light']) {
      const ctx = await browser.newContext({ colorScheme: cs, viewport: { width: 1280, height: 1000 } });
      const page = await ctx.newPage();
      await page.goto(BASE + pg.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const tag = `${pg.name}/${cs}`;

      const rest = await page.evaluate((sel) => {
        const card = document.querySelector(sel);
        const p = card && card.querySelector(':scope > .sc-chrome');
        if (!p) return { panel: false };
        const cr = card.getBoundingClientRect(), pr = p.getBoundingClientRect();
        return {
          panel: true,
          opacity: getComputedStyle(p).opacity,
          display: getComputedStyle(p).display,
          rightGap: cr.right - pr.right,       // want 10
          bottomDelta: pr.bottom - cr.top,     // want 0
          items: [...p.children].map(e => e.className.split(' ')[0]),
          order: [...p.children].map(e => getComputedStyle(e).order),
          borderBottom: getComputedStyle(p).borderBottomWidth,
          cardOverflow: getComputedStyle(card).overflow,
        };
      }, pg.card);
      ok(rest.panel, `${tag} panel mounted`);
      if (rest.panel) {
        ok(rest.opacity === '0', `${tag} hidden at rest (opacity=${rest.opacity})`);
        ok(Math.abs(rest.rightGap - 10) < 0.6, `${tag} right edge 10px inside card border-box right (got ${rest.rightGap.toFixed(2)})`);
        ok(Math.abs(rest.bottomDelta) < 0.6, `${tag} bottom edge on the card's border-box top (delta ${rest.bottomDelta.toFixed(2)})`);
        ok(rest.borderBottom === '0px', `${tag} no bottom border (${rest.borderBottom})`);
        console.log(`INFO ${tag} items=${JSON.stringify(rest.items)} order=${JSON.stringify(rest.order)} cardOverflow=${rest.cardOverflow}`);
      }

      // hover reveal
      const cr = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }, pg.card);
      await page.mouse.move(cr.x + cr.w / 2, cr.y + 60);
      await page.waitForTimeout(400);
      const hovOp = await page.evaluate((s) => getComputedStyle(document.querySelector(s).querySelector(':scope > .sc-chrome')).opacity, pg.card);
      ok(hovOp === '1', `${tag} revealed on card hover (opacity=${hovOp})`);

      // keyboard twin
      const focOp = await page.evaluate((s) => {
        const p = document.querySelector(s).querySelector(':scope > .sc-chrome');
        p.querySelector('button').focus();
        return getComputedStyle(p).opacity;
      }, pg.card);
      ok(focOp === '1', `${tag} revealed by :focus-within (opacity=${focOp})`);

      // legacy strip must be gone from the head
      const stray = await page.evaluate(() => ({
        headCopy: !!document.querySelector('.sc-head .sc-copylink, .sb__head > .sc-copylink'),
        headPin: !!document.querySelector('.sc-head > .sc-pin'),
        headEnc: !!document.querySelector('.sb__head > .sc-enc-addpage'),
        headExp: !!document.querySelector('.sc-head > .sc-export'),
        pageact: !!document.querySelector('.sc-pageact'),
      }));
      ok(!stray.headCopy && !stray.headPin && !stray.headEnc && !stray.headExp,
        `${tag} no control left in the card head (${JSON.stringify(stray)})`);

      // print
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(300);
      const pr = await page.evaluate((s) => {
        const p = document.querySelector(s).querySelector(':scope > .sc-chrome');
        return { display: getComputedStyle(p).display, mt: getComputedStyle(document.querySelector(s)).marginTop };
      }, pg.card);
      ok(pr.display === 'none', `${tag} absent in print (display=${pr.display}); anchor margin-top=${pr.mt}`);
      await page.emulateMedia({ media: 'screen' });
      await ctx.close();

      // phone
      const pctx = await browser.newContext({ colorScheme: cs, viewport: { width: 375, height: 820 }, isMobile: true, hasTouch: true });
      const ppage = await pctx.newPage();
      await ppage.goto(BASE + pg.url, { waitUntil: 'networkidle' });
      await ppage.waitForTimeout(600);
      const ph = await ppage.evaluate((s) => {
        const card = document.querySelector(s);
        const p = card.querySelector(':scope > .sc-chrome');
        const cr = card.getBoundingClientRect(), pr = p.getBoundingClientRect();
        const prev = card.previousElementSibling ? card.previousElementSibling.getBoundingClientRect() : null;
        return {
          opacity: getComputedStyle(p).opacity,
          marginTop: getComputedStyle(card).marginTop,
          clearsPrev: prev ? pr.top - prev.bottom : null,
          rightGap: cr.right - pr.right,
          bottomDelta: pr.bottom - cr.top,
        };
      }, pg.card);
      ok(ph.opacity === '1', `${tag} phone: always visible (opacity=${ph.opacity})`);
      ok(parseFloat(ph.marginTop) >= 30, `${tag} phone: reserved top space (margin-top=${ph.marginTop})`);
      ok(ph.clearsPrev === null || ph.clearsPrev >= -0.5, `${tag} phone: panel clears the element above (gap=${ph.clearsPrev})`);
      ok(Math.abs(ph.rightGap - 10) < 0.6 && Math.abs(ph.bottomDelta) < 0.6, `${tag} phone: geometry holds (right ${ph.rightGap.toFixed(2)}, bottom ${ph.bottomDelta.toFixed(2)})`);
      await pctx.close();
    }
  }
  await browser.close();
  console.log(fails ? `FAILURES ${fails}` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
