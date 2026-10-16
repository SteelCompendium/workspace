# SC-377 R3: scoped re-review (R2F textarea + rebase onto `e0ee273`; dse tip `9ad919d`)

## Executive summary

- **VERDICT: PASS. LAND-READY: YES.** Tips verified: dse `9ad919d` (27 commits on `e0ee273`, which is still `origin/develop`), superproject `d90d7a0`. Nothing is open from any round.
- **NEW-MEDIUM-R2 is closed.** Title line and Heroes line shift is 0.000px across rest → editing → committed for all of these:
  - Harness, real keyboard: short, 19ch, 31ch, 53ch and unnamed × main/500/300 × dark/light (30 cases; up to 4 wrapped rows).
  - Real Obsidian 1.14.4: 280px tracker with "The Ford of Bruinen" (2 rows) in Reading view and Live Preview, both themes, plus a 980px tracker.
- `assertTitleLineStable` is not vacuous. Fed `309894a`'s CSS at runtime, it fails all 8 wrapped cases (28 to 84px).
- **Textarea behaviour verified.** Enter and Shift+Enter commit with no newline. Escape reverts. Pasted `\n` / `\r\n` collapse to spaces, both in the draft and in the file. Overflow is hidden (no scrollbar). It grows 1→2 rows and shrinks back while typing. A click on it keeps it open. Click-away commits. `spellcheck` is false. YAML specials round-trip. The bytes outside the block and the second block are intact. G-S3 / G-S9d/e/f are ok.
- **The rebase is clean.**
  - `range-diff`: 24 of 27 commits identical; the 3 that differ change only CHANGELOG context.
  - Per file, the changed lines of `e0ee273...9ad919d` equal those of `9ded832...e3a7760` for all 29 files.
  - Both CHANGELOGs keep every base bullet once.
  - `styles-source.css`: develop touched no initiative rules, braces balance 1907/1907, and every SC-377 block occurs once.
- **Deliverables reproduce.**
  - `rebaseline.txt` (38) equals the live mismatch set, and its hashes are identical across my 2 clean shots runs.
  - A detached `e0ee273` run gives `freeze OK (268/268)`, with the 38 `initiative*` lines 38/38.
  - `widening.txt`: 6 lines, 0 collisions with the live 268.
  - Twin and realprint deltas vs `e0ee273` are identical regions, and only the SC-377 layout change.
- Battery at `9ad919d` reproduces every claim. One SC-383 red occurred in 1 of 3 jest runs (excluded by ruling).

## Findings

None blocking. Two INFO items for landing:

