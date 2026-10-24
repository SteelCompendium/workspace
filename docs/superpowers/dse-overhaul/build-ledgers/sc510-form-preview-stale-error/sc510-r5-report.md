# SC-510 r5 report (test-only fold)
- STATUS: DONE. New dse tip 08c086c (on 2d01bd8); superproject unchanged (088bbc9), pointer unbumped.
- Added one assertion to test/dom/authoring/formModalStalePreview.test.ts after the card-text check (line 277), reviewer's text verbatim: `expect(form.preview.querySelector(':scope > .dse-form__preview-slot > .dse-error-card')).toBe(card);`. The test sits in a describe.each, so it covers feature and statblock.
- Mutant R2 (FormModal.ts:465 `renderErrorCard(this.previewEl as HTMLElement, this.def, error)` instead of `slot`): file run `Tests: 2 failed, 19 passed, 21 total` (feature + statblock error-card tests), failing line `> 277 | expect(form.preview.querySelector(':scope > .dse-form__preview-slot > .dse-error-card')).toBe(card)` / `Received: null`. Restored with git checkout; tree clean apart from the pointer.
- Gates on 08c086c: tsc rc 0; lint rc 0; jest 6099 passed / 1 skipped / 246 of 247 suites.
- Logs (ledger dir): sc510-r5-tsc.log, sc510-r5-lint.log, sc510-r5-jest.log, sc510-r5-mutant-R2.log.
Drive-by fixes: none. Follow-ups: none.
