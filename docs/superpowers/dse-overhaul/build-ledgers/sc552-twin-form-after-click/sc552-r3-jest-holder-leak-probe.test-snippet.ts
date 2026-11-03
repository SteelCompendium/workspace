describe('SC-552 r3 reviewer probe: a form that already closed is never kept open', () => {
	const PIN = { text: 'note text', lineStart: 3 };
	test('Save (or Cancel) closes the form; its view unloading LATER (the Save redraws the block) adds no holder', async () => {
		const holder = new Component();
		holder.load();
		const replaceSource = jest.fn(async () => true);
		const cx = {
			app: new App(),
			host: {
				mode: 'reading', sourcePath: 'N.md', containerEl: document.createElement('div'), canPersist: true,
				addChild: <T,>(c: T) => c, getBlockInfo: () => null, blockKey: () => 'k', replaceSource,
				pinPosition: () => PIN, keepFormOpenOn: () => holder,
			},
			prefs: { descriptors: () => [] },
		} as never;
		const counts: number[] = [];
		for (let i = 0; i < 5; i++) {
			const owner = fakeOwner();
			const modal = openFormEditor(owner, cx, schemaDef(), 'name: Goblin', createValidationService());
			if (i % 2 === 0) await modal.save(); else modal.close();
			expect(document.body.contains(modal.containerEl)).toBe(false);
			owner.unload(); // Obsidian redraws the block after the Save (or later: an outside edit, a twin redraw)
			counts.push((holder as unknown as { _children: unknown[] })._children.length);
		}
		expect(counts).toEqual([0, 0, 0, 0, 0]);
	});
});
