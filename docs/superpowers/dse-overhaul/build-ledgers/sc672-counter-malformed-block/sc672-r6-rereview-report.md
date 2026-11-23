# SC-672 r6 scoped re-review (delta `0098eb44` + `52cc1b49` on dse `fefd9029`; superproject `1bb51fab`)

**Executive summary**
- VERDICT: LAND, for this delta. The full gates come in the next round, after the rebase onto `d582e7ff`. Findings: HIGH 0, MEDIUM 0, LOW 1 (an optional wording nit), INFO 3.
- M1 is CLOSED in real Obsidian. `!!set`, `!!timestamp`, `!!binary` and `!!omap`, plus `%YAML 1.1` dates and sets, `!<tag:yaml.org,2002:set>` and `!!pairs`, are all the plain error card with 0 controls. This holds in Reading view, Live Preview and a popout window. A mouse click or double-click on any card leaves the note byte-identical.
- No new false refusal. These all stay counters and write the same bytes as the pre-delta head `c203beef` (measured on both): `{}`, `!!map {}`, `--- !!map`, anchors and aliases, a `%YAML 1.1` merge key, `__proto__` / `toString` keys, custom tags, every R2 empty form, a normal counter and the shipped example.
- tsc (incl. `-p e2e`) + lint: rc 0 / 0, clean. Full jest (it had started before the narrowing addendum): `Tests: 2 skipped, 13962 passed, 13964 total`, rc 0, fresh worktree.
- `counter-wrong-block.e2e.ts` alone, three runs: `OBSIDIAN-E2E done: 13/13 ok, 0 failed, 0 known-bug` each time.
- Full e2e: DROPPED per the owner's addendum (it had not started). Lifecycle: not run (as briefed). `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
- The new tests can fail. With the old predicate restored, jest gives `Tests: 9 failed, 45 passed, 54 total` with the 9 tagged cases red ("Received function did not throw"), and CTR-W13 gives `0/1 ok`. CTR-W14 / W15 pin the whole note, so a line eaten or added outside the fence fails them. They were stable over 3 runs.
- Wording is true as measured, with one optional LOW nit. The SC-644 and SC-675 bullets are intact. The delta touches only the planned lines.
- Item 4 was skipped honestly. The collision invariant runs in `e2e/driver/session.ts:42-44`, after the `knownBug` body, so the marker cannot hold it (r5 log: `CTR-W16 FAIL: invariant violation(s): - view registry collisions=1`). Nothing under `e2e/driver/**` changed.
- Rebase: the `src/` diff `fefd9029..52cc1b49` is exactly `src/model/Counter.ts` and `src/elements/shared/undeclaredDefaults.ts`. Settings re-draws (SC-644) leave the error cards as error cards and the empty counter at 0, and the note stays byte-identical. Plugin at `52cc1b49`, clean.

Evidence root `$R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r6-rerev/`.

## Findings

### LOW

**L1 (optional wording nit). In the CHANGELOG, the typed-number clause sits under the `current_value: 1` example.** Worktree `CHANGELOG.md:14`: "the first click on + (or a number typed into the box) fills the block in (`current_value: 1`)".
- Typing 7 + Enter writes `current_value: 7`, not `current_value: 1` (r4 PRB-B01 measured this; the code path is unchanged in this delta).
- As written, a reader can take the example to apply to the typed number too.
- Fix (optional): "the first click on + fills the block in (`current_value: 1`); a number typed into the box does the same with that number". `docs/counter.md:50` gives no example value and is fine.

### INFO

- **I1. My keyboard probe changed the note, but through Obsidian, not the card.** In Reading view, from a click on a card:
  - Tab ×3 reached Obsidian's own view-mode button ("Current view: reading, Click to edit"), and Enter switched the leaf to source mode.
  - The next keys (` `, `+`, `-`) were typed by the editor at the top of the note (`+- # Counter: …`). The key log in `$R/obs/head-probe2.jsonl` (`T01`, `T03`) shows the focus and mode after each key.
  - The cards have 0 focusable elements, so no key can land on them. The mouse-only control (PRB6-T06) leaves the note byte-identical and the view in preview. Live Preview click + Tab is also byte-identical.
  - Not a finding. It is what the user does to any note with those keys.
- **I2.** `__proto__: {current_value: 7}` with `name: P` is read as a map. The `__proto__` own key is ignored, so the counter shows 0. + writes `current_value: 1\nname: P`, which drops the `__proto__` line. This is unknown-key loss (SC-671 territory) and identical on `c203beef`.
- **I3.** `!!seq {}` is a mapping node, so it is read as `{}` (a fresh counter). That is consistent with R1, since it is a map, and identical on `c203beef`.

## What was probed

Throwaway probe spec and fixtures: copies at `$R/probe/zz-r6-probe.e2e.ts` and `$R/probe/vault/R6Probe/*.md`. They were deleted from the worktree afterwards. Observations: `$R/obs/head-probe1.jsonl` (first attempt; a popout ordering problem made the later tests time out), `$R/obs/head-probe2.jsonl` (head), `$R/obs/prev-prev1.jsonl` (comparison worktree at `c203beef`, removed). Logs: `$R/e2e-probe1.log`, `$R/e2e-probe2.log`, `$R/e2e-prev1.log`.

**1. M1 closed, no false refusal.**
- Parser sweep (`$R/yaml-shapes.cjs`, `$R/yaml-shapes.log`), using the same `yaml` package Obsidian ships:
  - Every result tagged `[object Object]` has prototype `Object.prototype`, including `__proto__` keys, which stay own keys. The parser yields no class instance or null-prototype object.
  - Everything not tagged `[object Object]` is refused, including `%YAML 1.1` dates, booleans and sets, `!!pairs`, `!<tag:yaml.org,2002:set>`, and `!!null hello` / `!!bool hello` (which read as strings).
  - Null results: `!!null`, `--- # c`, `~ # c`, `null # c`, `---\n...`. These are the R2 empty forms.
