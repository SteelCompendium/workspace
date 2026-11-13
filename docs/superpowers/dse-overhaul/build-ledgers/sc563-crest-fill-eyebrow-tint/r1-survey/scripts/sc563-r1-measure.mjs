// SC-563 r1 — crest icon fill + trait eyebrow tint: measure site vs plugin, same-scale tiles,
// option probes (addStyleTag only; no source edit), print/realprint sweep.
//
// Usage (devbox, from the dse worktree):  node <this> site|plugin|glyphs|sweep
// Plugin = a PRIVATE COPY of the harness built from the sc563 worktree at dse 6270e84a
//          (index.html + vars.css + dist/{harness.js,harness.css,obsidian-app.css}), 900x1200,
//          theme=steel, sheet=1 on screen and on the print twin, realprint = emulateMedia print,
//          no sheet — exactly snap()'s query shape (shoot.mjs:624-643).
// Site   = live https://steelcompendium.io/v2 at 1440x900 (parity:site's viewport); scheme
//          forced via context colorScheme AND body[data-md-color-scheme] (read back per page).
// Tiles  = deviceScaleFactor 2 on BOTH sides (2 image px per CSS px), never auto-fit.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { iconOptions, EYEBROW_OPTIONS, SC368_A, CONTROL_UNSCOPED, SITE_GLYPH } from './sc563-probes.mjs';

const WT = '/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint';
const SCRATCH = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc563-r1-reviewer-k7q2';
const req = createRequire(WT + '/draw-steel-elements/package.json');
const { chromium } = req('playwright');
const { PNG } = req('pngjs');
const LUCIDE = req('lucide/dist/cjs/lucide.js');
const HARNESS = `file://${SCRATCH}/harness/index.html`;
const FONT_URL = `file://${WT}/v2/docs/fonts/DrawSteelGlyphs-Regular.otf`;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TILES = path.join(OUT, 'tiles');
const DATA = path.join(OUT, 'data');
fs.mkdirSync(TILES, { recursive: true });
fs.mkdirSync(DATA, { recursive: true });
const ICON = iconOptions(FONT_URL);
const DSF = 2;

// ---------------------------------------------------------------- colour math
function parseColor(s) {
	const m = s.match(/rgba?\(([^)]+)\)/);
	if (!m) return null;
	const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
	return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}
const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const relLum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const contrast = (a, b) => { const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function oklch(c) {
	const r = lin(c.r), g = lin(c.g), b = lin(c.b);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	const C = Math.hypot(A, B);
	let h = (Math.atan2(B, A) * 180) / Math.PI; if (h < 0) h += 360;
	return { L: +L.toFixed(3), C: +C.toFixed(3), h: +h.toFixed(0) };
}
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

function medianBg(buf, rect) {
	// rect in CSS px relative to the shot; image is DSF x
	const png = PNG.sync.read(buf);
	const x0 = Math.max(0, Math.floor(rect.x * DSF)), y0 = Math.max(0, Math.floor(rect.y * DSF));
	const x1 = Math.min(png.width, Math.ceil((rect.x + rect.w) * DSF)), y1 = Math.min(png.height, Math.ceil((rect.y + rect.h) * DSF));
	const rs = [], gs = [], bs = [];
	for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * png.width + x) * 4; rs.push(png.data[i]); gs.push(png.data[i + 1]); bs.push(png.data[i + 2]); }
	if (!rs.length) return null;
	const med = (a) => { a.sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
	return { r: med(rs), g: med(gs), b: med(bs), a: 1 };
}
function describe(colorStr, bg) {
	const raw = parseColor(colorStr);
	if (!raw) return { computed: colorStr };
	const painted = raw.a < 1 && bg ? over(raw, bg) : raw;
	const out = { computed: colorStr, hex: hex(painted), oklch: oklch(painted) };
	if (bg) { out.bgHex = hex(bg); out.bgL = oklch(bg).L; out.contrast = +contrast(painted, bg).toFixed(2); }
	return out;
}
// ink of one element: pixel diff between a normal shot and a shot with the element hidden
function inkDiff(bufA, bufB) {
	const a = PNG.sync.read(bufA), b = PNG.sync.read(bufB);
	let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
	for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
		const i = (y * a.width + x) * 4;
		const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
		if (d > 24) { n++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
	}
	if (x1 < 0) return { inkPx: 0 };
	const w = (x1 - x0 + 1) / DSF, h = (y1 - y0 + 1) / DSF;
	return { inkPx: n, inkCssPx2: +(n / DSF / DSF).toFixed(1), bbox: { x: x0 / DSF, y: y0 / DSF, w, h }, coverage: +(n / ((x1 - x0 + 1) * (y1 - y0 + 1))).toFixed(3), imgW: a.width / DSF, imgH: a.height / DSF };
}

