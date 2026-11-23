# SC-671 r1 — implementer brief: counter writes keep YAML keys the counter does not know

## 1. Context loading (do this first)

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/decisions.md`.
  It is the current state of every decision. Its "Owner rulings" are binding; quote, don't reinterpret.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in this brief and
  the ledger.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys`, branch
  `sc671-counter-unknown-keys` in every submodule. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements`.
  Verify `git -C <abs> branch --show-current` before any write. **Never write under
  `/home/scott/code/steelCompendium/workspace/`** except your report into the ledger dir. The main checkout's dse dirt
  (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected,
  not yours, don't touch or report it.
- Base: dse `develop` @ `129beb18` (the branch already sits there); superproject on workspace main `3a517cdf`. Run
  `git -C <plugin abs path> fetch origin` and confirm `origin/develop` is still `129beb18`. **If it moved, do NOT
  rebase on your own** — keep working on `129beb18` and say so in the report (a move most likely means SC-442 landed,
  and the owner decides the rebase; see the SC-442 ruling in the ledger).
- A fresh worktree has no `node_modules`: run `npm ci` in the plugin dir first (through a devbox script file, output
  to a log).
- **Prior art — the same bug fixed twice.** Montage (SC-625) and negotiation (SC-637) are landed on `129beb18`.
  Read `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc637-negotiation-unknown-yaml-keys/decisions.md`
  (owner rulings and the r1 / r2 results), and copy the shape of the landed code and tests:
  - montage: `src/elements/montage/model.ts` (`unknownPairs`, `carryUnknown`, extras as own properties copied with
    `Object.defineProperty`, written after the known keys), `test/unit/model/montage-serialize.test.ts`, the X09
    `test.each` over every write path and X10 two-blocks in `test/dom/elements/montage-matrix.test.ts`, MONT-X09..X14
    in `e2e/specs/montage/integrity.e2e.ts`;
  - negotiation: `src/model/NegotiationData.ts` (`unknownKeysOf`, extras in a module-private WeakMap) and
    `src/elements/negotiation/model.ts` (`withUnknownKeys`), with their tests.
  - the counter's own neighbours: `src/elements/shared/undeclaredDefaults.ts` (SC-482, `recordingDefaults` /
    `stringifyOmittingUntouched`), `e2e/specs/counter/kept-keys.e2e.ts` + `e2e/vaults/shipped/Counter/kept-keys.md`
    (SC-652, CTR-K01), `test/dom/elements/counter.test.ts`.
- Read the `dse-verify` skill's battery table and notes: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  lines 20-246 (some lines are very long; read in parts, e.g. `cut -c1-2000`) plus the "Current expected numbers"
  CURRENT paragraph at line 1534.

## 2. The task

Ticket SC-671, as Scott filed it: "Pressing − or + on a `ds-counter` rewrites the block with only `max_value`,
`current_value`, `min_value` and `name`. Any other key the user wrote is deleted from the note." Repro: "a counter
block that also holds `note_to_self: keep me` and `extra: {a: 1}`. Press +. Both keys are gone from the note."

Pointers (from the ticket): `src/elements/counter/model.ts:43-44` — `serialize` writes only the `Counter` instance;
`src/model/Counter.ts:41-52` — `parse` copies six named fields (plus `_dse_anchor`) and drops the rest. The counter
definition (`src/elements/counter/definition.ts`) has no schema; the view is `src/elements/counter/view.ts`.

Owner rulings, verbatim from the ledger:

> **Not dependent on SC-599.** (Same ruling as SC-625 / SC-637.) SC-599 (parked on Scott) is about comments / quote
> style / flow formatting of the whole-block rewrite. SC-671 is about key/value data the parser throws away; it is
> fixed inside the existing parse -> model -> `stringifyYaml` path. Do NOT introduce source-text-preserving editing,
> the `yaml` Document API, or anything that decides SC-599's question. Unknown values are preserved by VALUE; their
> formatting follows whatever the existing serializer does today (`extra: {a: 1}` may come back as a block map).

> **Placement:** known keys keep the existing fixed order (`max_value`, `current_value`, `min_value`, `name`,
> `value_height`, `name_height`, `_dse_anchor`); unknown keys go after ALL the known ones (after `_dse_anchor` too, as
> montage and negotiation do), in their original relative order. A key that looks like an integer is written first
> (JS object key order) — document it, do not restructure to fix it (SC-625 precedent).

> **"Known" means every key the counter READS:** `max_value`, `current_value`, `min_value`, `name`, `value_height`,
> `name_height`, `_dse_anchor`, plus any alias the parser or view turns out to read. A known key is never carried as
> "unknown", whatever its value (a wrong-typed or falsy known value keeps today's behaviour exactly — that is SC-672 /
> SC-673). The framework-reserved wrapper keys (`prefs`, `collapsed`, `collapsible`, `collapse_default`) are the
> pipeline's (SC-652) and must be written once, where they are written today — never twice, never moved.

> **SC-482 stays intact.** A key the source did not declare and the user did not change is still not added on write
> (`min_value: 0`, `value_height: 3`, `name_height: 1`, `current_value: 0`). A block with no unknown keys must
> serialize byte-identically to develop `129beb18`.

> **Every write path keeps the unknown keys:** −, +, a typed value (click-to-edit box, Enter / blur / arrow keys), any
> reset, the pinned sidebar card (which adds `_dse_anchor`), a write after an outside-edit refresh, and the block edit
> form if the counter has one. A path that builds a NEW `Counter` (clone, re-parse) must not lose them.

> **No YAML key may shadow a field or the prototype.** `__proto__`, `constructor`, `toString`, `hasOwnProperty`,
> `toJSON` as user keys: no prototype pollution, no crash, value written back. Where the extras live (own props as
> montage, or a module-private WeakMap as negotiation and `undeclaredDefaults.ts`) is the implementer's call, with the
> reason stated.

> **Scope is `ds-counter` (`ds-ct`) only.** Do not change montage or negotiation code. Reusing an existing generic
> helper is fine; extracting one out of landed montage / negotiation code is not. Out of scope, do not fix: SC-672
> (non-map block overwritten, empty block raw TypeError), SC-673 (out-of-range values), SC-674, SC-680 (wheel),
> SC-599. Other elements that drop unknown keys the same way are reported as Follow-ups, not fixed.

> **SC-442 overlap (unlanded; its branch head `ed7130d9` sits on `129beb18`, test-only).** SC-442 adds
> `e2e/vaults/shipped/Counter/unknown-keys.md`, `e2e/specs/counter/counter-bugs.e2e.ts`
> (`knownBug('SC-671', '[CTR-U01] …')`), `counter-steppers.e2e.ts`, `counter-typed.e2e.ts`,
> `test/dom/elements/counter-matrix.test.ts`, and edits `e2e/manifest/counter.ts`, `e2e/specs/_census.e2e.ts`,
> `test/dom/e2eCensus.test.ts`, `e2e/README.md`. To keep the two branches mergeable in either landing order, SC-671
> r1: uses NEW files with names SC-442 does not use (no `unknown-keys.md` fixture, no `counter-bugs` /
> `counter-steppers` / `counter-typed` / `counter-matrix` file names), takes no scenario id SC-442 holds
> (CTR-E01..E05, F01, F02, K01, L01..L05, N01, Q01, S01..S04, T01..T06, U01, V01..V03, W01, W02, X01), and keeps edits
> to the shared files above to the minimum the gates force. Whichever of the two lands second flips the CTR-U01
> marker to a plain test in its rebase round.

> **No lifecycle scenario expected.** If a worker shows a lifecycle-only path, the free id is `G-S146`.

What to do:

- First, enumerate (in the report) every key the counter's parser and view read (incl. any alias), and every write
  path of the counter (−, +, typed value and its keys, any reset, pinned sidebar card, write after an outside-edit
  refresh, the block edit form if one is offered for a schema-less element — say whether it is and what it does with
  an unknown key), and confirm each goes through the same `serialize`. Note any path that builds a NEW `Counter`.
- Fix: carry the unknown top-level keys of a `ds-counter` block through the model and write them back after the known
  keys. An unknown key with a nested map / list / null value survives by value. A non-map body (`hello`, a list, an
  empty block) keeps today's behaviour exactly — do not crash on it differently and do not fix it (SC-672).
- Tests that pin the behaviour and fail on the base (state which fail on `129beb18`). Suggested files (new, names not
  used by SC-442): `test/unit/model/counter-serialize.test.ts`, `test/dom/elements/counter-own-keys.test.ts`.
  Cover: unknown scalar + nested map + list + null survive EACH write path (a `test.each`, as montage X09); order
  (known fixed order, then `_dse_anchor`, then unknown in original order); SC-482 still holds with unknown keys
  present (no `min_value: 0` / `value_height: 3` / `name_height: 1` added) and a block with no unknown keys is
  byte-identical to before; `value_height` / `name_height` are not carried as unknown (no duplicate); the reserved
  wrapper keys (`prefs: compact`, `collapsed: yes`, a usable `prefs:` map) appear once each next to unknown keys;
  hostile keys `__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON` and keys named like Counter fields
  with different spelling/case (`Name`, `maxValue`) — no prototype pollution (`({}).polluted` stays undefined), no
  crash, value written back; two counter blocks in one note, each with its own unknown keys — a press on one leaves
  the other block's bytes untouched and never moves a key across; text above and below the fence survives; a second
  and third press keep the keys (no loss on the re-parse after the plugin's own write); an outside edit that ADDS or
  REMOVES an unknown key, then a press — the written block has the outside edit's keys, not the stale set; the
  pinned-sidebar write keeps them alongside `_dse_anchor`; integer-looking key order pinned with a unit test.
- e2e (real Obsidian): one new spec file, e.g. `e2e/specs/counter/own-keys.e2e.ts`, with a new fixture, e.g.
  `e2e/vaults/shipped/Counter/own-keys.md` (a scalar, a nested map, a list; ABOVE / BELOW text; follow
  `kept-keys.md`'s layout). Cover at least: + keeps them (Reading view); − then + keeps them across two writes; the
  same in Live Preview; the pinned sidebar card's write keeps them (look at
  `e2e/specs/sidebar/pending-saves.e2e.ts` for the pin driver). New scenario ids: `CTR-O01…` (check they are free:
  `grep -rhno "CTR-[A-Z]*[0-9]*" e2e/ test/` and the SC-442 list in the ruling above). **Never put a bracketed ticket
  id in a test title** (the runner reads titles for scenario ids). If the fixture census / manifest
  (`e2e/specs/_census.e2e.ts`, `test/dom/e2eCensus.test.ts`, `e2e/manifest/counter.ts`) forces an edit for the new
  fixture, make the smallest one and list it in the report (SC-442 edits the same files).
- CHANGELOG: one user-facing bullet under `## Unreleased` in YOUR worktree's superproject
  `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`. Plain words and accurate: say the keys are kept with the same values;
  do not claim "as you typed them" (comments, quote style and `{a: 1}` flow form are still not kept — SC-599). Look at
  the SC-625 and SC-637 bullets for wording. Commit it in the superproject as its own commit. **Do NOT commit a
  submodule pointer bump** — the owner arranges that once, at the end.
