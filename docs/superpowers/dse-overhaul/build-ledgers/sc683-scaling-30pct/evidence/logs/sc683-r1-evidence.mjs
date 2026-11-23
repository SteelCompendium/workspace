// Scratch (NOT committed). Browser-harness captures + probes for SC-683, through the real `cardScale` pref path
// (entry.ts -> deps.prefs.set('cardScale', v) -> snap() -> --dse-card-scale on the element root).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const PLUGIN = '/home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct/draw-steel-elements';
const require = createRequire(path.join(PLUGIN, 'package.json'));
const { chromium } = require('playwright');
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const pageUrl = 'file://' + path.join(PLUGIN, 'visual-harness', 'index.html');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
const page = await context.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));

async function mount(params) {
	const q = new URLSearchParams({ theme: 'steel', bg: 'dark', sheet: '1', ...params });
	await page.emulateMedia({ media: 'screen' });
	await page.goto(`${pageUrl}?${q}`);
	await page.waitForFunction(() => window.__dseHarnessDone !== undefined, null, { timeout: 20000 });
	const done = await page.evaluate(() => window.__dseHarnessDone);
	if (done.errors.length) throw new Error('harness errors: ' + JSON.stringify(done.errors));
}

// In-page probe: everything measured is a number from the live DOM.
const probe = () => page.evaluate(() => {
	const mountEl = document.getElementById('mount');
	const root = mountEl.querySelector('[data-dse-element]');
	const card = mountEl.querySelector('.dse-sb, .dse-card') ?? root;
	const zoomOf = (el) => parseFloat(getComputedStyle(el).zoom);
	// Every element that zooms (computed zoom !== 1) and the product of zooms up its ancestor chain.
	const chainZoom = (el) => { let z = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) z *= zoomOf(e); return z; };
	const zoomed = [...mountEl.querySelectorAll('*')].filter((e) => zoomOf(e) !== 1).map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 40), zoom: zoomOf(e) }));
	// Horizontal overflow: elements whose own box sticks out of the card's box (zoom-aware: both are in viewport px).
	const cb = card.getBoundingClientRect();
	const out = [...card.querySelectorAll('*')].filter((e) => {
		const r = e.getBoundingClientRect();
		return r.width > 0 && (r.right > cb.right + 1 || r.left < cb.left - 1);
	}).slice(0, 8).map((e) => ({ cls: String(e.className).slice(0, 40), left: +e.getBoundingClientRect().left.toFixed(1), right: +e.getBoundingClientRect().right.toFixed(1) }));
	// Clipped text: leaf-ish elements whose scrollWidth exceeds clientWidth (ignoring zero-width).
	const clipped = [...card.querySelectorAll('*')].filter((e) => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible').slice(0, 8).map((e) => ({ cls: String(e.className).slice(0, 40), sw: e.scrollWidth, cw: e.clientWidth }));
	// Smallest text actually painted: for each text-bearing element, computed font-size x chain zoom = rendered px.
	let min = { px: 1e9 };
	const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
	for (let n = walker.nextNode(); n; n = walker.nextNode()) {
		if (!n.textContent.trim()) continue;
		const el = n.parentElement;
		const fs = parseFloat(getComputedStyle(el).fontSize);
		const px = fs * chainZoom(el);
		if (px < min.px) min = { px: +px.toFixed(3), fontSizeComputed: fs, zoomChain: +chainZoom(el).toFixed(3), cls: String(el.className).slice(0, 40), text: n.textContent.trim().slice(0, 24) };
	}
	// Does a rendered line's height follow the zoom (no minimum-font floor)? line box of the smallest text element.
	return {
		scaleVar: root.style.getPropertyValue('--dse-card-scale'),
		cardClass: String(card.className).slice(0, 40),
		cardZoom: zoomOf(card),
		cardBox: { w: +cb.width.toFixed(1), h: +cb.height.toFixed(1) },
		mountBox: { w: +mountEl.getBoundingClientRect().width.toFixed(1), scrollW: mountEl.scrollWidth, clientW: mountEl.clientWidth },
		docScrollW: document.documentElement.scrollWidth, docClientW: document.documentElement.clientWidth,
		zoomedCount: zoomed.length, zoomed: zoomed.slice(0, 6),
		overflowing: out, clipped, smallestText: min,
	};
});

