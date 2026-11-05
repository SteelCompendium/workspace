// SC-366 stripe review probe. Builds BOTH ds-scc degrade cards with the same createDiv/createEl
// calls as RefUnwrapView.ts (renderRefNotice + webCard), under bare / Reading / Live Preview
// ancestors, pinned 1.13.7 sheet and installed 1.14.4 app.css, dark/light, screen/print.
// AFTER = harness as built at e025dd2. BEFORE = same page with the one deleted declaration
// (`border-left: 3px solid var(--color-blue)`) re-inserted into the `.dse-ref-notice` rule via CSSOM.
import { chromium } from '/home/scott/code/steelCompendium/worktrees/sc366-stripe-remove/draw-steel-elements/node_modules/playwright/index.mjs';
import fs from 'fs';
const OUT = process.argv[2];
const pageUrl = 'file:///home/scott/code/steelCompendium/worktrees/sc366-stripe-remove/draw-steel-elements/visual-harness/index.html';
const APP1144 = fs.readFileSync('/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-review-r1-q9k2/css/obsidian-1.14.4-app.css', 'utf8');
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const results = [];

async function build(page, { wrapper, state, card }) {
	return page.evaluate(({ wrapper, state, card }) => {
		if (state === 'before') {
			let n = 0;
			const walk = (rules) => {
				for (const r of rules) {
					if (r instanceof CSSStyleRule && r.selectorText === '.dse-ref-notice') {
						if (r.style.borderLeftWidth !== '') throw new Error('AFTER sheet still has a border-left on .dse-ref-notice');
						r.style.setProperty('border-left', '3px solid var(--color-blue)'); n++;
					} else if (r.cssRules) walk(r.cssRules);
				}
			};
			for (const sh of document.styleSheets) walk(sh.cssRules);
			if (n !== 1) throw new Error('before re-insert hit ' + n + ' rules');
		}
		const root = document.querySelector('[data-dse-element]');
		const mount = document.getElementById('mount');
		let host = mount;
		if (wrapper === 'reading') {
			host = mount.createDiv({ cls: 'markdown-preview-view markdown-rendered' }).createDiv({ cls: 'markdown-preview-sizer markdown-preview-section' }).createDiv({ cls: 'el-pre' }).createDiv({ cls: 'block-language-ds-scc' });
		} else if (wrapper === 'livepreview') {
			const v = mount.createDiv({ cls: 'markdown-source-view cm-s-obsidian mod-cm6 is-live-preview' });
			const c = v.createDiv({ cls: 'cm-editor' }).createDiv({ cls: 'cm-scroller' }).createDiv({ cls: 'cm-sizer' }).createDiv({ cls: 'cm-contentContainer' }).createDiv({ cls: 'cm-content' });
			host = c.createDiv({ cls: 'cm-preview-code-block cm-embed-block markdown-rendered' }).createDiv({ cls: 'block-language-ds-scc' });
		}
		if (host !== mount) host.appendChild(root);
		root.empty();
		if (card === 'notinstalled') {
			// RefUnwrapView.webCard, verbatim calls
			const code = 'mcdm.heroes.v1/kit/panther';
			const c = root.createDiv({ cls: 'dse-ref-notice dse-ref-web-card', attr: { 'data-scc': code } });
			c.createDiv({ cls: 'dse-ref-notice__msg dse-ref-web-card__msg', text: 'Not installed locally.' });
			const a = c.createEl('a', { cls: 'dse-ref-web-card__link external-link', text: 'View on steelcompendium.io', href: `https://steelcompendium.io/scc/${code}/` });
			a.setAttribute('target', '_blank');
			a.setAttribute('rel', 'noopener');
			c.createDiv({ cls: 'dse-ref-notice__hint dse-ref-web-card__cta', text: 'Run "Sync compendium" to embed it here.' });
		} else {
			// renderRefNotice(root, { message, hint }), verbatim calls
			const c = root.createDiv({ cls: 'dse-ref-notice' });
			c.createDiv({ cls: 'dse-ref-notice__msg', text: 'Unknown SCC code `mcdm.heroes.v1/kit/pantherr`. Try Draw Steel: Insert compendium reference.' });
			c.createDiv({ cls: 'dse-ref-notice__hint', text: 'Check the code, or run "Sync compendium".' });
		}
		// family reference link for the SC-366 colour check
		const ref = root.createDiv({ cls: 'dse-card' });
		ref.style.display = 'none';
		ref.createEl('a', { text: 'fam', href: 'https://e/', attr: { id: 'sc366-fam' } });
		return true;
	}, { wrapper, state, card });
}

