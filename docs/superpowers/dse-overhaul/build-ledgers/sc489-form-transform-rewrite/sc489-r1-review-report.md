# SC-489 r1 review (reviewer B): dse 6cfc338 on 9f08f06

## Executive summary
- **Verdict: LAND-READY.** Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 2 LOW (CHANGELOG overclaim; D3 label path untested), 5 INFO.
- **Real Obsidian** (1.14.4, private Xvfb `:200`, experimental + `authoringControls` on, 8 probes): **base 9f08f06 1/8, tip 6cfc338 8/8.** The one base pass is the SC-488 roll relabel probe, which is meant to pass on both.
- **Jest probes:** across all 8 schema elements (23 sources), base and tip differ only in the expected transform cases (case kept on Save, select shows the matching option). Previews and `Default (…)` labels are identical in all 23. A spy shows validate never gets a container of `working` at tip (0 of 16 calls; base 13 of 13). parse gets `working` only on the stamina serialize path and never mutates it.
- **Mutants:** all 4 survey mutants go red: validate `working` 8, preview from `working` 2, no display fallback 1, shallow clone 6. Of 5 extra mutants, 4 go red. `labels-working` survives (LOW-2). Unmutated: 52/52.
- **Gates at 6cfc338:** tsc (incl. e2e) and lint clean · jest **5858 passed / 1 skipped / 241 of 242** (re-run; the first run hit 1 load timeout in an unrelated suite, INFO-3) · lifecycle **34/34** · e2e **108/108 ok, 0 failed, 0 known-bug, 69/69** · shots **592**, rc 0, all in-run lines · freeze **280/280** · parity **0 / 0 / 24**.
- **Screenshots (tip):** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-r1-shot-form.png` and `.../sc489-r1-shot-saved.png`.
- **Base Save, same steps:** the dropdown opens blank (selectedIndex -1). Save writes `style: chips\nskills:\n  - climb\nonly_show_selected: true`. Tip writes `style: Chips\nskills:\n  - Climb\nonly_show_selected: true`.
- origin/develop is still 9f08f06. The reviewed tree is clean and unchanged (`git status --porcelain` empty before and after). Superproject ` M draw-steel-elements` (pointer not bumped) is as found.

## 1. Real-Obsidian probe
- Spec: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r1-review-b-90cwwu/spec/form-case.e2e.ts`
- Fixtures: `.../sc489-r1-review-b-90cwwu/fixtures/SC489B/{climb,chips,sheet,custom,order,roll}.md`
- Runner: `.../b-probe-e2e.sh`. It copies the spec and fixtures into a **scratch worktree** and runs `npm run e2e -- --element=zz-sc489b --shards=1` there. The scratch worktrees were `base` at 9f08f06 and `tipc` at 6cfc338, the same sha as the review. Both are now removed, and no probe file ever touched the reviewed worktree.
- Prefs: `data.json {experimental:true, prefs:{authoringControls:true}}`, then a plugin reload; `after()` restores `{}`.
- Input:
  - Each form opens from the block's `Edit <name>` affordance, by a real pointer click after a hover.
  - Toggles are clicked with a real pointer on `label.checkbox-container`.
  - Options are picked with WebDriver `selectByAttribute` on the real `<select>`.
  - Text goes in as real keys (`dse.type`, select-all, then type).
  - Source mode is entered with `leaf.setViewState({mode:'source', source:true})`.
  - The driver's per-fence integrity invariant runs after every test.
- Observations: `.../obs-tip.jsonl` and `.../obs-base.jsonl`. Logs: `.../probe-e2e-tip-r2.log` (8/8; r1 only had a bad toggle selector) and `.../probe-e2e-base-r1.log` (1/8).