const results = {};
const VALUES = [1, 0.8, 0.5, 0.3];
const pct = (v) => Math.round(v * 100);

async function shotMount(name) {
	const file = path.join(OUT, name);
	// grow the viewport to cover #mount (as shoot.mjs's snap() does) so a tall card is not captured clipped
	const h = await page.evaluate(() => Math.ceil(document.getElementById('mount').getBoundingClientRect().bottom + window.scrollY) + 40);
	await page.setViewportSize({ width: page.viewportSize().width, height: Math.max(1200, Math.min(h, 9000)) });
	await page.locator('#mount').screenshot({ path: file });
	await page.setViewportSize({ width: page.viewportSize().width, height: 1200 });
	return file;
}

// A. statblock at 100/80/50/30 (default fixture)
for (const v of VALUES) {
	await mount({ element: 'statblock', fixture: 'default', prefs: `cardScale:${v}` });
	results[`A-statblock-${pct(v)}`] = await probe();
	await shotMount(`sc683-A-statblock-card-size-${pct(v)}.png`);
}
// A2. a longer, villain/companion corpus statblock for the clipping probe at 30/50
for (const v of [1, 0.5, 0.3]) {
	await mount({ element: 'statblock', fixture: 'villain-corpus', prefs: `cardScale:${v}` });
	results[`A2-villain-corpus-${pct(v)}`] = await probe();
	if (v !== 1) await shotMount(`sc683-A2-villain-corpus-card-size-${pct(v)}.png`);
}
// B. feature card at 100 and 30 (+ 50 for the probe)
for (const v of [1, 0.5, 0.3]) {
	await mount({ element: 'feature', fixture: 'default', prefs: `cardScale:${v}` });
	results[`B-feature-${pct(v)}`] = await probe();
	if (v !== 0.5) await shotMount(`sc683-B-feature-card-size-${pct(v)}.png`);
}
// Nested: a by-SCC reference card (a real nested card inside an element root) at 100/50/30.
for (const [element, fixture] of [['condition', 'by-scc'], ['rule', 'by-scc']]) {
	for (const v of [1, 0.5, 0.3]) {
		try {
			await mount({ element, fixture, prefs: `cardScale:${v}` });
			const r = await probe();
			// count element roots + card hosts to prove nesting actually occurs here
			r.nesting = await page.evaluate(() => ({
				roots: document.querySelectorAll('#mount [data-dse-element]').length,
				hosts: [...document.querySelectorAll('#mount .dse-sb, #mount .dse-card, #mount [data-dse-element="feature"], #mount [data-dse-element="featureblock"]')].map((e) => ({ el: e.getAttribute('data-dse-element') ?? e.className.slice(0, 20), zoom: parseFloat(getComputedStyle(e).zoom), depthRoots: (() => { let n = 0; for (let p = e.parentElement; p; p = p.parentElement) if (p.hasAttribute('data-dse-element')) n++; return n; })() })),
			}));
			results[`N-${element}-${fixture}-${pct(v)}`] = r;
			if (v === 0.3) await shotMount(`sc683-N-${element}-${fixture}-card-size-30.png`);
		} catch (e) {
			results[`N-${element}-${fixture}-${pct(v)}`] = { error: String(e) };
		}
	}
}
// Card inside a modal: emulated. Wrap the rendered statblock in the production modal classes and stamp the pref var on
// the modal root, exactly the selector arm `:is([data-dse-element], .dse-modal) :is(.dse-sb,.dse-card)` styles-source.css ~8434.
for (const v of [1, 0.5, 0.3]) {
	await mount({ element: 'statblock', fixture: 'default', prefs: `cardScale:${v}` });
	results[`M-modal-emulated-${pct(v)}`] = await page.evaluate((v) => {
		const mountEl = document.getElementById('mount');
		const sb = mountEl.querySelector('.dse-sb');
		const modal = document.createElement('div');
		modal.className = 'dse-modal';
		modal.style.setProperty('--dse-card-scale', v === 1 ? '' : String(v));
		const body = document.createElement('div');
		body.className = 'dse-modal__body';
		const card = document.createElement('div');
		card.className = 'dse-sb';
		card.textContent = 'modal card';
		card.style.width = '400px';
		body.appendChild(card);
		modal.appendChild(body);
		document.body.appendChild(modal);
		const z = parseFloat(getComputedStyle(card).zoom);
		const r = card.getBoundingClientRect();
		return { varOnModal: modal.style.getPropertyValue('--dse-card-scale'), zoom: z, boxW: +r.width.toFixed(1), note: 'bare .dse-sb in .dse-modal, 400px css width' };
	}, v);
}
// settings-preview chrome surface (real SettingsPreview mount of a statblock)
for (const v of [1, 0.3]) {
	try {
		await mount({ surface: 'settings-preview', prefs: `cardScale:${v}` });
		results[`P-settings-preview-${pct(v)}`] = await page.evaluate(() => {
			const prev = document.querySelector('#mount .dse-settings-preview');
			const sb = prev?.querySelector('.dse-sb');
			return { previewW: prev ? +prev.getBoundingClientRect().width.toFixed(1) : null, sbZoom: sb ? parseFloat(getComputedStyle(sb).zoom) : null, sbW: sb ? +sb.getBoundingClientRect().width.toFixed(1) : null, scaleVarOn: [...document.querySelectorAll('#mount [data-dse-element]')].map((e) => e.style.getPropertyValue('--dse-card-scale')) };
		});
		if (v === 0.3) await shotMount('sc683-P-settings-preview-card-size-30.png');
	} catch (e) { results[`P-settings-preview-${pct(v)}`] = { error: String(e) }; }
}
// Narrow (sidebar) width at 30%: 360 css px
for (const v of [1, 0.3]) {
	await mount({ element: 'statblock', fixture: 'default', width: '360', prefs: `cardScale:${v}` });
	results[`W-narrow360-${pct(v)}`] = await probe();
	if (v === 0.3) await shotMount('sc683-W-statblock-narrow360-card-size-30.png');
}

