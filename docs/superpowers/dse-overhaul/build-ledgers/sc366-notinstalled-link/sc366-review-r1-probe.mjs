// SC-366 review r1 probe: build the not-installed web card with the SAME createDiv/createEl
// calls RefUnwrapView.webCard makes, inside real-Obsidian-shaped ancestors, under both the
// pinned 1.13.7 sheet and the installed 1.14.4 sheet; measure AFTER (as built) and BEFORE
// (CSSOM: the two SC-366 selector parts removed), list every rule that sets `color` on the link.
import { chromium } from '/home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements/node_modules/playwright/index.mjs';
import fs from 'fs';
const OUT = process.argv[2];
const pageUrl = 'file:///home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements/visual-harness/index.html';
const APP1144 = fs.readFileSync('/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-review-r1-q9k2/css/obsidian-1.14.4-app.css','utf8');
const SHEET_1144_UNUSED = 'file:///tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-review-r1-q9k2/css/obsidian-1.14.4-app.css';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const results = [];

async function build(page, { wrapper, state }) {
	return page.evaluate(({ wrapper, state }) => {
		let rewrote = 0;
		if (state === 'before') {
			const walk = (rules) => {
				for (const r of rules) {
					if (r.cssRules && !(r instanceof CSSStyleRule)) walk(r.cssRules);
					if (r instanceof CSSStyleRule && r.selectorText.includes('dse-ref-web-card__link')) {
						rewrote++; r.selectorText = r.selectorText.split(',').map((s) => s.trim()).filter((s) => !s.includes('dse-ref-web-card__link')).join(', ');
					}
				}
			};
			for (const sh of document.styleSheets) { walk(sh.cssRules); }
			if (rewrote !== 2) throw new Error('before-revert rewrote ' + rewrote + ' rules, expected 2');
		}
		const root = document.querySelector('[data-dse-element]');
		// real-Obsidian-shaped ancestors
		const mount = document.getElementById('mount');
		let host = mount;
		if (wrapper === 'reading') {
			const v = mount.createDiv({ cls: 'markdown-preview-view markdown-rendered' });
			const s = v.createDiv({ cls: 'markdown-preview-sizer markdown-preview-section' });
			const e = s.createDiv({ cls: 'el-pre' });
			host = e.createDiv({ cls: 'block-language-ds-scc' });
		} else if (wrapper === 'livepreview') {
			const v = mount.createDiv({ cls: 'markdown-source-view cm-s-obsidian mod-cm6 is-live-preview' });
			const c = v.createDiv({ cls: 'cm-editor' }).createDiv({ cls: 'cm-scroller' }).createDiv({ cls: 'cm-sizer' }).createDiv({ cls: 'cm-contentContainer' }).createDiv({ cls: 'cm-content' });
			host = c.createDiv({ cls: 'cm-preview-code-block cm-embed-block markdown-rendered' }).createDiv({ cls: 'block-language-ds-scc' });
		}
		if (host !== mount) host.appendChild(root);
		// RefUnwrapView: rootEl.empty(); then webCard(root, code, url) — verbatim calls
		root.empty();
		const code = 'mcdm.heroes.v1/kit/panther';
		const url = 'https://steelcompendium.io/scc/mcdm.heroes.v1/kit/panther/';
		const card = root.createDiv({ cls: 'dse-ref-notice dse-ref-web-card', attr: { 'data-scc': code } });
		card.createDiv({ cls: 'dse-ref-notice__msg dse-ref-web-card__msg', text: 'Not installed locally.' });
		const a = card.createEl('a', { cls: 'dse-ref-web-card__link external-link', text: 'View on steelcompendium.io', href: url });
		a.setAttribute('target', '_blank');
		a.setAttribute('rel', 'noopener');
		card.createDiv({ cls: 'dse-ref-notice__hint dse-ref-web-card__cta', text: 'Run "Sync compendium" to embed it here.' });
		// family reference: a `.dse-card a` sibling root in the same context
		const ref = document.createElement('div');
		for (const at of root.attributes) ref.setAttribute(at.name, at.value);
		ref.id = 'sc366-ref';
		const rc = ref.createDiv({ cls: 'dse-card' });
		rc.createEl('a', { cls: 'external-link', text: 'family link', href: url, attr: { id: 'sc366-famlink' } });
		root.after(ref);
		return { rootAttrs: Object.fromEntries([...root.attributes].map((x) => [x.name, x.value.slice(0, 30)])), bodyCls: document.body.className };
	}, { wrapper, state });
}


async function forceHover(page, cdp, selector, on) {
	const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
	const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
	await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: on ? ['hover'] : [] });
}

