#!/usr/bin/env node
// visual-harness/sc243-evidence.mjs — SC-243 evidence capture: the settings Compendium
// section's Sync/Check-for-updates row at rest, mid-sync, and mid-check, in a real
// Obsidian. Copies (and trims) settings-evidence.mjs's CDP scaffolding — see that file's
// header for the popout-window architecture (Settings is its own CDP page target; the
// MAIN target's `window.app` is the same live singleton the popout renders from, per
// Obsidian's "open in new window" contract, so `window.app` is reachable from either
// target — driven from the settings popout's OWN target here, so there is never a
// cross-window-identity question at all).
//
// The busy state is driven through the REAL service (CompendiumSyncService's public
// beginOperation/endOperation), not a network stub — SC-243's own guard is already
// jest-proven at the network layer (test/unit/data/compendiumSyncBusy.test.ts); this
// script only needs the disabled/label affordance on screen.
//
// Isolated-instance discipline (same as settings-evidence.mjs / obsidian-lifecycle.mjs):
// own Xvfb display (:160-:199, never Scott's :1), own CDP port, own user-data-dir, own
// vault. Not part of `npm run shots`/`obsidian-shots` — adds nothing to the freeze or
// parity baselines.
//
// Usage: node visual-harness/sc243-evidence.mjs --out=<dir>
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.dirname(dir);
const demoVault = path.join(repo, 'demo-vault');

const args = Object.fromEntries(
	process.argv
		.slice(2)
		.filter((a) => a.startsWith('--'))
		.map((a) => {
			const [k, v] = a.replace(/^--/, '').split('=');
			return [k, v ?? '1'];
		}),
);

const PORT = Number(process.env.DSE_CAMERA_PORT ?? 9231);
const BIN = process.env.DSE_CAMERA_BIN ?? '/usr/bin/obsidian';
const tmpRoot = process.env.DSE_CAMERA_TMP ?? '/tmp/claude-1000/dse-obsidian-camera';
const udd = path.join(tmpRoot, 'obsidian-sc243-udd');
const vaultPath = path.join(tmpRoot, 'sc243-scratch-vault');
const VAULT_ID = 'dsesc243evidence';
const outDir = args.out ?? path.join(dir, 'sc243-evidence');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (value) => JSON.stringify(value);

