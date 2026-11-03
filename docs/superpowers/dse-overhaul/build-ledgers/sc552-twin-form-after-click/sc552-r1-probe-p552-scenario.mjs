	{
		// SC-552 r1 probes (scratch only, never committed).
		id: 'PR552',
		async run(t) {
			const OUT = process.env.PR_OUT;
			const WANT = (process.env.PR_CASES ?? '').split(',').filter(Boolean);
			const PAGE = fs.readFileSync(process.env.PR_PAGE, 'utf8');
			const PROTO = process.env.PR_PROTO ? fs.readFileSync(process.env.PR_PROTO, 'utf8') : null;
			const J = JSON.stringify;
			const res = { cases: {} };
			const save = () => fs.writeFileSync(OUT + '/pr552.json', JSON.stringify(res, null, 1));
			const prefs = `app.plugins.plugins['draw-steel-elements'].frameworkV2.services.prefs`;
			const { waitFormOpen, FORM, SAVE } = formKit(t);
			const FX = {
				c2: 'Lifecycle/twin-callouts.md',
				c3: 'Lifecycle/twin-callouts-3.md',
				c4: 'Lifecycle/twin-callouts-4.md',
				p2: 'Lifecycle/twin-pair.md',
				p3: 'Lifecycle/twin-triplets.md',
				p4: 'Probe552/twin-plain-4.md',
			};
			const namesOf = (text) => (text.match(/^(?:> ?)*name: (\w+)$/gm) ?? []).map((s) => s.replace(/^(?:> ?)*name: /, ''));
			const valuesOf = (text) => (text.match(/current_value: (\d+)/g) ?? []).map((s) => Number(s.split(': ')[1]));
			await t.ev(`(() => { if (!document.getElementById('pr-notice')) { const st = document.createElement('style'); st.id = 'pr-notice'; st.textContent = '.notice-container { display: none !important; }'; document.head.appendChild(st); } return true; })()`);
			await t.ev(PAGE);
			if (PROTO) await t.ev(PROTO);
			const A = 'window.__pr.A';
			const B = 'window.__pr.B';
			const leafOf = (k) => (k === 'B' ? B : A);
			async function park() {
				for (const L of [A, B]) if (await t.ev(`!!(${L}) && !!(${L}).view && (${L}).view.getMode?.() === 'source'`)) await t.ev(`(${L}).view.editor.setCursor({ line: 0, ch: 0 })`);
				await t.sleep(1000);
			}
			const blocksOf = (rel) => (FIXTURES[rel].match(/```ds-counter/g) ?? []).length;
			const stOf = (rel, mode) => (mode === 'rv' ? { file: rel, mode: 'preview' } : { file: rel, mode: 'source', source: false });
			const openA = async (rel, mode) => {
				await t.ev(`(() => { app.workspace.getLeavesOfType('markdown').slice(1).forEach((l) => l.detach()); window.__pr.A = app.workspace.getLeavesOfType('markdown')[0] ?? app.workspace.getMostRecentLeaf(); window.__pr.B = null; return true; })()`);
				await t.ev(`(async () => { await (${A}).setViewState({ type: 'markdown', state: { file: 'Lifecycle/other.md', mode: 'preview' }, active: true }); })()`);
				await t.sleep(400);
				await t.reset(rel);
				await t.ev(`(async () => { await (${A}).setViewState({ type: 'markdown', state: ${J(stOf(rel, mode))}, active: true }); })()`);
				await t.waitFor(`(${A}).view?.file?.path === ${J(rel)}`, `${rel}: opened`);
				await park();
			};
			const openB = async (rel, mode) => {
				await t.ev(`(async () => { const leaf = app.workspace.getLeaf('split', 'vertical'); window.__pr.B = leaf; await leaf.setViewState({ type: 'markdown', state: ${J(stOf(rel, mode))}, active: true }); })()`);
				await t.waitFor(`(${B}).view?.file?.path === ${J(rel)}`, `${rel}: pane B opened`);
				await park();
			};
			const btn = (leaf, block) => `(window.__pr.root(${leaf}, ${block})?.querySelector('button[aria-label^="Increase"]'))`;
			const pencilOf = (leaf, block) => `(window.__pr.root(${leaf}, ${block})?.querySelector('.dse-chrome button[data-dse-chrome-item="edit"], button[aria-label^="Edit "]'))`;
			/** Press Enter on block `block`'s pencil in `leaf` (the LP pencil cannot be clicked by mouse, SC-523). Records the entry first. */
			const openForm = async (label, leaf, block) => {
				const pencil = pencilOf(leaf, block);
				await t.waitFor(`!!${pencil}`, `${label}: the Edit pencil is drawn`);
				await t.ev(`(() => { const root = window.__pr.root(${leaf}, ${block}); window.__pr.formEntry = window.__pr.entryOfRoot(root); window.__pr.formLeaf = ${leaf}; window.__pr.wheres.push({ label: 'pencil', ...window.__pr.where(${leaf}) }); ${pencil}.focus({ focusVisible: true }); return true; })()`);
				await t.cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
				await t.cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
			};
			const where = (label) => t.ev(`(() => { const w = Object.assign({ label: ${J(label)} }, window.__pr.where(window.__pr.formLeaf)); window.__pr.wheres.push(w); return w; })()`);
			const formRename = async (label, from, to) => {
				t.expect(await t.ev(`(() => { const ta = ${FORM}.querySelector('textarea.dse-form__raw'); if (!ta) return false; ta.value = ta.value.replace('name: ${from}', 'name: ${to}'); ta.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`), `${label}: the form has no raw box`);
				await t.waitFor(`!!(${SAVE}) && !(${SAVE}).disabled`, `${label}: Save is enabled`);
			};
			const formRaw = () => t.ev(`(${FORM})?.querySelector('textarea.dse-form__raw')?.value ?? null`);
			const clickSave = async (label) => {
				await t.ev(`(() => { window.__pr.saving = true; window.__pr.log.push({ k: 'save', t: window.__pr.now() }); (${SAVE}).click(); return true; })()`);
				await t.waitFor(`!document.querySelector('.modal-container .dse-modal')`, `${label}: the form closed`, 6000);
				await t.ev(`window.__pr.saving = false`);
			};
			/** Wait until no view is pending and no write came for `quiet` ms (max 6 s). */
			const quiesce = async (quiet = 1200) => {
				const t0 = Date.now();
				let lastN = -1;
				let lastChange = Date.now();
				for (;;) {
					const n = await t.ev('window.__pr.mods.length');
					const p = await t.ev('window.__pr.pending()');
					if (n !== lastN) { lastN = n; lastChange = Date.now(); }
					if (p <= 0 && Date.now() - lastChange >= quiet) break;
					if (Date.now() - t0 > 6000) break;
					await t.sleep(80);
				}
				await park();
			};
			const waitMods = async (rel, n, ms) => {
				const t0 = Date.now();
				while ((await t.ev(`window.__pr.mods.filter((m) => m.path === ${J(rel)}).length`)) < n) {
					if (Date.now() - t0 > ms) return false;
					await t.sleep(30);
				}
				return true;
			};
			const outsideEdit = async (rel, block, how) => {
				// value of block `block` 5 -> 7, either in-app (vault.process) or on disk (the watcher path, like Sync)
				const ed = (c, block) => { const ls = c.split('\n'); let k = -1; let seen = -1; ls.forEach((l, i) => { if (/current_value: \d+$/.test(l)) { seen++; if (seen === block) k = i; } }); ls[k] = ls[k].replace(/current_value: \d+/, 'current_value: 7'); return ls.join('\n'); };
				if (how === 'disk') {
					const p = path.join(vault, rel);
					await t.ev(`window.__pr.log.push({ k: 'ext-disk', t: window.__pr.now() })`);
					fs.writeFileSync(p, ed(fs.readFileSync(p, 'utf8'), block));
				} else {
					await t.ev(`(async () => { window.__pr.log.push({ k: 'ext', t: window.__pr.now() }); const ed = ${ed.toString()}; await app.vault.process(app.vault.getAbstractFileByPath(${J(rel)}), (c) => ed(c, ${block})); })()`);
				}
			};

			// Case grammar:
			//   F-<fx>-<mode>-p<plus>-f<form>-g<gap>[-B<modeB>][-x<rep>]   + on block <plus> (pane A), <gap> ms later Enter on block <form>'s
			//      pencil (pane B when -B is given), wait for the + write + 800 ms, rename Twin -> Edited, Save.  gap 'n' = no + click.
			//   X-<fx>-<mode>-p<plus>-g<gap>-e<block>-<inapp|disk>[-x<rep>]  + on <plus>, <gap> ms later an outside edit (value 7) of block <block> (SC-549).
			//   R-<fx>-<mode>-f<form>-e<block>-<inapp|disk>[-x<rep>]  form open on <form>, then an outside edit of <block>, wait, rename, Save (the residual).
			const parse = (name) => {
				const parts = name.split('-');
				const c = { kind: parts[0], fx: parts[1], mode: parts[2], rel: FX[parts[1]] };
				for (const p of parts.slice(3)) {
					if (p[0] === 'p') c.plus = Number(p.slice(1));
					else if (p[0] === 'f') c.form = Number(p.slice(1));
					else if (p[0] === 'g') c.gap = p.slice(1) === 'n' ? null : Number(p.slice(1));
					else if (p[0] === 'B') c.paneB = p.slice(1);
					else if (p[0] === 'e') c.edit = Number(p.slice(1));
					else if (p === 'inapp' || p === 'disk') c.how = p;
				}
				return c;
			};

			for (const name of WANT) {
				const c = parse(name);
				if (!c.rel) { console.log(`PR552 ${name}: NO SUCH FIXTURE`); continue; }
				const n = blocksOf(c.rel);
				const r = { name, ...c, problems: [], wheres: [] };
				res.cases[name] = r;
				const m0 = await t.mark();
				try {
					await t.ev(`${prefs}.set('authoringControls', true)`);
					await openA(c.rel, c.mode);
					if (c.paneB) await openB(c.rel, c.paneB);
					for (const L of c.paneB ? [A, B] : [A]) {
						for (let b = 0; b < n; b++) {
							await t.ev(`(() => { const L = ${L}; if (L.view.getMode() !== 'source') return true; const cm = L.view.editor.cm; const fl = []; cm.state.doc.toString().split('\\n').forEach((l, i) => { if (/^(?:[ ]{0,3}>[ ]?)*\`\`\`ds-counter\\s*$/.test(l)) fl.push(i); }); const pos = cm.state.doc.line(fl[${b}] + 1).from; L.view.editor.scrollIntoView({ from: L.view.editor.offsetToPos(pos), to: L.view.editor.offsetToPos(pos) }, true); return true; })()`);
							await t.sleep(120);
						}
					}
					await t.ev(`(() => { for (const L of [${A}, ${B}]) { if (L && L.view.getMode() === 'source') L.view.editor.scrollIntoView({ from: { line: 0, ch: 0 }, to: { line: 0, ch: 0 } }); } return true; })()`);
					await t.sleep(300);
					await t.waitFor(`window.__pr.cards(${A}).length === ${n}`, `${c.rel}: every card is drawn in pane A`);
					if (c.paneB) await t.waitFor(`window.__pr.cards(${B}).length === ${n}`, `pane B: every card is drawn`);
					await t.ev('window.__pr.install()');
					await t.ev('window.__pr.reset()');
					const formLeaf = c.paneB ? B : A;
					if (c.kind === 'F') {
						if (c.gap !== null) {
							await t.realClick(btn(A, c.plus));
							await t.sleep(c.gap);
						}
						await openForm(name, formLeaf, c.form);
						try { await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000); } catch { r.problems.push('form never opened'); }
						if (c.gap !== null) r.wroteBeforeSave = await waitMods(c.rel, 1, 3000);
						await t.sleep(800);
						r.wheres.push(await where('settled'));
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						if (!r.formOpenAtSettle) r.problems.push('form closed by itself before Save');
						else {
							r.formRaw = await formRaw();
							await formRename(name, 'Twin', 'Edited');
							r.wheres.push(await where('save'));
							await clickSave(name);
						}
					} else if (c.kind === 'X') {
						await t.realClick(btn(A, c.plus));
						await t.sleep(c.gap);
						await outsideEdit(c.rel, c.edit, c.how);
					} else if (c.kind === 'T') {
						// SC-549's typing variant (LP only): + on <plus>, <gap> ms later type 'Z' at the end of callout <edit>'s header line in the editor
						await t.realClick(btn(A, c.plus));
						await t.sleep(c.gap);
						await t.ev(`(() => { window.__pr.log.push({ k: 'type', t: window.__pr.now() }); const ed = (${A}).view.editor; const ls = ed.getValue().split('\\n'); let seen = -1; let k = -1; ls.forEach((l, i) => { if (/^> \\[!note\\] Camp/.test(l)) { seen++; if (seen === ${c.edit}) k = i; } }); ed.replaceRange('Z', { line: k, ch: ls[k].length }); return k; })()`);
						await t.sleep(2500);
						await t.ev(`(async () => { await (${A}).view.save(); })()`);
					} else if (c.kind === 'C') {
						// SC-544 r5 script-only case: the middle's form open and renamed, then script + on the middle and the upper, then Save
						await openForm(name, formLeaf, 1);
						await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000);
						await t.sleep(500);
						await formRename(name, 'Twin', 'Edited');
						await t.ev(`(() => { ${btn(A, 1)}.click(); return true; })()`);
						await t.sleep(30);
						await t.ev(`(() => { ${btn(A, 0)}.click(); return true; })()`);
						await t.sleep(120);
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						if (!r.formOpenAtSettle) r.problems.push('form closed by itself before Save');
						else await clickSave(name);
					} else if (c.kind === 'D') {
						// the form open on <form>; an in-app outside edit DELETES block <edit> (its fence lines); then rename + Save
						await openForm(name, formLeaf, c.form);
						await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000);
						await t.sleep(300);
						await t.ev(`(async () => { window.__pr.log.push({ k: 'ext-del', t: window.__pr.now() }); await app.vault.process(app.vault.getAbstractFileByPath(${J(c.rel)}), (c) => { const ls = c.split('\\n'); const opens = []; ls.forEach((l, i) => { if (/^(?:> ?)*\`\`\`ds-counter/.test(l)) opens.push(i); }); const o = opens[${c.edit}]; let e = o + 1; while (!/^(?:> ?)*\`\`\`\\s*$/.test(ls[e])) e++; ls.splice(o, e - o + 1, ...(ls[o].startsWith('>') ? ['> gone'] : ['gone'])); return ls.join('\\n'); }); })()`);
						await waitMods(c.rel, 1, 3000);
						await t.sleep(900);
						r.wheres.push(await where('settled'));
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						if (!r.formOpenAtSettle) r.problems.push('form closed by itself before Save');
						else {
							await formRename(name, 'Twin', 'Edited');
							await t.ev(`(() => { window.__pr.log.push({ k: 'save', t: window.__pr.now() }); (${SAVE}).click(); return true; })()`);
							await t.sleep(1500);
							r.formOpenAfterSave = await t.ev('window.__pr.formOpen()');
						}
					} else if (c.kind === 'R') {
						await openForm(name, formLeaf, c.form);
						await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000);
						await t.sleep(300);
						await outsideEdit(c.rel, c.edit, c.how);
						await waitMods(c.rel, 1, 3000);
						await t.sleep(900);
						r.wheres.push(await where('settled'));
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						if (!r.formOpenAtSettle) r.problems.push('form closed by itself before Save');
						else {
							await formRename(name, 'Twin', 'Edited');
							await clickSave(name);
						}
					}
					await quiesce();
					if (process.env.PR_SHOT) {
						await t.ev(`(() => { const L = ${A}; if (L.view.getMode() === 'source') L.view.editor.scrollIntoView({ from: { line: 0, ch: 0 }, to: { line: 0, ch: 0 } }); else L.view.previewMode.applyScroll(0); return true; })()`);
						await t.sleep(600);
						r.shot = await t.shot(`${process.env.PR_SHOT}-${name}`);
					}
					const text = t.read(c.rel);
					r.disk = valuesOf(text);
					r.names = namesOf(text);
					r.text = text;
					r.log = await t.ev('window.__pr.log');
					r.clicks = await t.ev('window.__pr.clicks');
					r.keys = await t.ev('window.__pr.keys');
					r.mods = await t.ev('window.__pr.mods');
					r.wheres = await t.ev('window.__pr.wheres');
					r.writes = r.mods.filter((m) => m.path === c.rel).length;
					r.cardsA = await t.ev(`window.__pr.cards(${A})`).catch(() => null);
					if (c.paneB) r.cardsB = await t.ev(`window.__pr.cards(${B})`).catch(() => null);
					// expected
					const want = Array.from({ length: n }, () => 5);
					const wantNames = Array.from({ length: n }, () => 'Twin');
					if (c.kind === 'F' || c.kind === 'X' || c.kind === 'T') if (c.gap !== null) want[c.plus] = 6;
					if (c.kind === 'X' || c.kind === 'R') want[c.edit] = c.kind === 'X' && c.edit === c.plus ? 7 : 7;
					if (c.kind === 'F' || c.kind === 'R') wantNames[c.form] = 'Edited';
					if (c.kind === 'C') { want[0] = 6; want[1] = 6; wantNames[1] = 'Edited'; }
					r.want = want;
					r.wantNames = wantNames;
					if (J(r.disk) !== J(want)) r.problems.push(`disk ${J(r.disk)} want ${J(want)}`);
					if (J(r.names) !== J(wantNames)) r.problems.push(`names ${J(r.names)} want ${J(wantNames)}`);
					for (const w of ['TOP', 'BOTTOM']) if (!text.includes('\n' + w + '\n')) r.problems.push(`lost ${w}`);
					for (const [nm, cards] of [['A', r.cardsA], ['B', r.cardsB]]) {
						if (!cards) continue;
						for (const cd of cards) if (cd.block >= 0 && (cd.value !== r.disk[cd.block] || cd.name !== r.names[cd.block])) r.problems.push(`card ${nm}${cd.block} shows ${cd.name}=${cd.value}, disk ${r.names[cd.block]}=${r.disk[cd.block]}`);
						if (cards.length !== r.disk.length) r.problems.push(`pane ${nm} draws ${cards.length} cards for ${r.disk.length} blocks`);
					}
					const click = r.clicks[0]?.t;
					const key = r.keys[0]?.t;
					const mod = r.mods.find((m) => m.path === c.rel)?.t;
					r.gapMs = click !== undefined && key !== undefined ? Math.round(key - click) : null;
					r.writeMs = click !== undefined && mod !== undefined ? Math.round(mod - click) : null;
					r.pencilBeforeWrite = key !== undefined && mod !== undefined ? key < mod : null;
					r.formEvents = r.log.filter((x) => x.k === 'form-open' || x.k === 'form-close' || x.k === 'oapw').map((x) => `${x.k}${x.k === 'oapw' ? (x.pending ? '(pending)' : '(none)') : ''}${x.saving ? '(saving)' : ''}@${click !== undefined ? Math.round(x.t - click) : x.t}`);
					r.rsSeq = r.log.filter((x) => ['rs', 'rs-done', 'vp', 'ext', 'ext-disk', 'save'].includes(x.k)).map((x) => x.k === 'rs' ? `rs(${x.fromView ? 'view' : x.formHost ? 'FORM' : 'form?'},v${x.value},${x.name},kL${x.knownLine})` : x.k === 'rs-done' ? `done(${x.ok},${x.formHost ? 'FORM' : ''}L${x.line})` : x.k === 'vp' ? `vp${x.id}` : x.k).join(' ');
				} catch (e) {
					r.error = String(e && e.stack ? e.stack : e);
				} finally {
					try {
						for (let i = 0; i < 6 && (await t.ev(`!!document.querySelector('.modal-container .dse-modal')`)); i++) {
							r.leftOpen = (r.leftOpen ?? 0) + 1;
							await t.ev(`(() => { const m = document.querySelector('.modal-container .dse-modal'); const c = Array.from(m.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Cancel' || b.textContent.trim() === 'Cancel'); if (c) c.click(); else m.closest('.modal-container')?.querySelector('.modal-close-button')?.click(); return true; })()`);
							await t.sleep(250);
							if (await t.ev(`!!document.querySelector('.modal-container .dse-modal')`)) await t.key('Escape', 'Escape', 27);
							await t.sleep(250);
						}
						await t.ev(`${prefs}.set('authoringControls', false)`);
					} catch (e2) { r.cleanupError = String(e2); }
				}
				r.errors = await t.errorsSince(m0);
				r.notices = await t.noticesSince(m0);
				if (r.errors.length) r.problems.push(`page errors ${J(r.errors)}`);
				if (r.notices.length) r.problems.push(`notices ${J(r.notices)}`);
				r.verdict = r.error ? 'ERROR' : r.problems.length ? 'PROBLEMS' : 'clean';
				const wh = (r.wheres ?? []).map((w) => `${w.label}:b${w.block}${w.connected ? '' : '/detached'}${w.released ? '/released' : ''}${w.loaded ? '' : '/unloaded'}/kL${w.hostKnownLine}`).join(' ');
				console.log(`PR552 ${name}: ${r.verdict} disk ${J(r.disk)} names ${J(r.names)} gap ${r.gapMs} write ${r.writeMs} pencilBeforeWrite ${r.pencilBeforeWrite} where [${wh}] form [${(r.formEvents ?? []).join(' ')}]${r.problems.length ? ' :: ' + r.problems.slice(0, 6).join(' | ') : ''}${r.error ? ' :: ' + r.error.split('\n')[0] : ''}`);
				console.log(`PR552 ${name} seq: ${r.rsSeq ?? ''}`);
				save();
			}
			for (const rel of Object.values(FX)) await t.reset(rel).catch(() => {});
			await t.ev(`(() => { app.workspace.getLeavesOfType('markdown').slice(1).forEach((l) => l.detach()); return true; })()`);
			await t.open('Lifecycle/other.md');
			save();
			return 'cases ' + Object.keys(res.cases).join(',');
		},
	},
