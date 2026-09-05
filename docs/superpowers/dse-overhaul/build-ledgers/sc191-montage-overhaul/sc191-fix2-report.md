# SC-191 fix round 2 report — End round, Undo, Reopen/Clear all bars; ⋯ dedup

## Executive summary

STATUS: DONE. Base `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732` (origin/develop unmoved — no
rebase). Commit `8cd9d30d043d66593e0640d8706b5da8bfa93e67` on `sc191-montage-overhaul`,
not pushed, no tag. Restored the settled mock's bottom action bar: LIVE state gains `Undo` (removes the
most recently logged entry) and `End round N` (the only control that advances
`current_round` — confirmed it was previously touched only by `parse()`/
`resetMontageProgress()`); COMPLETE state now shows `Reopen` (only when exhausted by
rounds alone, never when a limit was hit) + danger `Clear all`. `Clear all` removed from
the ⋯ chrome menu (four items now, not five) — it lives only in the done-state bar,
sharing `resetMontageProgress`. Battery: tsc/lint clean, jest 3643 passed/1 skipped/192
suites, shots 508 PNGs 0 FAIL byte-identical ×2, freeze exactly the 2 montage lines FAILED
(the SAME sanctioned bytes slice 4 already produced — unchanged, see below), parity 0
GAPs/0 undeclared/16 declared exit 0. All new/changed tests shown red against the
pre-fix-2 tree, then green.

## Base / commit

- `git fetch origin develop`: tip `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732`, matched
  dispatch-expected `69eb5f7` exactly. No rebase.
- Branch tip before this round: `69eb93f` (slice 4). Fix-round-2 commit:
  `8cd9d30d043d66593e0640d8706b5da8bfa93e67` — "SC-191 fix 2 — End round, Undo,
  Reopen/Clear all bars; ⋯ dedup". Not pushed. No tag/release. Superproject pointer
  untouched (worktree superproject `git status --short`: only the pre-existing
  uncommitted `CHANGELOG.md` bullet from slice 4 and the inherent `M draw-steel-elements`
  pointer diff — nothing staged there this round).

## Item-by-item — what changed, with file:line, and the test's red→green

### 1. `End round N` — the round-advance control

- **`src/elements/montage/model.ts`** (new, after `resetMontageProgress`):
  `endMontageRound(m)` — `m.current_round += 1`, a plain delta write, the same shape as
  `addMontageRound`. Confirmed before writing it: `current_round` was touched in exactly
  two places pre-fix-2 — `parse()` (`d.current_round ?? 1`, model.ts's own `if
  (d.title...)` block) and `resetMontageProgress()` (`= 1`) — neither advances it, so a
  Director had no way to leave round 1 without hand-editing the YAML.
- **`src/elements/montage/view.ts`**, `buildActionBar()` (replacing the old
  `buildLogActionRow`): the LIVE-state bar's third button, label `` `End round
  ${model.current_round}` ``, icon `chevron-right`, disabled read-only. Wired to
  `endMontageRound` + `commit()`.
- **Test** (`test/dom/elements/montage.test.ts`, "SC-191 fix round 2: the bottom action
  bar"): `'"End round N" shows the round being ended, advances current_round by one, and
  persists…'` — clicks `End round 3` on the `mid` fixture (current_round 3, rounds 3),
  asserts `host.replaceSource` wrote `current_round: 4` and the outcome band/bar flip to
  `complete`. **Red**: `TypeError: Cannot read properties of null` (no such button existed
  pre-fix) against the stashed pre-fix-2 source; **green** after. Unit-level:
  `test/unit/model/montage-tally.test.ts`, two new tests for `endMontageRound` (plain
  advance; ending the last round flips `montageTallies(m).complete` live).

### 2. `Undo` — removes the most recently logged entry

- **`model.ts`**: `undoLastMontageEntry(m)` — no-op on an empty/absent `entries[]`;
  otherwise delegates to the existing `removeMontageEntry(m, entries[entries.length -
  1])`. Tie-break, per the brief's own ask: **log order**, not a round/hero sort —
  `entries[]` preserves authored/logged array order (§B.5, `logMontageEntry` always
  `.push()`es), so the LAST array element is unambiguously the most recent, even when a
  Director logs out of board order via the sheet's Round field (spec §D allows any
  round).
