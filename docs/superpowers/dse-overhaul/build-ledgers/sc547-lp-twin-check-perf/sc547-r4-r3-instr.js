(() => {
  // SC-537 r3 review probe: page-side instrumentation (installed once per Obsidian run).
  if (window.__r537) return 'already';
  const plugin = app.plugins.plugins['draw-steel-elements'];
  const reg = plugin.viewRegistry;
  const P = (window.__r537 = { log: [], n: 0, rid: 0, A: null, B: null });
  const cv = (b) => {
    if (b == null) return null;
    const name = (b.match(/name: (\w+)/) ?? [])[1] ?? '?';
    const val = (b.match(/current_value: (\d+)/) ?? [])[1] ?? '?';
    return name + '=' + val;
  };
  P.cv = cv;
  P.paneOf = (el) => {
    if (!el || !el.isConnected) return 'detached';
    const tag = (l) => (l === P.A ? 'A' : l === P.B ? 'B' : '?');
    for (const l of app.workspace.getLeavesOfType('markdown')) {
      if (!l.view.containerEl.contains(el)) continue;
      return tag(l) + (el.closest('.markdown-source-view') ? ':lp' : el.closest('.markdown-reading-view') ? ':rv' : ':?');
    }
    return 'other';
  };
  const oOwn = reg.own.bind(reg);
  reg.own = (view, host, root) => {
    root.__rid = 'R' + ++P.rid;
    const e = oOwn(view, host, root);
    if (P.gsiOn) P.patchProto(Object.getPrototypeOf(host));
    P.log.push({ n: ++P.n, ev: 'own', rid: root.__rid, known: cv(host.lastKnownBody), pane: P.paneOf(root) });
    return e;
  };
  const oRel = reg.release.bind(reg);
  reg.release = (entry, reason) => {
    if (!entry.released) P.log.push({ n: ++P.n, ev: 'release', rid: entry.root.__rid, reason, known: cv(entry.host.lastKnownBody), pane: P.paneOf(entry.root) });
    return oRel(entry, reason);
  };
  // which DSE view a click reached, and at which block it sat then; every vault.process write as counter values before -> after
  document.addEventListener(
    'click',
    (e) => {
      const r0 = e.target && e.target.closest ? e.target.closest('[data-dse-element]') : null;
      if (!r0) return;
      let top = r0;
      while (top.parentElement && top.parentElement.closest('[data-dse-element]')) top = top.parentElement.closest('[data-dse-element]');
      let block = null;
      for (const l of app.workspace.getLeavesOfType('markdown')) {
        if (!l.view.containerEl.contains(top) || l.view.getMode() !== 'source') continue;
        const c = P.cardsRaw(l.view.editor.cm).find((x) => x.root === top);
        block = c ? c.block : 'unmapped';
      }
      P.log.push({ n: ++P.n, ev: 'click', rid: top.__rid ?? '?', block, pane: P.paneOf(top), t: Math.round(performance.now()) });
    },
    true,
  );
  const vals = (s) => (s.match(/current_value: (\d+)/g) ?? []).map((x) => Number(x.split(': ')[1]));
  const oProc = app.vault.process.bind(app.vault);
  app.vault.process = (file, fn, opts) =>
    oProc(
      file,
      (content) => {
        const out = fn(content);
        P.log.push({ n: ++P.n, ev: 'write', before: vals(content), after: vals(out), t: Math.round(performance.now()) });
        return out;
      },
      opts,
    );
  P.fences = (cm) => {
    const out = [];
    cm.state.doc.toString().split('\n').forEach((l, i) => {
      if (/^(?:[ ]{0,3}>[ ]?)*```ds-(?:counter|ct)\s*$/.test(l)) out.push(i);
    });
    return out;
  };
  P.lineOf = (cm, w) => {
    try {
      return cm.state.doc.lineAt(cm.posAtDOM(w)).number - 1;
    } catch (e) {
      return null;
    }
  };
  const topRoots = (w) => Array.from(w.querySelectorAll('[data-dse-element="counter"]')).filter((r) => r.isConnected && !r.parentElement.closest('[data-dse-element]'));
  const valueOf = (r) => Number(Array.from(r.querySelectorAll('input')).map((i) => i.value).find((v) => v !== ''));
  const nameOf = (r) => r.querySelector('.dse-counter__name')?.textContent ?? '';
  /** LP cards of an editor: the k-th DSE root of a widget belongs to the k-th counter fence at or after the widget's line. */
  P.cardsRaw = (cm) => {
    const fl = P.fences(cm);
    const out = [];
    for (const w of Array.from(cm.contentDOM.children).filter((x) => x.classList.contains('cm-embed-block'))) {
      const L = P.lineOf(cm, w);
      if (L === null) continue;
      const after = fl.filter((x) => x >= L);
      topRoots(w).forEach((r, k) => out.push({ block: fl.indexOf(after[k]), rid: r.__rid ?? '?', name: nameOf(r), value: valueOf(r), root: r }));
    }
    return out.sort((a, b) => a.block - b.block);
  };
  P.cards = (cm) => P.cardsRaw(cm).map(({ root, ...rest }) => rest);
  P.rootFor = (cm, block) => P.cardsRaw(cm).find((c) => c.block === block)?.root ?? null;
  /** Reading-view cards of a leaf, in document order. */
  P.rvCards = (leaf) => {
    const scope = leaf.view.containerEl.querySelector('.markdown-reading-view');
    if (!scope) return null;
    return topRoots(scope).map((r, block) => ({ block, rid: r.__rid ?? '?', name: nameOf(r), value: valueOf(r) }));
  };
  P.rvRoot = (leaf, block) => {
    const scope = leaf.view.containerEl.querySelector('.markdown-reading-view');
    return scope ? topRoots(scope)[block] ?? null : null;
  };
  P.hosts = (path) =>
    reg
      .liveEntries()
      .filter((e) => e.host.sourcePath === path)
      .map((e) => ({ rid: e.root.__rid, pane: P.paneOf(e.root), known: cv(e.host.lastKnownBody), lastWrite: e.host.lastWriteLineStart }));
  /** The DSE update listener among this editor's update listeners (the bundle keeps the `reconcile(` call and `docChanged`). */
  P.dseListener = (cm) => {
    const fns = cm.state.facet(cm.constructor.updateListener);
    return fns.find((f) => /docChanged/.test(String(f)) && /\.reconcile\(/.test(String(f))) ?? null;
  };
  const stats = (xs) => {
    const s = xs.slice().sort((a, b) => a - b);
    const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return { n: s.length, mean: +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(4), p50: +q(0.5).toFixed(4), p95: +q(0.95).toFixed(4), max: +s[s.length - 1].toFixed(4) };
  };
  P.stats = stats;
  /** Time the DSE listener alone, called with this editor's view and a document text that differs every call (so the split cache misses, as when typing). */
  P.timeListener = (cm, n) => {
    const fn = P.dseListener(cm);
    if (!fn) return { listener: false };
    let k = 0;
    const view = {
      dom: cm.dom,
      posAtDOM: (node, off) => cm.posAtDOM(node, off),
      state: { doc: { lineAt: (p) => cm.state.doc.lineAt(p), toString: () => cm.state.doc.toString() + (k++ % 2 ? '' : '\n') } },
    };
    const before = P.n;
    const xs = [];
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      fn({ docChanged: true, state: cm.state, view });
      xs.push(performance.now() - t0);
    }
    return { listener: true, ...stats(xs), releases: P.log.filter((x) => x.n > before && x.ev === 'release').length };
  };
  /** Real keystrokes (dispatched transactions) at `pos`; per-dispatch wall time. */
  P.timeTyping = (cm, pos, n) => {
    const xs = [];
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      cm.dispatch({ changes: { from: pos + i, insert: 'x' }, userEvent: 'input.type' });
      xs.push(performance.now() - t0);
    }
    return stats(xs);
  };
  /** Per-pass cost of each piece of reusedBlockBody(…, scope) over the entries in this editor (ms per pass, averaged over 20 passes). */
  P.profile = (cm, path) => {
    const text = cm.state.doc.toString();
    const lines = text.split(/\r\n|\r|\n/);
    const linesOf = () => lines;
    const scope = { view: cm, text };
    const ents = reg.liveEntries().filter((e) => e.host.sourcePath === path && cm.dom.contains(e.root));
    const acc = { widget: 0, gsi: 0, section: 0, ordinal: 0, full: 0, split: 0 };
    const R = 20;
    if (!ents.length || typeof ents[0].host.livePreviewCalloutSection !== 'function') return { entries: ents.length, methods: false };
    for (let rep = 0; rep < R; rep++) {
      let t0 = performance.now();
      text.split(/\r\n|\r|\n/);
      acc.split += performance.now() - t0;
      for (const e of ents) {
        const h = e.host;
        t0 = performance.now();
        h.livePreviewCalloutWidget();
        acc.widget += performance.now() - t0;
        const tg = h.remountTarget();
        t0 = performance.now();
        tg.ctx.getSectionInfo(tg.el);
        acc.gsi += performance.now() - t0;
        t0 = performance.now();
        h.livePreviewCalloutSection(scope, linesOf);
        acc.section += performance.now() - t0;
        t0 = performance.now();
        h.domOrdinal();
        acc.ordinal += performance.now() - t0;
        t0 = performance.now();
        h.reusedBlockBody(linesOf, scope);
        acc.full += performance.now() - t0;
      }
    }
    for (const k of Object.keys(acc)) acc[k] = +(acc[k] / R).toFixed(3);
    acc.entries = ents.length;
    return acc;
  };
  // ---- r5: time each editor pass in the REAL listener path (reusedBlockBody is called with the pass's scope object)
  P.passes = [];
  P.passMap = new WeakMap();
  P.gsi = { calls: 0, nonNull: 0, textDiff: 0, passes: 0, mixedPasses: 0, mixedSamples: [], samples: [], byPath: {} };
  P.gsiPass = new WeakMap();
  P.gsiSummary = () => JSON.parse(JSON.stringify(P.gsi));
  P.gsiProbe = (h, linesOf, scope) => {
    if (!h.livePreviewCalloutWidget()) return;
    const tg = h.remountTarget();
    let g;
    try { g = tg.ctx.getSectionInfo(tg.el); } catch (e) { g = 'throw'; }
    const G = P.gsi;
    G.calls++;
    const bp = (G.byPath[h.sourcePath] ??= { calls: 0, nonNull: 0, textDiff: 0 });
    bp.calls++;
    let key, src;
    if (g && g !== 'throw') {
      G.nonNull++; bp.nonNull++;
      const same = g.text === scope.text;
      if (!same) { G.textDiff++; bp.textDiff++; }
      src = same ? 'gsi-same' : 'gsi-diff';
      key = g.lineStart + ':' + g.lineEnd;
      if (G.samples.length < 12) G.samples.push({ rid: tg.el.closest('[data-dse-element]')?.__rid ?? tg.el.querySelector('[data-dse-element]')?.__rid ?? '?', ls: g.lineStart, le: g.lineEnd, same, textLen: g.text.length, editorLen: scope.text.length });
    } else {
      const sec = h.livePreviewCalloutSection(scope, linesOf);
      if (!sec) return;
      src = 'editor';
      key = sec.lineStart + ':' + sec.lineEnd;
    }
    let m = P.gsiPass.get(scope);
    if (!m) { m = new Map(); P.gsiPass.set(scope, m); G.passes++; m.mixed = false; }
    const set = m.get(key) ?? new Set();
    set.add(src);
    m.set(key, set);
    if (!m.mixed && set.has('editor') && set.has('gsi-diff')) { m.mixed = true; G.mixedPasses++; if (G.mixedSamples.length < 6) G.mixedSamples.push({ key, srcs: [...set] }); }
  };
  P.patchRBB = () => {
    const e = reg.liveEntries()[0];
    if (!e) return 'no entry';
    return P.patchProto(Object.getPrototypeOf(e.host));
  };
  P.patchProto = (proto) => {
    if (proto.__r5patched) return 'already';
    const orig = proto.reusedBlockBody;
    proto.reusedBlockBody = function (linesOf, scope) {
      if (!scope) return orig.call(this, linesOf, scope);
      if (P.gsiOn) { try { P.gsiProbe(this, linesOf, scope); } catch (e) { P.gsi.err = String(e); } }
      const t0 = performance.now();
      try {
        return orig.call(this, linesOf, scope);
      } finally {
        const dt = performance.now() - t0;
        let p = P.passMap.get(scope);
        if (!p) {
          p = { ms: 0, n: 0 };
          P.passMap.set(scope, p);
          P.passes.push(p);
        }
        p.ms += dt;
        p.n++;
      }
    };
    proto.__r5patched = true;
    return 'patched';
  };
  P.passStats = (from) => {
    const ps = P.passes.slice(from);
    if (!ps.length) return { passes: 0 };
    return { passes: ps.length, entriesPerPass: Math.max(...ps.map((p) => p.n)), ...stats(ps.map((p) => p.ms)) };
  };
  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
  /** Typing, cursor moves and scrolling in this editor: wall time per dispatch / per frame, and the editor passes they caused. */
  P.costRun = async (cm, scrollStep, scrollFrames) => {
    const out = {};
    let k = P.passes.length;
    out.typing = P.timeTyping(cm, cm.state.doc.length, 200);
    out.typingPasses = P.passStats(k);
    await new Promise((r) => setTimeout(r, 500));
    const sc = cm.scrollDOM;
    // cursor moves (selection-only updates) over the lines on screen
    const vpFrom = cm.state.doc.lineAt(cm.viewport.from).number;
    const vpTo = cm.state.doc.lineAt(cm.viewport.to).number;
    k = P.passes.length;
    const xs = [];
    for (let i = 0; i < 100; i++) {
      const ln = vpFrom + (i % Math.max(1, vpTo - vpFrom));
      const t0 = performance.now();
      cm.dispatch({ selection: { anchor: cm.state.doc.line(ln).from } });
      xs.push(performance.now() - t0);
    }
    out.cursor = { lines: [vpFrom, vpTo], ...stats(xs) };
    out.cursorPasses = P.passStats(k);
    cm.dispatch({ selection: { anchor: 0 } });
    sc.scrollTop = 0;
    await new Promise((r) => setTimeout(r, 600));
    k = P.passes.length;
    const frames = [];
    await raf();
    let last = performance.now();
    for (let i = 0; i < scrollFrames; i++) {
      sc.scrollTop += scrollStep;
      await raf();
      const now = performance.now();
      frames.push(now - last);
      last = now;
    }
    out.scrollFrames = { endScrollTop: Math.round(sc.scrollTop), ...stats(frames) };
    out.scrollPasses = P.passStats(k);
    return out;
  };
  /** Scroll in steps, one per frame; on every frame record the scrollTop and each drawn card's value against `disk`. */
  P.scrollCheck = async (cm, disk, step, maxFrames) => {
    const sc = cm.scrollDOM;
    const bad = [];
    let frames = 0;
    const jumps = [];
    for (let i = 0; i < maxFrames; i++) {
      const want = Math.min(sc.scrollTop + step, sc.scrollHeight - sc.clientHeight);
      sc.scrollTop = want;
      await raf();
      frames++;
      if (Math.abs(sc.scrollTop - want) > 1) jumps.push([i, Math.round(want), Math.round(sc.scrollTop)]);
      for (const c of P.cards(cm)) if (c.block < 0 || c.value !== disk[c.block]) bad.push({ frame: i, block: c.block, rid: c.rid, value: c.value, disk: disk[c.block] });
      if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1 && step > 0) break;
      if (sc.scrollTop <= 0 && step < 0) break;
    }
    return { frames, bad: bad.slice(0, 20), nBad: bad.length, jumps: jumps.slice(0, 10), nJumps: jumps.length };
  };
  /** Walk the cursor down every `every`-th line (selection-only updates), checking the drawn cards against `disk` each step. */
  P.cursorWalk = async (cm, disk, every) => {
    const bad = [];
    let steps = 0;
    for (let ln = 1; ln <= cm.state.doc.lines; ln += every) {
      cm.dispatch({ selection: { anchor: cm.state.doc.line(ln).from }, scrollIntoView: true });
      await raf();
      steps++;
      for (const c of P.cards(cm)) if (c.block < 0 || c.value !== disk[c.block]) bad.push({ line: ln, block: c.block, rid: c.rid, value: c.value, disk: disk[c.block] });
    }
    return { steps, bad: bad.slice(0, 20), nBad: bad.length };
  };
  /** How many live DSE entries the editor pass judges: in this editor's DOM and in a callout widget. */
  P.judged = (cm, path) => {
    const live = reg.liveEntries().filter((e) => e.host.sourcePath === path);
    const inDom = live.filter((e) => cm.dom.contains(e.root));
    const callout = inDom.filter((e) => e.root.closest('.cm-embed-block.cm-callout'));
    return { live: live.length, inEditorDom: inDom.length, inCalloutWidget: callout.length, docChars: cm.state.doc.length, docLines: cm.state.doc.lines };
  };
  return 'installed';
})()
