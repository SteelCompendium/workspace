#!/usr/bin/env python3
# Insert a TEMPORARY reviewer test into twin-reuse.test.ts (the SC-537 describe, where `lp` lives). Restored by git checkout afterwards.
import sys
p = sys.argv[1]
s = open(p).read()
anchor = "\t// SC-544: the click on the middle callout comes before the upper's write."
assert anchor in s
t = r"""	test('R2-LIFETIME: a count-preserving edit inside the callout between two passes (fences move, window bounds do not)', async () => {
		const both = callout(['X', 5], ['Y', 3]);
		const note = noteOf(both, both);
		const t = await lp(note);
		const upper = await t.draw(0, 2);
		await t.draw(1, 2);
		await t.update(); // pass 1 reads the windows' fences
		expect(t.registry.liveEntries().filter((e) => e.releasedBy).length).toBe(0);
		// the edit: X loses its min_value line, Y gains a comment line - Y's fence moves up one line, the window keeps its lines
		const lines = note.split('\n');
		const xMin = lines.indexOf('> min_value: 0');
		const yOpen = lines.indexOf('> ```ds-counter', xMin);
		const edited = [...lines.slice(0, xMin), ...lines.slice(xMin + 1, yOpen + 1), '> # c', ...lines.slice(yOpen + 1)].join('\n');
		expect(edited.split('\n').length).toBe(lines.length);
		t.app.vault.setFile('Note.md', edited);
		t.syncEditor();
		await t.update(); // pass 2
		const released = t.registry.liveEntries().filter((e) => e.releasedBy).length;
		const shownNow = upper.els.map((el) => `${shown(el)}|${(el.textContent ?? '').includes('```')}`);
		console.log(`R2-LIFETIME released=${released} shown=${JSON.stringify(shownNow)}`);
		expect(shownNow).toEqual(['X=5|false', 'Y=3|false']);
	});

"""
s = s.replace(anchor, t + anchor, 1)
open(p, 'w').write(s)
print('inserted')