function measure(page) {
	return page.evaluate(() => {
		const card = document.querySelector('.dse-ref-notice');
		const cs = getComputedStyle(card);
		const sides = {};
		for (const s of ['top', 'right', 'bottom', 'left']) sides[s] = `${cs.getPropertyValue(`border-${s}-width`)} ${cs.getPropertyValue(`border-${s}-style`)} ${cs.getPropertyValue(`border-${s}-color`)}`;
		const pse = {};
		for (const p of ['::before', '::after']) { const q = getComputedStyle(card, p); pse[p] = { content: q.content, w: q.width, bg: q.backgroundColor, bgi: q.backgroundImage.slice(0, 20), border: q.borderLeftWidth }; }
		const msg = card.querySelector('.dse-ref-notice__msg');
		const cr = card.getBoundingClientRect(), mr = msg.getBoundingClientRect();
		const hint = card.querySelector('.dse-ref-notice__hint');
		const a = card.querySelector('a');
		// every rule (any sheet) matching the card that sets a border/box-shadow/outline/background-image
		const hits = [];
		const walk = (rules, src) => {
			for (const r of rules) {
				if (r instanceof CSSStyleRule) {
					const st = r.style; const props = [];
					for (let i = 0; i < st.length; i++) { const p = st[i]; if (/^(border(-left|-inline-start)?(-width|-color|-style)?$|border-left|border-inline|box-shadow|outline|background-image)/.test(p)) props.push(`${p}: ${st.getPropertyValue(p)}`); }
					if (!props.length) continue;
					for (const part of r.selectorText.split(',')) {
						let m = false; try { m = card.matches(part.trim().replace(/::?(before|after)$/, '')); } catch {}
						if (m) hits.push({ src, sel: part.trim().slice(0, 120), props: props.filter((p) => !/radius/.test(p)).slice(0, 6) });
					}
				} else if (r.cssRules) {
					if (r instanceof CSSMediaRule && !matchMedia(r.conditionText).matches) continue;
					walk(r.cssRules, src);
				}
			}
		};
		for (const sh of document.styleSheets) { if (sh.disabled) continue; walk(sh.cssRules, (sh.href || (sh.ownerNode && sh.ownerNode.id) || 'inline').split('/').pop()); }
		return {
			sides, boxShadow: cs.boxShadow, outline: cs.outlineStyle, bgImage: cs.backgroundImage.slice(0, 30), bg: cs.backgroundColor,
			padL: cs.paddingLeft, padT: cs.paddingTop, radius: cs.borderTopLeftRadius,
			textInsetL: +(mr.left - cr.left).toFixed(2), textInsetR: +(cr.right - mr.right).toFixed(2), textInsetT: +(mr.top - cr.top).toFixed(2),
			cardW: +cr.width.toFixed(2), cardH: +cr.height.toFixed(2),
			hintInsetL: hint ? +(hint.getBoundingClientRect().left - cr.left).toFixed(2) : null,
			linkColor: a ? getComputedStyle(a).color : null, famColor: getComputedStyle(document.getElementById('sc366-fam')).color,
			afterGlyphBg: a ? getComputedStyle(a, '::after').backgroundColor : null,
			pseudo: pse, hits,
		};
	});
}

for (const sheetVer of ['1.13.7', '1.14.4']) {
	for (const bg of ['dark', 'light']) {
		for (const print of [false, true]) {
			for (const wrapper of ['bare', 'reading', 'livepreview']) {
				for (const card of ['notinstalled', 'notice']) {
					for (const state of ['before', 'after']) {
						const ctx = await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 2 });
						const page = await ctx.newPage();
						const q = new URLSearchParams({ element: 'perk', fixture: 'default', theme: 'steel', bg, sheet: '1', ...(print ? { print: '1' } : {}) });
						await page.goto(`${pageUrl}?${q}`);
						await page.waitForFunction(() => window.__dseHarnessDone !== undefined, null, { timeout: 30000 });
						if (sheetVer === '1.14.4') {
							await page.evaluate((txt) => {
								const l = document.getElementById('dse-obsidian-app-css');
								const st = document.createElement('style'); st.id = 'sc366-app-1144'; st.textContent = txt;
								l.after(st); st.disabled = l.disabled; l.disabled = true;
							}, APP1144);
						}
						const sheetLive = await page.evaluate(() => { const st = document.getElementById('sc366-app-1144'); const l = document.getElementById('dse-obsidian-app-css'); return st ? !st.disabled : !l.disabled; });
						await build(page, { wrapper, state, card });
						const m = await measure(page);
						const name = `${sheetVer}-${bg}${print ? '-print' : ''}-${wrapper}-${card}-${state}`;
						if (wrapper === 'reading' && sheetVer === '1.14.4') {
							const box = await page.locator('.dse-ref-notice').boundingBox();
							await page.screenshot({ path: `${OUT}/sr-${name}.png`, clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 } });
						}
						results.push({ name, sheetLive, ...m });
						await ctx.close();
					}
				}
			}
		}
	}
}
await browser.close();
fs.writeFileSync(`${OUT}/probe.json`, JSON.stringify(results, null, 2));
for (const r of results) {
	console.log(r.name.padEnd(46), r.sheetLive ? 'sheet' : 'NOSHEET', '| L', r.sides.left, '| T', r.sides.top, '| R', r.sides.right, '| B', r.sides.bottom, '| shadow', r.boxShadow, '| padL', r.padL, '| textInsetL', r.textInsetL, 'T', r.textInsetT, '| link', r.linkColor, 'fam', r.famColor, '| ::before', r.pseudo['::before'].content, '::after', r.pseudo['::after'].content);
}
