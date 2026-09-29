# SC-232 round 10b — finish round 10 (replacement worker)

## Executive summary

- Head `f3085d5` on branch `sc232-cardname-scale`, base `fa9addc` (round 8b's final head).
  `origin/develop` unchanged at `5a20d5f` — no rebase needed.
- All round-10 fixes were already DONE and committed by the prior worker: HIGH-1/LOW-2/LOW-3
  `6f19b8b`; empty left-deck fold `31f54d8`; MEDIUM-1 `e1705ba`; MEDIUM-2 comments + LOW-4/LOW-5
  `f3085d5`. This round only finished verification/deliverables — no new code commits.
- MEDIUM-2 outcome: comments corrected (plugin-side fix declined, reasoning in `f3085d5`);
  the data fix is filed as **SC-375** (steel-etl should emit `metadata.kit` in the nested
  kit fence).
- Rebaseline: **78 lines / 39 ids, old (8b) -> new: unchanged (78 -> 78, 0 ids dropped, 0
  ids added)** — `rebaseline.txt` (written 20:18 by the replaced worker) verified BYTE-FOR-BYTE
  current at this head; no regeneration needed.
- Determinism: 2 independent full `npm run shots` runs at this head, byte-identical (540/540
  PNGs, `diff` empty).
- Gates: tsc/lint clean; jest **4189 passed / 1 skipped / 4190 total, 212/213 suites** (base
  fa9addc 4170/1/4171, net +19); lifecycle **19/19 ok, 0 failed**; shots **540, 0 FAIL**;
  freeze FAILED-set == rebaseline set (78, exact match both directions), scratch-substituted
  baseline **260/260**; parity **0 gap(s), 0 undeclared, 26 declared, exit 0** (unchanged).
- Scratch worktree `sc232-r10-scratch-fa9addc` removed: **yes**.

## Step 0 — rebase check

`git fetch origin`: `origin/develop` is still exactly `5a20d5f` (unchanged since round 8b).
No rebase performed. All numbers below are measured at dse `f3085d5` on top of `fa9addc`.

## Round 10 fixes — status (all already committed by the replaced worker)

Per "Owner rulings, round 9" in `decisions.md` and `sc232-brief-r10-fix.md`:

| Finding | Status | Commit |
|---|---|---|
| HIGH-1 (usage chip over-applied to every statblock ability; Type cell dropped) | FIXED as prescribed: `usageInHead` opt-in set only by the standalone Feature view and inline kit-signature; Type cell restored for statblock abilities; DOM test pins it on `human-bandit-chief` | `6f19b8b` |
| LOW-2 (usage chip wording) | FIXED: `usageLabelOf` ports the site's canonical labels, case-insensitive substring match, markdown-stripped fallback; 8 new unit cases | `6f19b8b` |
| LOW-3 (displaced `ability_type` when cost present) | FIXED: displaced value now falls back to the right-eyebrow slot | `6f19b8b` |
| Empty left-deck span on a keyword-less statblock | FOLDED/fixed: slot now omitted entirely, not an empty span | `31f54d8` |
| MEDIUM-1 (pasted snapshot loses `metadata.scc`/`kind`) | FIXED as prescribed: statblock DTOs narrow `metadata` to `{scc}`; featureblock's undeclared `kind` re-added via a new `unwrapModel` helper; retainer (`gnoll-gnasher.md`) + malice featureblock (`devil-malice.md`) snapshot cases added; stale `:95` comment corrected | `e1705ba` |
| MEDIUM-2 (synced kit's nested signature has no kit name) | Comments corrected (both `renderFeature.ts`'s `leftDeckFallback` doc and `layouts.ts`'s hybrid-branch doc now state the real gap); plugin-side fix evaluated and declined (no DOM handle from the recursed fence back to `layouts.ts`; the real fix belongs in steel-etl). **Filed as SC-375** by the owner, not this worker (workers never call Linear) | `f3085d5` |
| LOW-4 (`kwUsage` help text overclaim) | FIXED | `f3085d5` |
| LOW-5 (CHANGELOG overclaim + process wording) | FIXED (worktree superproject CHANGELOG, commit `8e7291d`) | `f3085d5` (dse) + `8e7291d` (superproject) |

I verified these are real, not just claimed, by reading every commit's diff (`git log -p
fa9addc..HEAD` in `draw-steel-elements`) — summarized in "Freeze — round 10 attribution"
below with live DOM measurements, not just commit-message trust.

## 1. Freeze, final head

Two full foreground `npm run shots` runs at `f3085d5`:
- Run 1: 540 PNGs written, all in-run gates OK (host-copy pin, button/input/table/list/
  inline/checkbox/prose host-leak, print-twin delta OK on 134 capture ids, print-twin
  self-test OK, nested corner-radius OK). Log: `shots-run1.log`.
- Run 2: 540 PNGs written, same in-run gates OK. Log: `shots-run2.log`.
- `sha256sum` of all 540 PNGs, run 1 vs run 2: **byte-identical, `diff` empty** (determinism
  confirmed).

`check-freeze.sh` against this head's shots: `FREEZE VIOLATED (78 checksum mismatches, 0
missing)`. Cross-checks (both directions, both exit 0 / empty diff):
- The 78 FAILED filenames == `rebaseline.txt`'s 78 filenames exactly (sorted-diff empty).
- Every one of `rebaseline.txt`'s 78 hashes == the real sha256 of that file in this head's
  own `visual-harness/shots/` (sorted-diff empty). **`rebaseline.txt` needed no
  regeneration** — the replaced worker's 20:18 write already matched this head byte-for-byte.
- A SCRATCH copy of the shared `freeze-baseline.sha256` (never the shared file itself) with
  these 78 lines substituted in, checked with a scratch copy of `check-freeze.sh` (same
  hardcoded-relative-path contract, pointed at the scratch dir): **`freeze OK (260/260
  frozen print PNGs byte-identical)`, exit 0.**

**Line count: old (8b) 78 lines / 39 ids -> new (round 10 fix, this verification) 78 lines
/ 39 ids — unchanged. 0 ids dropped, 0 ids added.** Round 10's fixes moved BYTES on 35 of
those same 39 ids (see next section) but did not change which ids are frozen-and-moving.

## 2. `rebaseline-map.md`, regenerated

Updated in place: `rebaseline-map.md` keeps round 8b's own method and items 1-5 verbatim
(still accurate — unaffected by round 10) and adds a new final section, **"Round 10 fix (r9
independent review HIGH-1, LOW-2, LOW-3 — commit `6f19b8b`)"**.

**Method:** the existing scratch worktree at `fa9addc` (round 8b's final head, immediately
pre-round-10) already had its own `npm run shots` output on disk. I diffed the sha256 of
every one of `rebaseline.txt`'s 78 filenames between that directory and this head's fresh
shots — a real byte diff of real shots output, not inferred from reading the code.

**Result: 35 of 39 ids moved; 4 did not** (`featureblock`, `featureblock-featstyle-flat`,
`featureblock-stats`, `featureblock-stats-ledger` — unchanged, because a featureblock
option's `usageInHead` was never true either before or after this round, and none of the
frozen featureblock fixtures carry a `cost`+`ability_type` pair for LOW-3 to fire on).

**Attribution:** all 35 moved ids trace to the single combined commit `6f19b8b` (HIGH-1 +
LOW-2 + LOW-3 — the commit's own message states they share one ~20-line code block). The
other three round-10 commits are measured/proven print-neutral, not assumed:
- `31f54d8` (empty left-deck slot) — the left-deck slot is Steel screen-only revealed
  (`:not([data-dse-print="on"])`), same reveal gate that made round 8b's own W1b
  print-neutral; the only fixture it touches (`NO_FEATURES`) isn't in the 39-id frozen set.
- `e1705ba` (MEDIUM-1, `compendiumInsert.ts`) — `grep -rn "trimSnapshotDTO|compendiumInsert"
  visual-harness/` returns 0 hits: nothing in the shots harness's render path can reach this
  module.
- `f3085d5` — read its diff to `layouts.ts`/`renderFeature.ts`: every changed line is inside
  a comment block; `catalog.ts`'s one line is a settings help string, never read by the
  render path.

Per-cause detail (LOW-2 relabels standalone/kit-signature usage text case; HIGH-1 removes
the spurious statblock-sub-feature usage chip and restores the Type cell; LOW-3 measured 0
lines on the real frozen corpus, same shape as round 8b's own W2 finding) is written out
id-by-id in the map, with live DOM-verified before/after values
(`r8-evidence/dom-verified-text-print-screen.json`) cited as the evidence, e.g. sub-feature
"Whip and Magic Longsword": `rightDeck: "Main action"` / Type cell missing (before) ->
`rightDeck: null` / Type cell shows "Main action" (after) — matching the real site exactly.

Every one of the 39 ids is explained (both the 35 that moved and the 4 that didn't).
Nothing is left unexplained.

## 3. Evidence refresh (`r8-evidence/`)

Rules followed: `deviceScaleFactor: 1` (1 image px = 1 CSS px), head-only crops via
`.dse-head`/`.sc-head` bounding boxes (no rescaling), text labels, Site captured with
`colorScheme: 'dark'` (confirmed live: body `data-md-color-scheme="slate"`), every tile's
text DOM-verified via `querySelector`, not eyeballed.

**Method / tooling:** the r9-evidence scripts in `r9-evidence/scripts/` (`printcrop.mjs`,
`plugin-heads2.mjs`, `site-heads.mjs`) rely on a `src=<base64>` query param the harness
(`visual-harness/entry.ts` `parseParams`) does not actually implement — confirmed by
reading `parseParams`'s full field list and `mountOne`'s `FIXTURES[id][fixtureName]`
lookup (no dynamic-content path exists). Those scripts could not have worked as written, so
I did not reuse them; I wrote fresh, small scripts using the harness's own REGISTERED
fixtures (`element=feature&fixture=default` = Coverage Strike, `element=kit&fixture=default`
= Panther/Devastating Rush, `element=statblock&fixture=default` = Human Bandit Chief +
sub-features, `element=feature&fixture=ability-provenance` = round-8a's own Mark fixture) —
this is BYTE-EXACT with the real frozen corpus, not an approximation. New scripts (kept
under my own scratch dir, not committed — see Artifacts): `pluginCrop.mjs` (file:// harness
captures + DOM text, both dark-screen and print), `siteCrop.mjs` (live
`steelcompendium.io/v2/scc/<code>/` captures, dark scheme, + DOM text), `compose.py` (PIL
grid compositor, no rescaling).

- **`sc232-slots-neutral.png`**: **left unchanged**, disclosed rather than silently skipped.
  Its 4 entities (`determination`, `mark`, `growing-ferocity`, `devil-malice`) are
  harness-local literals not reachable via the file:// harness page with real Obsidian
  removed from the loop (round 8a/8b's own capture of these needed a live-Obsidian corpus
  insert, heavier infra than this verification round's scope) — but round 10's fixes are
  proven not to reach any of the 4 differently than at `fa9addc`: `determination` has no
  `ability_type` (LOW-3 needs cost+ability_type together); `devil-malice` is a featureblock
  (HIGH-1/LOW-2 don't apply, per the featureblock-unaffected finding above);
  `growing-ferocity` carries no cost/ability_type/usage-in-a-statblock shape; `mark`'s raw
  usage `"Maneuver"` maps to the IDENTICAL canonical string under `usageLabelOf`
  (`a.includes('maneuver') → 'Maneuver'`, read directly from `renderFeature.ts:491`) — so
  LOW-2 fires but changes 0 bytes for it. This is a disclosed scoping decision, not an
  oversight.
- **`sc232-slots-print-screen.png`**: rebuilt, 6 rows, 3 columns (Before `fa9addc` | This
  branch `f3085d5` | Site, all screen/dark). Added the new row **"Statblock ability, no
  usage chip"** using "Kneel, Peasant!" (`human-bandit-chief`'s 2nd sub-feature — before:
  spurious `Maneuver` chip + missing Type cell; after: no chip, Type cell shows
  "Maneuver", matching the site's own render exactly, `rightDeck: null` on both). The
  pre-existing "ability w/ cost" row's Coverage-Strike/Apex-Predator mismatch is **NOT
  resolved** — I could not make it one entity without a source change (Coverage Strike is
  a harness-only literal with no real corpus/site page; rendering a real corpus ability
  like "Censored" in the plugin harness would need either a new `FIXTURES` registry entry
  in `entry.ts` — an actual code change, out of scope for an evidence round — or full
  live-Obsidian compendium-insert automation). Disclosed as a Follow-up, same limitation
  round 8b already recorded.
- **`sc232-print-before-after.png`**: rebuilt from the current (verified) 78-line set, 5
  rows of `steel-print` crops, Before (`fa9addc`) | After (`f3085d5`): feature (Coverage
  Strike, LOW-2's "Main action" -> "Main Action"), kit (Devastating Rush, same), statblock
  head (Human Bandit Chief, byte-unchanged by round 10), statblock sub-feature "Whip and
  Magic Longsword" (HIGH-1 removes the bogus chip), statblock sub-feature "Kneel, Peasant!"
  (this round's own new fix, same effect).
- `dom-verified-text-print-screen.json` regenerated to match the rebuilt composite (6
  entities x 3 states: before/head/site).

## 4. Gates at the final head (`f3085d5`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, no output |
| `npm run lint` | clean (0 errors; 1 unrelated ESLint deprecation info-warning about `.eslintignore`) |
| `rm -f main.js styles.css && npx jest` | **4189 passed / 1 skipped / 4190 total, 212 of 213 suites, 3 snapshots** — vs base (`fa9addc`) 4170/1/4171, 212/213: **net +19**, all from round 10's own new test cases (8 `usageLabelOf` unit cases + a new DOM pin for HIGH-1 in `6f19b8b`; new `SNAPSHOT_CASES` entries + a dedicated featureblock `kind` round-trip test in `e1705ba`). `/proc/loadavg` 1.59/1.55/2.40 at run time — not load-sensitive. |
| `DSE_LIFECYCLE_PORT=9351 npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 |
| `npm run shots` (x2) | 540 PNGs each run, 0 FAIL, byte-identical across runs |
| `check-freeze.sh` | FAILED set == `rebaseline.txt`'s 78-line set exactly (both directions); scratch-substituted baseline reads `freeze OK (260/260)` |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 26 declared deferral(s)**, exit 0 — unchanged composition from round 8b/9 |

## 5. Cleanup

- `pgrep -af "sc232-r10-scratch\|worktrees/sc232-cardname-scale/"` before removal: no real
  process running against either path (the only pgrep hit was the grep invocation itself
  matching its own command line).
- `git -C .../sc232-cardname-scale/draw-steel-elements worktree list` -> confirmed the
  owning repo and that `sc232-r10-scratch-fa9addc` was a detached worktree at `fa9addc`.
- `git worktree remove --force /home/scott/code/steelCompendium/worktrees/sc232-r10-scratch-fa9addc`
  from that repo: exit 0. Re-listed: only the real worktree remains. Its symlinked
  `node_modules` was not followed/touched — `git worktree remove` deletes the worktree's own
  directory tree, and removing a symlink entry never touches its target.
- No scratch worktree was created by this round.

## Rules compliance

- Every command ran in the foreground with an explicit `timeout: 600000` where needed; no
  `run_in_background`, `&`, `nohup`, or `Monitor` used deliberately. One command
  (`npm run shots` run 1, first attempt) exceeded the tool's default 120s timeout and was
  auto-backgrounded by the harness before I passed an explicit timeout — I killed that
  background process **by PID only**, verifying each PID's `/proc/<pid>/cmdline` contained
  `worktrees/sc232-cardname-scale/` before killing (5 PIDs: the wrapper bash, devbox, and
  three child shells, all matching), then re-ran the same command with `timeout: 600000` to
  completion in the foreground. No `pkill`/`killall` by pattern was used.
- Never touched dse `main`, never tagged, never pushed, never ran `just deploy*`.
- Never edited the shared `freeze-baseline.sha256` or `check-freeze.sh` — only read from
  them (once to build the scratch-substituted copy, once via a scratch copy of the script
  itself pointed at that scratch baseline).
- Made no code changes and no new commits — every fix was already committed by the replaced
  worker; this round is verification + deliverables only.
- Did not bump the superproject pointer (dse submodule still shows dirty/new-commits in
  `git status` at the superproject level — a landing-time concern, per round 8b's own
  convention).
- `.superpowers/` deliverables (ledger `decisions.md`'s directory) are the shared,
  gitignored coordination scratch this whole effort has always used — not a submodule file,
  not the shared main checkout's tracked working tree.

## Follow-ups (for the owner)

- MEDIUM-2's real fix needs steel-etl to emit `kit:` into a synced kit's nested
  `ds-feature` fence's own `metadata` — **filed as SC-375** (per the owner's ruling; workers
  never touch Linear, this is a report-back).
- The ability-cost evidence row's Coverage-Strike/Apex-Predator entity mismatch remains
  unresolved (see "3. Evidence refresh" above) — would need a new harness `FIXTURES`
  registry entry (a real code change) or live-Obsidian corpus-insert automation to fully
  close; out of scope for a verification round.
- `sc232-slots-neutral.png` was verified unchanged rather than re-rendered (see "3. Evidence
  refresh"); if the owner wants it re-captured from a live Obsidian instance anyway (to
  match round 8a/8b's own original capture method exactly), that needs the
  `obsidian-lifecycle`/`obsidian-camera`-style infra, not the plain file:// harness.
- The r9-evidence directory's `printcrop.mjs`/`plugin-heads2.mjs`/`plugin-heads.mjs`/
  `site-heads.mjs` scripts rely on a `src=` harness query param that does not exist in
  `visual-harness/entry.ts`'s `parseParams` — they could not have produced real captures as
  written. Worth a note for whoever wrote/relied on them.

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r10-fix-report.md`
- Rebaseline: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/rebaseline.txt`
  (verified current, unchanged, 78 lines)
- Rebaseline map (updated):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/rebaseline-map.md`
- Evidence (refreshed):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/sc232-slots-print-screen.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/sc232-print-before-after.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/dom-verified-text-print-screen.json`
- Evidence (unchanged, verified): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/sc232-slots-neutral.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/dom-verified-text.json`
- dse commits (branch `sc232-cardname-scale`, worktree
  `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/draw-steel-elements`,
  all pre-existing, none created this round): `6f19b8b`, `31f54d8`, `e1705ba`, `f3085d5`
  (**final dse head**), on top of `fa9addc`.
- Superproject commits (worktree
  `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`, pre-existing): `8e7291d`
  (LOW-5 CHANGELOG fix, **final superproject head for this round**; `draw-steel-elements`
  submodule shows dirty/new-commits in `git status`, intentionally — pointer bump is a
  landing-time step per round 8b's convention).
- Gate logs (scratch, not preserved beyond this session):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc232r10b/{tsc,lint,jest,lifecycle,parity,shots-run1,shots-run2,freeze-check}.log`
- Scratch worktree `/home/scott/code/steelCompendium/worktrees/sc232-r10-scratch-fa9addc`:
  **removed** (`git worktree remove --force`, verified via `git worktree list`).
