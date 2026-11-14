# SC-637 r1 — implementer brief: negotiation writes keep YAML keys the negotiation does not know

## 1. Context loading (do this first)

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/decisions.md`.
  It is the current state of every decision. Its "Owner rulings" are binding; quote, don't reinterpret.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in this brief and
  the ledger.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys`, branch
  `sc637-negotiation-unknown-yaml-keys` in every submodule. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys/draw-steel-elements`.
  Verify `git -C <abs> branch --show-current` before any write. **Never write under
  `/home/scott/code/steelCompendium/workspace/`** except your report into the ledger dir. The main checkout's dse dirt
  (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected,
  not yours, don't touch or report it.
- Base: dse `develop` @ `76520b1f` (the branch already sits there); superproject on workspace main `18f8043f`. Run
  `git -C <plugin abs path> fetch origin` and confirm `origin/develop` is still `76520b1f`; if it moved, rebase onto it
  and say so in the report.
- **Prior art — the same bug fixed on the montage (SC-625, landed in `76520b1f`).** Read
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc625-montage-unknown-yaml-keys/decisions.md`
  ("Notes for SC-637's owner" and the r2 rulings) and skim its `sc625-r2-review-report.md` findings list. Copy the
  shape of the landed code and tests: `src/elements/montage/model.ts` (unknown keys carried as own properties copied
  with `Object.defineProperty`, written after the known keys), `test/unit/model/montage-serialize.test.ts`, the
  X09 `test.each` over every write path and X10 two-blocks in `test/dom/elements/montage-matrix.test.ts`, and the
  MONT-X09..X14 e2e in `e2e/specs/montage/integrity.e2e.ts`.
