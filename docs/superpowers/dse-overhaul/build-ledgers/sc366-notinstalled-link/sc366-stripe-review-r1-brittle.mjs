// Faithful JS port of the two new tests in test/dom/theme/notInstalledLinkColour.test.ts
// (describe 'SC-366 — the ds-scc degrade cards have no left stripe'), run against mutated
// COPIES of styles-source.css — never the worktree file.
import fs from 'fs';
const orig = fs.readFileSync(process.argv[2], 'utf8');
function run(rawCss) {
	const noComments = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
	const cardRules = [...noComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
		.map((m) => ({ sel: m[1].trim(), body: m[2] }))
		.filter((r) => /\.dse-ref-notice(?![\w-])|\.dse-ref-web-card(?![\w-])/.test(r.sel));
	const root = cardRules.filter((r) => r.sel === '.dse-ref-notice');
	const t1 = root.length === 1 && /border:\s*1px solid var\(--background-modifier-border\);/.test(root[0].body);
	const t2 = cardRules.every((r) => !/border-(left|inline-start)\b/.test(r.body));
	return [t1, t2];
}
const ROOT = '.dse-ref-notice {\n\tbackground-color: var(--background-secondary);\n\tborder: 1px solid var(--background-modifier-border);\n';
if (!orig.includes(ROOT)) throw new Error('root rule shape not found');
const addToRoot = (decl) => (s) => s.replace(ROOT, ROOT + '\t' + decl + '\n');
const appendRule = (rule) => (s) => s + '\n' + rule + '\n';
const muts = {
	'unmodified': (s) => s,
	// --- the regression itself, and close variants
	'BITE: border-left: 3px solid var(--color-blue) restored': addToRoot('border-left: 3px solid var(--color-blue);'),
	'border-left-width: 3px + border-left-color': addToRoot('border-left-width: 3px; border-left-color: var(--color-blue);'),
	'border-inline-start: 3px solid blue': addToRoot('border-inline-start: 3px solid var(--color-blue);'),
	'stripe in a scoped rule ([steel] .dse-ref-notice)': appendRule(`[data-dse-theme='steel'] .dse-ref-notice { border-left: 3px solid var(--dse-accent); }`),
	'stripe on .dse-ref-web-card only, inside @media': appendRule('@media (min-width: 1px) { .dse-ref-web-card { border-left: 4px solid red; } }'),
	// --- other stripe devices
	'box-shadow: inset 3px 0 0 blue': addToRoot('box-shadow: inset 3px 0 0 var(--color-blue);'),
	'::before bar (absolute, 3px wide, blue)': (s) => addToRoot('position: relative;')(s) + "\n.dse-ref-notice::before { content: ''; position: absolute; inset-block: 0; left: 0; width: 3px; background: var(--color-blue); }\n",
	'border-width: 1px 1px 1px 3px + border-color 4-value': addToRoot('border-width: 1px 1px 1px 3px; border-color: grey grey grey var(--color-blue);'),
	'background-image gradient stripe': addToRoot('background-image: linear-gradient(to right, var(--color-blue) 3px, transparent 3px);'),
	'stripe on a child (.dse-ref-notice__msg border-left)': appendRule('.dse-ref-notice__msg { border-left: 3px solid var(--color-blue); padding-left: 8px; }'),
	// --- harmless edits (over-brittleness)
	'harmless: border-left: none': addToRoot('border-left: none;'),
	'harmless: reorder declarations in the root rule': (s) => s.replace(ROOT, '.dse-ref-notice {\n\tborder: 1px solid var(--background-modifier-border);\n\tbackground-color: var(--background-secondary);\n'),
	'harmless: extra space in border value': (s) => s.replace(ROOT, ROOT.replace('border: 1px solid', 'border: 1px  solid')),
	'harmless: border shorthand reordered (solid 1px)': (s) => s.replace(ROOT, ROOT.replace('border: 1px solid', 'border: solid 1px')),
	'harmless: root selector scoped (:is(.dse-ref-notice))': (s) => s.replace(ROOT, ROOT.replace('.dse-ref-notice {', ':is(.dse-ref-notice) {')),
	'harmless: unrelated rule .dse-ref-notice__hint border-left': appendRule('.dse-ref-notice__hint { border-left: 0; }'),
	'harmless: .dse-ref-notice-x sibling class with border-left': appendRule('.dse-ref-notice-x { border-left: 3px solid red; }'),
};
for (const [name, f] of Object.entries(muts)) {
	const m = f(orig);
	if (name !== 'unmodified' && m === orig) { console.log(name.padEnd(58), 'MUTATION DID NOT APPLY'); continue; }
	const [t1, t2] = run(m);
	console.log(name.padEnd(58), '[root-rule, no-stripe] =', t1 ? 'pass' : 'FAIL', t2 ? 'pass' : 'FAIL');
}