// ---------------------------------------------------------------- pages
async function pluginPage(browser, el, fx, mode, dsf = DSF) {
	const bg = mode === 'light' ? 'light' : 'dark';
	const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: dsf });
	const page = await ctx.newPage();
	const q = { element: el, fixture: fx, theme: 'steel', bg };
	if (mode === 'print') q.print = '1';
	if (mode !== 'realprint') q.sheet = '1';
	await page.emulateMedia({ media: mode === 'realprint' ? 'print' : 'screen' });
	await page.goto(`${HARNESS}?${new URLSearchParams(q)}`);
	await page.waitForFunction(() => window.__dseHarnessDone !== undefined, null, { timeout: 30000 });
	const done = await page.evaluate(() => window.__dseHarnessDone);
	if (done.errors.length) throw new Error(`${el}/${fx} ${mode}: ${done.errors.join('|')}`);
	await page.evaluate(() => document.fonts.ready);
	await page.mouse.move(0, 0);
	return { ctx, page };
}
async function sitePage(browser, url, scheme) {
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF, colorScheme: scheme });
	const page = await ctx.newPage();
	const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
	if (resp.status() !== 200) throw new Error(`${url} -> ${resp.status()}`);
	await page.evaluate((s) => document.body.setAttribute('data-md-color-scheme', s === 'dark' ? 'slate' : 'default'), scheme);
	await page.addStyleTag({ content: '.md-header, .md-tabs, .sc-chrome, .sc-copylink { visibility: hidden !important; }' });
	await page.evaluate(() => document.fonts.ready);
	await page.mouse.move(0, 0);
	await page.waitForTimeout(200);
	return { ctx, page };
}
async function addCss(page, css) { return css ? page.addStyleTag({ content: css }) : null; }
async function rmCss(h) { if (h) await h.evaluate((e) => e.remove()); }
async function settle(page) { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(60); }

