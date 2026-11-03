	{
		// SC-552 r3 reviewer probes (scratch only, never committed). Built on the r1 PR552 probe (cards by block, form by Enter on the pencil).
		id: 'PR552R3',
		async run(t) {
			const OUT = process.env.PR_OUT;
			const WANT = (process.env.PR_CASES ?? '').split(',').filter(Boolean);
			const PAGE = fs.readFileSync(process.env.PR_PAGE, 'utf8');
			const J = JSON.stringify;
			const res = { cases: {} };
			const save = () => fs.writeFileSync(OUT + '/pr552r3.json', JSON.stringify(res, null, 1));
			const prefs = `app.plugins.plugins['draw-steel-elements'].frameworkV2.services.prefs`;
			const { FORM, SAVE } = formKit(t);
			const FX = {
				c2: 'Lifecycle/twin-callouts.md',
				c3: 'Lifecycle/twin-callouts-3.md',
				c4: 'Lifecycle/twin-callouts-4.md',
				p2: 'Lifecycle/twin-pair.md',
				p3: 'Lifecycle/twin-triplets.md',
				p4: 'Probe552/twin-plain-4.md',
				crlf: 'Probe552/twin-crlf.md',
				ccrlf: 'Probe552/twin-callouts-crlf.md',
				solo: 'Probe552/single.md',
				tall3: 'Probe552/tall-twins-3.md',
				tall2: 'Probe552/tall-twins-2.md',
				tallc3: 'Probe552/tall-callouts-3.md',
				mixed: 'Probe552/mixed-kinds.md',
				mid6: 'Probe552/twin-mid6.md',
				cmid6: 'Probe552/twin-callouts-mid6.md',
				unt: 'Lifecycle/form-pin-unterminated.md',
			};
			const namesOf = (text) => (text.match(/^(?:> ?)*name: (\w+)\r?$/gm) ?? []).map((s) => s.replace(/^(?:> ?)*name: /, '').replace(/\r$/, ''));
			const valuesOf = (text) => (text.match(/current_value: (\d+)/g) ?? []).map((s) => Number(s.split(': ')[1]));
			await t.ev(`(() => { if (!document.getElementById('pr-notice')) { const st = document.createElement('style'); st.id = 'pr-notice'; st.textContent = '.notice-container { display: none !important; }'; document.head.appendChild(st); } return true; })()`);
			await t.ev(PAGE);
			const A = 'window.__pr.A';
			const B = 'window.__pr.B';
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
			const openForm = async (label, leaf, block) => {
				const pencil = pencilOf(leaf, block);
				await t.waitFor(`!!${pencil}`, `${label}: the Edit pencil is drawn`);
				await t.ev(`(() => { const root = window.__pr.root(${leaf}, ${block}); window.__pr.formEntry = window.__pr.entryOfRoot(root); window.__pr.formLeaf = ${leaf}; window.__pr.wheres.push({ label: 'pencil', ...window.__pr.where(${leaf}) }); ${pencil}.focus({ focusVisible: true, preventScroll: true }); return true; })()`);
				await t.cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
				await t.cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
			};
			const where = (label) => t.ev(`(() => { const w = Object.assign({ label: ${J(label)} }, window.__pr.where(window.__pr.formLeaf)); window.__pr.wheres.push(w); return w; })()`);
			const formRename = async (label, from, to) => {
				t.expect(await t.ev(`(() => { const ta = ${FORM}.querySelector('textarea.dse-form__raw'); if (!ta) return false; ta.value = ta.value.replace('name: ${from}', 'name: ${to}'); ta.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`), `${label}: the form has no raw box`);
				await t.waitFor(`!!(${SAVE}) && !(${SAVE}).disabled`, `${label}: Save is enabled`);
			};
			const formRaw = () => t.ev(`(${FORM})?.querySelector('textarea.dse-form__raw')?.value ?? null`);
			const clickSave = async (label, mustClose = true) => {
				await t.ev(`(() => { window.__pr.saving = true; window.__pr.log.push({ k: 'save', t: window.__pr.now() }); (${SAVE}).click(); return true; })()`);
				if (mustClose) await t.waitFor(`!document.querySelector('.modal-container .dse-modal')`, `${label}: the form closed`, 6000);
				else await t.sleep(1500);
				await t.ev(`window.__pr.saving = false`);
			};
			const cancelForm = async () => {
				await t.ev(`(() => { const m = document.querySelector('.modal-container .dse-modal'); if (!m) return false; const c = Array.from(m.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Cancel' || b.textContent.trim() === 'Cancel'); if (c) c.click(); else m.closest('.modal-container')?.querySelector('.modal-close-button')?.click(); return true; })()`);
				await t.sleep(300);
			};
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
				const ed = (c, block) => { const ls = c.split('\n'); let k = -1; let seen = -1; ls.forEach((l, i) => { if (/current_value: \d+\r?$/.test(l)) { seen++; if (seen === block) k = i; } }); ls[k] = ls[k].replace(/current_value: \d+/, 'current_value: 7'); return ls.join('\n'); };
				if (how === 'disk') {
					const p = path.join(vault, rel);
					await t.ev(`window.__pr.log.push({ k: 'ext-disk', t: window.__pr.now() })`);
					fs.writeFileSync(p, ed(fs.readFileSync(p, 'utf8'), block));
				} else {
					await t.ev(`(async () => { window.__pr.log.push({ k: 'ext', t: window.__pr.now() }); const ed = ${ed.toString()}; await app.vault.process(app.vault.getAbstractFileByPath(${J(rel)}), (c) => ed(c, ${block})); })()`);
				}
			};
			const regChildren = () => t.ev(`(() => { const r = app.plugins.plugins['draw-steel-elements']?.viewRegistry; return r ? r._children.length : -1; })()`);
			const scrollState = (L) => t.ev(`(() => { const L = ${L}; const mode = L.view.getMode(); const sc = mode === 'source' ? L.view.containerEl.querySelector('.cm-scroller') : L.view.containerEl.querySelector('.markdown-preview-view'); let a = null; if (mode === 'source') { a = Array.from(L.view.containerEl.querySelectorAll('.cm-line')).find((x) => x.textContent.trim() === 'ANCHOR'); } else { a = Array.from(L.view.containerEl.querySelectorAll('.markdown-preview-view p')).find((x) => x.textContent.trim() === 'ANCHOR'); } const sr = sc.getBoundingClientRect(); return { st: Math.round(sc.scrollTop), anchor: a ? Math.round(a.getBoundingClientRect().top - sr.top) : null }; })()`);

			// Case grammar (new kinds after r1's F/X/T/R):
			//   F-<fx>-<mode>-p<plus>-f<form>-g<gap>[-B<modeB>][-x<rep>]  r1's ticket steps (gap 'n' = no click)
			//   X-<fx>-<mode>-p<plus>-g<gap>-e<block>-<inapp|disk>       SC-549: + then an outside edit of <block> within <gap>
			//   T-<fx>-lp-p<plus>-g<gap>-e<block>                        SC-549 typing in callout <block>'s title
			//   R-<fx>-<mode>-f<form>-e<block>-<inapp|disk|big>          residual: form open, outside edit, Save. 'big' = 300 lines above + 300 below + block value 7
			//   D-<fx>-<mode>-f<form>[-p<plus>-g<gap>]-e<block>          form open (optionally after a held-ish click), block <block> deleted from outside, rename + Save
			//   U-unt-<mode>-x<rep>                                      F1: <rep> sequential Saves on the unterminated trailing fence
			//   N-<fx>-<mode>-x<rep>-<save|cancel|cancelext>             registry children across <rep> form opens on block 0
			//   Q-<fx>-<mode>-p<plus>-c<clicks>-g<gap>[-u<upper>]        <clicks> quick clicks on <plus>, <gap> ms apart (optional: + on <upper> first)
			//   S-<fx>-<mode>-f<form>[-p<plus>-g<gap>]                   scroll: twins centred, form on <form> (optionally after + on <plus>), Save; anchor offset over time
			const parse = (name) => {
				const parts = name.split('-');
				const c = { kind: parts[0], fx: parts[1], mode: parts[2], rel: FX[parts[1]] };
				for (const p of parts.slice(3)) {
					if (p === 'inapp' || p === 'disk' || p === 'big' || p === 'save' || p === 'cancel' || p === 'cancelext') c.how = p;
					else if (p[0] === 'p') c.plus = Number(p.slice(1));
					else if (p[0] === 'f') c.form = Number(p.slice(1));
					else if (p[0] === 'g') c.gap = p.slice(1) === 'n' ? null : Number(p.slice(1));
					else if (p[0] === 'B') c.paneB = p.slice(1);
					else if (p[0] === 'e') c.edit = Number(p.slice(1));
					else if (p[0] === 'x') c.rep = Number(p.slice(1));
					else if (p[0] === 'c') c.clicks = Number(p.slice(1));
					else if (p[0] === 'u') c.upper = Number(p.slice(1));
				}
				return c;
			};

			for (const name of WANT) {
				const c = parse(name);
				if (!c.rel) { console.log(`PR552R3 ${name}: NO SUCH FIXTURE`); continue; }
				const n = blocksOf(c.rel);
				const r = { name, ...c, problems: [], wheres: [], notes: [] };
				res.cases[name] = r;
				const m0 = await t.mark();
				let want = Array.from({ length: n }, (_, i) => (c.rel === FX.mixed && i === 2 ? 9 : 5));
				let wantNames = Array.from({ length: n }, (_, i) => (c.rel === FX.mixed && i === 2 ? 'Other' : c.rel === FX.solo ? 'Solo' : 'Twin'));
				let wantWrites = null;
				let allowNotice = false;
				try {
					await t.ev(`${prefs}.set('authoringControls', true)`);
					await openA(c.rel, c.mode);
					if (c.paneB) await openB(c.rel, c.paneB);
					const tall = /^tall/.test(c.fx);
					for (const L of c.paneB ? [A, B] : [A]) {
						for (let b = 0; b < n; b++) {
							await t.ev(`(() => { const L = ${L}; if (L.view.getMode() !== 'source') return true; const cm = L.view.editor.cm; const fl = []; cm.state.doc.toString().split('\\n').forEach((l, i) => { if (/^(?:[ ]{0,3}>[ ]?)*\`\`\`ds-counter\\s*$/.test(l)) fl.push(i); }); const pos = cm.state.doc.line(fl[${b}] + 1).from; L.view.editor.scrollIntoView({ from: L.view.editor.offsetToPos(pos), to: L.view.editor.offsetToPos(pos) }, true); return true; })()`);
							await t.sleep(120);
						}
					}
					if (!tall) await t.ev(`(() => { for (const L of [${A}, ${B}]) { if (L && L.view.getMode() === 'source') L.view.editor.scrollIntoView({ from: { line: 0, ch: 0 }, to: { line: 0, ch: 0 } }); } return true; })()`);
					else {
						// tall: scroll each card into view so it is drawn, then centre the ANCHOR paragraph
						await t.ev(`(() => { const L = ${A}; if (L.view.getMode() === 'source') { const cm = L.view.editor.cm; const ls = cm.state.doc.toString().split('\\n'); const k = ls.indexOf('ANCHOR'); L.view.editor.scrollIntoView({ from: { line: k, ch: 0 }, to: { line: k, ch: 0 } }, true); } else { const k = L.view.data.split('\\n').indexOf('ANCHOR'); L.view.previewMode.applyScroll(Math.max(0, k - 12)); } return true; })()`);
						await t.sleep(900);
						await t.ev(`(() => { const L = ${A}; if (L.view.getMode() !== 'source') { const p = Array.from(L.view.containerEl.querySelectorAll('.markdown-preview-view p')).find((x) => x.textContent.trim() === 'ANCHOR'); p?.scrollIntoView({ block: 'center' }); } return true; })()`);
					}
					await t.sleep(400);
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
							await clickSave(name);
						}
						if (c.gap !== null) want[c.plus] = 6;
						wantNames[c.form] = 'Edited';
					} else if (c.kind === 'X') {
						await t.realClick(btn(A, c.plus));
						await t.sleep(c.gap);
						await outsideEdit(c.rel, c.edit, c.how);
						want[c.plus] = 6;
						want[c.edit] = 7;
					} else if (c.kind === 'T') {
						await t.realClick(btn(A, c.plus));
						await t.sleep(c.gap);
						await t.ev(`(() => { window.__pr.log.push({ k: 'type', t: window.__pr.now() }); const ed = (${A}).view.editor; const ls = ed.getValue().split('\\n'); let seen = -1; let k = -1; ls.forEach((l, i) => { if (/^> \\[!note\\] Camp/.test(l)) { seen++; if (seen === ${c.edit}) k = i; } }); ed.replaceRange('Z', { line: k, ch: ls[k].length }); return k; })()`);
						await t.sleep(2500);
						await t.ev(`(async () => { await (${A}).view.save(); })()`);
						want[c.plus] = 6;
						allowNotice = true;
					} else if (c.kind === 'M') {
						// the form's OWN pending write makes its block identical to its neighbours: - on <form>, <gap> ms later its pencil
						await t.realClick(`(window.__pr.root(${A}, ${c.form})?.querySelector('button[aria-label^="Decrease"]'))`);
						await t.sleep(c.gap);
						await openForm(name, A, c.form);
						try { await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000); } catch { r.problems.push('form never opened'); }
						await t.sleep(900);
						r.wheres.push(await where('settled'));
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						if (!r.formOpenAtSettle) r.problems.push('form closed by itself before Save');
						else {
							await formRename(name, 'Twin', 'Edited');
							await clickSave(name);
						}
						want = want.map(() => 5);
						wantNames[c.form] = 'Edited';
					} else if (c.kind === 'P') {
						// SC-545 seam: plugin off/on, optionally with a (kept-open) form open. P-<fx>-<mode>[-p<plus>-g<gap>][-f<form>]
						if (c.plus !== undefined) {
							await t.realClick(btn(A, c.plus));
							await t.sleep(c.gap);
							want[c.plus] = 6;
						}
						if (c.form !== undefined) {
							await openForm(name, A, c.form);
							await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000);
							await t.sleep(900);
							r.wheres.push(await where('settled'));
							r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
							if (r.formOpenAtSettle) {
								await formRename(name, 'Twin', 'Edited');
							} else r.notes.push('form closed by itself before the disable');
						} else await quiesce(900);
						const reg = `app.plugins.plugins['draw-steel-elements']?.viewRegistry`;
						r.childrenBeforeOff = await t.ev(`(${reg})?._children.length ?? -1`);
						r.entriesBeforeOff = await t.ev(`(${reg}) ? [...(${reg}).liveEntries()].length : -1`);
						const beforeOff = t.read(c.rel);
						r.loadOff = fs.readFileSync('/proc/loadavg', 'utf8').trim();
						await t.ev(`(async () => { await app.plugins.disablePlugin('draw-steel-elements'); })()`);
						await t.waitFor(`!document.querySelector('.modal-container .dse-modal')`, `${name}: no form after the disable`, 10000);
						r.unchangedAtOff = t.read(c.rel) === beforeOff;
						r.stashAfterOff = await t.ev(`document.querySelectorAll('[data-dse-replug]').length`);
						await t.sleep(1500);
						r.unchangedAfter1500 = t.read(c.rel) === beforeOff;
						if (!r.unchangedAtOff || !r.unchangedAfter1500) r.problems.push('the disable changed the note');
						await t.ev(`(async () => { await app.plugins.enablePlugin('draw-steel-elements'); })()`);
						await t.waitFor(`!!(${reg})`, `${name}: plugin back`, 10000);
						await t.ev(PAGE);
						try { await t.waitFor(`window.__pr.cards(${A}).length === ${n}`, `${name}: all cards drawn again`, 20000); } catch (e) { r.problems.push('cards not drawn again: ' + J(await t.ev(`window.__pr.cards(${A})`))); }
						await t.sleep(800);
						r.stashAfterOn = await t.ev(`document.querySelectorAll('[data-dse-replug]').length`);
						r.childrenAfterOn = await t.ev(`(${reg})._children.length`);
						r.entriesAfterOn = await t.ev(`[...(${reg}).liveEntries()].length`);
						r.holdersAfterOn = await t.ev(`(() => { const R = ${reg}; const views = new Set([...R.liveEntries()].map((e) => e.view)); return R._children.filter((x) => !views.has(x)).length; })()`);
						if (r.holdersAfterOn !== 0) r.problems.push(`holders after on ${r.holdersAfterOn}`);
						if (r.stashAfterOn !== 0) r.problems.push(`stash marks left ${r.stashAfterOn}`);
						await t.ev('window.__pr.install()');
						await t.ev('window.__pr.reset()');
						const nb = (t.read(c.rel).match(/current_value: (\d+)/g) ?? []).map((x) => Number(x.split(': ')[1]));
						await t.realClick(btn(A, 1));
						want = nb.slice();
						want[1] += 1;
					} else if (c.kind === 'R') {
						await openForm(name, formLeaf, c.form);
						await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000);
						await t.sleep(300);
						if (c.how === 'big') {
							await t.ev(`(async () => { window.__pr.log.push({ k: 'ext-big', t: window.__pr.now() }); await app.vault.process(app.vault.getAbstractFileByPath(${J(c.rel)}), (s) => { const ls = s.split('\\n'); let k = -1; let seen = -1; ls.forEach((l, i) => { if (/current_value: \\d+$/.test(l)) { seen++; if (seen === ${c.edit}) k = i; } }); ls[k] = ls[k].replace(/current_value: \\d+/, 'current_value: 7'); const top = ls.indexOf('TOP'); const bot = ls.indexOf('BOTTOM'); const above = Array.from({ length: 300 }, (_, i) => 'filler above ' + i); const below = Array.from({ length: 300 }, (_, i) => 'filler below ' + i); ls.splice(bot + 1, 0, ...below); ls.splice(top, 0, ...above); return ls.join('\\n'); }); })()`);
						} else await outsideEdit(c.rel, c.edit, c.how);
						await waitMods(c.rel, 1, 3000);
						await t.sleep(900);
						r.wheres.push(await where('settled'));
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						if (!r.formOpenAtSettle) r.problems.push('form closed by itself before Save');
						else {
							await formRename(name, 'Twin', 'Edited');
							await clickSave(name);
						}
						want[c.edit] = 7;
						wantNames[c.form] = 'Edited';
					} else if (c.kind === 'D') {
						if (c.plus !== undefined) {
							await t.realClick(btn(A, c.plus));
							await t.sleep(c.gap);
						}
						await openForm(name, formLeaf, c.form);
						await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000);
						if (c.plus !== undefined) await waitMods(c.rel, 1, 3000);
						await t.sleep(800);
						r.wheres.push(await where('before-delete'));
						const before = (await t.ev(`window.__pr.mods.length`));
						await t.ev(`(async () => { window.__pr.log.push({ k: 'ext-del', t: window.__pr.now() }); await app.vault.process(app.vault.getAbstractFileByPath(${J(c.rel)}), (s) => { const ls = s.split('\\n'); const opens = []; ls.forEach((l, i) => { if (/^(?:> ?)*\`\`\`ds-counter/.test(l)) opens.push(i); }); const o = opens[${c.edit}]; let e = o + 1; while (!/^(?:> ?)*\`\`\`\\s*$/.test(ls[e])) e++; ls.splice(o, e - o + 1, ...(ls[o].startsWith('>') ? ['> gone'] : ['gone'])); return ls.join('\\n'); }); })()`);
						await waitMods(c.rel, before + 1, 3000);
						await t.sleep(900);
						r.afterDelete = t.read(c.rel);
						r.wheres.push(await where('settled'));
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						if (!r.formOpenAtSettle) r.notes.push('form closed by itself after the delete');
						else {
							await formRename(name, 'Twin', 'Edited');
							const nb = await t.ev(`window.__pr.mods.length`);
							await clickSave(name, false);
							await t.sleep(800);
							r.writesBySave = (await t.ev(`window.__pr.mods.length`)) - nb;
							r.formOpenAfterSave = await t.ev('window.__pr.formOpen()');
						}
						if (c.plus !== undefined) want[c.plus] = 6;
						want.splice(c.edit, 1);
						wantNames.splice(c.edit, 1);
						allowNotice = true;
					} else if (c.kind === 'U') {
						r.tails = [];
						let prev = 'Twin';
						for (let i = 1; i <= c.rep; i++) {
							await openForm(name, A, n - 1);
							await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened ${i}`, 5000);
							await t.sleep(400);
							const nm = 'E' + i;
							await formRename(name, prev, nm);
							await clickSave(name);
							prev = nm;
							await quiesce();
							const text = t.read(c.rel);
							r.tails.push(text.slice(text.lastIndexOf('```ds-counter')));
						}
						wantNames[n - 1] = prev;
					} else if (c.kind === 'N') {
						r.children = [await regChildren()];
						let prev = c.rel === FX.solo ? 'Solo' : 'Twin';
						for (let i = 1; i <= c.rep; i++) {
							await openForm(name, A, 0);
							await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened ${i}`, 5000);
							await t.sleep(300);
							if (c.how === 'save') {
								const nm = 'N' + i;
								await formRename(name, prev, nm);
								await clickSave(name);
								prev = nm;
							} else {
								await cancelForm();
								if (c.how === 'cancelext') {
									await t.edit(c.rel, `c.replace(/current_value: \\d+/, 'current_value: ${10 + i}')`);
									want[0] = 10 + i;
								}
							}
							await quiesce(900);
							r.children.push(await regChildren());
						}
						wantNames[0] = prev;
					} else if (c.kind === 'Q') {
						if (c.upper !== undefined) {
							await t.realClick(btn(A, c.upper));
							want[c.upper] = 6;
						}
						const target = btn(A, c.plus);
						for (let i = 0; i < c.clicks; i++) {
							if (i === 0) await t.realClick(target);
							else {
								const at = await t.ev(`(() => { const r = (${target}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
								const base = { x: at.x, y: at.y, button: 'left', clickCount: 1 };
								await t.cdp.call('Input.dispatchMouseEvent', { type: 'mousePressed', buttons: 1, ...base });
								await t.cdp.call('Input.dispatchMouseEvent', { type: 'mouseReleased', buttons: 0, ...base });
							}
							await t.sleep(c.gap);
						}
						want[c.plus] = 5 + c.clicks;
						wantWrites = c.upper !== undefined ? 2 : 1;
					} else if (c.kind === 'S') {
						if (c.plus !== undefined) {
							await t.realClick(btn(A, c.plus));
							await t.sleep(c.gap);
							want[c.plus] = 6;
						}
						await openForm(name, A, c.form);
						await t.waitFor(`window.__pr.formOpen()`, `${name}: form opened`, 5000);
						if (c.plus !== undefined) await waitMods(c.rel, 1, 3000);
						await t.sleep(900);
						r.formOpenAtSettle = await t.ev('window.__pr.formOpen()');
						r.wheres.push(await where('settled'));
						if (!r.formOpenAtSettle) r.problems.push('form closed by itself before Save');
						else {
							await formRename(name, 'Twin', 'Edited');
							r.scroll = [{ k: 'before', ...(await scrollState(A)) }];
							await t.ev(`(() => { window.__pr.saving = true; (${SAVE}).click(); return true; })()`);
							for (const ms of [50, 150, 300, 600, 1200, 2500]) {
								await t.sleep(ms - (r.scroll.length > 1 ? [50, 150, 300, 600, 1200, 2500][r.scroll.length - 2] : 0));
								r.scroll.push({ k: ms, ...(await scrollState(A)) });
							}
							await t.ev(`window.__pr.saving = false`);
							const a0 = r.scroll[0].anchor;
							r.maxAnchorDrift = Math.max(...r.scroll.map((s) => (s.anchor === null || a0 === null ? 9999 : Math.abs(s.anchor - a0))));
							if (r.maxAnchorDrift > 4) r.problems.push(`reading position moved: anchor drift ${r.maxAnchorDrift}px ${J(r.scroll)}`);
						}
						wantNames[c.form] = 'Edited';
					}
					if (c.kind !== 'S') await quiesce();
					else await t.sleep(1500);
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
					if (c.kind !== 'S') {
						r.cardsA = await t.ev(`window.__pr.cards(${A})`).catch(() => null);
						if (c.paneB) r.cardsB = await t.ev(`window.__pr.cards(${B})`).catch(() => null);
					}
					r.want = want;
					r.wantNames = wantNames;
					if (J(r.disk) !== J(want)) r.problems.push(`disk ${J(r.disk)} want ${J(want)}`);
					if (J(r.names) !== J(wantNames)) r.problems.push(`names ${J(r.names)} want ${J(wantNames)}`);
					if (wantWrites !== null && r.writes !== wantWrites) r.problems.push(`writes ${r.writes} want ${wantWrites}`);
					const eol = /\r\n/.test(FIXTURES[c.rel]) ? '\r\n' : '\n';
					for (const w of ['TOP', 'BOTTOM']) if (FIXTURES[c.rel].includes(eol + w + eol) && !text.includes(eol + w + eol)) r.problems.push(`lost ${w}`);
					if (eol === '\r\n') { const bare = (text.match(/(?<!\r)\n/g) ?? []).length; r.bareLF = bare; if (bare) r.problems.push(`CRLF note has ${bare} bare LF`); }
					if (c.kind === 'D' && r.formOpenAtSettle) {
						if (r.writesBySave !== 0) r.problems.push(`the Save after the delete wrote ${r.writesBySave} time(s)`);
						if (text !== r.afterDelete) r.problems.push('note changed after the delete');
					}
					for (const [nm, cards] of [['A', r.cardsA], ['B', r.cardsB]]) {
						if (!cards) continue;
						for (const cd of cards) if (cd.block >= 0 && (cd.value !== r.disk[cd.block] || cd.name !== r.names[cd.block])) r.problems.push(`card ${nm}${cd.block} shows ${cd.name}=${cd.value}, disk ${r.names[cd.block]}=${r.disk[cd.block]}`);
						if (cards.length !== r.disk.length) r.problems.push(`pane ${nm} draws ${cards.length} cards for ${r.disk.length} blocks`);
					}
					if (c.kind === 'N' && r.children[r.children.length - 1] !== r.children[0]) r.problems.push(`registry children ${J(r.children)}`);
					const click = r.clicks[0]?.t;
					const key = r.keys[0]?.t;
					const mod = r.mods.find((m) => m.path === c.rel)?.t;
					r.gapMs = click !== undefined && key !== undefined ? Math.round(key - click) : null;
					r.writeMs = click !== undefined && mod !== undefined ? Math.round(mod - click) : null;
					r.formEvents = r.log.filter((x) => x.k === 'form-open' || x.k === 'form-close' || x.k === 'oapw').map((x) => `${x.k}${x.k === 'oapw' ? (x.pending ? '(pending)' : '(none)') : ''}${x.saving ? '(saving)' : ''}@${click !== undefined ? Math.round(x.t - click) : x.t}`);
					r.rsSeq = r.log.filter((x) => ['rs', 'rs-done', 'vp', 'ext', 'ext-disk', 'ext-del', 'ext-big', 'save'].includes(x.k)).map((x) => x.k === 'rs' ? `rs(${x.fromView ? 'view' : x.formHost ? 'FORM' : 'form?'},v${x.value},${x.name},kL${x.knownLine})` : x.k === 'rs-done' ? `done(${x.ok},${x.formHost ? 'FORM' : ''}L${x.line})` : x.k === 'vp' ? `vp${x.id}` : x.k).join(' ');
				} catch (e) {
					r.error = String(e && e.stack ? e.stack : e);
				} finally {
					try {
						for (let i = 0; i < 6 && (await t.ev(`!!document.querySelector('.modal-container .dse-modal')`)); i++) {
							r.leftOpen = (r.leftOpen ?? 0) + 1;
							await cancelForm();
							if (await t.ev(`!!document.querySelector('.modal-container .dse-modal')`)) await t.key('Escape', 'Escape', 27);
							await t.sleep(250);
						}
						await t.ev(`${prefs}.set('authoringControls', false)`);
					} catch (e2) { r.cleanupError = String(e2); }
				}
				r.errors = await t.errorsSince(m0);
				r.notices = await t.noticesSince(m0);
				if (r.errors.length) r.problems.push(`page errors ${J(r.errors)}`);
				if (r.notices.length && !allowNotice) r.problems.push(`notices ${J(r.notices)}`);
				r.verdict = r.error ? 'ERROR' : r.problems.length ? 'PROBLEMS' : 'clean';
				const wh = (r.wheres ?? []).map((w) => `${w.label}:b${w.block}${w.connected ? '' : '/detached'}${w.released ? '/released' : ''}${w.loaded ? '' : '/unloaded'}`).join(' ');
				const extra = c.kind === 'P' ? ` off[unch ${r.unchangedAtOff}/${r.unchangedAfter1500} stash ${r.stashAfterOff} ch ${r.childrenBeforeOff} en ${r.entriesBeforeOff}] on[stash ${r.stashAfterOn} ch ${r.childrenAfterOn} en ${r.entriesAfterOn} holders ${r.holdersAfterOn}] formOpen ${r.formOpenAtSettle} load ${r.loadOff}` : c.kind === 'N' ? ` children ${J(r.children)}` : c.kind === 'S' ? ` drift ${r.maxAnchorDrift} scroll ${J(r.scroll)}` : c.kind === 'D' ? ` formOpenAtSettle ${r.formOpenAtSettle} writesBySave ${r.writesBySave} formOpenAfterSave ${r.formOpenAfterSave} notices ${J(r.notices)}` : c.kind === 'U' ? ` tails ${J(r.tails)}` : '';
				console.log(`PR552R3 ${name}: ${r.verdict} disk ${J(r.disk)} names ${J(r.names)} writes ${r.writes} gap ${r.gapMs} write ${r.writeMs} where [${wh}] form [${(r.formEvents ?? []).join(' ')}]${extra}${r.problems.length ? ' :: ' + r.problems.slice(0, 6).join(' | ') : ''}${r.error ? ' :: ' + r.error.split('\n')[0] : ''}`);
				console.log(`PR552R3 ${name} seq: ${r.rsSeq ?? ''}`);
				save();
			}
			for (const rel of Object.values(FX)) await t.reset(rel).catch(() => {});
			await t.ev(`(() => { app.workspace.getLeavesOfType('markdown').slice(1).forEach((l) => l.detach()); return true; })()`);
			await t.open('Lifecycle/other.md');
			save();
			return 'cases ' + Object.keys(res.cases).join(',');
		},
	},
