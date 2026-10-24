# SC-494 r1 review report (reviewer B, agent a4210f3cbe3031b53)

## Executive summary
- VERDICT: LAND-READY. Reviewed dse `13b5df6` on `efc17de` (red `7560ce5` + fix), superproject `0eb4ac5` on `7e45f8d`.
- No BLOCKER / HIGH / MEDIUM. One LOW: no committed test pins "a key the model owns stays with the model" (that mutant survives 21/21).
- Red at base: the HEAD test file run against `efc17de`'s src goes 18 failed / 3 passed of 21 (the 3 green are owned-`collapse_default` x2 and raw-box counter, all expected green). At HEAD: 21/21.
- Mutants: serialize-path re-emit dropped 11 red; stringify-path re-emit dropped 6 red; pop at open dropped 18 red; claim always 1 red; claim never 2 red; prefs/collapsed order swapped 3 red; claim model-owned keys only (precise) 0 red (LOW-1).
- Differential (384 cases: 16 chrome defs x 6 key sets x 4 positions, with and without `prefs:`): 0 duplicated keys, 0 lost keys, 0 keys the user never typed, 0 render changes (collapsed state and collapse toggle identical before and after Save), 0 changes outside the fence. For all 6 field-form defs (stamina-bar, conditions, surges, heroic-resource, hero-tokens, and hero for keys) the form's bytes equal the pipeline's own write-back in 24/24 cases. Canonical order is byte-identical; only the two odd orders normalise (owner-accepted).
- hero and heroic-resource probed explicitly: no double-emitted or lost collapse line (hero's raw splice is fed `stringifyYaml(working)`, which no longer holds the keys).
- Real Obsidian 1.15.0: no-edit Save left the note byte-identical; edited Save wrote `collapsed: true\nmax_stamina: 25\ncurrent_stamina: 15`; after a plugin reload the card draws collapsed, "Stamina (15/25)". 6 screenshots.
- Gates at HEAD all match the expected numbers: tsc/lint rc 0 · jest 6024 / 1 / 243 of 244 · lifecycle 36/36 · e2e 114/114, 0 known-bug, 79/79 · shots 592, 0 FAIL · freeze 280/280 · parity 0 / 0 / 24.

## Findings

### LOW-1: the "owned keys stay with the model" rule is not pinned by any committed test
- Where: `src/authoring/FormModal.ts:133` (`extractCollapseKeys(rawData, claimsLegacyCollapseKeys(this.def))`), tests in `test/dom/authoring/formModalCollapseKeys.test.ts:187-213`.
- Mutant: change `claimsLegacyCollapseKeys(this.def)` to `this.def.chrome !== undefined || claimsLegacyCollapseKeys(this.def)`. This claims `collapsible:` / `collapse_default:` on stamina-bar and skills too. The suite stays 21/21 green (`mutant-M4c.rc`). The owned-key tests only count lines, and the re-emit plus the "already declares it" guard keeps that count at 1.
- What goes wrong (measured with a probe): the stamina-bar and skills forms have "Collapsible" and "Collapse default" toggles. Under the mutant, a block with `collapse_default: true` opens with "Collapse default" shown OFF (it reads true at HEAD). On skills, the key also moves to the end of the block on Save. A user who trusts the toggle sees the wrong state.
- Fix: add a test for stamina-bar and skills with `collapse_default: true`. It should assert that the "Collapse default" toggle opens ON, then turn it off and Save. The written body should have exactly one `collapse_default: false` line, and the re-render should be expanded. A ready template is the third `describe` in the probe source `zzSc494ReviewProbe.test.ts.txt`. That describe passes at HEAD and goes 2/2 red under the mutant.

### INFO (nothing to fix in this ticket)
- INFO-1: the pipeline's own hero write-back writes `prefs:` twice when a hero block has `prefs:`. Measured: `prefs:\n  reduceMotion: true\nprefs:\n  reduceMotion: true\ncollapsed: true…`. The cause is `withPrefOverrides` on top of hero's raw splice. The gap predates this ticket and is already named in the `withCollapseKeys` doc comment (`src/framework/chrome/collapsedKey.ts`, "filed rather than fixed here"). The form's hero Save writes `prefs:` once. If no ticket exists for it, file one.
- INFO-2: the hero form's Save re-writes the whole definition through `stringifyYaml`, which drops comments and expands flow maps. The cause is the unchanged `this.def.parse(data, stringifyYaml(data))` at `FormModal.ts:296`. It predates this ticket, and hero is hidden/deferred.
- INFO-3 (SC-509 seen live): after the edited Save, the open card still showed 15/20 (shot 4) until the note was reopened.
- INFO-4: a collapsed block has no Edit pencil, because SC-169 ruling 4 hides the floating panel while the block is collapsed. A person must click Expand first, and that choice is kept for the session. Reopening in the same session therefore shows the block expanded, even though the file still says `collapsed: true` (shot 5a). It draws collapsed again in a new session (shot 5b). This is by design and predates the ticket, but Scott may read "it came back expanded" as this bug.
- INFO-5: the CHANGELOG line "a Save with no changes writes the block as it was" holds for canonical order. With `collapsed:` after the body or before `prefs:`, the key moves to the pipeline's position (owner-accepted). Optional wording: "…writes the block as it was (reserved keys go to the top, as on any other save)".
- INFO-6: D1 hoped for one shared helper. The claim rule is shared now (`claimsLegacyCollapseKeys`), but the wrapper order is written twice: `FormModal.withReservedKeys` (`FormModal.ts:307-311`) and `pipeline.ts` ~550-565, where the pipeline also passes `prefPassthrough`. The differential shows 0 drift today. A later refactor could add one `wrapReservedKeys(serialize, popped, prefOverrides, passthrough?)` to `src/framework/`.
- INFO-7: in the stamina-bar form (shot 2), "Collapsible" shows OFF on a block with no `collapsible:` key, although the block can collapse (the default is collapsible). The toggle default rendering predates this ticket; SC-488 fixed only selects. Candidate follow-up.

## 1. Red at base
Method: `git checkout efc17de -- src/authoring/FormModal.ts src/framework/chrome/collapsedKey.ts src/framework/pipeline.ts`, run the HEAD test file, then `git checkout HEAD -- …`. The tree was clean afterwards.
- Base: `Tests: 18 failed, 3 passed, 21 total`. The 3 green tests are stamina-bar `collapse_default: true` (owned), skills `collapse_default: true` (owned), and the ds-counter raw box. All three are expected green at base.
- HEAD: `Tests: 21 passed, 21 total`.

## 2. Mutants (each applied to `src/authoring/FormModal.ts`, run against the SC-494 file, reverted with `git checkout --`)
| Mutant | Result |
|---|---|
| M1 serialize path without the collapse re-emit (prefs only) | 11 failed / 10 passed |
| M2 stringify path without the collapse re-emit | 6 failed / 15 passed |
| M3 no pop at open | 18 failed / 3 passed |
| M4 claim always (`true \|\| …`) | 1 failed (killed only by the no-chrome stub) |
| M4b claim never | 2 failed |
| M4c claim model-owned keys (chrome defs always claim) | **0 failed, survives** (LOW-1) |
| M5 swap order (collapse keys outside `prefs:`) | 3 failed |

## 3. Differential vs the pipeline
Probe: a temporary jest file, now deleted (source kept as `zzSc494ReviewProbe.test.ts.txt`). It renders each block through the real `ElementPipeline` + `ReadingModeBlockHost`. It captures the pipeline's own write-back serializer by spying on `ElementView.setSerializer` and calls it on the view's model, which gives exactly what a tracker click writes. It then opens the real form from the real Edit button, presses Save, reads the vault bytes, and re-renders.
- Chrome defs covered (16): stamina-bar, skills, conditions, surges, heroic-resource, hero-tokens, hero (field form); counter, negotiation, montage, project, party, encounter, initiative, values-row, characteristics (raw box). Not run: feature, featureblock, statblock, scc and the display family. They are raw-box/schemaless, so their form writes the box verbatim (the same path as counter), and they are unchanged by the diff.
- Key sets (6): `collapsed: true`, `collapsed: false`, `collapsible: false`, `collapse_default: true`, `collapsed + collapsible`, all three.
- Layouts (4): keys first; `prefs:` then keys; keys then `prefs:`; body then keys.
- HEAD result (`analyze-head4.txt`): 0 issues of any kind (dup/lost/extra key, `prefs:` count, render state, surroundings). Field-form defs: form == pipeline write in 24/24 each. form == source in 12/24, and the other 12 are exactly the `keys-prefs-body` / `body-keys` layouts (owner-accepted normalisation). Skills (no serializer): form == source 14/24, with the same odd layouts differing. Raw-box defs: form == source 24/24 (encounter differs only because its own mount write adds `_computed:` before the form opens; that predates this ticket).
- Base result for contrast (`analyze-base.txt`): conditions, surges, heroic-resource, hero-tokens and hero have Save disabled in 24/24 cases. Skills has Save disabled in 8. Stamina-bar loses the key in 16. The raw-box rows are identical to HEAD.
- Sample (stamina, `collapsed: true` after the body): source `max_stamina: 20\ncurrent_stamina: 15\ncollapsed: true` → form and pipeline both write `collapsed: true\nmax_stamina: 20\ncurrent_stamina: 15`.
- Render after Save: the collapsed attribute and the presence of the collapse/expand toggle are the same before and after in all 384 cases.

## 4. Schemas with additionalProperties: false
conditions, surges, heroic-resource, hero-tokens and hero (and skills with `collapsed: true`) open with an empty error line, Save enabled, and write the keys back. All 24 variants each, with 0 SAVEOFF at HEAD versus 24/24 SAVEOFF at base.

## 5. Integrity
- Content above and below the fence (`# Note`, `Above text.`, `After.`) is byte-identical in all 384 differential Saves.
- Two stamina bars in one note, with hand-edited text (`para  with  double  spaces`, a `>` quote between the blocks, `Tail line`):
  - A no-edit Save on the second block (`collapsed: true`) left the whole note byte-identical.
  - An edit on the second (max 30→31) changed exactly that one line.
  - The re-render showed the first block expanded (`collapsed: false`) and the second collapsed.

## 6. Real Obsidian (1.15.0, private Xvfb :160, CDP port 9295, scratch vault)
Method: a temporary `SC494-SHOTS` scenario was spliced into `visual-harness/obsidian-lifecycle.mjs` and run with `--only=SC494-SHOTS`. The file was restored with `git checkout --` afterwards. The fixture note `SC494/stamina.md` is `# SC-494 stamina / Above. / ```ds-stamina-bar collapsed: true, max_stamina: 20, current_stamina: 15``` / After.`. All clicks are real CDP pointer events, and the value was typed with real key input. Result: `SC494-SHOTS ok`, 0 page errors.
- `sc494-r1-shot-1-collapsed.png`: the note "SC-494 stamina" with "Above." and "After." around a single one-line bar reading "STAMINA (15/20)" with a down-chevron Expand button at its right end. This is the collapsed form, and no stamina bar or numbers are drawn.
- To reach the Edit pencil, the scenario first clicked Expand. A collapsed block shows only Expand, and expanding is session state that does not touch the file; the note was checked byte-identical after the click.
- `sc494-r1-shot-2-form.png`: the "EDIT STAMINA BAR" dialog over the expanded bar. There is no error line. The fields are Collapsible (off), Collapse default (off), Max stamina 20, Current stamina 15, and empty Temp stamina, Recoveries, Recoveries max and Height; Style reads "Default (default)". The Save icon button at the bottom right is enabled.
- A real click on Save with no edit left the note byte-identical to the fixture, `collapsed: true` included (`note-after-noedit-save.md`).
- `sc494-r1-shot-3-form-edited.png`: the same dialog with Max stamina typed as "25" (focus outline on that box) and no error line.
- After a real click on Save the note on disk reads `…```ds-stamina-bar\ncollapsed: true\nmax_stamina: 25\ncurrent_stamina: 15\n```…` (`note-after-edit-save.md`).
- `sc494-r1-shot-4-after-save-live.png`: the dialog is closed. The open card is the expanded bar and still reads "15 / 20". The live card did not refresh (SC-509).
- `sc494-r1-shot-5a-reopened-same-session.png` (not needed for the verdict; kept to explain INFO-4): after navigating to another note and back in the same session, the card is drawn fresh as "15/25" but expanded, because the session remembers the earlier Expand click.
- `sc494-r1-shot-5b-reopened-fresh-session.png`: after a plugin disable + enable, which clears the session (the G-S6e mechanism), the note was reopened. The card is again the one-line collapsed bar, now reading "STAMINA (15/25)" with the Expand chevron. It was drawn from the saved file, so the edit landed and the `collapsed: true` line kept the block collapsed.

## 7. Battery at HEAD (dse 13b5df6), each through a script file with rc captured
| Gate | Result |
|---|---|
| tsc (incl. e2e) | rc 0, clean |
| lint | rc 0, clean (only the known `.eslintignore` warning) |
| jest | rc 0 · `Tests: 1 skipped, 6024 passed, 6025 total` · `243 of 244` suites. The SC-506 flake did not fire. |
| lifecycle (port 9295) | rc 0 · `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed` |
| e2e | rc 0 · `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` |
| shots | rc 0 · 592 files, 0 FAIL · host-copy pin OK (1.15.0) · button host-leak 113 / 678 · modal host-leak 10 / 228 · expected `OBSIDIAN APP.CSS PIN DRIFT` warning |
| freeze | rc 0 · `freeze OK (280/280 …)` |
| parity | rc 0 · `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |

## Tree state
At start, the plugin `git status --porcelain` was empty and the superproject showed ` M draw-steel-elements` (pointer not bumped). The end state is the same. The temporary probe test was deleted by its exact path. The lifecycle harness edit was reverted with `git checkout --`. The two lifecycle temp dirs kept by my failed shot attempts (`/tmp/dse-obsidian-lifecycle-SsmTj9`, `-JxT4Gc`) were removed by exact path. Untracked `main.js` / `styles.css` were rebuilt by the gates.

## Evidence
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc494-r1-review-a4210f3cbe3031b53/`
- red at base: `jest-base.log`, `jest-base.json`
- mutants: `mutants.log`, `mutant-*.log|json|diff`, `mutant-M4c.rc`, `mutant-M4c-claim-owned-only.diff`
- differential: `probe-head4.jsonl`, `analyze-head4.txt`, `probe-base.jsonl`, `analyze-base.txt`; owned-toggle probe `probe-owned-head.jsonl`, `probe-owned-m4.jsonl`
- probe source: `zzSc494ReviewProbe.test.ts.txt`, `analyze.py`
- real Obsidian: `obs-shots.log`, `sc494-shots-facts.txt`, `note-after-noedit-save.md`, `note-after-edit-save.md`, scenario source `scenario.mjs.txt`
- gates: `gate-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.{log,rc}`
Screenshots: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc494-form-collapsed-line/sc494-r1-shot-{1-collapsed,2-form,3-form-edited,4-after-save-live,5a-reopened-same-session,5b-reopened-fresh-session}.png`