// head/crest/eyebrow probe, both sides
async function probeHead(page, headSel, side) {
	return page.evaluate(({ headSel, side }) => {
		const head = document.querySelector(headSel);
		if (!head) return null;
		head.scrollIntoView({ block: 'center' });
		const hr = head.getBoundingClientRect();
		const rel = (r) => ({ x: r.left - hr.left, y: r.top - hr.top, w: r.width, h: r.height });
		const cs = (e, p) => (e ? getComputedStyle(e, p) : null);
		const pick = (s, keys) => (s ? Object.fromEntries(keys.map((k) => [k, s.getPropertyValue(k)])) : null);
		const crest = side === 'site' ? head.querySelector(':scope > .sc-crest, :scope > * > .sc-crest') : head.querySelector(':scope > .dse-crest');
		let glyph = null;
		if (crest) {
			if (side === 'site') {
				const g = crest.firstElementChild;
				const svg = crest.querySelector('svg');
				glyph = { kind: svg ? 'svg' : 'font', text: g?.textContent ?? null, rect: rel((svg ?? g).getBoundingClientRect()), style: pick(cs(svg ?? g), ['font-family', 'font-size', 'color', 'fill', 'stroke', 'stroke-width', 'transform']) };
			} else {
				const gw = crest.querySelector('.dse-crest__glyph');
				const svg = gw?.querySelector('svg');
				const before = cs(gw, '::before');
				const paths = svg ? [...svg.querySelectorAll('path,circle,rect,polyline,line,polygon,ellipse')].map((p) => p.tagName) : [];
				glyph = {
					kind: 'svg', icon: gw?.getAttribute('data-icon'), svgDisplay: svg ? cs(svg).display : null,
					rect: svg && cs(svg).display !== 'none' ? rel(svg.getBoundingClientRect()) : null,
					style: pick(cs(svg), ['color', 'fill', 'stroke', 'stroke-width', 'width', 'height']),
					svgAttr: svg ? { sw: svg.getAttribute('stroke-width'), fill: svg.getAttribute('fill'), cls: svg.getAttribute('class') } : null,
					before: before ? { content: before.content, fontFamily: before.fontFamily, fontSize: before.fontSize } : null,
					elements: paths,
				};
			}
		}
		const ebSel = side === 'site' ? '.sc-head__left-eyebrow' : '.dse-head__eyebrow--left';
		const eb = [...head.querySelectorAll(ebSel)].find((e) => e.closest(side === 'site' ? '.sc-head' : '.dse-head') === head);
		const nmSel = side === 'site' ? '.sc-head__left-primary' : '.dse-head__primary--left';
		const nm = [...head.querySelectorAll(nmSel)].find((e) => e.closest(side === 'site' ? '.sc-head' : '.dse-head') === head);
		const ebS = cs(eb), ebB = cs(eb, '::before');
		return {
			headRect: { w: hr.width, h: hr.height },
			crest: crest ? { rect: rel(crest.getBoundingClientRect()), display: cs(crest).display } : null,
			glyph,
			eyebrow: eb ? { text: eb.textContent.trim(), display: ebS.display, color: ebS.color, fontSize: ebS.fontSize, fontWeight: ebS.fontWeight, rect: rel(eb.getBoundingClientRect()), dia: { bg: ebB.backgroundColor, content: ebB.content, w: ebB.width, h: ebB.height } } : null,
			name: nm ? { text: nm.textContent.trim(), color: cs(nm).color, rect: rel(nm.getBoundingClientRect()) } : null,
			act: side === 'site' ? head.closest('[data-action]')?.getAttribute('data-action') : head.parentElement?.getAttribute('data-dse-act'),
			actColor: side === 'site' ? cs(head.closest('[data-action]') ?? head).getPropertyValue('--act').trim() : cs(head.parentElement).getPropertyValue('--dse-act').trim(),
			scheme: document.body.getAttribute('data-md-color-scheme') || (document.body.classList.contains('theme-light') ? 'theme-light' : 'theme-dark'),
		};
	}, { headSel, side });
}

async function shoot(page, sel) { return page.locator(sel).first().screenshot({ animations: 'disabled' }); }

// full measurement + tiles of one head under the currently injected CSS
async function captureHead(page, headSel, side, tag) {
	const m = await probeHead(page, headSel, side);
	if (!m) throw new Error('head not found ' + headSel);
	await settle(page);
	const headShot = await shoot(page, headSel);
	fs.writeFileSync(path.join(TILES, `${tag}--head.png`), headShot);
	const crestSel = side === 'site' ? `${headSel} .sc-crest` : `${headSel} > .dse-crest`;
	const hideGlyph = side === 'site' ? `${crestSel} > * { visibility: hidden !important; }` : `${crestSel} .dse-crest__glyph { visibility: hidden !important; }`;
	if (m.crest) {
		const crestShot = await shoot(page, crestSel);
		fs.writeFileSync(path.join(TILES, `${tag}--crest.png`), crestShot);
		const h = await addCss(page, hideGlyph); await settle(page);
		const bare = await shoot(page, crestSel);
		await rmCss(h);
		m.glyphInk = inkDiff(crestShot, bare);
		m.glyphInkColour = describe(m.glyph?.style?.color ?? 'rgb(0,0,0)', medianBg(bare, { x: m.glyphInk.bbox?.x ?? 0, y: m.glyphInk.bbox?.y ?? 0, w: m.glyphInk.bbox?.w ?? 1, h: m.glyphInk.bbox?.h ?? 1 }));
	}
	// eyebrow + name background: hide all text in the head
	const hideText = `${headSel}, ${headSel} * { color: transparent !important; text-shadow: none !important; -webkit-text-stroke: 0 transparent !important; } ${headSel} *::before { background: transparent !important; }`;
	const h2 = await addCss(page, hideText); await settle(page);
	const bgShot = await shoot(page, headSel);
	await rmCss(h2);
	if (m.eyebrow) {
		const bg = medianBg(bgShot, m.eyebrow.rect);
		m.eyebrow.ink = describe(m.eyebrow.color, bg);
		m.eyebrow.diaInk = describe(m.eyebrow.dia.bg, bg);
	}
	if (m.name) m.name.ink = describe(m.name.color, medianBg(bgShot, m.name.rect));
	m.tiles = { head: `tiles/${tag}--head.png`, crest: m.crest ? `tiles/${tag}--crest.png` : null };
	return m;
}

