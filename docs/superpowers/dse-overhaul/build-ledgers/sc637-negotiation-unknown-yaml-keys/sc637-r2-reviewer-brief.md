# SC-637 r2 — independent reviewer brief: negotiation writes keep unknown YAML keys

## 1. Context loading (do this first)

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/decisions.md`
  (binding owner rulings), the r1 report `sc637-r1-implementer-report.md` and the r1b fold report `sc637-r1b-fold-report.md` in the same dir. Read the ticket summary
  at the top of the ledger. You did not write this code; review it adversarially.
- **You never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys` (branch
  `sc637-negotiation-unknown-yaml-keys`). Plugin: `<worktree>/draw-steel-elements`. r1 head: dse `4e30dcfb` on
  `develop` `7b9e82cf`; superproject CHANGELOG commit `31a49921` on workspace main `66b04168`. Run
  `git -C <plugin abs> fetch origin` and report whether `origin/develop` moved. **Do not commit to the branch.** If you
  need scratch edits (e.g. reverting `src/` to check tests fail on base), use a separate `git worktree add` of the plugin
  into your private scratch dir, or `git stash` and restore — and leave the branch exactly at `4e30dcfb` with a clean
  tree when you finish (verify with `git status`).
- Prior art: the same fix on the montage, SC-625 (landed in `76520b1f`):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc625-montage-unknown-yaml-keys/`
  — its `sc625-r2-review-report.md` and `sc625-r4-rereview-report.md` list what went wrong there; check r1 did not
  repeat it.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-240 (long
  lines; read in parts) plus the CURRENT paragraph near line 1525.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is
  Scott's live vault — expected, ignore it.

## 2. The task — execute and probe, don't just read

Review the r1 change against the ticket and the ledger rulings. Probe by running code (jsdom tests, node scripts
against the model, the e2e driver):

1. Every negotiation write path (Patience / Interest seals, motivation chips, pitfall chips, Complete Argument, Reset,
   any argument / edit / undo path, the sidebar host via `SidebarBlockHost.ts`, anything else that writes) keeps
   unknown top-level, per-motivation, per-pitfall and `currentArgument:` keys (the last per the ledger's
   `currentArgument` FOLD ruling: they live as long as that argument does, and go when a write clears/replaces it). Did r1 miss a path, or a code path that builds a fresh
   `NegotiationData` (clone, reset, a view that constructs one) and drops the extras?
2. Ordering: known keys in the pre-existing fixed order, then unknown keys in original relative order, at all four
   levels (ruling "Placement"; `currentArgument` per its FOLD ruling). Also: r1 keeps extras in a module-private WeakMap keyed by model objects — probe that every clone / rebuild re-attaches them and that nothing leaks between blocks or across re-renders.
3. "Known" = every key the parser reads, incl. legacy aliases and keys read-then-dropped-as-empty. Find any key that
   is read but ALSO carried as unknown (duplicated, or a stale alias resurrected after the canonical value changes).
4. `NegotiationData` is a CLASS. Hostile YAML: `__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON`,
   and keys named like every `NegotiationData` / Motivation / Pitfall / argument method and field (enumerate them), at
   all four levels; a motivation / pitfall that is not a map; an unknown value that is null / nested map / list / multi-line
   string. No prototype pollution, no shadowed method or field, no crash, no data loss.
5. Integrity: text above and below the fence survives; two negotiation blocks in one note don't cross-talk; a hand
   edit to an unknown key followed by a click keeps the hand edit (no stale copy from an earlier render resurrects
   it); deleting an unknown key by hand then clicking doesn't bring it back; the sidebar and the in-note view writing
   the same block don't resurrect each other's stale extras.
6. Did r1 decide anything SC-599 owns (comments, quotes, flow lists, source-text editing) or touch montage code /
   SC-652's `prefs:` / `collapsed:`? It must not.
7. Tests: do r1's new tests fail on base `7b9e82cf` (revert `src/` only)? Are the SC-637 markers now real plain tests
   (no leftover `knownBug('SC-637')` / `test.failing` for SC-637)? Any bracketed ticket id in a test title (forbidden)?
   Any duplicate `NEGO-*` scenario id (scenario ids are global)?
8. CHANGELOG bullet in the worktree superproject: accurate, plain, does not over-claim (comments and quote style are
   still lost — SC-599).
9. Re-run the battery yourself: tsc, lint, jest, lifecycle (seven parts), e2e. Expected: tsc/lint clean; jest (fresh
   worktree, no shots cache) = **12720 passed / 2 skipped**; e2e **`OBSIDIAN-E2E done: 491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs`**; lifecycle **64/64**. Check `styles.css` byte-identity vs a
   clean `7b9e82cf` build if r1 claims shots/freeze/parity carry.

**Lifecycle runs in SEVEN parts with `--only=` (EQUALS sign — with a space the runner runs the whole suite)**, one per
Bash call, comma-separated ids:
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 last
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112,G-S115` (3) — about 200 s

Known flakes: G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 cell (g) only (SC-633):
a red showing the "changed on disk first" Notice on a loaded host gets ONE re-run of part 7; a red on the re-run, on a
quiet host, or in any other G-S115 cell is real. G-S97 red: first check/restore `demo-vault/.obsidian/appearance.json`
(`git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json`, SC-622). Jest "Exceeded timeout" (30 s, SC-568)
is a real hang until proven otherwise.

## 3. Footguns

- Devbox: `devbox run -c <plugin abs path> -- bash <script file>`. `$?` inside `bash -c '…'` is always 0 — record exit
  codes from a script FILE, read each gate's own summary line. Never pipe a gate into `tail`.
- Calls over 180 s are moved to the background by the Bash tool: log to a unique file in your private scratch dir,
  then poll your OWN node pid (`readlink /proc/<pid>/cwd` inside the worktree) with
  `timeout 175 tail --pid=<pid> -f /dev/null`. No `Monitor`, never wait for a completion notice. Redirect long output
  to files — the 600 s stream watchdog kills silent agents.
- Never `cd` inside a compound command; `git -C <abs path>` for every git command.
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc637-r2-review/`,
  uniquely named files, created with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, no `rm` with a shell variable, no
  glob `rm` — workers hung on a permission prompt doing that. Leave throwaway files in place. The only allowed `rm` is
  the literal `rm -f <plugin abs>/main.js <plugin abs>/styles.css` before jest.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is in your worktree / scratch clone.
- Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` except your report file.
- Never key a wait-loop on a scratch filename or contents from another run.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever send
  a message anyway, its FIRST WORD must be `SC-637:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by severity, measured gate
numbers). Then findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure scenario, and a
prescribed fix. Then the probe list (what you ran, result), gate log paths.

## 5. Return contract

Final text goes to the ticket-owner: verdict, severity counts, one line per finding, measured numbers, absolute paths
of the report and logs. No prose.