- **`view.ts`**, `buildActionBar()`: the LIVE-state bar's second button, disabled when
  `(model.entries?.length ?? 0) === 0`, read-only disabled too.
- **Tests**: `test/dom/elements/montage.test.ts` — disabled-with-no-entries /
  enabled-with-entries; and the tie-break proof itself — undoing on the `mid` fixture
  removes Talin's round-2 assist (the fixture's actual last-pushed entry) and leaves
  successes/failures untouched (an assist never tallies). `montage-tally.test.ts` — a
  unit test that logs entries in round 2-then-round-1 order (deliberately out of board
  order) and asserts the round-1 one (pushed second) is what gets undone, not the
  round-2 one — proving the tie-break is log order, never a round sort. Both **red**
  (`montageReopenable`/`undoLastMontageEntry is not a function` / no such button)
  against the stashed pre-fix-2 source, **green** after.

### 3. Done-state bar: `Reopen` + danger `Clear all`

- **`model.ts`**: `montageReopenable(m)` — `true` only when `montageTallies(m).complete`
  AND neither the success nor the failure limit was actually reached (i.e. complete
  by rounds running out alone). The mock only DRAWS `Reopen` (mock6.js:1424, a static
  screenshot); this is the ledger's own specified behaviour, not a guess: "exhausted-
  by-rounds → `addMontageRound`… ended by a limit → `Reopen` is not shown (limits are
  final; Clear all/Reset progress is the way back)". Which case I found in the mock: the
  mock draws `Reopen` unconditionally (no branching logic at all, since it's a static
  render) — the reopenable/not-reopenable split is this round's own implementation of the
  ledger's stated rule, not something extracted from the mock's (nonexistent) logic.
- **`view.ts`**, `buildActionBar()`: the COMPLETE branch renders `Reopen` (icon `undo`,
  same glyph the mock reuses for it) only `if (montageReopenable(model))`, then always
  `Clear all` (danger, icon `trash`) — DOM order and labels match mock6.js:1424-1425
  exactly. `Reopen`'s click calls `addMontageRound` + `commit()` (extending `rounds` by
  one makes `current_round > rounds` false again, live). `Clear all`'s click is the
  SAME `resetMontageProgress` + a `'Montage progress cleared'` Notice the old ⋯ item used.
- **Tests**: `montage-done` fixture (complete via `success_limit` reached) — bar shows
  ONLY `Clear all`, no `Reopen`, no Log/Undo/End-round; a separate inline fixture
  (`rounds: 3`, `current_round: 4`, neither limit reached) proves `Reopen` DOES render
  and clicking it writes `rounds: 4` and flips the bar back to `data-complete="off"`.
  Both **red** (no such buttons / `montageReopenable is not a function`) against
  pre-fix-2, **green** after. Unit-level: four `montageReopenable` cases (rounds-only
  true; success-limit false; failure-limit false; live/not-complete false).

### 4. ⋯ menu dedup

- **`view.ts`**, `chromeItems()` (~line 182 in the pre-fix-2 file, the `montage-clear-all`
  entry deleted outright): the ⋯ panel now returns exactly `montage-add-round` /
  `montage-add-hero` / `montage-set-limits` / `montage-reset-progress` — four items.
- **Test**: `'add a round / add a hero / set limits… / Reset progress render… Clear all
  is NOT one of them'` — asserts the exact 4-item id set (sorted) and
  `chromeItem(root, 'montage-clear-all')` is `null`. **Red** against pre-fix-2 (the old
  set was 5, including `montage-clear-all`), **green** after.

## Gates — full `dse-verify` battery, final tree, post-commit

