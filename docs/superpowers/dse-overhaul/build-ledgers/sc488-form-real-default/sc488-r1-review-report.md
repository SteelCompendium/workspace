# SC-488 r1 review (reviewer B): dse 459ce81 on e4c5cf6

## Executive summary
- **Verdict: LAND-READY** (code at 459ce81). Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 2 LOW, 5 INFO.
- **Real-Obsidian probe** (Obsidian 1.14.4, private Xvfb, experimental + `authoringControls` on, 8 scenarios): **base e4c5cf6 3/8, tip 459ce81 8/8.** On base, the display, preview and Default-pick probes are RED as expected. The 3 that pass on base only record behaviour; they do not assert SC-488.
- **Jest:** a reviewer probe found no sentinel leak into parse, validate or written YAML on any of the 4 built-in selects. Mutation: revert-fix makes 14 tests red, and each of the 7 targeted mutants makes 1 to 15 tests red. The unmutated tip is 40/40.
- **Gates at 459ce81:** tsc (incl. `-p e2e`) clean · lint clean · jest **5725 passed / 1 skipped / 238 of 239** · lifecycle **31/31** (port 9313) · e2e **101/101 ok, 0 failed, 0 known-bug, 66/66 pairs**.
- **Not finished:** shots was killed by my 598 s wrapper timeout at the `sweep` step (a "page closed" exception, not a product failure). Before it stopped, the button host-leak (112/672), modal button host-leak (10/9/38/228), pipette, pressed-toggle (96) and modal text-scale anchoring lines were OK. Freeze and parity were not run, by the owner's scope change; they will run on the rebased tip.
- **Screenshots:** both were taken on 459ce81 and checked. The owner will retake them on the rebased tip.
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r1-shot-skills.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r1-shot-roll.png`
- **origin/develop moved** e4c5cf6 -> c0e761b (SC-279). Reading the diff, it does not affect the D2 labels or how the form builds its preview data (§6).

## 1. How the probes ran
- **Spec:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-review-b-q8v2mz/spec/form-default.e2e.ts`.
- **Fixtures:** `.../fixtures/SC488B/{skills,roll,stam,null,case}.md`.
- **Runner:** `.../probe-e2e.sh`. It copies the spec and fixtures into `e2e/specs/zz-sc488b/` and `e2e/vaults/shipped/SC488B/`, then runs `npm run e2e -- --element=zz-sc488b --shards=1`.
- **Prefs:** the spec writes `data.json {experimental:true, prefs:{authoringControls:true}}` and reloads the plugin; `after()` restores `{}`.
- **Real input:** the pencil or chrome item is clicked with a real pointer after a hover. Options are picked with WebDriver `selectByAttribute` on the real `DropdownComponent.selectEl`. Text goes in through real keys (`dse.type`).
- **Observations:** `.../obs-tip.jsonl` and `.../obs-base.jsonl`.
- **Logs:** `.../probe-e2e-tip.log` (8/8) and `.../probe-e2e-base.log` (3/8).
- **Base:** ran in a scratch worktree at e4c5cf6, since removed.
- **Cleanup:** the probe files were deleted from the reviewed worktree by exact path. `git status --porcelain` is empty there.

| Probe | Base e4c5cf6 | Tip 459ce81 |
|---|---|---|
| SK1 ds-skills, no `style:` | dropdown `list`; preview has no `data-skills-style` (classic list); Save is a byte-identical no-op | `Default (ledger)` selected, value `__dse-unset__`; preview `data-skills-style="ledger"`; Save writes nothing new; note byte-identical |
| RL1 ds-roll `roll: Might test` | mode `power-roll`, difficulty `easy`, caption "Might test · easy difficulty" | mode `Default (test)`, difficulty `Default (none)`, caption "Might test" |
| RL1, edit roll: to `Power Roll + Might` (real keys) | mode `power-roll`; caption "… · easy difficulty" | label changes live to `Default (power-roll)`, value stays the sentinel, caption "Power Roll + Might" |
| RL1, edit roll: to `Agility test` | (not reached) | label back to `Default (test)` |
| RL2 pick `hard`, Save, reopen on the same view, pick Default, Save, reopen | no Default option, so it cannot be picked | caption "Might test · hard difficulty"; writes `difficulty: hard`; reopen shows `hard` and mode `Default (test)`; picking Default restores the caption to "Might test" and the note to the fixture byte-for-byte; reopen shows `Default (none)` |
| ST1 stamina `style: sheet`, then Default | no Default option | only the `style: sheet` line is removed; rest of the note byte-identical; label `Default (default)` |
| SK2 two ds-skills blocks | (cannot pick Default) | block 1 set to Default: only block 1 changes. Block 0 then set to `list`: only block 0 changes. Text above, between and below stays byte-identical (double spaces and a trailing tab kept). Reopening each block re-reads the NEW source (`list` / `Default (ledger)`). Integrity invariant clean |
| SK3 untouched Save of a block with a comment | comment dropped, key order kept | **same bytes as base**, so no regression |
| NL1 `style:` / `difficulty:` null | schema error card, **no edit affordance** | same, so D5 is not reachable from the real UI (LOW-2) |
| CS1 `style: Chips` (SC-489 neighbour) | nothing selected; Save writes `chips` | same as base, so SC-489 is not made worse |