const SITE = 'https://steelcompendium.io/v2/Browse/';
const SITE_ROWS = [
	{ id: 'ability-mark', act: 'maneuver', url: SITE + 'feature/ability/tactician/level-1/mark/', head: '.sc-ability > .sc-head' },
	{ id: 'ability-parry', act: 'triggered', url: SITE + 'feature/ability/tactician/level-1/parry/', head: '.sc-ability > .sc-head' },
	{ id: 'ability-concussive-strike', act: 'main', url: SITE + 'feature/ability/tactician/level-1/concussive-strike/', head: '.sc-ability > .sc-head' },
	{ id: 'ability-phase-leap', act: 'move', url: SITE + 'feature/ability/null/level-5/phase-leap/', head: '.sc-ability > .sc-head' },
	{ id: 'ability-revitalizing-limerick', act: 'none', url: SITE + 'feature/ability/troubadour/level-1/revitalizing-limerick/', head: '.sc-ability > .sc-head' },
	{ id: 'trait-determination', act: 'trait', url: SITE + 'feature/trait/human/determination/', head: '.sc-trait > .sc-head' },
	{ id: 'feature-nature-watch', act: 'trait', url: SITE + 'feature/summoner/level-5/nature-watch/', head: '.sc-trait > .sc-head' },
	{ id: 'kitsig-devastating-rush', act: 'main', url: SITE + 'kit/panther/', head: '.sc-embed .sc-ability > .sc-head' },
	{ id: 'kit-panther', act: null, url: SITE + 'kit/panther/', head: '.sc-kit__head' },
];

const PLUGIN_ROWS = [
	{ id: 'mark', el: 'feature', fx: 'ability-provenance', head: "[data-dse-element='feature'] > .dse-feature > .dse-head" },
	{ id: 'determination', el: 'feature', fx: 'trait-provenance', head: "[data-dse-element='feature'] > .dse-feature > .dse-head" },
	{ id: 'devastating-rush', el: 'kit', fx: 'default', head: "[data-dse-element='kit'] .dse-card__band .dse-feature > .dse-head" },
	{ id: 'feature-default', el: 'feature', fx: 'default', head: "[data-dse-element='feature'] > .dse-feature > .dse-head" },
	{ id: 'villain', el: 'feature', fx: 'villain', head: "[data-dse-element='feature'] > .dse-feature > .dse-head" },
];
const PLUGIN_COLS = {
	today: '',
	I1: ICON.I1.css, I2: ICON.I2.css, I3: ICON.I3.css,
	EA: EYEBROW_OPTIONS.EA.css, EC: EYEBROW_OPTIONS.EC.css,
	'368A': SC368_A, 'EA+368A': EYEBROW_OPTIONS.EA.css + '\n' + SC368_A, 'EC+368A': EYEBROW_OPTIONS.EC.css + '\n' + SC368_A,
};