Host-pin condition unchanged from slices 2-4 (SC-205, Obsidian self-updated to 1.14.0 past
the pinned 1.13.7) — aborts `npm run shots`' own exit code at its final in-run assertion,
strictly AFTER every PNG is written. Not touched (pin/listings/`obsidian-host-pin.mjs`/
`shoot.mjs`'s host model/asar all untouched this round). All gates run via plain
`bash`/`npm` on PATH, output to files, read for content.

| Gate | Expected (brief) | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean** | `tsc-2.log` |
| `npm run lint` | clean, exit 0 | **clean, exit 0** | (part of `green-1.log`) |
| `rm -f main.js styles.css && npx jest` | ≥3626/1 + yours | **3643 passed / 1 skipped / 192 suites / 3 snapshots** (+17 net: 8 new in `montage-tally.test.ts`, 9 net in `montage.test.ts` after rewriting the 5-item ⋯ test into a 4-item one and the reset/clear-all `test.each` into two separate tests, plus 10 new bar tests) | `jest-full-1.log` |
| `npm run shots` ×2 | 508 (+ any new capture id) byte-identical | **508 PNGs both runs (no new capture id this round — the bar's buttons are additions to EXISTING capture ids, not new ones), 0 ERROR-suffixed files; sha256 of all 508 byte-identical across both runs** | `shots-1.log`, `shots-2.log`, `run1.sha256`, `run2.sha256` (diff empty) |
| `check-freeze.sh` | exactly the 2 montage print lines | **`montage--steel-print.png: FAILED`, `montage--steel-realprint.png: FAILED` — exactly those 2, nothing else** | `freeze-1.log` |
| `npm run parity` (last) | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0** | `parity-1.log` |

**In-run assertions printed OK before the pin abort** (all three, matching slices 3/4):
`chrome placement OK (7 element families…)`, `montage track widths OK (success 413.13px
=== failure 413.13px, montage:mid, 6/3 limits)`, `chrome host-leak OK (18 family/scheme
combos…)`.

## Freeze package — unchanged, verified rather than regenerated

**No montage print capture actually moved bytes this round** — verified directly, not
assumed. The whole action bar (all its buttons, in both LIVE and COMPLETE states) lives
in ONE Steel-only CSS tier that never reaches print (spec §E: it needs no print reach —
board grid/outcome band/guide panel are the only three named exceptions), AND every
button inside it is `.dse-btn`, independently hidden by the plugin-wide print rule 4
(`[data-dse-print="on"] .dse-btn { display: none }`). So under print media the bar
renders as empty regardless of whether it holds 0, 1, 2 or 3 hidden buttons — adding
`Undo`/`End round N`/`Reopen` changes nothing a print capture can see.

Confirmed by direct hash comparison, not inference:
- `montage--steel-{print,realprint}.png` (this round's fresh shots) —
  **byte-identical** to slice 4's own `rebaseline.txt` hash
  (`3792de475e245b6b692518f54b8fee5932c41b331afc4d9fb2403d1648d5c32f` for both).
- All 7 widened capture ids' `--steel-{print,realprint}.png` pairs (`montage-mid`,
  `-done`, `-failed`, `-old-shape`, `-narrow`, `-guide-open`, `-strip-pinned`) — a
  fresh `sha256sum` diffed against the existing `widening.txt` is **empty**, incl.
  `montage-done` (whose bar visibly changed on screen — single accent button, slice 4 →
  a danger `Clear all` button, this round — but not under print, for the reason above).

**Conclusion: `rebaseline.txt`, `widening.txt`, and both before/after crop pairs in the
ledger dir are unchanged and still accurate — nothing to regenerate.** `check-freeze.sh`'s
2 FAILED lines are the SAME sanctioned slice-4 rebaseline (against the ORIGINAL
pre-SC-191 baseline), not a new movement.

## Tests — full list, all shown red before green

- **`test/unit/model/montage-tally.test.ts`** (+8 new): `endMontageRound` (plain advance;
  ending the last round flips `complete` live); `undoLastMontageEntry` (log-order
  tie-break proof; no-op on empty entries); `montageReopenable` (rounds-only-true;
  success-limit-false; failure-limit-false; live-false). Shown red: `git stash push -u --
  src/elements/montage/model.ts` (keeping the test file), ran the file → 8 failed
  (`TypeError: … is not a function`), rest passed unaffected; `git stash pop`, re-ran →
  39/39 green. Logs: `jest-tally-red.log`, `jest-tally-green.log`.
- **`test/dom/elements/montage.test.ts`** (net +9, several rewritten): the ⋯ menu's
  4-item set (Clear all absent); the live bar's DOM order/labels/accent class; Undo's
  disabled state (empty vs. non-empty entries); Undo's log-order removal + persistence;
  End round's label/advance/persistence/completion; the done bar's shape (no
  Log/Undo/End-round, Clear all present+danger); Reopen absent when a limit was hit;
  Reopen present+working when exhausted by rounds alone; read-only disables every bar
  button in both live and complete states; "Reset progress" (⋯ item) and "Clear all"
  (done bar) both verified to zero progress identically via one shared assertion
  helper. Shown red: `git stash push -u -- src/elements/montage/{model,view}.ts
  styles-source.css` (keeping the test file), ran the file → **10 failed** (exactly the
  new/changed tests — the two that happened to already pass, "Reset progress via ⋯
  item" and "complete-by-limit Reopen absent", were testing UNCHANGED behaviour, not a
  gap in the red check), rest of the 61 unaffected tests passed; `git stash pop`,
  re-ran → 71/71 green. Logs: `jest-red.log` (pre-stash-pop), `green-1.log` (post).

## Docs

- **`docs/gm-trackers.md`** — "Ending a round", "Undoing the last thing you logged", and
  "When a montage finishes" paragraphs added (plain language: End round N as the only
  round-advance path; Undo as "the single most recent entry only"; Reopen vs. Clear all,
  with the limit-is-final distinction spelled out). The ⋯ menu paragraph corrected to
  four items, with a one-line note that Clear all (done-bar) and Reset progress (⋯) are
  the same reset reachable two different ways.
- **`docs/Media/montage.png`** — regenerated (the `mid` fixture's bar now shows Log an
  action…/Undo/End round 3). Every OTHER docs image `npm run docs-shots` touched was
  reverted with `git checkout --` (the same over-broad-regeneration issue flagged after
  the session interruption during slice 4 — confirmed `montage-sheet-modal.png` came
  back byte-identical, so the sheet itself is genuinely unaffected by this round and
  needed no revert).
- **`CHANGELOG.md`** (dse) — the SC-191 `[FEATURE]` bullet's control list corrected: the
  bar now names `End round N`/`Undo`/`Reopen`/danger `Clear all`; the ⋯ list drops
  `Clear all`, down to four items.
- Workspace `CHANGELOG.md` (superproject) — **not edited**: it never enumerated the
  specific ⋯/bar controls (a higher-level summary), so it stayed accurate without a
  change; still sits uncommitted in the worktree superproject from slice 4, per the
  brief's standing instruction.

## Drive-by fixes

None. Every line touched is squarely this round's own four-item scope; no pre-existing
bug in a touched file was found and fixed in passing.

## Follow-ups

None new. Slice 4's own follow-ups (the harness `Modal` shim, filed as SC-294) are
explicitly out of scope for this round and untouched.

## Artifacts

- Commit: `8cd9d30d043d66593e0640d8706b5da8bfa93e67` (branch `sc191-montage-overhaul`, worktree
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`)
- This report:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-fix2-report.md`
- Changed source: `src/elements/montage/{model,view}.ts`, `styles-source.css`
- Changed tests: `test/unit/model/montage-tally.test.ts`,
  `test/dom/elements/montage.test.ts`
- Docs: `docs/gm-trackers.md`, `docs/Media/montage.png` (regenerated), `CHANGELOG.md` (dse)
- Freeze package (ledger dir, unchanged/verified, not regenerated):
  `rebaseline.txt` (2 lines), `widening.txt` (14 lines),
  `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png`
- Gate logs (all under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-fix2/`):
  `tsc-1.log`, `tsc-2.log`, `green-1.log` (tsc+lint+jest montage.test.ts, final green),
  `jest-red.log` (montage.test.ts, pre-fix-2 red), `jest-tally-red.log`/
  `jest-tally-green.log` (model unit tests, red/green), `jest-full-1.log` (full suite,
  3643 passed), `shots-1.log`/`shots-2.log`, `run1.sha256`/`run2.sha256`,
  `widening-new.txt` (the fresh-hash comparison proving widening.txt unchanged),
  `freeze-1.log`, `parity-1.log`, `docs-shots-1.log`, `commit.log`.
