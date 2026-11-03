#!/usr/bin/env python3
# SC-547 r2 reviewer: scratch copy of the CURRENT lifecycle harness with the SC-537 r5 probe scenario (+ r1's cost-n cases)
# and an r2 getSectionInfo probe (R537_GSI=1) and an `embed` case. The tracked harness is never touched.
R = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r4-rereview-r2q7'
P = '/home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf/draw-steel-elements'
s = open(P + '/visual-harness/obsidian-lifecycle.mjs').read()


def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)


rep("'../scripts/cdp-owned.mjs'", "'%s/scripts/cdp-owned.mjs'" % P)
rep("'../scripts/xvfb-owned.mjs'", "'%s/scripts/xvfb-owned.mjs'" % P)
rep("const dir = path.dirname(fileURLToPath(import.meta.url));", "const dir = '%s/visual-harness';" % P)
rep("const shotsDir = path.join(work, 'shots');", "const shotsDir = path.join(process.env.R537_OUT, 'shots');")
rep("\t\tif (fs.existsSync(shotsDir)) {\n\t\t\tconsole.log(`OBSIDIAN-LIFECYCLE temp dir kept", "\t\tif (false) {\n\t\t\tconsole.log(`OBSIDIAN-LIFECYCLE temp dir kept")
fx = r"""
const R3_PARAS = (n, tag) => Array.from({ length: n }, (_, i) => `Paragraph ${tag} ${i}.`).join('\n\n');
const R3_LARGE = () => {
	const parts = ['# large', ''];
	for (let i = 0; i < 150; i++) parts.push(`Paragraph ${i}.`, '', QUOTED([`[!note] C${i}`], 5, `N${i}`), '');
	for (let i = 0; i < 1500; i++) parts.push(`Prose line ${i} lorem ipsum dolor sit amet, consectetur adipiscing elit.`);
	return parts.join('\n') + '\n';
};
const R3_BIG = (n = 40) => {
	const inner = ['[!note] Big'];
	for (let i = 0; i < n; i++) inner.push(...(i ? [''] : []), '```ds-counter', ...counterLines(5, `B${i}`), '```');
	return `# big\n\n${R3_PARAS(40, 'above')}\n\n${inner.map((l) => (l === '' ? '>' : `> ${l}`)).join('\n')}\n\n${R3_PARAS(40, 'below')}\n`;
};
const R4_MIX = () => ['[!note] Camp', '```ds-counter', ...counterLines(5, 'A'), '```', '', '```ds-counter', ...counterLines(5, 'B'), '```', '', '```ds-ct', ...counterLines(5, 'C'), '```', '', '```ds-ct', ...counterLines(5, 'D'), '```'].map((l) => (l === '' ? '>' : `> ${l}`)).join('\n');
Object.assign(FIXTURES, {
	'Probe537/cross.md': `# cross\n\nTOP\n\n${QUOTED(['[!note] Camp'])}\n\nMID\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n`,
	'Probe537/far.md': `# far\n\nTOP\n\n${QUOTED(['[!note] Camp'])}\n\n${R3_PARAS(150, 'mid')}\n\n${QUOTED(['[!note] Camp'])}\n\nBOTTOM\n`,
	'Probe537/farplain.md': `# farplain\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\n${R3_PARAS(150, 'mid')}\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n`,
	'Probe537/many.md': `# many\n\nTOP\n\n${Array.from({ length: 30 }, (_, i) => `${QUOTED(['[!note] Camp'])}\n\n${R3_PARAS(8, 'gap' + i)}`).join('\n\n')}\n\nBOTTOM\n`,
	// r2: a callout (A, doc lines 2-8) and an embedded section whose callout (B) sits at lines 2-8 of the EMBED's text, with its fence one line lower
	'Probe537/collide.md': ['# collide', '', '> [!note] A', '> ```ds-counter', '> name: Alpha', '> current_value: 5', '> max_value: 20', '> min_value: 0', '> ```', '', '## Section', '', '> [!note] B', '>', '> ```ds-counter', '> name: Beta', '> current_value: 3', '> max_value: 20', '> ```', '', '## Other', '', '> [!note] Mirror', '> ![[collide#Section]]', '', 'BOTTOM', ''].join('\n'),
	// r4: a callout with two blocks of each of two aliases (ds-counter, ds-ct), twice (identical callouts); and far apart
	'Probe537/mix.md': `# mix\n\nTOP\n\n${R4_MIX()}\n\nMID\n\n${R4_MIX()}\n\nBOTTOM\n`,
	'Probe537/mixfar.md': `# mixfar\n\nTOP\n\n${R4_MIX()}\n\n${R3_PARAS(120, 'mid')}\n\n${R4_MIX()}\n\nBOTTOM\n`,
	'Probe537/large.md': R3_LARGE(),
	'Probe537/bigcallout.md': R3_BIG(40),
	// r2: a callout that embeds a section of its own note (the embedded copy is drawn inside the Mirror callout widget)
	'Probe537/embed.md': `# embed\n\n## Section\n\n${QUOTED(['[!note] Camp'])}\n\n## Other\n\n> [!note] Mirror\n> ![[embed#Section]]\n\nBOTTOM\n`,
});
"""
rep("// ------------------------------------------------------------------ note integrity", fx + "\n// ------------------------------------------------------------------ note integrity")
probe = open(R + '/r3-scenario.base.mjs').read()


