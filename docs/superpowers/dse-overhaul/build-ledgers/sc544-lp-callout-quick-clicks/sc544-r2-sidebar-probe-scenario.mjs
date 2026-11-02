	{
		id: 'SB544',
		async run(t) {
			const OUT = process.env.SB_OUT;
			const WANT = (process.env.SB_CASES ?? '').split(',').filter(Boolean);
			const J = JSON.stringify;
			const res = { cases: {} };
			const save = () => fs.writeFileSync(OUT + '/sb544.json', JSON.stringify(res, null, 1));
			const rels = { rv: 'Probe544/sb4p.md', lp: 'Probe544/sb4c.md', dist: 'Probe544/sb4d.md' };
			const NL = `(app.workspace.getLeavesOfType('markdown')[0] ?? app.workspace.getMostRecentLeaf())`;
			// The note's cards BY BLOCK (a callout the cursor is in is raw, so the DOM order of drawn cards is not the block order).
			await t.ev(`window.__sbCards = (mode) => {
				const leaf = app.workspace.getLeavesOfType('markdown')[0] ?? app.workspace.getMostRecentLeaf();
				const out = [null, null, null, null];
				if (mode === 'rv') {
					Array.from(leaf.view.containerEl.querySelector('.markdown-reading-view').querySelectorAll('[data-dse-element="counter"]')).filter((r) => r.isConnected).forEach((r, i) => { out[i] = r; });
					return out;
				}
				const cm = leaf.view.editor.cm;
				const fences = cm.state.doc.toString().split('\\n').map((l, i) => (/^>\\s*\`\`\`ds-counter/.test(l) ? i : -1)).filter((i) => i >= 0);
				for (const r of Array.from(cm.dom.querySelectorAll('.cm-embed-block [data-dse-element="counter"]')).filter((x) => x.isConnected)) {
					const line = cm.state.doc.lineAt(cm.posAtDOM(r.closest('.cm-embed-block'))).number - 1;
					const b = fences.findIndex((f) => f >= line);
					if (b >= 0 && !out[b]) out[b] = r;
				}
				return out;
			}`);
			const noteBtn = (mode, k) => `(window.__sbCards(${J(mode)})[${k}])?.querySelector('button[aria-label^="Increase"]')`;
			const sbRoot = `Array.from((app.workspace.getLeavesOfType('dse-sidebar')[0]?.view.containerEl ?? document.createElement('div')).querySelectorAll('[data-dse-element="counter"]')).find((x) => x.isConnected)`;
			const sbBtn = `(${sbRoot})?.querySelector('button[aria-label^="Increase"]')`;
			const quickClick = async (elExpr) => {
				const at = await t.ev(`(() => { const el = ${elExpr}; if (!el) return null; const r = el.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return null; return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
				if (!at) return false;
				const base = { x: at.x, y: at.y, button: 'left', clickCount: 1 };
				res.lastAt = { at, hit: await t.ev(`(() => { let e = document.elementFromPoint(${at.x}, ${at.y}); const chain = []; while (e && chain.length < 8) { chain.push(e.tagName + '.' + e.className.toString().slice(0, 40)); e = e.parentElement; } return chain.join(' < '); })()`), win: await t.ev('[innerWidth, innerHeight]') };
				await t.cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
				await t.cdp.call('Input.dispatchMouseEvent', { type: 'mousePressed', buttons: 1, ...base });
				await t.cdp.call('Input.dispatchMouseEvent', { type: 'mouseReleased', buttons: 0, ...base });
				return true;
			};
			await t.ev(`(() => { if (!document.getElementById('sb544-notice')) { const st = document.createElement('style'); st.id = 'sb544-notice'; st.textContent = '.notice-container { display: none !important; }'; document.head.appendChild(st); } return true; })()`);
			const CASES = {};
			// seq: ['N', k] = the note's card k; ['S'] = the sidebar card (the pinned block pk). `gap` ms between the clicks.
			const mk = (mode, pk, seq, gap = 120) => ({ mode, pk, seq, gap });
			for (const mode of ['rv', 'lp']) {
				CASES[`${mode}-pk0-N1-S`] = mk(mode, 0, [['N', 1], ['S']]);
				CASES[`${mode}-pk0-S-N2`] = mk(mode, 0, [['S'], ['N', 2]]);
				CASES[`${mode}-pk0-N1-N2-S`] = mk(mode, 0, [['N', 1], ['N', 2], ['S']]);
				CASES[`${mode}-pk1-N0-S`] = mk(mode, 1, [['N', 0], ['S']]);
				CASES[`${mode}-pk1-S-N2`] = mk(mode, 1, [['S'], ['N', 2]]);
				CASES[`${mode}-pk1-N2-S`] = mk(mode, 1, [['N', 2], ['S']]);
				CASES[`${mode}-pk3-N0-S`] = mk(mode, 3, [['N', 0], ['S']]);
				CASES[`${mode}-pk3-S-N1`] = mk(mode, 3, [['S'], ['N', 1]]);
				CASES[`${mode}-pk3-N0-N1-S`] = mk(mode, 3, [['N', 0], ['N', 1], ['S']]);
				// control with no sidebar writer: the ticket's bug on the 4-block note (pk none)
				CASES[`${mode}-nopin-N1-N2`] = mk(mode, -1, [['N', 1], ['N', 2]]);
			}
			CASES['dist-pk0-N1-S'] = mk('rv', 0, [['N', 1], ['S']]); CASES['dist-pk0-N1-S'].fix = 'dist';
			CASES['dist-pk0-S-N1'] = mk('rv', 0, [['S'], ['N', 1]]); CASES['dist-pk0-S-N1'].fix = 'dist';
			for (const g of [50, 250, 350, 500, 700]) CASES[`rv-pk0-N1-S-${g}`] = mk('rv', 0, [['N', 1], ['S']], g);
			for (const name of WANT) {
				const c = CASES[name];
				if (!c) {
					console.log(`SB544 ${name}: NO SUCH CASE`);
					continue;
				}
				const rel = rels[c.fix ?? c.mode];
				const r = { rel, ...c, problems: [] };
				res.cases[name] = r;
				const m0 = await t.mark();
				try {
					await t.ev(`(async () => { for (const l of app.workspace.getLeavesOfType('dse-sidebar')) l.detach(); const ls = app.workspace.getLeavesOfType('markdown'); ls.slice(1).forEach((l) => l.detach()); })()`);
					await t.ev(`(async () => { await (app.workspace.getLeavesOfType('markdown')[0] ?? app.workspace.getMostRecentLeaf()).setViewState({ type: 'markdown', state: { file: 'Lifecycle/other.md', mode: 'preview' }, active: true }); })()`);
					await t.sleep(500);
					await t.reset(rel);
					const st = c.mode === 'rv' ? { file: rel, mode: 'preview' } : { file: rel, mode: 'source', source: false };
					await t.ev(`(async () => { await (${NL}).setViewState({ type: 'markdown', state: ${J(st)}, active: true }); })()`);
					await t.waitFor(`(${NL}).view?.file?.path === ${J(rel)}`, `open ${rel}`);
					await t.sleep(1800);
					if (c.mode === 'lp') await t.ev(`(${NL}).view.editor.setCursor({ line: 0, ch: 0 })`);
					await t.sleep(600);
					await t.waitFor(`(window.__sbCards(${J(c.mode)})).every(Boolean)`, 'four note cards');
					if (c.pk >= 0) {
						await t.ev(`(() => { window.__lcRandom = Math.random; Math.random = () => 0xabcdef / 0x1000000; return true; })()`);
						try {
							await t.ev(`(window.__sbCards(${J(c.mode)})[${c.pk}]).querySelector('[data-dse-chrome-item="pin"]').click()`);
							const t0 = Date.now();
							while (!t.read(rel).includes('_dse_anchor:')) {
								if (Date.now() - t0 > 15000) throw new Error('no anchor stamp');
								await t.sleep(100);
							}
						} finally {
							await t.ev(`(() => { if (window.__lcRandom) Math.random = window.__lcRandom; delete window.__lcRandom; return true; })()`);
						}
						await t.waitFor(`!!(${sbRoot})`, 'sidebar panel mounted');
						await t.sleep(2500); // the panel catches up with the stamp
						if (c.mode === 'lp') await t.ev(`(${NL}).view.editor.setCursor({ line: 0, ch: 0 })`);
						await t.sleep(1000);
						await t.waitFor(`(window.__sbCards(${J(c.mode)})).every(Boolean)`, 'four note cards after the pin');
					}
					const before = t.counterValues(rel);
					r.before = before;
					await t.ev(`(() => {
						if (window.__sb?.off) window.__sb.off();
						const sb = (window.__sb = { clicks: [], mods: [], ev: [] });
						const t0 = performance.now();
						const label = (e) => (e.target.closest?.('.dse-sidebar__panel') ? 'S' : e.target.closest?.('.markdown-reading-view,.cm-editor') ? 'N' : '?') + ':' + (e.target.getAttribute?.('aria-label') ?? e.target.className?.toString?.().slice(0, 30) ?? '');
						const on = (type) => { const h = (e) => { sb.ev.push(type + '@' + Math.round(performance.now() - t0) + ' ' + label(e)); if (type === 'click' && e.target.closest?.('button[aria-label^="Increase"]')) sb.clicks.push(Math.round(performance.now() - t0)); }; document.addEventListener(type, h, true); return () => document.removeEventListener(type, h, true); };
						const offs = ['mousedown', 'mouseup', 'click'].map(on);
						const ref = app.vault.on('modify', (f) => { if (f.path === ${J(rel)}) sb.mods.push(Math.round(performance.now() - t0)); });
						sb.off = () => { offs.forEach((o) => o()); app.vault.offref(ref); };
						return true;
					})()`);
					const want = before.slice();
					const wantIdx = (s) => (s[0] === 'S' ? c.pk : s[1]);
					let first = true;
					for (const s of c.seq) {
						if (!first) await t.sleep(c.gap);
						if (!first && process.env.SB_SHOT) await t.shot(`sb544-${name}-before-click2`);
						const expr = s[0] === 'S' ? sbBtn : noteBtn(c.mode, s[1]);
						let ok;
						if (first) {
							ok = await t.ev(`!!(${expr})`);
							if (ok) await t.realClick(expr);
						} else ok = await quickClick(expr);
						if (!ok) r.problems.push(`no button for ${J(s)}`);
						else want[wantIdx(s)]++;
						first = false;
					}
					r.want = want; r.lastAt = res.lastAt;
					r.mid = t.read(rel);
					const t0 = Date.now();
					while (J(t.counterValues(rel)) !== J(want) && Date.now() - t0 < 4000) await t.sleep(80);
					await t.sleep(1800);
					if (c.mode === 'lp') await t.ev(`(${NL}).view.editor.setCursor({ line: 0, ch: 0 })`);
					await t.sleep(1000);
					r.disk = t.counterValues(rel);
					r.text = t.read(rel);
					r.cards = await t.ev(`window.__sbCards(${J(c.mode)}).map((r) => r?.querySelector('.dse-counter__value')?.value ?? null)`);
					r.sidebar = await t.ev(`(${sbRoot})?.querySelector('.dse-counter__value')?.value ?? null`);
					r.sb = await t.ev('(() => { const { clicks, mods, ev } = window.__sb; window.__sb.off(); return { clicks, mods, ev }; })()');
					r.timing = r.sb.clicks.length > 1 && r.sb.mods.length ? (r.sb.clicks[1] < r.sb.mods[0] ? 'click2-before-write1' : 'click2-after-write1') : 'n/a';
					if (J(r.disk) !== J(want)) r.problems.push(`disk ${J(r.disk)} want ${J(want)}`);
					if (r.cards.length === 4) {
						r.cards.forEach((v, i) => {
							if (String(r.disk[i]) !== String(v)) r.problems.push(`note card ${i} shows ${v}, disk ${r.disk[i]}`);
						});
					} else r.problems.push(`${r.cards.length} note cards`);
					if (c.pk >= 0 && String(r.disk[c.pk]) !== String(r.sidebar)) r.problems.push(`sidebar card shows ${r.sidebar}, disk ${r.disk[c.pk]}`);
					r.shot = process.env.SB_SHOT ? await t.shot(`sb544-${name}`) : null;
				} catch (e) {
					r.error = String(e && e.stack ? e.stack : e);
				}
				r.errors = await t.errorsSince(m0);
				r.notices = await t.noticesSince(m0);
				if (r.errors.length) r.problems.push(`page errors ${J(r.errors)}`);
				if (r.notices.length) r.problems.push(`notices ${J(r.notices)}`);
				r.verdict = r.error ? 'ERROR' : r.problems.length ? 'PROBLEMS' : 'clean';
				console.log(`SB544 ${name}: ${r.verdict} disk ${J(r.disk)} want ${J(r.want)} cards ${J(r.cards)} sidebar ${r.sidebar} timing ${r.timing}${r.problems.length ? ' :: ' + r.problems.slice(0, 6).join(' | ') : ''}${r.error ? ' :: ' + r.error.split('\n')[0] : ''}`);
				save();
			}
			await t.ev(`(async () => { for (const l of app.workspace.getLeavesOfType('dse-sidebar')) l.detach(); })()`);
			await t.open('Lifecycle/other.md');
			save();
			return 'cases ' + Object.keys(res.cases).join(',');
		},
	},