- If `e2e/README.md` or a plugin doc (`docs/` in the plugin, e.g. an integration / element note) states what a counter
  write keeps, update it in the same change; say in the report which docs you checked.
- Commit inside `draw-steel-elements` after every coherent step (fix, unit/jsdom tests, e2e) so nothing sits
  uncommitted through a gate. No AI attribution or co-author trailers in any commit message.

## 3. Gates (dse-verify) — expected numbers at dispatch (CURRENT @ `129beb18`)

tsc and lint clean · jest **13703 passed / 1 skipped** with the shots cache (fresh worktree **13702 / 2** — this
worktree is fresh) · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage:
418/418 pairs`** · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity
0/0/24.

After your change expect: jest = 13702 + your new tests (fresh, 2 skipped); e2e ok = 658 + new, total = 667 + new,
**9 known-bug unchanged** (the SC-671 marker is not on this base), `0 failed`, coverage Y/Y pairs (state Y; a new
pair only if your e2e drives a counter control x interaction not yet in the manifest); lifecycle 64/64.

- Run in order: `rm -f` the two literal build files (below), then tsc, lint, jest, lifecycle (seven parts), e2e.
- **Lifecycle runs in SEVEN parts with `--only=` (EQUALS sign — with a space the runner runs the whole suite)**, one
  part per Bash call, comma-separated ids (check the list against dse-verify line 32 before the first run):
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3) — about 200 s
  Any call over 180 s is moved to the background by the Bash tool: start each part with output to a unique log in your
  private scratch dir, then poll the log / your OWN node pid (`readlink /proc/<pid>/cwd` must be your worktree's
  plugin dir) with `timeout 175 tail --pid=<pid> -f /dev/null`. Never wait for a completion notice. The same goes for
  the full e2e run (it does not fit one 180 s call).
- Known flakes (dse-verify has the details): a G-S91 FAIL is real unless it says the host was too slow after two
  re-runs. G-S115 cell (g) only (SC-633): one re-run of part 7 on a loaded host. If G-S97 fails, first check
  `git -C <plugin> status demo-vault/.obsidian/appearance.json` (SC-622) and restore it with
  `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json`. e2e: SET-X03/X04 (SC-657), INIT-W09 (SC-654
  signature) and NEGO-R05 have each failed once under load — a red in one of those gets ONE re-run of that spec alone
  plus a note; any counter or sidebar red is yours until proven otherwise.
- Jest timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise (re-run that suite alone).
- **Shots / freeze / parity:** this change should touch no CSS. Build once and compare `styles.css` (sha256) against
  a clean `129beb18` build (build the base in a scratch `git worktree add` at an absolute path under your private
  scratch dir, or use `git stash`-free means; never in the main checkout). If byte-identical, shots / freeze / parity
  carry — say so with both hashes. If not, run them.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements -- bash <script file>`.
  `$?` echoed inside `bash -c '…'` is ALWAYS 0 — record exit codes from a script FILE, and read each gate's own
  summary line (jest "Tests:", `OBSIDIAN-LIFECYCLE done:`, `OBSIDIAN-E2E done:`). Never pipe a gate into `tail`.