No `__dse-unset__` appears in any modal text node, any preview HTML or any written note.

## 2. Jest probes
- **Reviewer probe** (scratch worktree at 459ce81; file since deleted). Output: `.../jest-probe-out.json`; log: `.../jest-probe.log` (5/5).
- **Sentinel never leaks:** for skills.style, roll.mode, roll.difficulty and stamina.style, every option was picked, then the sentinel, then every option again, then the sentinel. No parse() input, validate() input or replaceSource body contained the sentinel. The final writes were the fixture bodies.
- **D2 labels:**
  - A parse that throws when the form opens leaves the label as plain `Default`.
  - An explicit `mode: power-roll` with `roll: Might test` keeps the sentinel label `Default (test)`, and the value stays `power-roll`.
  - An empty ds-roll reads `Default (power-roll)` / `Default (none)`.
- **Cost:** 10 parse() calls per keystroke on ds-roll (2 optional selects, (1+4) + (1+3), plus the preview).
- **The rest of D2:** zero, one and several hits, and recomputing while another field is invalid, are covered by A's tests. The mutants below confirm those tests catch a broken rule.
- **D6/D7:**
  - The required-select tests seed the schema `default` when it is in the enum, else enum[0], and the value is written.
  - `grep untouchedSeeds|withoutUntouchedSeeds|requiredKeys|currentBody(true|false)` finds only the explanatory comment at `src/authoring/FormModal.ts:66`.
  - The `shapeFromSchemaYaml` import was removed; tsc and lint are clean.
  - Diffing every changed existing assertion in `test/dom/authoring/formModal.test.ts` finds exactly the 3 ledger-named re-asserts (null key at :383-386, preview at :400-404, serialize at :430-432). The other changes are titles and comments.

### Mutation testing
Run with `.../mutants.sh` and `.../mutate.py`, against `formModal.test.ts` (40 tests). Summary: `.../mutants-summary.txt`; logs: `.../mutant-*.log`.

| Mutant | Red |
|---|---|
| unmutated tip | 0/40 |
| revert src to e4c5cf6 (mock kept) | 14 |
| `hits.length >= 1` (several hits pick the first) | 1 |
| zero-hit label becomes `Default` | 3 |
| seed enum[0] again for an optional select | 15 |
| refresh labels only after the `saveDisabled` return | 2 |
| D5 delete removed | 2 |
| required select ignores the schema default | 1 |
| a throw resets the label | 1 |

## 3. Findings

### LOW-1: picking Default and then an option moves the key to the end of the block
- **Where:** `src/authoring/FormModal.ts:195-196`. On the stringify path (skills, roll), `delete` followed by a re-add appends the key last.
- **Scenario:** source `style: chips\nskills:\n  - climb`. Pick Default, then pick `chips` again (the value the source already had). Save writes `skills:\n  - climb\nstyle: chips`, a reordered block where the user meant no change. Picking `list` directly keeps the order (`style: list\nskills: …`).
- **Base:** the form could never delete a select key, so this did not happen.
- **D5 path:** a `style:` null line that is later given a value would also move. That path is unreachable from the UI (LOW-2).
- **Fix (optional):** in `onOpen`, save `Object.keys(rawData)` as a source-order index. In `stringifyWorking`, sort the keys by that index, with new keys after. Alternatively, accept and document. Serializer elements (stamina) are unaffected.