| Probe | Base 9f08f06 | Tip 6cfc338 |
|---|---|---|
| U1 untouched `- Climb` | Save `- climb` | note byte-identical (`- Climb`); label `Default (ledger)` |
| C1 `style: Chips` + `Climb`, toggle Only show selected | Style select blank (`value ''`, index -1); preview `data-skills-style="chips"`; Save `style: chips / - climb / only_show_selected: true` | select `chips` (index 3); chips preview; Save `style: Chips\nskills:\n  - Climb\nonly_show_selected: true`; sibling block untouched; Source mode shows the same text |
| C1 reopen after Save | re-derived (`chips`, toggle on) | re-derived from the NEW source: `chips`, toggle on |
| C1 second block (`style: chips`, `- Sneak`) then toggle + Save | Save lowercases `Sneak`; block 0 stays as base wrote it | block 1 gets `only_show_selected: true`; `Sneak` kept; block 0 keeps `Chips`/`Climb`; text above, between and below byte-exact (double space, tab+spaces kept) |
| S1 stamina `style: Sheet` untouched | select blank; preview `.dse-stamina__notice`; Save `style: sheet` | select `sheet`; sheet notice; note byte-identical |
| S1 Max -> 25 (real keys) | `max_stamina: 25 … style: sheet` | `max_stamina: 25\ncurrent_stamina: 15\nstyle: Sheet` |
| S1 then pick Default | label `Default (default)`; line removed | same |
| P1 Chips -> `list` | `style: list / - climb` | `style: list\nskills:\n  - Climb` |
| P1 Chips -> Default | label `Default (ledger)`; `skills: / - climb` | label `Default (ledger)`; `skills:\n  - Climb` |
| T1 type `- " Climb "` | preview marks Climb; Save `- climb` | preview marks Climb (`climbOn: true`), Save enabled; Save `- " Climb "` |
| G1 untouched custom `skill_group: " Exploration "` | `exploration`, `- climb` | byte-identical |
| O1 key order `only_show_selected / skills / style: Chips`, toggle | same key order, values lowercased | same key order, values as written |
| R1 ds-roll labels (SC-488) | `Default (test)` / `Default (none)` -> `Default (power-roll)` -> `Default (test)` | identical |

## 2. Jest probes (scratch worktrees; probe file never in the reviewed tree)
- Source: `.../sc489-r1-review-b-90cwwu/spec/zz-sc489b-probe.test.ts`. Runner: `.../b-jprobe.sh`.
- **P1, every registered schema element, untouched open and Save.** The 8 elements are conditions, hero, hero-tokens, heroic-resource, roll, skills, stamina-bar and surges. Each opens with its example plus crafted sources (23 sources in all).
  - Output: `jprobe-P1-base2.json` and `jprobe-P1-tip2.json`.
  - 13 cases are byte-identical between base and tip.
  - 10 cases differ, all of them transform cases: skills example (`Heal`/`Sneak`/`skill_group: Interpersonal` kept), `Chips`, `LIST`, `" chips "`/`" Sneak "`, custom `skill_group`, and stamina `Sheet`, `" SHEET "`, `Default`, `prefs:`+`Sheet`, `collapsed:`+`Sheet`.
  - **Preview HTML and every `Default (…)` label are identical in all 23.**
  - Untouched `style: LIST` shows `list` and saves `LIST`. Stamina `style: Default` shows the `default` option (not the sentinel) and saves `Default`, as D4 intends.
- **P2, mutation spy.** The probe wraps validate and parse and checks every argument against every container reachable from the live `working`. Output: `jprobe-P2-tip.json` / `jprobe-P2-base.json`.

| element | validate calls sharing a `working` container (tip / base) | parse calls given `working` containers (tip) | parse mutated them |
|---|---|---|---|
| skills | 0/7 vs 6/6 | 0 | 0 |
| stamina-bar | 0/5 vs 4/4 | 5 (serialize path `currentBody`, FormModal.ts:282) | 0 |
| roll | 0/4 vs 3/3 | 0 | 0 |

## 3. Mutation testing (formModal.test.ts, 52 tests)
Runner: `.../b-mutants.sh` + `.../b-mutate.py`. Summary: `.../mutants-summary.txt`. Logs: `.../mutant-*.log`.

