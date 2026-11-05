// Faithful JS port of test/dom/theme/notInstalledLinkColour.test.ts's parsing + assertions,
// run against mutated copies of styles-source.css (never the worktree file).
import fs from 'fs';
const orig = fs.readFileSync(process.argv[2], 'utf8');
const GATE = `[data-dse-theme='steel']:not([data-dse-print="on"])`;
function run(rawCss) {
	const familyStart = rawCss.indexOf('In-card link color (SC-10 Task 1');
	const familyEnd = rawCss.indexOf('Plan 24 / SC-100 Task 3', familyStart);
	const family = rawCss.slice(familyStart, familyEnd).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[^{}]*?(?=\[data-dse-theme)/, '').replace(/\s+/g, ' ');
	const res = [];
	res.push(familyStart > 0 && familyEnd > familyStart);
	for (const hover of [false, true]) {
		try {
			const anchor = `${GATE} .dse-card a${hover ? ':hover' : ''}`;
			const rules = [...family.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2].trim() }));
			const match = rules.filter((r) => r.sel.split(',').map((s) => s.trim()).includes(anchor));
			if (match.length !== 1) throw new Error('match ' + match.length);
			if (!match[0].body.includes('color: var(--dse-accent);')) throw new Error('body');
			const sels = match[0].sel.split(',').map((s) => s.trim());
			res.push(sels.includes(`${GATE} a.dse-ref-web-card__link${hover ? ':hover' : ''}`));
		} catch (e) { res.push(false); }
	}
	return res;
}
const G = GATE + ' ';
const ours = G + 'a.dse-ref-web-card__link';
const muts = {
	'unmodified': (s) => s,
	'BITE: both selectors removed': (s) => s.replace(',\n' + ours + ' {', ' {').replace(',\n' + ours + ':hover {', ' {'),
	'reorder: ours moved first in both lists': (s) => s
		.replace(G + '.dse-feature a,\n', ours + ',\n' + G + '.dse-feature a,\n').replace(',\n' + ours + ' {', ' {')
		.replace(G + '.dse-feature a:hover,\n', ours + ':hover,\n' + G + '.dse-feature a:hover,\n').replace(',\n' + ours + ':hover {', ' {'),
	'whitespace: tabs/blank lines between selectors': (s) => s.replace(',\n' + ours + ' {', ' ,\n\n\t' + ours + '  {').replace(',\n' + ours + ':hover {', ',\t\t' + ours + ':hover\n{'),
	'whitespace: all on one line': (s) => s.replace(/(\[data-dse-theme='steel'\]:not\(\[data-dse-print="on"\]\) \.dse-feature a,)\n/, '$1 ').replace(/\.dse-sb a,\n/, '.dse-sb a, '),
	'comment inside the selector list': (s) => s.replace(',\n' + ours + ' {', ',\n/* SC-366 */ ' + ours + ' {'),
	'unrelated rule added between family and next banner': (s) => s.replace('/*  Plan 24 / SC-100 Task 3', '.dse-new-thing { color: red; }\n/*  Plan 24 / SC-100 Task 3'),
	'next section banner text renamed (unrelated section)': (s) => s.replace('/*  Plan 24 / SC-100 Task 3', '/*  Plan 24 / SC-100 step 3'),
	'family banner text reworded': (s) => s.replace('In-card link color (SC-10 Task 1', 'In-card link colour (SC-10 Task 1'),
	'our selector double-quoted steel attr (same meaning)': (s) => s.replace(ours + ' {', `[data-dse-theme="steel"]:not([data-dse-print="on"]) a.dse-ref-web-card__link {`),
	'ours split into its own rule (same meaning)': (s) => s.replace(',\n' + ours + ' {', ' {').replace('/*  Plan 24 / SC-100 Task 3', ours + ' {\n\tcolor: var(--dse-accent);\n}\n/*  Plan 24 / SC-100 Task 3'),
	'r1 form (.dse-ref-web-card__link, no a)': (s) => s.replace(ours + ' {', G + '.dse-ref-web-card__link {').replace(ours + ':hover {', G + '.dse-ref-web-card__link:hover {'),
	'rest rule colour changed to --text-accent': (s) => { const i = s.indexOf(ours + ' {'); return s.slice(0, i) + s.slice(i).replace('color: var(--dse-accent);', 'color: var(--text-accent);'); },
	'print gate dropped from ours': (s) => s.replace(ours + ' {', `[data-dse-theme='steel'] a.dse-ref-web-card__link {`),
};
for (const [name, f] of Object.entries(muts)) {
	const m = f(orig);
	const changed = m !== orig;
	const r = run(m);
	console.log(name.padEnd(56), changed || name === 'unmodified' ? '' : '(MUTATION DID NOT APPLY) ', 'tests [block, rest, hover] =', r.map((x) => (x ? 'pass' : 'FAIL')).join(' '));
}