### LOW-2: the CHANGELOG claims a behaviour the user cannot reach
- **Where:** superproject `CHANGELOG.md` (a2716cb): "A dropdown line left empty (`style:`) counts as left out."
- **Scenario:** in real Obsidian, a ds-skills `style:` or ds-roll `difficulty:` null renders as a schema error card with no pencil or chrome edit item (probe NL1, base and tip). So the user cannot open the form on such a block. D5 (`FormModal.ts:189`) is defensive code only.
- **Fix:** drop that sentence from the CHANGELOG bullet, or say it applies only once the form is open. Keep the code.

### INFO-1: three stale SC-483 wordings in the test file
`test/dom/authoring/formModal.test.ts`. Assertions are correct; only the words are stale.
- Line 150, comment: "SC-483: the seed is display/validation-only".
- Line 340, title: "…when the untouched select is stripped".
- Line 390, title: "…still see the seeded value of an untouched absent select". This test now uses a REQUIRED select.

### INFO-2: labels depend on parse() ignoring the raw body
- **Where:** `FormModal.ts:270-271`. Each option probe passes `stringifyYaml(data)` as the raw body.
- **Risk:** a parse() that folds the raw text into its model would give every option a different signature. The result would be zero hits and a wrong `Default (none)`.
- **Status:** no built-in parse does this. The census test opens each element through the real FormModal path, so it would catch one. This joins the limits the ledger already accepts (Map/Set models; conditionally required selects).

### INFO-3: skills and stamina chrome edit items need a hover first
The edit items only become displayed on hover; the probe hovers before clicking. This existed before SC-488 and is unrelated to it.

### INFO-4: out-of-scope tickets
- **SC-489:** not worse (CS1 identical on base and tip).
- **SC-493 / SC-494 / SC-492:** this diff does not touch their paths. Raw mode, `collapsed:` and the stamina pencil are not in it.

### INFO-5: superproject pointer not bumped
The superproject worktree shows ` M draw-steel-elements`, the unbumped submodule pointer. This was already so at review start, as the implementer reported.

## 4. Gates at 459ce81
Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-review-b-q8v2mz/`, with an rc file next to each.

| Gate | Result | Log |
|---|---|---|
| tsc | rc 0, clean | gate-tsc.log |
| lint | rc 0, clean | gate-lint.log |
| jest | rc 0; 5725 passed, 1 skipped; 238 passed + 1 skipped of 239 suites | gate-jest.log |
| lifecycle | rc 0; `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` | gate-lifecycle.log |
| e2e | rc 0; `OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs` | gate-e2e.log |
| shots | INCOMPLETE: killed by my 598 s timeout at `sweep` ("Target page… closed"). The listed OK lines were printed before that | gate-shots.log |
| freeze / parity | not run (owner scope change) | none |

## 5. Screenshots, taken on 459ce81
Both will be retaken on the rebased tip.
- **sc488-r1-shot-skills.png:** the Edit Skills modal. The Style dropdown reads "Default (ledger)", the Skills textarea holds "- climb", and below it the live preview shows the ledger grid of group panels (Crafting 0/10, Exploration 1/10 with Climb bold) with the "Read-only" badge.
- **sc488-r1-shot-roll.png:** the Edit Roll modal, taken at a 2400 px tall viewport. Roll reads "Might test", Mode reads "Default (test)", Difficulty reads "Default (none)", and the bottom preview card shows the caption "Might test" (no difficulty) with the roll bar and the "Read-only" badge.

## 6. SC-279 (origin/develop c0e761b) and the form
What `git diff e4c5cf6 origin/develop -- src/elements/roll src/framework/kit/rollBar.ts` changes:
- **`view.ts`:** the roll bar gets `defaults`, a session `persist` slot `roll.modsOpen.0`, and `mainAction` from `last`. The caption code (`expressionText` + `difficulty`) is unchanged.
- **`rollBar.ts`:** the strip is restructured into Roll + a collapsed Modifiers disclosure. The strip still reads `opts.mode`: edges are tiered when not flat, and Main action shows only in power-roll mode.

Effect on the form:
- **Labels:** no change. RollModel, the schema and parse are untouched, so D2 parse-equality gives the same results.
- **Preview:** it now shows the new strip. That strip is built from the same key-absent model, so an absent mode in a test roll gives no Main-action toggle. Preview and saved block still agree.
- **Session state:** the preview host's blockKey is `<key>::form-preview`. The preview's Modifiers open/closed state and last-input state therefore go to their own session slots and never touch the real block's. These are session-only; the preview never writes the note (canPersist false).
- **Rebased screenshot:** the roll shot should show the collapsed strip under the "Might test" caption.
