# SC-625 r2 — independent adversarial review: montage writes keep unknown YAML keys

## 1. Context loading

- Ledger (binding decisions): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/decisions.md`.
- The r1 implementer brief (what was asked) and report (what was claimed), same dir:
  `sc625-r1-implementer-brief.md`, `sc625-r1-implementer-report.md`. Treat the report's claims as claims to verify,
  not facts.
- **You never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys`, plugin at
  `.../draw-steel-elements`, branch `sc625-montage-unknown-yaml-keys`. Base dse `develop` `11fbded6`; the diff under
  review is `git -C <plugin abs> diff 11fbded6..78d8658f` (r1 head `78d8658f`: fix `8b7dc083`, e2e `78d8658f`; superproject CHANGELOG commit `36dae9e2`). `git -C <plugin abs> fetch origin`
  first and say whether `origin/develop` moved.
- You may edit ONLY inside that worktree and only for probes; do not commit product changes — findings come back to
  me. Put any probe test files in your scratch dir or revert them before you finish (state which). If you leave a
  probe edit in the tree, say so.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-240 (file is
  ~460 KB; read only that range).

## 2. The task — execute and probe, don't just read

Review the r1 change against the ticket and the ledger rulings. Specifically probe, by running code (jsdom tests,
node scripts against the built model, or the e2e driver):

1. Every montage write path (quick-log, End round / Back to round, Add a hero, Set limits, any undo/remove, anything
   else you find that writes) keeps unknown top-level keys and unknown per-action keys. Did r1 miss a path?
2. Ordering: known keys in the pre-existing fixed order, then unknown keys in their original relative order, at both
   levels. r1 reports that `participants:` entries keep their TYPED key position (no fixed-order rebuild) while
   actions now get fixed-known-then-unknown — the ledger ruling said to make actions match participants if they
   differ, and r1 did not. Give me a recommendation with evidence: find the rationale for the fixed order (sc191
   montage ledger `docs/superpowers/dse-overhaul/build-ledgers/sc191-montage-overhaul/sc191-decisions.md`, review-2
   M-2) and say whether it covers actions or only the top level, and what aligning actions with participants would
   cost (existing tests / snapshots / e2e that pin entry key order).
3. "Known" = every key the parser reads, incl. legacy aliases. Find any key that is read but now ALSO carried as
   unknown (duplicated, or a stale alias resurrected after the canonical key changes).
4. Hostile YAML: `__proto__:`, `constructor:`, `toString:` at top level and in an action; an action that is not a
   map; an unknown key whose value is null / nested map / list / multi-line string; a top-level key that collides
   with something the model stores internally. No prototype pollution, no crash, no data loss.
5. Integrity: text above and below the fence survives; two montage blocks in one note don't cross-talk; a hand edit
   to an unknown key followed by a click keeps the hand edit (no stale copy from an earlier render resurrects it);
   deleting an unknown key by hand then clicking doesn't bring it back.
6. Did r1 decide anything SC-599 owns (comments, quotes, flow lists, source-text editing)? It must not.
7. Tests: do the new tests fail on the base `11fbded6` (check with a stash/revert of `src/` only)? Are the flipped
   SC-625 markers real plain tests now (no leftover `knownBug('SC-625')`/`test.failing`)? Any bracketed ticket id in a
   test title (forbidden)? Any duplicate `MONT-*` scenario id?
8. r1 ran lifecycle as ONE whole-suite run (its `--only A,B` flag was ignored; the runner wants `--only=A,B`) — run the
   seven parts properly with `--only=`. Re-run the battery yourself: tsc, lint, jest, e2e, and lifecycle (seven parts). Expected: tsc/lint clean; jest
   (fresh worktree, no shots cache) = 12166 + r1's new tests passed / 2 skipped; e2e `0 failed`, **7 known-bug**,
   coverage Y/Y; lifecycle **64/64**. Check `styles.css` byte-identity vs a clean `11fbded6` build if r1 claims shots/
   freeze/parity carry.

Lifecycle parts (one per Bash call, comma-separated ids):
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a`
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40`
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`
4. `G-S57,G-S62,G-S61,G-S56` (G-S56 last)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`
6. `G-S92,G-S96,G-S97,G-S99`
7. `G-S108,G-S112,G-S115` (~200 s)

Known flakes: G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 cell (g) only: a red
showing the "changed on disk first" Notice on a loaded host gets ONE re-run of part 7; anything else is real. G-S97
red: first check/restore `demo-vault/.obsidian/appearance.json` (`git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json`).
Jest "Exceeded timeout" (30 s) is a real hang until proven otherwise.

## 3. Footguns

- Devbox: `devbox run -c <plugin abs path> -- bash <script file>`; an echoed `$?` inside `bash -c '…'` is always 0 —
  capture exit codes in a script FILE and read each gate's own summary line. Never pipe a gate into `tail`.
  `rm -f <plugin>/main.js <plugin>/styles.css` (literal absolute paths) before jest.
- Calls over 180 s are moved to the background by the Bash tool: write output to a unique log, then poll your OWN
  node pid (`readlink /proc/<pid>/cwd` inside your worktree) with `timeout 175 tail --pid=<pid> -f /dev/null`. No
  `Monitor`, never wait on a notification. Redirect long output to files (600 s stream watchdog).
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r2-review/`;
  unique file names; create files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, no `rm` with a variable in the path,
  no glob `rm`. Leave throwaway files in place.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd is in your worktree. `git -C <abs path>` for every git
  command; never `cd` inside a compound command.
- Never write under `/home/scott/code/steelCompendium/workspace/` except your report. Main-checkout dse dirt
  (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — ignore.
- Never key a wait on a scratch filename/contents from another run.
- If the report write is blocked, return the report inline.
- You cannot `SendMessage` me; for input end with `STATUS: NEEDS_CONTEXT` + question. Any message you send anyway must
  start with `SC-625:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/sc625-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / FIX-NEEDED, counts by severity, measured gate
numbers). Then findings by severity (HIGH / MEDIUM / LOW / INFO), each with file:line, a concrete failure scenario
(YAML in, YAML out), and a prescribed fix. Then probe list with results, gate log paths.

## 5. Return contract

Final text goes to the ticket-owner: raw facts — verdict, severity counts, reviewed sha, measured gate numbers — plus
absolute paths of the report and every log/probe artifact. No prose.