- **INFO-L1 (landing).** Superproject `origin/main` has moved again since the rebase, `5153a9b` → `8551579` (SC-385 deploy). That commit removes the SC-385 bullet from `## Unreleased` immediately above where the SC-377 bullet sits. `wt-finish` / land-stack will hit a trivial adjacent-hunk CHANGELOG conflict; keep the SC-377 bullet and drop nothing.
- **INFO-L2 (report accuracy, no action).** The rebase report says "568 PNGs (556 + 12 SC-379 captures)". In fact detached `e0ee273` already produces 556 (SC-379's 12 are in the base), and the 12 extra at the tip are SC-377's own three capture ids × 4 combos. The count of 568 is right.

## 1. NEW-MEDIUM-R2 / textarea

- **Harness, real Playwright keyboard and mouse** (`sc377-r3rev-harness-check.mjs`, log `…-harness-check.log`):
  - Setup per case: name set through the editor (select-all, type, Enter), then a real click opens the editor, then Enter commits (Shift+Enter for the 19ch cases).
  - Coverage: 30 cases (5 names × 3 widths × 2 schemes). Every delta is 0.
  - Rows: 1 for short names; 2 for 19/31ch at 300px and 53ch at 500px; 4 for 53ch at 300px.
  - Committed text: never contains a newline. Spellcheck: false in every case.
- **Grow and shrink** at 300px: rows 1 → 2 (title 28.06 → 56.13) while typing " at the Old Mill Bridge", and back to 1 after deleting. The textarea's scrollHeight is about 2px over its clientHeight with overflow hidden, so no scrollbar shows and nothing visibly clips (`sc377-r3rev-harness-300-typing-grows-steel-dark.png`).
- **Paste:** inserting `" Line two\nLine three\r\n  Line four"` gives the draft "… Line two Line three Line four", committed the same.
- **Escape** after typing " JUNK" closes the editor with the text unchanged.
- **Gate vacuity:** shoot.mjs's own `assertTitleLineStable` + `TITLE_LINE_CASES` (extracted verbatim), with `dist/harness.css` swapped at runtime for a `309894a` build (scratch worktree, removed).
  - Prints `TITLE LINE SHIFT`: −28.063 for long@500, 19ch@300 and 31ch@300, and −84.188 for long@300, in both schemes.
  - Shipped CSS passes.
- **Real Obsidian, `F-R3`** (own Xvfb `:160`, CDP 9291; sidebars collapsed; window calibrated so the tracker is exactly 280px):
  - 280px, Reading view and Live Preview, obsidian and moonstone: title 56.125, title-top → Heroes 65.469, identical in all phases. The editor has 2 rows and `spellcheck` false. A real click on the textarea keeps it focused. A real Shift+Enter commits with no newline (`name: The Ford of Bruinen`).
  - 980px: 28.063 / 37.406, identical.
  - Evidence: `sc377-r3rev-obsidian-280px-editing-crop-steel-dark.png`.
  - An earlier uncalibrated run at a 102px tracker (13 rows) was also 0-shift.
- **Persistence, real Obsidian, `Probe/two.md`** (text with `: # " '` around two trackers):

  | input | written |
  |---|---|
  | `"First line\nsecond: line # \"q\"\r\n  third"` | `name: 'First line second: line # "q" third'` |
  | ` - [a]: {b} \| > & * ! % @ \` 'x' "y" ` | quoted correctly, re-parses to the trimmed text |
  | Escape | writes nothing |

  Outside bytes and the second block are byte-identical in every case.
- **Same-card and cross-element flows** (`F-EDGE-RV/LP`, `F-EMBED`), all as in R1F2:
  - Amount → Label → Add lands. An empty label shows the hint and keeps the draft.
  - Counter: type then its own + gives 16.
  - Cross-element and two-pane clicks commit. A click on the editor itself and a drag out of it keep it open.
  - Embed and nested read-only counter: ok.
  - Live Preview + Add Condition still closes its modal on the write; that is SC-384, out of scope.

## 2. Rebase integrity

- `git range-diff 9ded832..e3a7760 e0ee273..9ad919d`: 24 commits `=`. 3 commits `!` (`6bcb66d`→`d076238`, `b6f4b2d`→`2b488ba`, `e525063`→`49d7d4b`) differ only in CHANGELOG hunk context (develop's SC-378 bullet now precedes ours). Saved as `sc377-r3rev-range-diff.txt`.
- Same 29-file set. For every file, the added and removed lines of `e0ee273...9ad919d` hash identically to `9ded832...e3a7760`, including `styles-source.css`, `pipeline.ts`, `view.ts`, `shoot.mjs` and the 4 docs PNGs. Both diffs are 2235+/272−.
- **dse CHANGELOG.** The 3 SC-377 bullets come after develop's top bullet. Every base `- [` bullet is present exactly once (the SC-377-filtered list equals the base list). SC-127 and SC-379 have no dse CHANGELOG bullets at base, so none could be dropped.
- **Superproject.** `5153a9b...d90d7a0` = CHANGELOG +7 (one SC-377 bullet) and DESIGN +8 (rule 9, after rule 8, numbering intact). Every base bullet is kept, and SC-378/379/385 appear once each.
- **`styles-source.css`.** `9ded832..e0ee273` touched 0 lines mentioning `dse-init__` / initiative. The key SC-377 blocks ("12e. ONE TURN MARK", socket reset, ENCOUNTER TITLE, MALICE STEPPER, quick-add hint, group-head, title-input, prompt `::before`) each occur exactly once, as at `e3a7760`. The removed `.dse-init__actionbar` / `.dse-init__round-reset` are still absent. Braces balance 1907/1907.

## 3. Deliverables

- Two clean `npm run shots` runs at `9ad919d`: all 568 PNG hashes identical across the runs.
- `check-freeze.sh` against the LIVE baseline (268 lines, mtime 2026-10-09 09:03): `FREEZE VIOLATED (38 checksum mismatches, 0 missing)`. 0 outside `initiative*`, and the set equals `rebaseline.txt`'s 38 names.
- `rebaseline.txt` + `widening.txt`: 44/44 `sha256sum -c` OK against my run. Versus `.pre-r3`: 19 rebaseline lines changed, all `--steel-print`, 0 realprint; 3 widening lines changed, all `--steel-print`. This matches SC-127's twin rebaseline.
- Widening: the 6 names have 0 matches in the live baseline.
- Detached `e0ee273` (scratch worktree, removed): shots 556, 0 FAIL. `freeze OK (268/268 …)`, exit 0. The 38 `initiative*` baseline lines reproduce 38/38, so the base is clean.
- Print deltas `e0ee273` → `9ad919d`, all 19 `initiative*` ids:
  - Twin and realprint differ in identical regions, for example `initiative-fight` (14,66)-(1508,618) in both.
  - Size changes are identical in twin and realprint: `initiative` +74 and `initiative-narrow` +22 (example title); narrow/500 ids −52 (round label moves to the Heroes line; the bar loses its round row).
  - Side-by-sides (`sc377-r3rev-print-ab-*`): "Round N" beside Heroes, "Malice: N" moved left with the quick-add re-centred, and the example title "The Ford of Bruinen" on `initiative`. Nothing else.

## 4. Battery at `9ad919d` (my runs)

- tsc / lint: clean, exit 0.
- `npx jest` ×3:
  - Run 1: `Tests: 1 failed, 1 skipped, 4366 passed, 4368 total`. The one red is `sidebarInitiative` "SC-288 r2" = SC-383, excluded by ruling.
  - Runs 2 and 3: `Tests: 1 skipped, 4367 passed, 4368 total`, `Test Suites: 1 skipped, 215 passed, 215 of 216 total`.
- Lifecycle: `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`.
- `npm run shots` ×2: 568 PNGs, 0 FAIL. Gate lines:
  - `title line stable OK (… 52 comparisons over 13 cases x dark/light, 8 of them wrapped …; the "Untitled encounter" prompt measures the label size)`
  - `turn mark parity OK (… 20 comparisons …)`
  - Host-leak OK: chrome; button 112/672; input 14/164 (the textarea is in the sweep); table, list, inline, checkbox, prose.
  - host-copy pin OK.
  - `print-twin delta OK (141 capture ids …, max vertical drift 2.00px …)`.
- Parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` at the tip and the same on detached `e0ee273`.
- Freeze: as in section 3.

## 5. Final

- **LAND-READY: YES.** Every finding from R1, R1F, R1F2, R2 and R2F is CLOSED.
- Out of scope by ruling: SC-381, SC-382, SC-383, SC-384, and the stale gif hand-off.
- Landing still owes:
  - the dispatcher applying `rebaseline.txt` (38, sanctioned) and `widening.txt` (6);
  - the superproject rebase onto current `origin/main` `8551579` (INFO-L1);
  - the pointer bump.

## State left behind

- dse `git status --porcelain` is empty, the tip is still `9ad919d`, and the worktree list holds only the branch worktree.
- The scratch `e0ee273` and `309894a` worktrees were removed and pruned.
- The one lifecycle temp dir my run created (`/tmp/dse-obsidian-lifecycle-D8g3li`, from a probe-selector FAIL) was removed by exact path.
- No processes remain.