// Nested roots inside a zoomed statblock/feature: an element root + card host injected under the card.
for (const v of [1, 0.5, 0.3]) {
	await mount({ element: 'statblock', fixture: 'default', prefs: `cardScale:${v}` });
	results[`NR-nested-injected-${pct(v)}`] = await page.evaluate(() => {
		const sb = document.querySelector('#mount .dse-sb');
		const mk = (kind) => {
			const root = document.createElement('div');
			root.setAttribute('data-dse-element', kind);
			const card = document.createElement('div');
			card.className = kind === 'statblock' ? 'dse-sb' : 'dse-card';
			card.textContent = 'nested ' + kind;
			root.appendChild(card);
			sb.appendChild(root);
			return { root, card };
		};
		const chain = (el) => { let z = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) z *= parseFloat(getComputedStyle(e).zoom); return +z.toFixed(4); };
		const out = {};
		for (const kind of ['statblock', 'feature', 'featureblock']) {
			const { root, card } = mk(kind);
			const host = kind === 'statblock' ? card : root; // feature/featureblock roots ARE their own card
			out[kind] = { ownZoom: parseFloat(getComputedStyle(host).zoom), chainZoomToDocument: chain(host), outerCardZoom: parseFloat(getComputedStyle(sb).zoom) };
		}
		return out;
	});
}
// Rendered-size floor: line-box height of the smallest label at each scale vs 100% (a font floor would stop it shrinking).
const heights = {};
for (const v of [1, 0.8, 0.5, 0.3]) {
	await mount({ element: 'statblock', fixture: 'default', prefs: `cardScale:${v}` });
	heights[pct(v)] = await page.evaluate(() => {
		const el = document.querySelector('#mount .dse-sb__kv-l');
		const r = document.createRange(); r.selectNodeContents(el);
		const rr = r.getBoundingClientRect();
		return { elH: +el.getBoundingClientRect().height.toFixed(3), glyphBoxH: +rr.height.toFixed(3), glyphBoxW: +rr.width.toFixed(3), computedFontSize: getComputedStyle(el).fontSize, innerLayoutWidthCss: +(document.querySelector('#mount .dse-sb').offsetWidth).toFixed(1) };
	});
}
results['F-rendered-label-box'] = heights;
results.pageErrors = errs;
fs.writeFileSync(path.join(OUT, 'sc683-probe-measurements.json'), JSON.stringify(results, null, 1));
await browser.close();
console.log('done; keys:', Object.keys(results).length, 'pageErrors:', errs.length);
