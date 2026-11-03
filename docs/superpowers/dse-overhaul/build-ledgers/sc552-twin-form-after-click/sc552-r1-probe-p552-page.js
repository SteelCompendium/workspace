(() => {
	// SC-552 r1 probe page helpers (scratch only). Based on the SC-544 r3 pr-page.js: cards by block (G-S61's rule), click + write
	// logs, replaceSource / Vault.process / flushPendingWrites wrappers. Added: Enter-key log, form open/close log, openAfterPendingWrite
	// log, the registry entry of the card whose pencil is pressed (`formEntry`) and a non-mutating "which block is that entry's element
	// on now" reader (`where`).
	const P = window.__pr && window.__pr.cardsRaw ? window.__pr : (window.__pr = { log: [], clicks: [], mods: [], keys: [], depth: 0 });
	const now = () => Math.round(performance.now() * 10) / 10;
	P.now = now;
	const topRoots = (w) => Array.from(w.querySelectorAll('[data-dse-element="counter"]')).filter((r) => r.isConnected && !r.parentElement.closest('[data-dse-element]'));
	const valueOf = (r) => Number(Array.from(r.querySelectorAll('input')).map((i) => i.value).find((v) => v !== ''));
	const nameOf = (r) => r.querySelector('.dse-counter__name')?.textContent ?? '';
	const lineOf = (cm, w) => { try { return cm.state.doc.lineAt(cm.posAtDOM(w)).number - 1; } catch (e) { return null; } };
	const fences = (cm) => { const out = []; cm.state.doc.toString().split('\n').forEach((l, i) => { if (/^(?:[ ]{0,3}>[ ]?)*```ds-counter\s*$/.test(l)) out.push(i); }); return out; };
	P.cardsRaw = (leaf) => {
		if (!leaf || !leaf.view) return [];
		if (leaf.view.getMode() !== 'source') {
			const scope = leaf.view.containerEl.querySelector('.markdown-reading-view');
			return scope ? topRoots(scope).map((root, block) => ({ block, root, name: nameOf(root), value: valueOf(root) })) : [];
		}
		const cm = leaf.view.editor.cm;
		const fl = fences(cm);
		const out = [];
		for (const w of Array.from(cm.contentDOM.children).filter((x) => x.classList.contains('cm-embed-block'))) {
			const L = lineOf(cm, w);
			if (L === null) continue;
			const after = fl.filter((x) => x >= L);
			topRoots(w).forEach((root, k) => out.push({ block: fl.indexOf(after[k]), root, name: nameOf(root), value: valueOf(root) }));
		}
		return out.sort((a, b) => a.block - b.block);
	};
	P.cards = (leaf) => P.cardsRaw(leaf).map(({ root, ...rest }) => rest);
	P.root = (leaf, block) => P.cardsRaw(leaf).find((c) => c.block === block)?.root ?? null;
	const reg = () => app.plugins.plugins['draw-steel-elements']?.viewRegistry;
	P.entryOfRoot = (root) => (reg() ? [...reg().liveEntries()].find((e) => e.root === root) ?? null : null);
	/** Which block of `leaf` the entry's root is drawn on now (G-S61's card rule), read without touching the host. */
	P.where = (leaf, entry) => {
		const e = entry ?? P.formEntry;
		if (!e) return { none: true };
		const cards = P.cardsRaw(leaf);
		const c = cards.find((x) => x.root === e.root);
		return {
			t: now(),
			block: c ? c.block : null,
			connected: e.root.isConnected,
			released: e.released,
			loaded: !!e.view._loaded,
			hostKnownLine: e.host.lastKnownLineStart,
			hostLastWrite: e.host.lastWriteLineStart,
			value: c ? c.value : null,
		};
	};
	P.formOpen = () => !!document.querySelector('.modal-container .dse-modal');
	if (!P.clickHooked) {
		P.clickHooked = true;
		document.addEventListener('click', (e) => {
			if (!e.target.closest || !e.target.closest('button[aria-label^="Increase"]')) return;
			P.clicks.push({ t: now(), trusted: e.isTrusted });
		}, true);
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && e.target && e.target.closest && e.target.closest('[data-dse-chrome-item="edit"], button[aria-label^="Edit "]')) P.keys.push({ t: now() });
		}, true);
		P.modRef = app.vault.on('modify', (f) => P.mods.push({ t: now(), path: f.path }));
		const vproc = app.vault.process;
		P.vprocOrig = vproc;
		app.vault.process = function (file, fn, ...rest) {
			const id = (P.vpN = (P.vpN ?? 0) + 1);
			P.log.push({ k: 'vp', id, t: now(), path: file?.path, depth: P.depth });
			return vproc.call(this, file, (c) => { P.log.push({ k: 'vp-cb', id, t: now() }); return fn(c); }, ...rest);
		};
		// form open / close, by DOM
		P.formWas = false;
		P.formObs = new MutationObserver(() => {
			const open = P.formOpen();
			if (open !== P.formWas) { P.formWas = open; P.log.push({ k: open ? 'form-open' : 'form-close', t: now(), saving: !!P.saving }); }
		});
		P.formObs.observe(document.body, { childList: true, subtree: false });
	}
	P.install = () => {
		const r = reg();
		if (!r) return 'no-registry';
		if (!r.__prWrapped && typeof r.flushPendingWrites === 'function') {
			r.__prWrapped = true;
			const orig = r.flushPendingWrites;
			r.flushPendingWrites = function (sourcePath, except) {
				const all = [...this.liveEntries()];
				const pend = all.filter((e) => e !== except && !e.released && e.host.sourcePath === sourcePath && e.view.hasPendingWrite && e.view.hasPendingWrite()).length;
				P.log.push({ k: 'flush', t: now(), pend, depth: P.depth });
				return orig.call(this, sourcePath, except);
			};
		}
		const e0 = [...r.liveEntries()][0];
		if (e0) {
			const proto = Object.getPrototypeOf(e0.host);
			if (!proto.__prWrapped) {
				proto.__prWrapped = true;
				const rs = proto.replaceSource;
				proto.replaceSource = function (src, opts) {
					const m = /current_value: (\d+)/.exec(src);
					const n = /name: (\w+)/.exec(src);
					const isForm = !!(P.formEntry && this === P.formEntry.host && !(opts && opts.fromView));
					P.log.push({ k: 'rs', t: now(), depth: P.depth, fromView: !!(opts && opts.fromView), formHost: isForm, knownLine: this.lastKnownLineStart, value: m ? Number(m[1]) : null, name: n ? n[1] : null });
					P.depth++;
					let p;
					try { p = rs.call(this, src, opts); } finally { P.depth--; }
					return p.then((ok) => { P.log.push({ k: 'rs-done', t: now(), ok, formHost: isForm, line: this.lastWriteLineStart }); return ok; });
				};
			}
			// ElementView.openAfterPendingWrite: find the prototype that owns it
			let vp = Object.getPrototypeOf(e0.view);
			while (vp && !Object.prototype.hasOwnProperty.call(vp, 'openAfterPendingWrite')) vp = Object.getPrototypeOf(vp);
			if (vp && !vp.__prWrapped) {
				vp.__prWrapped = true;
				const oa = vp.openAfterPendingWrite;
				vp.openAfterPendingWrite = function (open) {
					P.log.push({ k: 'oapw', t: now(), pending: this.hasPendingWrite() });
					if (P.protoA) return P.protoA.call(this, open, oa);
					return oa.call(this, open);
				};
			}
		}
		return 'ok';
	};
	P.reset = () => { P.log.length = 0; P.clicks.length = 0; P.mods.length = 0; P.keys.length = 0; P.vpN = 0; P.formEntry = null; P.wheres = []; return true; };
	P.pending = () => { const r = reg(); return r ? r.pendingWrites().length : -1; };
	return P.install();
})()
