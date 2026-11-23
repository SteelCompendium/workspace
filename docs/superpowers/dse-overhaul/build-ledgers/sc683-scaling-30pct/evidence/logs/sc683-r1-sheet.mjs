// Scratch (NOT committed): contact sheets with each Card size printed as a text label.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const PLUGIN = '/home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct/draw-steel-elements';
const require = createRequire(path.join(PLUGIN, 'package.json'));
const { chromium } = require('playwright');
const E = process.argv[2];
const sheet = async (name, items) => {
	const html = `<body style="margin:0;background:#222;color:#fff;font:700 28px sans-serif"><div style="display:flex;gap:24px;align-items:flex-start;padding:16px">${items.map(([label, f]) => `<figure style="margin:0;width:${Math.round(760 / items.length * 1.4)}px"><figcaption style="padding:6px 0">${label}</figcaption><img src="file://${path.join(E, f)}" style="width:100%"></figure>`).join('')}</div></body>`;
	const hp = path.join(E, `${name}.tmp.html`);
	fs.writeFileSync(hp, html);
	const b = await chromium.launch();
	const p = await b.newPage({ viewport: { width: 2000, height: 800 } });
	await p.goto('file://' + hp);
	await p.waitForLoadState('load');
	await p.screenshot({ path: path.join(E, name), fullPage: true });
	await b.close();
	fs.unlinkSync(hp);
};
await sheet('sc683-A-statblock-contact-sheet-100-80-50-30.png', [['Card size 100%', 'sc683-A-statblock-card-size-100.png'], ['Card size 80%', 'sc683-A-statblock-card-size-80.png'], ['Card size 50%', 'sc683-A-statblock-card-size-50.png'], ['Card size 30%', 'sc683-A-statblock-card-size-30.png']]);
await sheet('sc683-B-feature-contact-sheet-100-30.png', [['Card size 100%', 'sc683-B-feature-card-size-100.png'], ['Card size 30%', 'sc683-B-feature-card-size-30.png']]);
console.log('sheets ok');