| Mutant | Red | Which SC-489 tests |
|---|---|---|
| unmutated tip | 0 | none |
| revert FormModal.ts to 9f08f06 | 9 | the 9 the implementer reports red at base |
| validate `working` again (survey) | 8 | rows 1, 2, 3, 6, 7, 8, 9, 11 |
| preview from `working` (survey) | 2 | rows 5 and 6 |
| drop the display fallback (survey) | 1 | row 4 |
| shallow clone `{...working}` (survey) | 6 | rows 1, 2, 6, 7, 8, 11 |
| labels from `working` (extra) | **0, survives** | LOW-2 |
| no normalise before the field loop (extra) | 1 | row 4 |
| one cached clone reused via Object.assign (extra) | 3 | row 11 + two SC-483/488 null-key tests |
| Save writes `checked` (extra) | 7 | Save rows |
| arrays shallow-copied, objects in arrays shared (extra) | 1 | row 8 (custom `skill_group`) |

## 4. SC-488 survives
- `Default (…)` labels are identical between base and tip for every built-in optional select: `skills.style`, `stamina-bar.style`, `roll.mode` and `roll.difficulty` (P1, all 23 sources). The roll mode relabel on a `roll:` edit is identical in real Obsidian (R1).
- The D6 required-select seed, LOW-1 source order and the census tests are unchanged and green.
- `git diff 9f08f06..6cfc338 -- test/` has no removed or changed lines. It only adds `describe('SC-489 …')`, so no existing assertion changed.

## 5. Findings

### LOW-1: the CHANGELOG bullet claims more than Save does
- **Where:** superproject `CHANGELOG.md` (220c0a7), the sentence "Save now keeps what you wrote and changes only what you edited."
- **Scenario:** Save still re-stringifies the whole block (`FormModal.ts:290-297`, pre-existing, SC-404).
  - A block with `# my note` and `skills: [Climb]` is saved untouched without the comment, and as a block list.
  - The bullet tells users their text is kept.
- **Fix:** reword to say what changed, e.g. "Save no longer lowercases or trims values you did not edit (`Climb` stays `Climb`, `style: Chips` stays `Chips`)". Keep the dropdown sentence.

### LOW-2: D3 "labels build `absent` from `checked`" has no test
- **Where:** `src/authoring/FormModal.ts:337` (`const absent = { ...this.checked };`). The mutant `{ ...this.working }` passes 52/52.
- **Scenario:** an element whose `parse()` derives one select's default from another, transform-bearing key, compared case-sensitively. With `style: Alpha`, the real render uses `alpha` but `working` holds `Alpha`. A regression to `working` would show the wrong `Default (…)` label, and no test would fail. Built-in elements are unaffected today (P1: identical labels).
- **Fix:** add one `describe('SC-489')` test with a derived def:
  - Schema: `style` with `transform: [trim, toLowerCase]` and enum `[alpha, beta]`, plus an optional `mode` enum `[x, y]`.
  - Parse: `{ mode: d.mode ?? (d.style === 'alpha' ? 'x' : 'y') }`.
  - Assert: source `style: Alpha` shows `Default (x)` on the Mode select.

### INFO-1: one SC-488 comment is now imprecise
`FormModal.ts:210-213` says "Nothing is seeded, so validation, the live preview and Save all see the same data." Validation and the preview now see the normalised `checked`, while Save sees `working`. The keys are the same; the values are not. Optional rewording: "…all see the same keys (validation and the preview see the normalised copy)".

### INFO-2: test 11 checks identity only indirectly
It asserts that every validate call gets a distinct object and a distinct `skills` array, never `data !== working` directly. The mutants show this is enough: validate-working, shallow-clone and clone-once all turn it red. No action needed.