def prep(a, b):
    global probe
    assert a in probe, a[:60]
    probe = probe.replace(a, b)


# r1's cost-n<N> extension (kept for parity with r1's harness)
prep("['cost-big', 'cost-large', 'many-scroll', 'many-write', 'far-frames'].includes(name)", "(['cost-big', 'cost-large', 'many-scroll', 'many-write', 'far-frames', 'embed', 'collide'].includes(name) || /^cost-n\\d+$/.test(name))")
prep("const rel = { 'cost-big': 'Probe537/bigcallout.md',", "const rel = /^cost-n\\d+$/.test(name) ? `Probe537/big${name.slice(6)}.md` : { 'embed': 'Probe537/embed.md', 'collide': 'Probe537/collide.md', 'cost-big': 'Probe537/bigcallout.md',")
# r2: gsi probe switch right after the instrumentation is installed
prep("res.instr = await t.ev(fs.readFileSync(process.env.R537_INSTR, 'utf8'));", "res.instr = await t.ev(fs.readFileSync(process.env.R537_INSTR, 'utf8'));\n\t\t\tif (process.env.R537_GSI) res.gsiOn = await t.ev('(window.__r537.gsiOn = true)');")
# r2: per-case gsi summary in the saved json
prep("save();\n\t\t\t\t\tcontinue;", "res.gsi = await t.ev('window.__r537.gsiSummary ? window.__r537.gsiSummary() : null');\n\t\t\t\t\tsave();\n\t\t\t\t\tcontinue;")
prep("\t\t\t\tsave();\n\t\t\t}\n\t\t\tawait t.ev(`${prefs}.set('authoringControls', false)`);", "\t\t\t\tres.gsi = await t.ev('window.__r537.gsiSummary ? window.__r537.gsiSummary() : null');\n\t\t\t\tsave();\n\t\t\t}\n\t\t\tawait t.ev(`${prefs}.set('authoringControls', false)`);")
# r2: the embed case: scroll, walk the cursor, type inside the embedded section's callout (editor ahead of Obsidian's text), save
embed = r"""} else if (name === 'embed' || name === 'collide') {
							r.judged = await t.ev(`window.__r537.judged(${CMA}, ${J(rel)})`);
							r.embedDom = await t.ev(`(() => { const cm = ${CMA}; const w = Array.from(cm.contentDOM.querySelectorAll('.cm-embed-block.cm-callout')); return w.map((x) => ({ cls: x.className, embeds: x.querySelectorAll('.internal-embed, .markdown-embed').length, counters: x.querySelectorAll('[data-dse-element=\"counter\"]').length })); })()`);
							const disk = t.counterValues(rel);
							r.walk = await t.ev(`window.__r537.cursorWalk(${CMA}, ${J(disk)}, 1)`);
							const ln = lineIndex(rel, /^> name: \w+$/);
							await typeText(LA, ln, 12, 'Q');
							await t.sleep(300);
							r.afterType = await t.ev(`window.__r537.gsiSummary()`);
							await typeText(LA, ln, 13, '\b');
							await t.sleep(300);
							await saveView(LA);
							await t.sleep(1500);
							await park();
							r.reused = await reusedSince();
							r.final = await picture(rel);
							r.widgetText = await t.ev(`(() => Array.from(${CMA}.contentDOM.querySelectorAll('.cm-embed-block.cm-callout')).map((x) => x.innerText.replace(/\\s+/g, ' ').slice(0, 240)))()`);
							r.events = await t.ev(`window.__r537.log.filter((x) => x.ev === 'release' || x.ev === 'own')`);
						}"""
