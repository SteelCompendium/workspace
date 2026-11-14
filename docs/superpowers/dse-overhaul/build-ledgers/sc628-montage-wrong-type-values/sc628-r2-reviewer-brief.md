# SC-628 r2 reviewer brief — independent adversarial review of the r1 fix

You are the independent reviewer for Linear ticket SC-628 (montage: hand-typed values of the wrong type). You did not
write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Decisions ledger (the ONLY source of rulings): 
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc628-montage-wrong-type-values/decisions.md`.
- r1 brief and report in the same dir: `sc628-r1-implementer-brief.md` (battery procedure, footguns, lifecycle parts —
  they apply to you too, read §3 and §4) and `sc628-r1-implementer-report.md` (read its executive summary, design and
  input table; the claimed numbers are what you are checking).
- **You never call the tracker** (Linear) — not to read history, not to post.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values`, branch
  `sc628-montage-wrong-type-values`; dse head `ff266522` on base `afd1436c`. Read-only for you: do NOT commit to the
  branch. Probes go in a scratch copy (`git -C <plugin dir> worktree add <your scratch dir>/probe <sha>`, absolute path)
  or as uncommitted scratch test files that you revert by `git -C <plugin dir> checkout -- <that exact file>` / leave
  untracked in YOUR scratch dir — never `git checkout -- .`.
- `git -C <plugin dir> fetch origin`; confirm `origin/develop` is still `afd1436c`.

## 2. The task — execute and probe, not just read

Review `git -C <plugin dir> diff afd1436c..ff266522` against rulings M1–M4, Scope and Markers in the ledger.
Probe at runtime (unit/jsdom scratch tests, and real Obsidian e2e `--only=` where the claim is about the live card):

1. **M1** every scalar title (`2024`, `true`, `false`, `3.5`, `0`, `-1`, `1e3`, `.inf`, a date `2024-01-01` — YAML
   parses that to a Date in some schemas: check what Obsidian's `parseYaml` gives) renders; every place the title is
   read (head, aria, modal titles, Notices, error prefix) — grep for every `.title` read in `src/elements/montage/` and
   anything that names the montage.
2. **M2** each of the six number keys with `"3"`, `" 3 "`, `"0"`, `"-1"`, `"3.5"`, `"1e2"`, `"0x10"`, `"Infinity"`,
   `""`, `banana`, `true`, `[1]`, `{a: 1}`, `null`: what is read, what every write that touches that key produces,
   and that no write ever concatenates. Is "plain finite number" implemented strictly (does `"0x10"` or `"1e2"` count?
   report what it does; flag only if it contradicts M2 or produces something absurd on the board).
3. **M3 integrity probes** (this writes into user files): an untouched typed value survives EVERY write path (Log an
   action, correct/remove an entry, Add a hero, Set limits, Add a round, End round, reset progress, strip/guide
   toggles if they write); content above and below the block survives; two montage blocks in one note don't cross-talk
   (one with `title: 2024`, one with `title: "2024"`); an outside edit that changes the typed value between parse and
   write is not overwritten by a stale remembered value; SC-482's omit-absent-defaults and SC-625's unknown-key carry
   still hold (their existing tests green, plus one probe each combined with a typed value).
   Check the SC-625 constraint: no non-schema own property on the model or an entry (`Object.keys(model)` after parse
   of a typed-value block must list only schema keys + the user's unknown keys).
4. **M4** a map or list title → plain error card naming `title`, no raw JS message, no control, note byte-identical
   after interactions; also the error card in Live Preview and Reading view.
5. **Markers** W01/W02 are plain tests with assertions intact; W03 (SC-629) untouched; no bracketed ticket id in any
   test title; new ids don't collide (`command grep -a -rn` — plain grep reads `e2e/run.mjs` as binary).
6. **Tests are not vacuous:** revert the `src/` change in your scratch copy and confirm the new unit/jsdom/e2e tests
   go red.
7. **Re-run the battery yourself on `ff266522`**: tsc, lint, jest, lifecycle (seven parts, `--only=` with the equals
   sign), full e2e. Expected: tsc (+ `tsc -p e2e`) and lint clean, jest fresh 13188 passed / 2 skipped, lifecycle 64/64 (union of the seven parts), e2e `OBSIDIAN-E2E done: 579/600 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`, styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (identical to base). styles.css sha256 vs a clean `afd1436c` build — if they differ, also shots,
   freeze, parity (baseline: shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280,
   parity 0/0/24).
7b. **r1b folds** (ledger "r1 follow-ups ruled"): `description` number/boolean shown as text and written back as typed;
   map/list description → plain error card naming `description`, writes nothing; a block body that is not a map
   (text, number, boolean, list) → plain error card, writes nothing; an EMPTY block (nothing, blank lines, only
   comments, `null`) still draws a fresh default montage AND its first write behaves as before the change. Probe the
   edge between empty and non-map (`~`, `""` as the whole body, a body of only `---`, a comment then a scalar).
   SC-655 (entry-level wrong types) is OUT of scope — don't report its known behaviour as a finding.
8. The CHANGELOG bullet in the worktree superproject (`/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values/CHANGELOG.md`):
   one bullet under `## Unreleased`, user-facing, accurate.
9. The r1 Follow-ups (entry/participant wrong types): independently confirm or refute any claim of a raw error or
   data loss, with the exact input.

## 3. Footguns

Same as the r1 brief §4 — all apply. Your private scratch folder:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc628-r2-rev/`.
Never `rm`/`rmdir` in /tmp or the scratchpad, never `rm` a variable path, never `pkill` by pattern, `git -C` always,
no background gates or Monitors (poll your own pid), redirect long output to files, never key a wait on a scratch
filename. If the report-file write is blocked, return the report inline. You cannot `SendMessage` me: end with
`STATUS: NEEDS_CONTEXT` and the question; if you ever send a message anyway its first word must be `SC-628:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc628-montage-wrong-type-values/sc628-r2-reviewer-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED, finding counts by severity, your
measured gate numbers). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, the failing input, the
failure scenario and a prescribed fix. Paths of every probe and log.

## 5. Return contract

Raw facts only: STATUS line, verdict, findings one line each with severity and file:line, measured numbers, absolute
paths of the report and all evidence.