- Never `cd` inside a compound command; use absolute paths and `git -C <abs path>` for every git command.
- Private scratch dir only: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc671-r1-impl/`
  with uniquely named scripts/logs. Create files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (and no `rm` with a shell variable
  in its path, no glob `rm` anywhere). Leave throwaway files in place; overwrite with `>` or use fresh names. The only
  allowed `rm` is the literal
  `rm -f /home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements/styles.css`
  before jest (a stale `main.js` shadows `main.ts` for jest).
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree. Never delete a
  shared `/tmp` glob (other efforts' lifecycle / e2e vaults match it).
- Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` except your own report file below.
- Run each gate as a blocking foreground call where it fits under 180 s; otherwise the log+pid poll above. No
  `Monitor`, no waiting on notifications. Redirect long output to files — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Use per-run unique paths and your own
  pid.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I
  see your completion and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must
  be `SC-671:`.
- Do not edit `.claude/skills/dse-verify/SKILL.md`. If its notes need an update, write the proposed text into your
  report.
- Never create a tag or a release. Never push. Never run `just wt-finish`, `just deploy*` or `just sync`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (verdict, final dse sha, superproject CHANGELOG sha, gate numbers).
Then: the key / write-path enumeration, the design (where extras live and why no key can shadow a field or the
prototype), every test added (id, file, fails-on-base yes/no), every shared-with-SC-442 file you touched and the exact
hunk, gate log paths, `styles.css` hashes, `Drive-by fixes:`, `Follow-ups:` (incl. other elements that drop unknown
keys, if you noticed any — do not go looking beyond a quick grep), proposed SKILL.md text.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas (dse branch head, superproject
CHANGELOG commit), measured numbers per gate — no prose, plus the absolute path of every evidence artifact you
produced (report, gate logs).