prep("} else if (name === 'far-frames') {", embed + " else if (name === 'far-frames') {")

prep("'far-up-from-low': {", """'mix-ct-2': seqCase('Probe537/mix.md', [5, 5, 5, 5, 5, 5, 5, 5], [2, 6]),
				'mix-ct-3': seqCase('Probe537/mix.md', [5, 5, 5, 5, 5, 5, 5, 5], [3, 7, 2]),
				'mix-counter-0': seqCase('Probe537/mix.md', [5, 5, 5, 5, 5, 5, 5, 5], [0, 4]),
				'mixfar-ct': { rel: 'Probe537/mixfar.md', partial: true, steps: [{ k: 'click', b: 2, want: [5, 5, 6, 5, 5, 5, 5, 5] }, { k: 'scroll', b: 6 }, { k: 'check', want: [5, 5, 6, 5, 5, 5, 5, 5] }, { k: 'click', b: 6, want: [5, 5, 6, 5, 5, 5, 6, 5], noPark: true }, { k: 'scroll', b: 2 }, { k: 'check', want: [5, 5, 6, 5, 5, 5, 6, 5] }] },
				'far-up-from-low': {""")
prep("'far-frames', 'embed', 'collide'].includes(name)", "'far-frames', 'embed', 'collide', 'mix-walk'].includes(name)")
prep("{ 'embed': 'Probe537/embed.md',", "{ 'mix-walk': 'Probe537/mixfar.md', 'embed': 'Probe537/embed.md',")
prep("} else if (name === 'many-scroll') {", "} else if (name === 'many-scroll' || name === 'mix-walk') {")
anchor = "\n];\n\n// ---------------------------------------------------------------------------- main"
rep(anchor, "\n" + probe.rstrip('\n') + anchor)
open(R + '/harness-r2.mjs', 'w').write(s)

# instrumentation: the r5 file + an r2 getSectionInfo probe inside the reusedBlockBody wrapper, auto-installed on the first own()
ins = open(R + '/r3-instr.base.js').read()


def irep(a, b):
    global ins
    assert a in ins, a[:60]
    ins = ins.replace(a, b, 1)


irep("    const e = oOwn(view, host, root);\n", "    const e = oOwn(view, host, root);\n    if (P.gsiOn) P.patchProto(Object.getPrototypeOf(host));\n")
irep("""  P.patchRBB = () => {
    const e = reg.liveEntries()[0];
    if (!e) return 'no entry';
    const proto = Object.getPrototypeOf(e.host);
    if (proto.__r5patched) return 'already';""", """  P.gsi = { calls: 0, nonNull: 0, textDiff: 0, passes: 0, mixedPasses: 0, mixedSamples: [], samples: [], byPath: {} };
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
    if (proto.__r5patched) return 'already';""")
irep("""    proto.reusedBlockBody = function (linesOf, scope) {
      if (!scope) return orig.call(this, linesOf, scope);""", """    proto.reusedBlockBody = function (linesOf, scope) {
      if (!scope) return orig.call(this, linesOf, scope);
      if (P.gsiOn) { try { P.gsiProbe(this, linesOf, scope); } catch (e) { P.gsi.err = String(e); } }""")
irep('```ds-counter\\s*$/', '```ds-(?:counter|ct)\\s*$/')
open(R + '/r3-instr.js', 'w').write(ins)
print('built')
