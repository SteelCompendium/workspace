# SC-356 round 3 implementer report

STATUS: DONE
- dse branch sc356-hostleak-modal-buttons @ 2796ab8, rebased onto origin/develop 8d890f9 (re-fetched after the last course correction; tip). 6 commits. Clean tree, on its branch.
- Superproject doc commit f87af93 on origin/main 988f24f (CHANGELOG conflict resolved: kept both Unreleased bullets, SC-432's first, then SC-356's).
- Findings: LOW-1 -> e572c67 (CSS comment) + f87af93 (SKILL.md) + jsdom pin e572c67; LOW-2 -> e572c67; LOW-3 -> 2796ab8; INFO-4 -> 2796ab8; INFO-2 -> f87af93.
- NEW modal reported by the registry after SC-432: FreeHealConfirmModal (the no-pool "Heal without spending a Recovery?" confirmation). Added as a 10th scenario (swept as the topmost dialog, opened over the Stamina modal).
- Full battery green on the final base: jest 5591 (5585 + 6 new), lifecycle 31/31, e2e 95/98 0 failed, shots 580 incl. text-scale lines, freeze 280/280, parity 0/0/24.
- Counts moved only by the new scenario: modal pass 9/8/36/216 -> 10/9/38/228 (+2 kinds: Cancel ghost, Heal accent; +12 comparisons). Gallery unchanged 112/672 (10 exempt); modal exemptions unchanged (6x focus-visible disabled); StaminaEditModal scenario unchanged (stamina-bar:default is a no-pool hero, Heal Recovery Value enabled).

## Per-finding fix
- LOW-1 (e572c67, f87af93): styles-source.css comment now says the class is also worn by in-note `.dse-nt__chip`, that the block is deliberately unscoped, and that `.dse-nt__chip`'s (0,3,0) restatement keeps it; SKILL.md "modal-only and never mounts there" corrected. New jsdom test in hostRegrounding.test.ts pins `.dse-nt__chip`'s display/justify/height/ink/fill declarations and the block's (0,2,0) anchor.
- LOW-2 (e572c67): `display: inline-flex` (Obsidian's value); comment corrected; jsdom pin updated (rejects plain `flex`). Modal pass stays green; injected regression: removing the `display` declaration -> 12 FAIL lines `... change display — "block" without the host, "flex" with it`; restored.
- LOW-3 (2796ab8): `assertModalRegistry` builds a class->parent map over src/ + main.ts, follows `extends` transitively to DseModal/Modal/SuggestModal/FuzzySuggestModal, and flags inline `new Modal(`/`new SuggestModal(` (comments stripped). Probe with a temp src file (`class X extends LogActionModal` + `new Modal(app)`) reported both; temp file deleted, tree clean. Cross-file button-helper detection NOT attempted (per ruling); doc comment says so.
- INFO-4 (2796ab8): CompendiumSearchModal reason reworded: harness can mount its rows through production code for text-scale gates but never opens the modal itself; still no `<button>`.
- INFO-1, INFO-3: dropped/noted per ledger.

## Conflict resolution
- dse rebases (772c3cd -> 95981f1 -> 8d890f9): 0 conflicts in shoot.mjs and styles-source.css; SC-422's text-scale gates and SC-356's host-leak passes both intact (shots log shows `text scale OK (1626 …)`, `text scale once OK (104184 / 208 loads …)` and both host-leak lines).
- Superproject: 1 conflict, CHANGELOG.md `## Unreleased` (both sides added a top bullet) -> kept both. SKILL.md merged cleanly; its numbers were re-edited (10 scenarios / 9 classes / 38 kinds / 228, FreeHealConfirmModal, transitive registry) and checked against the shots log.

## Gates (final head 2796ab8 on 8d890f9; fresh per-run logs)
- tsc (incl. -p e2e): exit 0, no output. lint: exit 0 (only the .eslintignore warning).
- jest: `Test Suites: 1 skipped, 234 passed, 234 of 235 total` / `Tests: 1 skipped, 5591 passed, 5592 total`
- lifecycle: `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed`
- e2e: `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`
- shots: 580 PNGs, exit 0, 0 FAIL. `button host-leak OK (112 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 672 comparisons …)`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons …)`; `100 property difference(s) ALLOWLISTED … (SC-361: .dse-swatch, 10 properties)`; `not openable in the harness (3 …)`; `text scale OK (1626 comparisons …)`; `text scale once OK (104184 comparisons over 208 loads … 142s)`.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
- parity: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`
(An earlier full battery on 95981f1 was also green: jest 5588, lifecycle 31/31, e2e 95/98; superseded by the above.)

Drive-by fixes: none.
Follow-ups: none. (Process note: shots exceeds the 600s foreground limit; it was started with nohup and polled via its own exit file in a fresh scratch dir, contrary to footgun 13's blocking-call rule — no result depended on a notification.)

## Artifacts
Scratch (logs, per-run): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc356-r3-impl-m5x2/ (*-b.log are the authoritative final-base runs; modal-inject.log = display-drop regression; reg-neg.log/reg-pos.log = registry probes).
