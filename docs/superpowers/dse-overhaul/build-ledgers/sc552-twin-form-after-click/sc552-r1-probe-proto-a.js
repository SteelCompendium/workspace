(() => {
	// SC-552 r1 in-page PROTOTYPE of option A (the ticket's idea): openAfterPendingWrite widened from "this card" to "this note".
	// Flush every pending view of the note (this one included), wait until the note has nothing pending or in flight, wait for
	// Obsidian's rebuild (two painted frames + 150 ms after the last `modify`), then open the form on THIS view, as today.
	const P = window.__pr;
	P.protoA = function (open, orig) {
		const reg = app.plugins.plugins['draw-steel-elements'].viewRegistry;
		const path = this.cx.host.sourcePath;
		const ofNote = () => reg.pendingWrites().filter((e) => e.host.sourcePath === path);
		if (ofNote().length === 0) return orig.call(this, open);
		P.log.push({ k: 'protoA-wait', t: P.now(), pending: ofNote().length });
		reg.flushPendingWrites(path, null);
		const view = this;
		const t0 = performance.now();
		const tick = () => {
			const lastMod = P.mods.length ? P.mods[P.mods.length - 1].t : 0;
			if (ofNote().length === 0 && P.now() - lastMod > 150) {
				requestAnimationFrame(() => requestAnimationFrame(() => {
					P.log.push({ k: 'protoA-open', t: P.now(), loaded: !!view._loaded, ...P.where(P.formLeaf) });
					if (view._loaded) orig.call(view, open);
				}));
				return;
			}
			if (performance.now() - t0 > 5000) return;
			setTimeout(tick, 20);
		};
		setTimeout(tick, 20);
	};
	return 'protoA';
})()
