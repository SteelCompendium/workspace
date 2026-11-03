#!/usr/bin/env python3
# Scratch copy of the CURRENT lifecycle harness (visual-harness/obsidian-lifecycle.mjs) with the SC-537 r5 cost probe injected.
# SC-547: the scenario gains cost-n<N> cases (one callout, N counters) for the scaling sweep. The tracked harness is never touched.
import sys
S = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r1-impl-a1'
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
Object.assign(FIXTURES, {
	'Probe537/cross.md': `# cross\n\nTOP\n\n${QUOTED(['[!note] Camp'])}\n\nMID\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n`,
	'Probe537/many.md': `# many\n\nTOP\n\n${Array.from({ length: 30 }, (_, i) => `${QUOTED(['[!note] Camp'])}\n\n${R3_PARAS(8, 'gap' + i)}`).join('\n\n')}\n\nBOTTOM\n`,
	'Probe537/large.md': R3_LARGE(),
	'Probe537/bigcallout.md': R3_BIG(40),
	'Probe537/big10.md': R3_BIG(10),
	'Probe537/big20.md': R3_BIG(20),
	'Probe537/big80.md': R3_BIG(80),
	'Probe537/big160.md': R3_BIG(160),
});
"""
rep("// ------------------------------------------------------------------ note integrity", fx + "\n// ------------------------------------------------------------------ note integrity")
probe = open(S + '/r3-scenario.mjs').read()

def prep(a, b):
    global probe
    assert a in probe, a[:60]
    probe = probe.replace(a, b)

prep("['cost-big', 'cost-large', 'many-scroll', 'many-write', 'far-frames'].includes(name)", "(['cost-big', 'cost-large', 'many-scroll', 'many-write', 'far-frames'].includes(name) || /^cost-n\\d+$/.test(name))")
prep("const rel = { 'cost-big': 'Probe537/bigcallout.md',", "const rel = /^cost-n\\d+$/.test(name) ? `Probe537/big${name.slice(6)}.md` : { 'cost-big': 'Probe537/bigcallout.md',")
prep("if (name === 'cost-big' || name === 'cost-large') {", "const isBig = name === 'cost-big' || /^cost-n\\d+$/.test(name);\n\t\t\t\t\t\tconst nBlocks = name === 'cost-big' ? 40 : isBig ? Number(name.slice(6)) : 0;\n\t\t\t\t\t\tif (isBig || name === 'cost-large') {")
prep("if (name === 'cost-big') { await scrollToBlock(LA, 20);", "if (isBig) { await scrollToBlock(LA, nBlocks / 2);")
prep("window.__r537.costRun(${CMA}, ${name === 'cost-big' ? 40 : 120}, ${name === 'cost-big' ? 120 : 150})", "window.__r537.costRun(${CMA}, ${isBig ? 40 : 120}, ${isBig ? 120 : 150})")
anchor = "\n];\n\n// ---------------------------------------------------------------------------- main"
rep(anchor, "\n" + probe.rstrip('\n') + anchor)
open(S + '/harness-r547.mjs', 'w').write(s)
print('built')