- Real Obsidian, refused (PRB6-T01..T06): `Counter/wrong-tagged.md` has 4 cards and `R6Probe/tagged-more.md` has 7 (`%YAML 1.1` date, `%YAML 1.1` set, `!<…set>`, `!!pairs`, `%YAML 1.1 yes`, `!!null hello`, `&a hello`).
  - Every card shows the message `Invalid data: the block must be a map of keys.`, with 0 controls, 0 widgets and 0 chrome items.
  - Reading view: mouse click + double-click on each leaves the note byte-identical (T06). Live Preview (T02, T04): byte-identical. The popout window (T05): 4 cards, byte-identical after clicks.
- Real Obsidian, accepted (PRB6-A01): 10 maps, all drawn as counters with the expected value or name.
  - `{}` → 0, `!!map {}` → 0, `--- !!map` → 2, anchors / aliases → 1 with name "anchors", `%YAML 1.1` merge → 4, `__proto__` → 0 with name "P", `toString` key → 6, `!foo {…}` → 3, `&a {…}` → 5, `!!seq {}` → 0.
  - One + on each writes only inside its own fence. The cards and the written bytes are IDENTICAL on `c203beef`.
- R2 forms (PRB6-A02): each form draws a counter at 0, and its `innerHTML` equals the `{}` card. The forms are one blank line, three blank lines, whitespace lines, nothing between the fences, `# c`, `null`, `~` and `---`. + writes `current_value: 1` in each. IDENTICAL on `c203beef`.
- Normal counter, `{}` and the shipped example (PRB6-A03), with + / − / typed 3: bytes IDENTICAL on `c203beef`.

**2. The tests can fail.**
- Old predicate restored in a scratch edit, then `git checkout` (`cmp` against `$R/Counter.head.ts`):
  - jest on the two counter files: `Tests: 9 failed, 45 passed, 54 total` (`$R/jest-red.log`). The unit `!!set` case fails with "Received function did not throw", after its own assertion that the parse really is `[object Set]`.
  - e2e `--only=CTR-W13`: `0/1 ok`, "timed out waiting for all four tagged blocks to draw their error card" (`$R/e2e-red13.log`).
- CTR-W14 / W15 check the following, so a cycle that ate or added any line outside the fence fails at the full-note equality:
  - The whole note equals `head + '```ds-counter\n' + bodyAfter + '```' + tail` after the first cycle.
  - The text above and below the fence is the original.
  - The card shows a counter at 0 with no error card (`shown` gives errors 0).
  - A second cycle leaves the note byte-identical.
- The pinned bodies (a blank line in Reading view, `current_value: 0` in Live Preview) held in 3 runs of the spec alone (`$R/e2e-spec1.log`, `$R/e2e-spec2.log`, `$R/e2e-spec3.log`).

**3. Wording.**
- `docs/counter.md`: "the first click on + (or a number typed into the box) fills in the block" is true (− is disabled at 0). "`key: value` lines" is plain. The `name` row (No / no name shown) is true: a `{}` and an empty block show an empty name. The diff touches only those 3 lines.
- `CHANGELOG.md`: the three planned clauses are true as measured ("the card can't change your note": 0 controls, no write from the card), apart from the L1 nit. The bullet adds 6 lines against `334058e2`, and the SC-675 (line 17) and SC-644 (line 153) bullets are intact.

**4. Item 4.**
- r5's `e2e-new1.log` shows `CTR-W16 FAIL: invariant violation(s): - view registry collisions=1 ambiguous=0`. `knownBug` (`e2e/driver/knownBug.ts:17-36`) only catches the body's own failure. The session wrapper (`e2e/driver/session.ts:39-44`) runs `invariantProblems()` after the body returns, so the collision fails the test whatever the marker says.
- `git diff c203beef..52cc1b49 -- e2e/driver` and `fefd9029..52cc1b49 -- e2e/driver`: both empty. The delta's test files are additions only (the unit file +27, the jsdom file +4 rows, the e2e spec +57 with CTR-W01..W12 unchanged).

**5. Rebase.**
- `git diff fefd9029..52cc1b49 --stat -- src/`: `src/elements/shared/undeclaredDefaults.ts` (3 lines) and `src/model/Counter.ts` (14 lines), nothing else.
- SC-644 settings probe (PRB6-S01, real settings window, experimental switch on). Note: a `hello` card, an empty counter, a `{}` counter and a `!!set` card.
  - "Collapsible by default" off, then on, then "Show edit button" on, then off.
  - After each change both error cards still have 0 controls and 0 chrome items. Both counters stay at 0, with chrome items 3 → 1 → 3 → 4 → 3. The note is byte-identical at each step.
  - A + on the empty counter afterwards writes exactly `current_value: 1` inside its fence.

## Gates (`$R`)
- Run: tsc / lint (`$R/tsc.log`, `$R/tsc.rc`, `$R/lint.log`, `$R/lint.rc`); full jest (`$R/jest-full.log`, `$R/jest-full.rc`, `$R/jest-full.load`, loadavg 8.5 → 20.3); the spec alone ×3 (`$R/e2e-spec1.log` … `$R/e2e-spec3.log` with their `.rc`); build + styles (`$R/build.log`, `$R/styles.sha`; main.js was rebuilt from head after the red edit was restored).
- Dropped: the full e2e (owner's addendum). Not run: lifecycle (as briefed).