function measure(page) {
	return page.evaluate(() => {
		const a = document.querySelector('.dse-ref-web-card__link');
		const fam = document.getElementById('sc366-famlink');
		const card = document.querySelector('.dse-ref-web-card');
		const cs = getComputedStyle(a), af = getComputedStyle(a, '::after');
		const winners = [];
		const walk = (rules, href) => {
			for (const r of rules) {
				if (r instanceof CSSStyleRule) {
					if (!r.style.color) continue;
					for (const part of r.selectorText.split(',')) {
						let m = false; try { m = a.matches(part); } catch {}
						if (m) winners.push({ sheet: (href || 'inline').split('/').pop(), sel: part.trim().slice(0, 140), color: r.style.color });
					}
				} else if (r.cssRules) {
					if (r instanceof CSSMediaRule && !matchMedia(r.conditionText).matches) continue;
					walk(r.cssRules, href);
				}
			}
		};
		for (const sh of document.styleSheets) { if (sh.disabled) continue; walk(sh.cssRules, sh.href || (sh.ownerNode && sh.ownerNode.id)); }
		return {
			color: cs.color, deco: cs.textDecorationLine, famColor: getComputedStyle(fam).color, famDeco: getComputedStyle(fam).textDecorationLine,
			afterBg: af.backgroundColor, afterMask: (af.webkitMaskImage || af.maskImage || '').slice(0, 30), afterContent: af.content,
			linkBgImage: cs.backgroundImage.slice(0, 20), linkFilter: cs.filter,
			accent: getComputedStyle(a).getPropertyValue('--dse-accent').trim(),
			msg: getComputedStyle(card.querySelector('.dse-ref-web-card__msg')).color,
			cta: getComputedStyle(card.querySelector('.dse-ref-web-card__cta')).color,
			ctaFs: getComputedStyle(card.querySelector('.dse-ref-web-card__cta')).fontSize,
			border: getComputedStyle(card).borderLeftColor, cardBg: getComputedStyle(card).backgroundColor,
			winners,
		};
	});
}

for (const sheetVer of ['1.13.7', '1.14.4']) {
	for (const bg of ['dark', 'light']) {
		for (const print of [false, true]) {
			for (const wrapper of ['bare', 'reading', 'livepreview']) {
				for (const state of ['before', 'after']) {
					const ctx = await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 2 });
					const page = await ctx.newPage();
					const q = new URLSearchParams({ element: 'perk', fixture: 'default', theme: 'steel', bg, sheet: '1', ...(print ? { print: '1' } : {}) });
					await page.goto(`${pageUrl}?${q}`);
					await page.waitForFunction(() => window.__dseHarnessDone !== undefined, null, { timeout: 15000 });
					if (sheetVer === '1.14.4') {
						await page.evaluate((txt) => {
							const l = document.getElementById('dse-obsidian-app-css');
							const wasOn = !l.disabled;
							const st = document.createElement('style'); st.id = 'sc366-app-1144'; st.textContent = txt;
							l.after(st); st.disabled = !wasOn; l.disabled = true;
						}, APP1144);
					}
					const sheetInfo = await page.evaluate(() => { const l = document.getElementById('dse-obsidian-app-css'); const st = document.getElementById('sc366-app-1144'); if (st) return { live: !st.disabled, href: 'inline-1.14.4', rules: st.sheet.cssRules.length }; return { live: l.sheet != null && !l.disabled, href: l.href.split('/').pop(), rules: l.sheet ? l.sheet.cssRules.length : 0 }; });
					const meta = await build(page, { wrapper, state });
					const rest = await measure(page);
					const cdp = await ctx.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
					await forceHover(page, cdp, '.dse-ref-web-card__link', true);
					const hover = await page.evaluate(() => { const a = document.querySelector('.dse-ref-web-card__link'); return { color: getComputedStyle(a).color, deco: getComputedStyle(a).textDecorationLine, afterBg: getComputedStyle(a, '::after').backgroundColor }; });
					await forceHover(page, cdp, '.dse-ref-web-card__link', false);
					await forceHover(page, cdp, '#sc366-famlink', true);
					const famHover = await page.evaluate(() => { const a = document.getElementById('sc366-famlink'); return { color: getComputedStyle(a).color, deco: getComputedStyle(a).textDecorationLine }; });
					await forceHover(page, cdp, '#sc366-famlink', false);
					const name = `${sheetVer}-${bg}${print ? '-print' : ''}-${wrapper}-${state}`;
					if (wrapper === 'reading' && sheetVer === '1.14.4') {
						const box = await page.locator('.dse-ref-web-card').boundingBox();
						const clip = { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 };
						await page.screenshot({ path: `${OUT}/rv-${name}.png`, clip });
						if (!print) { await forceHover(page, cdp, '.dse-ref-web-card__link', true); await page.screenshot({ path: `${OUT}/rv-${name}-hover.png`, clip }); }
					}
					results.push({ name, sheetInfo, meta, rest, hover, famHover });
					await ctx.close();
				}
			}
		}
	}
}
await browser.close();
fs.writeFileSync(`${OUT}/probe.json`, JSON.stringify(results, null, 2));
for (const r of results) {
	console.log(r.name.padEnd(36), 'sheet', r.sheetInfo.live ? r.sheetInfo.href : 'OFF', '| link', r.rest.color, '| fam', r.rest.famColor, '| hover', r.hover.color, r.hover.deco, '| famHover', r.famHover.color, r.famHover.deco, '| ::after', r.rest.afterBg, '/hov', r.hover.afterBg, '| msg', r.rest.msg, 'cta', r.rest.cta, 'border', r.rest.border, '| accent', r.rest.accent);
}