### INFO-3: load-sensitive jest timeout, seen a second time
- **What happened:** the first full jest run failed 1 test with a 5 s timeout at 1-min load ~8: `test/dom/elements/initiative-default-keys.test.ts:459` (SC-485 "pool back at its parse value…"; suite 57.9 s). The re-run passed: 5858/1/241 of 242, with load rising to 25.
- **Relevance:** this is the same test the implementer saw time out once. The file is unrelated to FormModal.
- **Logs:** `gate-jest-g1.log` (red) and `gate-jest-g2.log` (green).
- **Suggestion:** a Backlog ticket for the owner to decide on (raise its timeout or speed up `drive`), since this is now a recurring flake.

### INFO-4: out-of-scope tickets, not made worse
- **SC-494:** a stamina block with `collapsed: true` loses the line on Save at base and at tip alike (P1 `stamina-bar#5`).
- **SC-493:** the raw-mode branch of `revalidate`/`renderPreview` is unchanged.
- **SC-504:** `pipeline.ts` is not in the diff.
- **SC-404:** the stringify path is unchanged.
- The unknown `prefs: skin:` key is dropped at base and tip alike.

### INFO-5: how two gates were run
`shots` took 15 min (15:11 to 15:26) and lifecycle 8.5 min. That is over or close to the 600 s tool limit, so both were started detached (`b-launch.sh`, `setsid`). Each was then awaited with a blocking `tail --pid` (`b-wait.sh`), keyed on the PID rather than a file. Their exit codes come from the gate script's own rc file. All other gates ran as one blocking foreground call each.

## 6. Gates at 6cfc338 (reviewed worktree)
Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r1-review-b-90cwwu/`, each with `.rc`, `.start` and `.end` files.

| Gate | Result | Log |
|---|---|---|
| tsc (+ `-p e2e`) | rc 0, clean | gate-tsc-g1.log |
| lint | rc 0, clean (only the .eslintignore notice) | gate-lint-g1.log |
| lifecycle (port 9317) | rc 0, `OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed` | gate-lifecycle-g1.log |
| e2e | rc 0, `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` | gate-e2e-g1.log |
| shots | rc 0; 592 PNGs; see the in-run lines below | gate-shots-g1.log |
| jest (after shots) | run 1: rc 1, 1 timeout (INFO-3); run 2: rc 0, 5858 passed / 1 skipped / 241 of 242 suites | gate-jest-g1.log, gate-jest-g2.log |
| freeze | rc 0, `freeze OK (280/280 …)` | gate-freeze-g1.log |
| parity | rc 0, `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | gate-parity-g1.log |

Shots in-run lines:
- `host-copy pin OK (… Obsidian 1.15.0 …)`
- `button host-leak OK (113 … 678 …)`
- `modal button host-leak OK (10 … 228 …)`
- pressed toggle parity OK (96)
- pipette selected look OK
- `text scale OK (1626 …)`
- `text scale once OK (107256 … 214 loads …)`
- `OBSIDIAN APP.CSS PIN DRIFT` warning present
- no ALLOWLISTED line, no FAIL

Gitignored `e2e/.out/` run folders left in the reviewed worktree: `20261023-190955-7b66` (my e2e gate). `20261023-182706-f8a5` predates this review.

## 7. Screenshots (tip 6cfc338, real Obsidian)
- `sc489-r1-shot-form.png`: the EDIT SKILLS modal.
  - The Style dropdown reads "chips" (not blank). Only show selected is off, and the Skills box holds `- Climb`.
  - Below the form, the read-only preview shows the chips layout: group headings with runs of skill chips, Climb highlighted under Exploration 1/10.
- `sc489-r1-shot-saved.png`: the note `SC489B/chips` in Source mode, right after Save. The first block reads `style: Chips` / `skills:` / `  - Climb` / `only_show_selected: true`. The second block, `style: chips` / `- Sneak`, and the text around both blocks are unchanged.
- Full-window copies: `.../sc489-r1-review-b-90cwwu/full-sc489-r1-shot-form.png` and `full-sc489-r1-shot-saved.png`.
