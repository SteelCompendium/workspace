# SC-625 r1 — implementer brief: montage writes keep YAML keys the montage does not know

## 1. Context loading (do this first)

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/decisions.md`.
  It is the current state of every decision. Its "Owner rulings" are binding; quote, don't reinterpret.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in this brief and
  the ledger.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys`, branch
  `sc625-montage-unknown-yaml-keys` in every submodule. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys/draw-steel-elements`.
  Verify `pwd`/`git -C <abs> branch --show-current` before any write. **Never write under
  `/home/scott/code/steelCompendium/workspace/`** except your report into the ledger dir. The main checkout's dse dirt
  (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected,
  not yours, don't touch or report it.
- Base: dse `develop` @ `11fbded6` (the branch already sits there). Run `git -C <plugin abs path> fetch origin` and
  confirm `origin/develop` is still `11fbded6`; if it moved, rebase onto it and say so in the report.
- Prior art to skim (do not read in full): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc438-e2e-montage-ledger.md`
  (how the montage e2e and the SC-625 markers were written) and `.../sc626-montage-focus-after-write-ledger.md` (the
  latest change to the same element). For why `serialize` uses a fixed key order, search the montage ledgers for
  "M-2".
- Read the `dse-verify` skill's battery table and the notes sections:
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-240 (the file is ~460 KB:
  read only that range plus the "Current expected numbers" CURRENT paragraph near line 1524).

## 2. The task

Ticket SC-625 (filed by SC-438): any click that writes a `ds-montage` block (a quick-log, End round, Add a hero, Set
limits — every write path) deletes every YAML key the montage does not know.

1. **Top level.** A block with `table_notes: keep me` loses that line on the first write.
2. **Inside a logged action.** An entry `{hero: Kira, round: 1, result: success, skill: Nature, dc: 12}` loses `dc`
   when any other action is logged. Every entry is rebuilt.

Hero entries (`participants:`) already keep their extra keys. Expected: keys the montage does not use are written
back as they were.

Pointers (from the ticket; line numbers approximate): `src/elements/montage/model.ts` `serialize` (~:276) rebuilds a
fixed key list; `parseModel` (~:237-253) copies only known keys; `sanitizeEntry` (~:162) builds a fresh object with
the five known fields.

Owner rulings, verbatim from the ledger:

> **Not dependent on SC-599.** SC-599 (parked on Scott) is about comments / quote style / flow-list formatting of the
> whole-block rewrite. SC-625 is about key/value data the parser throws away; it is fixed inside the existing
> parse -> model -> `stringifyYaml` path. Do NOT introduce source-text-preserving editing, the `yaml` Document API, or
> anything that decides SC-599's question. Unknown values are preserved by VALUE; their formatting follows whatever
> the existing serializer does today.

> **Placement:** known keys keep the existing fixed order; unknown keys go after the known ones, in their original
> relative order — at top level and inside each logged action. (Follows the ticket's agent notes; if `participants:`
> entries already do something different, make actions match participants and report it.)

> **"Known" means every key the montage READS**, including any legacy alias / old spelling the parser accepts and
> rewrites under a canonical name. Such a key must not be carried as "unknown" (that would duplicate or resurrect
> stale data).

> Scope is montage only. SC-637 (the same bug on `ds-negotiation`) is a separate ticket; do not fix it here.

What to do:

- First, enumerate (in the report) every key `parseModel` / `sanitizeEntry` reads at top level and per action, every
  write path of the montage (quick-log, End round / Back to round, Add a hero, Set limits, undo/remove if any, strip
  toggles if they write), and confirm each one goes through `serialize`. Note how `participants:` keeps its extras.
- Fix: carry unknown top-level keys and unknown per-action keys through the model and write them back after the
  known keys. Guard against `__proto__` / `constructor` keys from hand-written YAML (copy own keys with
  `Object.defineProperty` or `Object.create(null)` style, or skip `__proto__` — never `Object.assign`/spread into a
  plain object in a way that sets a prototype). An unknown key with a nested map / list value survives by value.
  An action that the parser already drops as invalid stays dropped (do not change validity rules). A NEW action
  logged by the user has no extras. Actions keep their extras when OTHER actions are logged, when rounds end, when
  heroes are added, when limits change.
- Flip the SC-625 known-bug markers to plain tests: 2 e2e `knownBug('SC-625')` markers (find them with
  `grep -rn "SC-625" e2e/`) and 2 jsdom `test.failing` in `test/dom/elements/montage-matrix.test.ts`. They must now
  pass as plain tests. **Never put a bracketed ticket id in a test title** (the e2e runner reads titles for scenario
  ids; scenario ids are global — pick new `MONT-*` ids that are not taken: `grep -rn "MONT-" e2e/ | grep -o "MONT-[A-Z]*[0-9]*" | sort -u`).