const ACT_ICON = { main: 'sword', maneuver: 'user', triggered: 'zap', move: 'footprints', none: 'circle-dashed', trait: 'star', villain: 'skull' };
const pascal = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
function lucideSvgInner(name) {
	const node = LUCIDE.icons[pascal(name)];
	return node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}></${tag}>`).join('');
}

const mode = process.argv[2];
const browser = await chromium.launch();
const t0 = Date.now();

if (mode === 'site') {
	const out = [];
	for (const scheme of ['dark', 'light']) {
		const byUrl = {};
		for (const r of SITE_ROWS) (byUrl[r.url] ??= []).push(r);
		for (const [url, rows] of Object.entries(byUrl)) {
			const { ctx, page } = await sitePage(browser, url, scheme);
			for (const r of rows) {
				const m = await captureHead(page, r.head, 'site', `site--${scheme}--${r.id}`);
				out.push({ scheme, row: r.id, expectAct: r.act, url, ...m });
				console.log(scheme, r.id, m.name?.text, m.act, m.glyph?.text, m.glyph?.style?.color, m.eyebrow?.ink?.hex, m.glyphInk?.bbox);
			}
			await ctx.close();
		}
	}
	// statblock sub-feature glyphs (site sb__feat-icon), dark only
	{
		const { ctx, page } = await sitePage(browser, SITE + 'monster/human/human-bandit-chief/', 'dark');
		const icons = await page.evaluate(() => [...document.querySelectorAll('.sb__feat-icon')].map((e) => ({ act: e.closest('[data-action]')?.getAttribute('data-action'), text: e.textContent.trim(), font: getComputedStyle(e.querySelector('.sb__feat-glyph') ?? e).fontFamily, size: getComputedStyle(e.querySelector('.sb__feat-glyph') ?? e).fontSize, color: getComputedStyle(e.querySelector('.sb__feat-glyph') ?? e).color })));
		out.push({ scheme: 'dark', row: 'sb-subfeature-icons', icons });
		console.log('sb icons', JSON.stringify(icons).slice(0, 400));
		await ctx.close();
	}
	fs.writeFileSync(path.join(DATA, 'sc563-r1-site.json'), JSON.stringify({ capturedAt: new Date().toISOString(), viewport: '1440x900 dsf2', rows: out }, null, 1) + '\n');
} else if (mode === 'plugin') {
	const out = [];
	for (const scheme of ['dark', 'light']) {
		for (const r of PLUGIN_ROWS) {
			const { ctx, page } = await pluginPage(browser, r.el, r.fx, scheme);
			for (const [col, css] of Object.entries(PLUGIN_COLS)) {
				const h = await addCss(page, css); await settle(page);
				const m = await captureHead(page, r.head, 'plugin', `plugin--${scheme}--${r.id}--${col}`);
				await rmCss(h);
				out.push({ scheme, row: r.id, col, ...m });
				console.log(scheme, r.id, col, m.name?.text, m.act, m.glyph?.icon, m.glyph?.style?.['stroke-width'], m.glyph?.style?.fill, m.eyebrow?.ink?.hex, m.glyphInk?.inkCssPx2);
			}
			await ctx.close();
		}
	}
	fs.writeFileSync(path.join(DATA, 'sc563-r1-plugin.json'), JSON.stringify({ capturedAt: new Date().toISOString(), harness: 'dse 6270e84a harness copy, 900x1200 dsf2, steel, sheet=1', rows: out }, null, 1) + '\n');
} else if (mode === 'glyphs') {
	// every action kind in ONE real crest (Mark's), icon swapped exactly as the shim's setIcon builds it
	const out = [];
	for (const scheme of ['dark', 'light']) {
		const { ctx, page } = await pluginPage(browser, 'feature', 'ability-provenance', scheme);
		const head = "[data-dse-element='feature'] > .dse-feature > .dse-head";
		for (const [act, icon] of Object.entries(ACT_ICON)) {
			const inner = lucideSvgInner(icon);
			await page.evaluate(({ act, icon, inner }) => {
				const root = document.querySelector("[data-dse-element='feature'] > .dse-feature");
				root.setAttribute('data-dse-act', act);
				root.style.setProperty('--dse-act', `var(--dse-act-${act})`);
				const gw = root.querySelector(':scope > .dse-head > .dse-crest .dse-crest__glyph');
				const svg = gw.querySelector('svg');
				svg.innerHTML = inner;
				svg.setAttribute('class', `lucide lucide-${icon}`);
				gw.setAttribute('data-icon', icon);
			}, { act, icon, inner });
			for (const col of ['today', 'I1', 'I2', 'I3']) {
				const h = await addCss(page, col === 'today' ? '' : ICON[col].css); await settle(page);
				const m = await captureHead(page, head, 'plugin', `glyph--${scheme}--${act}--${col}`);
				await rmCss(h);
				out.push({ scheme, act, icon, col, glyph: m.glyph, glyphInk: m.glyphInk, crest: m.crest, actColor: m.actColor, glyphInkColour: m.glyphInkColour, tile: `tiles/glyph--${scheme}--${act}--${col}--crest.png` });
				console.log(scheme, act, icon, col, m.glyphInk?.inkCssPx2, m.glyphInk?.bbox && `${m.glyphInk.bbox.w}x${m.glyphInk.bbox.h}`, m.glyph?.before?.content);
			}
		}
		await ctx.close();
	}
	fs.writeFileSync(path.join(DATA, 'sc563-r1-glyphs.json'), JSON.stringify({ capturedAt: new Date().toISOString(), rows: out }, null, 1) + '\n');
} else if (mode === 'allicons') {
	// every OTHER crest icon the plugin can draw (statblock roles, display families, montage,
	// negotiation, stamina), outline vs filled, to show what an UNSCOPED fill would do.
	const ICONS = ['crown', 'eye-off', 'wind', 'target', 'hammer', 'brain', 'sparkles', 'footprints', 'heart-pulse', 'shield', 'users', 'briefcase', 'octagon-alert', 'zap', 'map', 'backpack', 'package', 'gem', 'book-open', 'hourglass', 'trophy', 'handshake', 'shield-alert', 'skull'];
	const out = [];
	const { ctx, page } = await pluginPage(browser, 'feature', 'ability-provenance', 'dark');
	const head = "[data-dse-element='feature'] > .dse-feature > .dse-head";
	await page.evaluate(() => { const r = document.querySelector("[data-dse-element='feature'] > .dse-feature"); r.removeAttribute('data-dse-act'); r.style.removeProperty('--dse-act'); });
	for (const icon of ICONS) {
		const inner = lucideSvgInner(icon);
		await page.evaluate(({ icon, inner }) => {
			const gw = document.querySelector("[data-dse-element='feature'] > .dse-feature > .dse-head > .dse-crest .dse-crest__glyph");
			const svg = gw.querySelector('svg'); svg.innerHTML = inner; svg.setAttribute('class', `lucide lucide-${icon}`); gw.setAttribute('data-icon', icon);
		}, { icon, inner });
		for (const col of ['today', 'fillAll']) {
			const h = await addCss(page, col === 'fillAll' ? `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-crest__glyph svg { fill: currentColor; }` : ''); await settle(page);
			const m = await captureHead(page, head, 'plugin', `allicon--dark--${icon}--${col}`);
			await rmCss(h);
			out.push({ icon, col, glyphInk: m.glyphInk, tile: `tiles/allicon--dark--${icon}--${col}--crest.png` });
		}
		console.log(icon);
	}
	await ctx.close();
	fs.writeFileSync(path.join(DATA, 'sc563-r1-allicons.json'), JSON.stringify({ capturedAt: new Date().toISOString(), rows: out }, null, 1) + '\n');
} else if (mode === 'sweep') {
	// every element x fixture, 4 modes: inventory every crest/icon/eyebrow; option deltas.
	// print + realprint additionally hash a full-page dsf1 screenshot per option + an unscoped control.
	const { ctx: c0, page: p0 } = await pluginPage(browser, 'feature', 'default', 'dark', 1);
	const manifest = await p0.evaluate(() => window.__dseHarnessManifest);
	await c0.close();
	const all = manifest.elements.flatMap((e) => e.fixtures.map((fx) => [e.id, fx]));
	const from = Number(process.argv[3] ?? 0), to = Number(process.argv[4] ?? all.length);
	const list = all.slice(from, to);
	console.log('combos total', all.length, 'this part', from, to);
	const COLS = { today: '', I1: ICON.I1.css, I2: ICON.I2.css, I3: ICON.I3.css, EA: EYEBROW_OPTIONS.EA.css, EC: EYEBROW_OPTIONS.EC.css, UNION: [ICON.I1.css, ICON.I2.css, ICON.I3.css, EYEBROW_OPTIONS.EA.css, EYEBROW_OPTIONS.EC.css].join('\n'), CONTROL: CONTROL_UNSCOPED };
	const inv = () => {
		const crests = [...document.querySelectorAll('.dse-crest, .dse-sb__band-crest, .dse-fb__feat-icon')].map((c) => {
			const gw = c.querySelector('.dse-crest__glyph') ?? c;
			const svg = c.querySelector('svg');
			const s = svg ? getComputedStyle(svg) : null;
			const b = getComputedStyle(gw, '::before');
			const r = c.getBoundingClientRect();
			return {
				cls: c.className, icon: gw.getAttribute('data-icon') ?? c.getAttribute('data-icon') ?? (svg ? svg.getAttribute('class') : c.textContent.trim().slice(0, 4)),
				act: c.closest('.dse-feature[data-dse-act]')?.getAttribute('data-dse-act') ?? null,
				actParent: c.parentElement?.parentElement?.matches?.('.dse-feature[data-dse-act]') ?? false,
				inSbFb: !!c.closest('.dse-sb, .dse-fb'), host: c.closest('[data-dse-element]')?.getAttribute('data-dse-element'),
				display: getComputedStyle(c).display, w: +r.width.toFixed(2), h: +r.height.toFixed(2),
				svg: s ? { display: s.display, fill: s.fill, sw: s.strokeWidth, w: s.width } : null, before: b.content,
			};
		});
		const eyebrows = [...document.querySelectorAll('.dse-head__eyebrow--left')].map((e) => {
			const s = getComputedStyle(e), b = getComputedStyle(e, '::before');
			return { text: e.textContent.trim().slice(0, 30), act: e.closest('.dse-feature[data-dse-act]')?.getAttribute('data-dse-act') ?? null, inSbFb: !!e.closest('.dse-sb, .dse-fb'), host: e.closest('[data-dse-element]')?.getAttribute('data-dse-element'), display: s.display, color: s.color, dia: b.backgroundColor, w: +e.getBoundingClientRect().width.toFixed(2) };
		});
		return { crests, eyebrows };
	};
	const out = [];
	for (const [el, fx] of list) {
		for (const pm of ['dark', 'light', 'print', 'realprint']) {
			const { ctx, page } = await pluginPage(browser, el, fx, pm, 1);
			const rec = { el, fx, mode: pm, cols: {}, hash: {} };
			for (const [col, css] of Object.entries(COLS)) {
				if ((pm === 'dark' || pm === 'light') && col === 'CONTROL') continue;
				const h = await addCss(page, css);
				if (col === 'I1' || col === 'UNION') await page.evaluate(() => document.fonts.ready);
				await page.waitForTimeout(30);
				rec.cols[col] = await page.evaluate(inv);
				if (pm === 'print' || pm === 'realprint') {
					const buf = await page.screenshot({ fullPage: true, animations: 'disabled' });
					rec.hash[col] = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
				}
				await rmCss(h);
			}
			out.push(rec);
			await ctx.close();
		}
		console.log('swept', el, fx, Math.round((Date.now() - t0) / 1000) + 's');
	}
	fs.writeFileSync(path.join(DATA, `sc563-r1-sweep-${from}-${to}.json`), JSON.stringify({ capturedAt: new Date().toISOString(), combosTotal: all.length, from, to, rows: out }) + '\n');
}
await browser.close();
console.log('done', mode, Math.round((Date.now() - t0) / 1000) + 's');