- SC-439 (the negotiation e2e that filed this ticket):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc439-e2e-negotiation-ledger.md`
  — grep it for `SC-637`; it names the markers (X06/X07/K01/K02).
- Read the `dse-verify` skill's battery table and notes: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  lines 20-240 (some lines are very long; read in parts, e.g. `cut -c1-2000`) plus the "Current expected numbers"
  CURRENT paragraph near line 1525.

## 2. The task

Ticket SC-637: a `ds-negotiation` block with a key the plugin does not know (`note_to_self:` at the top, `gm_note:` on
a motivation or pitfall) loses that key the first time anything writes the block — a Patience or Interest seal, a
motivation or pitfall chip, Complete Argument, Reset. Expected: "keys the plugin does not know survive a write, at the
top level and inside each motivation and pitfall." Repro fixture `e2e/vaults/shipped/Negotiation/unknown-keys.md`:
click Patience seal 1 and the written block has no `note_to_self`, no `gm_note` on "Legacy" or on the pitfall "Pride".

Pointers (from the ticket): `src/model/NegotiationData.ts:29-36` (constructor), `:185-186` (Motivation), `:196-197`
(Pitfall) copy only known keys; `serialize` writes from the model (`src/elements/negotiation/model.ts:85-88`).
`NegotiationData` is also used by `src/framework/host/SidebarBlockHost.ts` and the
`src/drawSteelAdmonition/negotiation/*View.ts` views.

Owner rulings, verbatim from the ledger:

> **Not dependent on SC-599.** (Same ruling as SC-625.) SC-599 (parked on Scott) is about comments / quote style /
> flow-list formatting of the whole-block rewrite. SC-637 is about key/value data the parser throws away; it is fixed
> inside the existing parse -> model -> `stringifyYaml` path. Do NOT introduce source-text-preserving editing, the
> `yaml` Document API, or anything that decides SC-599's question. Unknown values are preserved by VALUE; their
> formatting follows whatever the existing serializer does today.

> **Placement:** known keys keep the existing fixed order; unknown keys go after the known ones, in their original
> relative order — at top level and inside each motivation and pitfall. The ticket's "re-orders the user's keys"
> sentence is not fixed here (it describes the known-key order, which stays as is; matches SC-625's top-level and
> per-action rule). A key that looks like an integer is written first (JS object key order) — document it, do not
> restructure to fix it (SC-625 precedent).

> **"Known" means every key the negotiation READS**, including any legacy alias / old spelling the parser accepts and
> rewrites under a canonical name, and keys it reads then drops as empty. Such a key must not be carried as "unknown"
> (that would duplicate or resurrect stale data).

> **Every write path keeps the unknown keys**, including Reset (Reset resets the tracker state, not the user's own
> keys) and the sidebar host (`SidebarBlockHost.ts` uses `NegotiationData`).

> **Scope is negotiation only.** Do not change montage code. Reusing an existing generic helper is fine; extracting
> one out of montage is not (it would widen review onto landed SC-625 code). SC-652 (framework `prefs:` / `collapsed:`
> drop) and SC-638..SC-642, SC-648, SC-649 are out of scope.

What to do:

- First, enumerate (in the report) every key the parser reads at top level, per motivation and per pitfall (incl.
  aliases), and every write path of the negotiation (Patience / Interest seals, motivation chips, pitfall chips,
  Complete Argument, Reset, any argument / edit / undo paths, the sidebar host), and confirm each goes through the
  same serialize. Note any path that builds a NEW `NegotiationData` (clone, reset) — extras must survive it.
- **Design caution, specific to this element:** `NegotiationData` is a CLASS with methods, unlike the montage's plain
  object. Carrying unknown keys as own properties of a class instance can collide with methods and fields
  (a user key named like a method, `toJSON`, `constructor`, a field name with a different spelling). Choose where the
  extras live (own props vs a dedicated non-enumerable bag / `Object.create(null)` record) so that no YAML key can
  shadow a method, a field, or the prototype, and say why in the report and in a short code comment.
- Fix: carry unknown top-level keys and unknown per-motivation / per-pitfall keys through the model and write them
  back after the known keys. An unknown key with a nested map / list value survives by value. An item the parser
  already drops as invalid stays dropped (do not change validity rules). A NEW motivation / pitfall (if the UI can add
  one) has no extras.
- Flip the SC-637 known-bug markers to plain tests: the e2e `knownBug('SC-637')` markers
  (`grep -rn "SC-637" e2e/`) and the jsdom `test.failing` in `test/dom/elements/negotiation-bugs.test.ts`. Move the
  jsdom ones out of the "bugs" file if that file's convention is bugs-only (follow what SC-625 did for montage — check
  the montage bug file history). Update `e2e/README.md`'s mention of SC-637 if it lists open markers.
  **Never put a bracketed ticket id in a test title** (the e2e runner reads titles for scenario ids; scenario ids are
  global — pick new `NEGO-*` ids not yet taken: `grep -rhno "NEGO-[A-Z]*[0-9]*" e2e/ | grep -o "NEGO-.*" | sort -u`).
- Add jsdom tests that pin the behaviour and fail on the base (state which fail on `76520b1f`): top-level unknown
  scalar + nested map + list survive EACH write path (a `test.each` like montage X09); per-motivation and per-pitfall
  unknown keys survive writes that touch OTHER items and writes that touch the item itself (chip toggle); order (known
  fixed order, then unknown in original order) at all three levels; legacy aliases / empty-dropped keys not
  duplicated or resurrected; hostile keys `__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON` and one
  key named like a `NegotiationData` method or field at all three levels — no prototype pollution, no crash, no
  shadowed method, value written back; a second negotiation block in the same note untouched (no cross-talk); text
  above and below the fence survives; integer-looking key order pinned with a unit test.
- Add e2e tests only where jsdom cannot show it (real-Obsidian write paths not already covered by the flipped
  markers — say which paths the e2e set covers after your change). Put them with the existing negotiation integrity
  e2e.
- CHANGELOG: one user-facing bullet under `## Unreleased` in YOUR worktree's superproject
  `/home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`. Plain words and accurate (SC-625 r4 lesson: say the keys are kept with
  the same values; do not claim "as you typed them" — comments and quote style are still not kept, that is SC-599).
  Look at SC-625's bullet for wording. Commit it in the superproject as its own commit. **Do NOT commit a submodule
  pointer bump** — the owner arranges that once, at the end.
- Commit inside `draw-steel-elements` after every coherent step (fix, tests, e2e) so nothing sits uncommitted through
  a gate.

## 3. Gates (dse-verify) — expected numbers at dispatch (CURRENT @ `76520b1f`)

tsc and lint clean · jest **12576 passed / 1 skipped** with the shots cache (fresh worktree **12575 / 2** — this
worktree is fresh) · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage:
287/287 pairs`** · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity
0/0/24.

After your change expect: jest = 12575 + your new jsdom tests (fresh; flipped `test.failing` already count as passed);
e2e **known-bug 20 -> 20 minus the SC-637 markers** (expected 18 if there are two e2e markers), ok = 484 + flipped +
new e2e, total = 504 + new, `0 failed`, coverage Y/Y pairs (state Y); lifecycle 64/64.

- Run in order: `rm -f` the two literal build files (below), then tsc, lint, jest, lifecycle (seven parts), e2e.
- **Lifecycle runs in SEVEN parts with `--only=` (EQUALS sign — with a space the runner runs the whole suite)**, one
  part per Bash call, comma-separated ids:
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3) — about 200 s
  Check the exact flag shape against dse-verify before the first run. Any call over 180 s is moved to the background
  by the Bash tool: start each part with output to a unique log in your private scratch dir, then poll the log / your
  OWN node pid (`readlink /proc/<pid>/cwd` must be your worktree's plugin dir) with
  `timeout 175 tail --pid=<pid> -f /dev/null`. Never wait for a completion notice.
- No new lifecycle scenario is expected. If you find you need one, the free id is `G-S127` — say so in the report.
- Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 cell (g) only
  (SC-633): a red that shows the "changed on disk first" Notice on a loaded host gets ONE re-run of part 7; a red on
  the re-run, on a quiet host, or in any other G-S115 cell is real. If G-S97 fails, first check
  `git -C <plugin> status demo-vault/.obsidian/appearance.json` — the camera tool can leave it dirty (SC-622); restore
  it with `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` and re-run before blaming code.
- Jest timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise (re-run that suite alone).
- **Shots / freeze / parity:** if your change touches no CSS, build once and compare `styles.css` against a clean
  `76520b1f` build (sha256). If byte-identical, shots/freeze/parity carry — say so with both hashes. If not, run them.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys/draw-steel-elements -- bash <script file>`.
  `$?` echoed inside `bash -c '…'` is ALWAYS 0 — record exit codes from a script FILE, and read each gate's own
  summary line (jest "Tests:", `OBSIDIAN-LIFECYCLE done:`, `OBSIDIAN-E2E done:`). Never pipe a gate into `tail`.
- Never `cd` inside a compound command; use absolute paths and `git -C <abs path>` for every git command.
- Private scratch dir only: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc637-r1-impl/`
  with uniquely named scripts/logs. Create files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (and no `rm` with a shell variable
  in its path, no glob `rm` anywhere) — two workers this wave hung on a permission prompt doing that. Leave throwaway
  files in place; overwrite with `>` or use fresh names. The only allowed `rm` is the literal
  `rm -f /home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys/draw-steel-elements/styles.css` before jest.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree.
- Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` except your own report file below.
- Run each gate as a blocking foreground call where it fits under 180 s; otherwise the log+pid poll above. No
  `Monitor`, no waiting on notifications. Redirect long output to files — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — use per-run unique paths and your
  own pid.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-637:`.
- Do not edit `.claude/skills/dse-verify/SKILL.md`. If its notes need an update (e.g. a known-bug marker count line),
  write the proposed text into your report.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (verdict, final dse sha, superproject CHANGELOG sha, gate numbers).
Then: the key/write-path enumeration, the design (where extras live and why no key can shadow a method/field), every
test added (id, file, fails-on-base yes/no), gate logs' paths, `styles.css` hashes, Drive-by fixes:, Follow-ups:,
proposed SKILL.md text.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas (dse branch head, superproject
CHANGELOG commit), measured numbers per gate — no prose, plus the absolute path of every evidence artifact you
produced (report, gate logs).