// —— Xvfb (copied from obsidian-lifecycle.mjs's resolveXvfb/startXvfb — never Scott's :1) ——
let liveXvfb = null;
function resolveXvfb() {
	if (process.env.XVFB_BIN && fs.existsSync(process.env.XVFB_BIN)) return process.env.XVFB_BIN;
	const onPath = spawnSync('which', ['Xvfb'], { encoding: 'utf8' });
	if (onPath.status === 0 && onPath.stdout.trim()) return onPath.stdout.trim();
	const devboxBin = path.join(repo, '.devbox', 'nix', 'profile', 'default', 'bin', 'Xvfb');
	if (fs.existsSync(devboxBin)) return devboxBin;
	return null;
}
async function startXvfb() {
	const bin = resolveXvfb();
	if (!bin) throw new Error('Xvfb not found (set XVFB_BIN or run `devbox install`)');
	let num = -1;
	for (let n = 160; n < 200; n++) {
		if (!fs.existsSync(`/tmp/.X11-unix/X${n}`) && !fs.existsSync(`/tmp/.X${n}-lock`)) {
			num = n;
			break;
		}
	}
	if (num < 0) throw new Error('no free X display in :160-:199');
	const child = spawn(bin, [`:${num}`, '-screen', '0', '1440x1100x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
	child.on('error', () => {});
	liveXvfb = child;
	for (let i = 0; i < 40; i++) {
		if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) return { child, display: `:${num}` };
		await sleep(250);
	}
	throw new Error(`Xvfb did not start on :${num}`);
}

// —— CDP scaffolding (copied from settings-evidence.mjs) ——
class Cdp {
	constructor(ws) {
		this.ws = ws;
		this.nextId = 0;
		this.pending = new Map();
		ws.onmessage = (e) => {
			const msg = JSON.parse(e.data);
			const p = this.pending.get(msg.id);
			if (!p) return;
			this.pending.delete(msg.id);
			if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`));
			else p.resolve(msg.result);
		};
		ws.onclose = () => {
			for (const p of this.pending.values()) p.reject(new Error(`${p.method}: CDP socket closed`));
			this.pending.clear();
		};
	}
	static async connect(url) {
		const WS = globalThis.WebSocket ?? (await import('ws')).default;
		const ws = new WS(url);
		await new Promise((resolve, reject) => {
			ws.onopen = resolve;
			ws.onerror = () => reject(new Error(`WebSocket connect failed: ${url}`));
		});
		return new Cdp(ws);
	}
	call(method, params = {}) {
		const id = ++this.nextId;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject, method });
			this.ws.send(JSON.stringify({ id, method, params }));
		});
	}
	close() {
		try { this.ws.close(); } catch { /* ignore */ }
	}
}

async function evaluate(cdp, expr) {
	const res = await cdp.call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
	if (res.exceptionDetails) {
		const d = res.exceptionDetails;
		throw new Error(`evaluate threw: ${d.exception?.description ?? d.text}`);
	}
	return res.result?.value;
}

async function waitFor(cdp, expr, { timeout = 30000, poll = 250, what = expr } = {}) {
	const t0 = Date.now();
	for (;;) {
		if (await evaluate(cdp, expr)) return;
		if (Date.now() - t0 > timeout) throw new Error(`timed out waiting for: ${what}`);
		await sleep(poll);
	}
}

async function jsonList() {
	try {
		return await (await fetch(`http://localhost:${PORT}/json/list`)).json();
	} catch {
		return null;
	}
}

/** Copied from obsidian-lifecycle.mjs's own seeding: a SCRATCH vault (demo-vault minus
 *  its `.obsidian/plugins` symlink and stale `workspace.json`) with the freshly built
 *  main.js/styles.css/manifest.json copied in directly, plus the newest self-updated
 *  asar from Scott's real `~/.config/obsidian` copied straight into this isolated UDD —
 *  skipping settings-evidence.mjs's online warm-up launch entirely (unreliable/slow in
 *  a sandboxed agent environment with no guaranteed outbound network). */
function seedVaultAndUdd() {
	const cfg = path.join(os.homedir(), '.config', 'obsidian');
	const asars = fs.existsSync(cfg) ? fs.readdirSync(cfg).filter((f) => /^obsidian-.*\.asar$/.test(f)).sort() : [];
	if (!asars.length) throw new Error('no obsidian-*.asar in ~/.config/obsidian — open Obsidian once so it self-updates');
	const asar = asars.at(-1);

	fs.rmSync(vaultPath, { recursive: true, force: true });
	fs.mkdirSync(vaultPath, { recursive: true });
	spawnSync('bash', ['-c',
		`cd ${JSON.stringify(demoVault)} && tar --exclude=./.obsidian/plugins --exclude=./.obsidian/workspace.json -cf - . | tar -xf - -C ${JSON.stringify(vaultPath)}`,
	], { stdio: 'inherit' });
	const pdir = path.join(vaultPath, '.obsidian', 'plugins', 'draw-steel-elements');
	fs.mkdirSync(pdir, { recursive: true });
	for (const f of ['main.js', 'styles.css', 'manifest.json']) fs.copyFileSync(path.join(repo, f), path.join(pdir, f));
	fs.writeFileSync(path.join(vaultPath, '.obsidian', 'community-plugins.json'), JSON.stringify(['draw-steel-elements']));

	fs.mkdirSync(udd, { recursive: true });
	fs.writeFileSync(
		path.join(udd, 'obsidian.json'),
		JSON.stringify({ vaults: { [VAULT_ID]: { path: vaultPath, ts: Date.now(), open: true } } }),
	);
	fs.writeFileSync(
		path.join(udd, `${VAULT_ID}.json`),
		JSON.stringify({ x: 0, y: 0, width: 1440, height: 1100, isMaximized: false, devTools: false, zoom: 0 }),
	);
	fs.copyFileSync(path.join(cfg, asar), path.join(udd, asar));
}

function spawnObsidian(display) {
	const child = spawn(
		BIN,
		[`--user-data-dir=${udd}`, `--remote-debugging-port=${PORT}`, '--window-size=1440,1100'],
		{ env: { ...process.env, DISPLAY: display }, stdio: 'ignore' },
	);
	child.exited = new Promise((r) => child.once('exit', r));
	child.alive = true;
	child.exited.then(() => (child.alive = false));
	return child;
}

async function killChild(child) {
	if (!child?.alive) return;
	child.kill('SIGTERM');
	await Promise.race([child.exited, sleep(5000)]);
	if (child.alive) child.kill('SIGKILL');
}

// —— expressions evaluated inside the settings popout (window.app is the same live
//    singleton the main window has — Obsidian's popout windows share it by design) ——

const OPEN_COMPENDIUM_PAGE = `(() => {
	const entry = [...document.querySelectorAll('.setting-item')]
		.find((el) => {
			const n = el.querySelector('.setting-item-name');
			return n && n.textContent.trim() === 'Compendium';
		});
	if (!entry) throw new Error('no Compendium page entry found');
	const target = entry.querySelector('.setting-item-control button, [role="button"]') || entry;
	target.click();
	return true;
})()`;

/** The Sync compendium row + the status line immediately above it, as a clip rect. */
const CROP_RECT = `(() => {
	const rows = [...document.querySelectorAll('.setting-item')];
	const syncRow = rows.find((el) => {
		const n = el.querySelector('.setting-item-name');
		return n && n.textContent.trim() === 'Sync compendium';
	});
	if (!syncRow) throw new Error('no Sync compendium row found');
	const statusRow = syncRow.previousElementSibling ?? syncRow;
	const top = statusRow.getBoundingClientRect();
	const bottom = syncRow.getBoundingClientRect();
	const pad = 14;
	const x = Math.max(0, Math.min(top.x, bottom.x) - pad);
	const y = Math.max(0, top.y - pad);
	const width = Math.max(top.width, bottom.width) + pad * 2;
	const height = (bottom.y + bottom.height) - top.y + pad * 2;
	return { x, y, width, height };
})()`;

const BUTTON_STATE = `(() => {
	const rows = [...document.querySelectorAll('.setting-item')];
	const syncRow = rows.find((el) => {
		const n = el.querySelector('.setting-item-name');
		return n && n.textContent.trim() === 'Sync compendium';
	});
	const buttons = [...syncRow.querySelectorAll('button')];
	return buttons.map((b) => ({ text: b.textContent.trim(), disabled: b.disabled }));
})()`;

const beginBusy = (kind) => `(() => {
	const plugin = window.app.plugins.plugins['draw-steel-elements'];
	window.__sc243Token = plugin.syncService.beginOperation(${q(kind)});
	return !!window.__sc243Token;
})()`;
const endBusy = `(() => {
	const plugin = window.app.plugins.plugins['draw-steel-elements'];
	if (window.__sc243Token) plugin.syncService.endOperation(window.__sc243Token);
	window.__sc243Token = null;
	return true;
})()`;

async function shootClip(scdp, file, label) {
	await evaluate(scdp, `document.querySelectorAll('.notice, .modal-container').forEach((n) => n.remove())`);
	const rect = await evaluate(scdp, CROP_RECT);
	const res = await scdp.call('Page.captureScreenshot', {
		format: 'png',
		clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 },
	});
	fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
	const bytes = fs.statSync(file).size;
	console.log(`  ok ${path.basename(file)} — ${label} (${bytes} bytes)`);
}

async function main() {
	fs.mkdirSync(outDir, { recursive: true });
	if (await jsonList()) throw new Error(`port ${PORT} already serving CDP — aborting`);
	const xvfb = await startXvfb();
	seedVaultAndUdd();
	const child = spawnObsidian(xvfb.display);
	let cdp;
	let scdp;
	try {
		let target = null;
		const t0 = Date.now();
		while (!target) {
			if (Date.now() - t0 > 60000) throw new Error('no obsidian page target within 60s');
			target = ((await jsonList()) ?? []).find((t) => t.type === 'page' && t.url?.startsWith('app://obsidian.md'));
			if (!target) await sleep(300);
		}
		cdp = await Cdp.connect(target.webSocketDebuggerUrl);
		await waitFor(cdp, `!!window.app?.plugins`, { what: 'window.app.plugins to exist' });
		// A fresh isolated UDD starts in restricted mode (copied from obsidian-camera.mjs's
		// step 2b) — community plugins are individually "enabled" in community-plugins.json
		// but never actually instantiated until restricted mode itself is turned off.
		let loaded = await evaluate(cdp, `!!window.app?.plugins?.plugins?.['draw-steel-elements']`);
		if (!loaded) {
			await evaluate(cdp, `(async () => {
				await window.app.plugins.setEnable(true);
				await window.app.plugins.enablePluginAndSave('draw-steel-elements');
			})()`);
			await evaluate(cdp, `document.querySelectorAll('.modal-container .modal-close-button').forEach((b) => b.click())`);
		}
		await waitFor(cdp, `!!window.app?.plugins?.plugins?.['draw-steel-elements']`, {
			timeout: 30000,
			what: 'the DSE plugin to finish loading',
		});
		await evaluate(cdp, `window.app.plugins.plugins['draw-steel-elements'].frameworkV2.services.theme.setActive('steel')`);

		for (const [themeName, suffix] of [['obsidian', '-dark'], ['moonstone', '-light']]) {
			await evaluate(cdp, `window.app.changeTheme(${q(themeName)})`);
			await evaluate(cdp, `(() => { window.app.setting.open(); window.app.setting.openTabById('draw-steel-elements'); })()`);

			let settingsTarget = null;
			const t1 = Date.now();
			while (!settingsTarget) {
				if (Date.now() - t1 > 20000) throw new Error('no Settings popout target within 20s');
				settingsTarget = ((await jsonList()) ?? []).find(
					(t) => t.type === 'page' && /^Settings /.test(t.title ?? ''),
				);
				if (!settingsTarget) await sleep(250);
			}
			scdp = await Cdp.connect(settingsTarget.webSocketDebuggerUrl);
			await waitFor(scdp, `!!document.querySelector('.setting-item')`, { what: 'settings content' });
			await scdp.call('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
			await sleep(700);

			await evaluate(scdp, OPEN_COMPENDIUM_PAGE);
			await sleep(600);
			await waitFor(scdp, `[...document.querySelectorAll('.setting-item')].some((el) => {
				const n = el.querySelector('.setting-item-name');
				return n && n.textContent.trim() === 'Sync compendium';
			})`, { what: 'the Sync compendium row to mount' });

			// (a) at rest
			console.log(`\n${themeName}${suffix}:`);
			await shootClip(scdp, path.join(outDir, `sc243-compendium-rest${suffix}.png`), 'at rest');
			console.log('  buttons:', JSON.stringify(await evaluate(scdp, BUTTON_STATE)));

			// (b) mid-sync — drive the busy state through the REAL service.
			await evaluate(cdp, beginBusy('sync'));
			await sleep(200);
			await shootClip(scdp, path.join(outDir, `sc243-compendium-mid-sync${suffix}.png`), 'mid-sync');
			console.log('  buttons:', JSON.stringify(await evaluate(scdp, BUTTON_STATE)));
			await evaluate(cdp, endBusy);

			// (c) mid-check
			await evaluate(cdp, beginBusy('check'));
			await sleep(200);
			await shootClip(scdp, path.join(outDir, `sc243-compendium-mid-check${suffix}.png`), 'mid-check');
			console.log('  buttons:', JSON.stringify(await evaluate(scdp, BUTTON_STATE)));
			await evaluate(cdp, endBusy);

			await scdp.call('Emulation.clearDeviceMetricsOverride').catch(() => {});
			scdp.close();
			await evaluate(cdp, 'window.app.setting.close()').catch(() => {});
			await sleep(400);
		}
	} finally {
		scdp?.close();
		cdp?.close();
		await killChild(child);
		if (liveXvfb) { try { liveXvfb.kill('SIGTERM'); } catch { /* ignore */ } }
	}
	console.log(`\ndone → ${outDir}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
