# SC-493 r1: review by reviewer B (afa49f9a4ee2f356b)

## Executive summary
- **Verdict: NOT LAND-READY.** One MEDIUM finding, and it is a one-line fix in FormModal (in scope under D2). Everything else is LOW or INFO.
- MEDIUM-1: in real Obsidian, the preview's "Read-only" badge covers the end of the D5 message, so the counter shot reads "…or pres" and the words "press Cancel." are hidden. Measured: the empty preview is 0 px tall and still carries `data-dse-readonly`, and its badge sits at top 4px / right 4px over the single-line, 526 px error line.
- The fix is correct and complete: red at base (15 failed / 15 passed), green at HEAD (30/30). 7 of 8 mutants killed. The survivor (`== null`) is equivalent in practice.
- The pipeline extraction preserves behaviour. Old `prepareModel` (c98bd82) vs new, over 33 defs × 195 bodies = 6435 pairs: **0 differences** in model, prefOverrides, passthrough, collapseKeys, thrown error and console output. The check can fail: disabling each of the three rescue arms gives 14, 96 and 70 diffs.
- Probe table (13 raw-box elements × 14 inputs): the four ticket elements, plus values-row and characteristics, now refuse an empty box with the D5 message. Montage, project, statblock and scc still save an empty body. No console warning fires on any keystroke.
- Rows where Save is enabled but the saved block renders an error card (all LOW): ds-scc bodies YAML rejects (new: the form now runs the pipeline's rescue arms); `@path` to a missing note on feature/featureblock/statblock (new); scalar or `^block-id` bodies on feature/featureblock/statblock (as before).
- Battery at HEAD 1175a3b: tsc/lint rc 0 · jest 5902 / 1 / 242 of 243 · lifecycle 34/34 · e2e 114/114, 0 known-bug, 79/79 · shots 592, 0 FAIL · freeze 280/280 · parity 0/0/24.
- No conflict with develop b624eef or a993a60: 0 shared files. SC-487 does not touch pipeline.ts or anything readBlockBody depends on.
- Screenshots in this directory: `sc493-r1-shot-counter.png`, `sc493-r1-shot-montage.png`, `sc493-r1-shot-montage-saved.png` (drawn fresh after Save) and `-saved-stale.png`. Both trees were left as found.
- Older than this ticket, out of scope, needs its own ticket (INFO-6): in real Obsidian, after any block edit form Save the card keeps its old content until the note is reopened.

## Findings

### MEDIUM-1: the read-only badge of an empty preview covers the end of the D5 message
- Where: `src/authoring/FormModal.ts`, `renderPreview()`, around line 388: `this.previewEl.empty(); if (this.saveDisabled) return;`. `data-dse-readonly` is set only on the mount path (around line 399) and never removed.
- Scenario (real Obsidian 1.15.0, from the screenshot run):
  1. Open the edit form on `ds-counter`. The first preview mounts and stamps `data-dse-readonly` on `.dse-form__preview`.
  2. Empty the box. `saveDisabled` becomes true, and the preview is emptied but keeps the attribute.
  3. The badge (`[data-dse-readonly]::after`, styles-source.css:527, absolutely positioned at top 4px / right 4px of a 0-height box) now sits over the right end of the `.dse-form__errors` line just below it.
- Measured: errors box at x=457, width 526, one line (scrollWidth 526); preview at the same top, height 0, `data-dse-readonly` true, 0 children. In the image the line reads "This block can't be empty. Add at least one setting, or pres", followed by the "Read-only" badge. The remaining "s Cancel." is under the badge.
- The mechanism is older than this ticket: any raw-box error after a valid preview overlaps the same way. But the D5 message is this ticket's deliverable, and its instruction is the part that is hidden.
- Prescribed fix: in `renderPreview()`, call `this.previewEl.removeAttribute('data-dse-readonly')` right after `this.previewEl.empty()`. The mount path sets it again. Add a jest assertion that after a valid box is emptied, `.dse-form__preview` has no `data-dse-readonly`. Retake screenshot (a).

### LOW-1: the change fixes more elements than the ledger, CHANGELOG and tests say
- The probe survey found 13 raw-box elements with a pencil, not six: negotiation, feature, featureblock, statblock, counter, values-row, characteristics, scc, encounter, montage, project, party, and initiative. Initiative's form has no raw box. Base vs HEAD:
  - **values-row and characteristics** had the same bug: Save enabled on empty, whitespace-only, comment-only or `---`, then the error card "Cannot read properties of null…". Both are fixed now.
  - **feature and featureblock** already had Save disabled. They now show the D5 text instead of `Cannot read properties of null (reading 'effects'/'features')`.
- `CHANGELOG.md:11-14` (superproject c7086e5) lists only Counter, Negotiation, Party and Encounter. `test/dom/authoring/formModalEmptyYaml.test.ts` CASES covers only the original six.
- Fix:
  - Add `valuesRowElement` and `characteristicsElement` (acceptsEmpty false) to CASES. Optionally add feature and featureblock.
  - Reword the CHANGELOG to "For a block the form edits as raw YAML (for example Counter, Negotiation, Party, Encounter, Values row, Characteristics)…".
  - Ledger: correct "six raw-box elements" to 13.

### LOW-2: the raw box now accepts what the pipeline's rescue arms accept, which is a user-visible change
- `parseRaw()` (FormModal.ts:321) runs `readBlockBody`'s rescue ladder, so some bodies the form used to refuse with a YAML error now pass:
  - (a) **feature, featureblock and statblock with a `@path` whole-block reference.** Base refused it: "Plain value cannot start with reserved character @". HEAD saves it. A valid target renders correctly. A missing target (`@Missing.md`) saves and renders "Feature: failed to render (render) Reference file (Missing.md) not found…". Reference resolution is documented as not mirrored.
  - (b) **ds-scc**: invalid YAML, a duplicate key, an inline link `[Panther](scc.v1:…)`, or `@path`. Base refused these with the YAML message. HEAD saves them, and the block renders ds-scc's own message card (`.dse-ref-notice`, e.g. "That is an inline link, not a block body — write just the code: …"). The form's check passes because ds-scc's parse returns an `invalid` model instead of throwing. The form preview shows the same message before Save, and an empty ds-scc body already behaved this way at base.
- This follows D1 (same data the pipeline sees), but it is not in the ledger or the CHANGELOG.
- Fix (owner call): accept it and note it in the ledger, or file a follow-up. A generic fix would make `parseRaw` treat a withReference `kind: 'invalid'` model as a check failure.

### LOW-3: preview async-mount race, an existing mechanism that `@path` bodies now reach
- Where: FormModal.ts around line 412, `void view.mount(this.previewEl, model)`. Every keystroke mounts into the same `previewEl`. A RefUnwrapView mount still in flight from an earlier keystroke writes into it after it has been emptied and replaced. Mount rejections are not handled.
- Evidence (jest probe): typing `@Ref.md` one character at a time into feature or statblock ended with the preview showing "Reference file (Ref.m) not found". Typing it in one go showed no error, and the save rendered correctly. A self-referential `@Note.md` produced 12 unhandled rejections (YAMLParseError from RefUnwrapView.onMount). At base the same race is reachable through a bare SCC-code body.
- Fix (follow-up): mount each preview into a fresh child `div` and detach it on the next revalidate. Add `.catch(() => {})` on `view.mount`.

### INFO
- INFO-1: in real Obsidian, saving an empty montage writes "```ds-montage\n\n```": the host splice puts one blank line inside the fence. The host is off limits (D2) and this is not new. The jest test asserts only `body.trim()`. If the blank line counts as "a byte the user never typed" under SC-483, it needs a follow-up.
- INFO-2: the montage preview inside the form renders as stacked, mostly unstyled text (see `sc493-r1-shot-montage.png`). This is how the preview is styled already, not this ticket.
- INFO-3: mutant m5 (`rawData == null`) survives. `undefined` comes only from the parseHandlesRawBody arm, which only ds-scc uses, and ds-scc's parse never throws, so the two are equivalent. A test is optional: a stub raw-body def that throws would pin it.
- INFO-4: a box holding a literal `null` or `~` reads as null and shows the D5 "can't be empty" text. That is acceptable.
- INFO-6 (older than this ticket; a follow-up ticket is recommended and may deserve HIGH on its own): in real Obsidian, a block edit form Save updates the note file, but the card on screen keeps the old content until you leave the note and come back. Measured on the montage:
  - A non-empty edit (`title: The Heist` changed to `title: Other Job`): the file reads `title: Other Job`, and 3 s later the card still reads "The Heist".
  - The emptied box: the card still reads "The Heist" right after Save and 4 s later; after navigating away and back it reads "MONTAGE TEST".
  - Likely cause: view adoption treats the form's `cx.host.replaceSource` write as the view's own write and keeps the old model. This branch touches neither the host, adoption, nor the save path, so it is not caused here. Jest and the e2e/lifecycle gates miss it because they re-render fresh or never save from the form.
- INFO-5: Obsidian's real `parseYaml` gives null for an emptied box. Shown directly: in real Obsidian the emptied counter box shows the D5 text and Save is disabled.

## Probe execution

### 1. Red test against c98bd82's FormModal
I checked out `FormModal.ts` from c98bd82, ran the new file and restored it. At base: 15 failed, 15 passed. The failures were the 12 element×box cases, "check and preview both get null", "throwing def: error shown, Save off" and "raw-body def peel". At HEAD: 30/30.

### 2. Mutants (each applied, run, then restored with `git checkout`)
| Mutant | Change | Result |
|---|---|---|
| m1 | check back to `parseYaml(raw) ?? {}` | 15 failed |
| m2 | preview back to `parseYaml(raw) ?? {}` | 1 failed (check and preview both get null) |
| m3 | D5 message removed | 13 failed |
| m4 | D5 message for every error | 3 failed (party, encounter and stub keep their own message) |
| m5 | `=== null` changed to `== null` | survives (equivalent, INFO-3) |
| m6 | `def.parse(rawData, this.rawText)` instead of bodySource | 1 failed (peel test) |
| m7 | `parseYaml(source) ?? {}` inside readBlockBody | 14 failed |
| m8 | parseRaw skips readBlockBody (plain parseYaml) | 1 failed (peel test) |

### 3. Probe table at HEAD (real pencil, real FormModal, real ReadingModeBlockHost, then a re-render through the real pipeline)
Each input was typed one keystroke at a time. "SAVE→ok" means Save is enabled and the block renders after Save. "off: D5" means Save is disabled and the D5 text is shown.

| Input | counter | montage | project | party / encounter | negotiation | values-row | characteristics | feature / featureblock | statblock | scc |
|---|---|---|---|---|---|---|---|---|---|---|
| `''` | off: D5 | SAVE→ok | SAVE→ok | off: D5 | off: D5 | off: D5 | off: D5 | off: D5 | SAVE→ok | SAVE→**scc card** "Empty block…" (same at base) |
| whitespace | off: D5 | SAVE→ok | SAVE→ok | off: D5 | off: D5 | off: D5 | off: D5 | off: D5 | SAVE→ok | SAVE→scc card |
| `# comment` | off: D5 | SAVE→ok | SAVE→ok | off: D5 | off: D5 | off: D5 | off: D5 | off: D5 | SAVE→ok | SAVE→scc card |
| `---` | off: D5 | SAVE→ok | SAVE→ok | off: D5 | off: D5 | off: D5 | off: D5 | off: D5 | SAVE→ok | SAVE→scc card |
| `prefs:` | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE |
| `prefs:\n  reduceMotion: true` | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE |
| `^block-id` | SAVE→ok | SAVE→ok | SAVE→ok | off: "The input must be a YAML object." | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→**error card** "Compendium not installed" (same at base) | SAVE→**error card** (same at base) | SAVE |
| `- a\n- b` | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | off: "Expected effects to be an array" | SAVE→ok | SAVE→ok | SAVE→ok | SAVE |
| `hello` | SAVE→ok | SAVE→ok | SAVE→ok | off: "The input must be a YAML object." | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→**error card** (same at base) | SAVE→**error card** (same at base) | SAVE |
| `key: [unclosed` | off: YAML msg | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | SAVE→**scc card** (new, LOW-2) |
| `collapsed: true` | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE→ok | SAVE |
| `collapsed: true\nSome prose: and: more` | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | SAVE (new) |
| `@Missing.md` | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | SAVE→**error card** "Reference file … not found" (new, LOW-2) | SAVE→**error card** (new) | SAVE→scc card (new) |
| `@Ref.md` (valid statblock note) | — | — | — | — | — | — | — | SAVE→ok (new) | SAVE→ok (new) | SAVE→scc card |
| `a: 1\na: 2` | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | off: YAML | SAVE→scc card (new) |

Base vs HEAD: every change in the table is listed in LOW-1 and LOW-2. Rows with Save enabled and an error card after Save: scc (empty and all bodies YAML rejects), feature/featureblock/statblock with `^block-id` or a scalar (unchanged from base), and `@Missing.md` (new). The four ticket elements, values-row and characteristics have no such row any more.

### 4. Schema'd elements
skills, stamina-bar, roll, conditions, heroic-resource, surges, hero-tokens and hero all have fields, so they never use raw mode. Their branch of `revalidate`/`renderPreview` is byte-identical to base, and full jest passes.

### 4b. Differential: old pipeline ladder vs readBlockBody
- Method: a temporary copy of c98bd82's `src/framework/pipeline.ts` and a temporary jest test, both deleted afterwards. Both versions' `prepareModel` ran over every harness-registry def (33) × 195 bodies = 6435 pairs. The bodies were every visual-harness FIXTURES variant, every ds-* fence in demo-vault, docs, test/fixtures, e2e and visual-harness `.md` files, every `src/elements/**/*.yaml`, and 50 probes (empty-ish inputs, prefs, `^id`, `---`, list, scalars, invalid YAML, duplicate keys, collapse-key peel cases, `@ref` with and without collapse lines, inline links, bare codes, `_dse_anchor`).
- Compared per pair: the model, prefOverrides, prefPassthrough and collapseKeys (deep signature including constructor names), or the thrown error (name, stage, message, cause), plus every console.warn and console.error call.
- Result: **0 diffs**. Outcomes: 4308 ok, 538 parse-stage errors, 262 render-stage, 1 reference, 1326 schema ValidationResults.
- Check the comparison can fail (rescue arm disabled in blockBody.ts, then restored):

| Arm disabled | Diffs | Defs affected |
|---|---|---|
| parseHandlesRawBody | 14 | scc |
| collapse-key peel | 96 | 17 defs |
| whole-block `@ref` | 70 | 10 defs |

- Console noise while typing in the form: 0 warn and 0 error calls on every keystroke of every probe row.

### 4c. D5 message
- Shown only when the box reads as null and parse throws. Elsewhere the element's own message stays: party and encounter `hello` or `^block-id` show "The input must be a YAML object.", values-row with a list shows "Expected effects to be an array", and YAML errors show the YAML message.
- montage and project with an empty box: Save stays enabled, the empty body is written, and it renders. Confirmed in jest and in real Obsidian.

### 5. Real Obsidian screenshots (1.15.0, private Xvfb :161, port 9298, scratch vault, temporary scenario run through the lifecycle harness, which was then deleted)
- `sc493-r1-shot-counter.png`: a note titled "SC-493 counter" with a Counter card reading 3 / Victories. In front of it is the "EDIT COUNTER" dialog: an empty YAML box with the text cursor in it, and under the box the line "This block can't be empty. Add at least one setting, or pres" with a small "Read-only" badge covering the rest (MEDIUM-1). At the bottom right are the Save icon button, disabled, and the Cancel (X) button. A real click on the disabled Save left the note byte-identical and the dialog open.
- `sc493-r1-shot-montage.png`: a note titled "SC-493 montage" behind the "EDIT MONTAGE TEST TRACKER" dialog. The YAML box is empty and there is no error line. Below it is a live preview of an untitled "MONTAGE TEST" (0 heroes, Round 1 in play, "No heroes yet", "Not started"), drawn as stacked plain text (INFO-2). The Save icon button at the bottom right is enabled.
- `sc493-r1-shot-montage-saved.png`: the montage note after a real click on Save, then navigating to another note and back so the card is drawn fresh from the saved file. The dialog is closed, and the card renders normally with default content: heading "MONTAGE TEST" with no title, "ROUND 1 / 2", "No heroes yet — add one from the montage menu", "Not started", Successes and Failures "no limit set", and "Log an action…" and "End round 1" buttons. There is no error card. The file on disk is "```ds-montage\n\n```" (INFO-1). The page logged 0 errors.
- `sc493-r1-shot-montage-saved-stale.png`: the same note immediately after Save, before navigating away. The card still shows the old title "THE HEIST", and it still does 4 s later. See INFO-6: this is older than this ticket and affects every block-edit-form save.

### 6. Battery at HEAD (dse 1175a3b, worktree)
| Gate | Result |
|---|---|
| tsc (+ `-p e2e`) | rc 0 |
| lint | rc 0 |
| jest | `Tests: 1 skipped, 5902 passed, 5903 total` · `Test Suites: 1 skipped, 242 passed, 242 of 243` · rc 0 (the SC-506 flake did not fire) |
| lifecycle (port 9297) | `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed` · rc 0 |
| e2e | `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` · rc 0 |
| shots | 592 files, 0 FAIL · rc 0 (expected `OBSIDIAN APP.CSS PIN DRIFT` warning; host-copy pin OK; button host-leak 113/678; modal 10/228) |
| freeze | `freeze OK (280/280 …)` · rc 0 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` · rc 0 |

### Rebase check (dispatcher asks)
- b624eef and a993a60 vs 1175a3b: old-style `git merge-tree <base> <develop> 1175a3b` shows 0 conflict markers, and the two diffs share no file. The system git is 2.34 and has no `--write-tree`.
- c98bd82..a993a60 (SC-498 and SC-487) touches none of pipeline.ts, blockBody.ts, FormModal.ts, chrome/collapsedKey.ts or registry.ts.
- SC-487 does touch `src/framework/sidebar/anchor.ts` (which has its own parseYaml), `host/blockPrefix.ts`, `host/fenceLine.ts` and `authoring/fenceScan.ts`. None of these is in readBlockBody's call graph, so there are no hunks to reconcile.

## Tree state
At start, plugin `git status --porcelain` was empty and the superproject showed ` M draw-steel-elements` (pointer not bumped). The end state is identical. Every temporary file was deleted, and my one kept lifecycle temp dir was removed by its exact path.

## Artifacts
- Report: this file.
- Screenshots: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc493-form-empty-yaml/sc493-r1-shot-counter.png`, `…/sc493-r1-shot-montage.png`, `…/sc493-r1-shot-montage-saved.png`.
- Logs and probe data: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc493-r1-review-afa49f9a4ee2f356b/`:
  - gates: `gate-*.log` and `gate-*.rc`
  - red test at base: `jest-red-base.log`
  - mutants: `mut-*.log` and `mut-*.rc`
  - differential: `diff-out*.json`, `jest-diff*.log`
  - probe tables: `probe-head.json`, `probe-base.json`, `probe-refs-*.json`
  - real-Obsidian run: `obs-shots.log`
  - temporary test and scenario sources: `zzSc493Diff.test.ts`, `zzSc493Probe.test.ts`, `zz-sc493-shots.mjs.bak`