- Add jsdom tests that pin the behaviour and fail on the base (state which fail on `11fbded6`): top-level unknown
  scalar + nested map + list survive each write path; per-action unknown keys survive another action logged; order
  (known fixed order, then unknown in original order) at both levels; legacy-alias keys (if any) are not duplicated;
  `__proto__` key in YAML does not pollute and does not crash; a second montage block in the same note is
  untouched (no cross-talk); text above and below the fence survives.
- Add e2e tests only where jsdom cannot show it (at least: Set limits write and Add a hero write keep a top-level
  unknown key, unless the existing two flipped markers already cover those paths — say which paths the e2e set covers).
- CHANGELOG: add one user-facing bullet under `## Unreleased` in YOUR worktree's superproject
  `/home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`. Plain words, e.g. "Montage: writing to a montage block no longer
  deletes keys the montage does not use (your own notes at the top of the block or on a logged action)."
  Commit it in the superproject as its own commit. **Do NOT commit a submodule pointer bump** — the owner does that
  once, at the end.
- Commit inside `draw-steel-elements` after every coherent step (fix, tests, e2e) so nothing sits uncommitted
  through a gate.

## 3. Gates (dse-verify) — expected numbers at dispatch (CURRENT @ `11fbded6`)

tsc and lint clean · jest **12167 passed / 1 skipped** with the shots cache (fresh worktree **12166 / 2** — this
worktree is fresh) · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 437/446 ok, 0 failed, 9 known-bug, coverage:
235/235 pairs`** · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity
0/0/24.

After your change expect: jest = 12166 + your new jsdom tests (fresh; the 2 flipped `test.failing` already count as
passed); e2e **known-bug 9 -> 7**, ok = 437 + 2 + your new e2e tests, total = 446 + new, `0 failed`, coverage Y/Y
pairs (state Y); lifecycle 64/64.

- Run in order: `rm -f main.js styles.css` in the plugin root, then tsc, lint, jest, lifecycle (seven parts), e2e.
- **Lifecycle runs in SEVEN `--only` parts**, one part per Bash call, comma-separated ids:
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3) — about 200 s
  Any call over 180 s is moved to the background by the Bash tool: start each part with output to a unique log in
  your private scratch dir, then poll the log / your OWN node pid (`readlink /proc/<pid>/cwd` must be your worktree's
  plugin dir) with `timeout 175 tail --pid=<pid> -f /dev/null`. Never wait for a completion notice.
- Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 cell (g) only:
  a red that shows the "changed on disk first" Notice on a loaded host gets ONE re-run of part 7; a red on the
  re-run, on a quiet host, or in any other G-S115 cell is real. If G-S97 fails, first check
  `git -C <plugin> status demo-vault/.obsidian/appearance.json` — the camera tool can leave it dirty (SC-622);
  restore it with `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` and re-run before blaming code.
- Jest timeout is 30 s: an "Exceeded timeout" is a real hang until proven otherwise (re-run that suite alone).
- **Shots / freeze / parity:** if your change touches no CSS, build once and compare `styles.css` against a clean
  `11fbded6` build (sha256). If byte-identical, shots/freeze/parity carry — say so with both hashes. If not, run them.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys/draw-steel-elements -- bash <script file>`.
  `$?` echoed inside `bash -c '…'` is ALWAYS 0 — record exit codes from a script FILE, and read each gate's own
  summary line (jest "Tests:", `OBSIDIAN-LIFECYCLE done:`, `OBSIDIAN-E2E done:`). Never pipe a gate into `tail`.
- Never `cd` inside a compound command; use absolute paths and `git -C <abs path>` for every git command.
- Private scratch dir only: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r1-impl/`
  with uniquely named scripts/logs. Create files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (and no `rm` with a shell variable
  in its path, no glob `rm` anywhere) — workers hung on a permission prompt doing that. Leave throwaway files in
  place; overwrite with `>` or use fresh names. The only allowed `rm` is the literal
  `rm -f /home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys/draw-steel-elements/styles.css` before jest.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree.
- Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` except your own report file below.
- Run each gate as a blocking foreground call where it fits under 180 s; otherwise the log+pid poll above. No
  `Monitor`, no waiting on notifications. Redirect long output to files — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — use per-run unique paths and your
  own pid.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-625:`.
- Do not edit `.claude/skills/dse-verify/SKILL.md`. If its notes need an update (e.g. the "jsdom test.failing markers
  for montage bugs: SC-625 x2" line), write the proposed text into your report.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/sc625-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (verdict, final dse sha, superproject CHANGELOG sha, gate numbers).
Then: the key/write-path enumeration, the design (where extras live in the model), every test added (id, file,
fails-on-base yes/no), gate logs' paths, `styles.css` hashes, Drive-by fixes:, Follow-ups:, proposed SKILL.md text.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas (dse branch head, superproject
CHANGELOG commit), measured numbers per gate — no prose, plus the absolute path of every evidence artifact you
produced (report, gate logs).
