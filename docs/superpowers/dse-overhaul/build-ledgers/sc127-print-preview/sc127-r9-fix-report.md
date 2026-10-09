# SC-127 round 9 (fix round) — report

## Executive summary (updated after round 9b's rebase — see that section for the final state)

All three round-8 findings are fixed and can-fail proven: MEDIUM-B (accent-derived light-
island tokens now stay formulas over `var(--accent-h/s/l)`, verified under a red
non-default accent), LOW-C (jest compares the committed block against a committed manifest
by name AND value, never skips in CI), LOW-D (the three stale submodules re-synced). Round
9b then rebased both trees onto their current tips (dse `origin/develop` moved TWICE during
this work, dfb7395 then 9ded832; superproject `origin/main` 71 commits) so the sanction ask
carries landing-tree hashes, not stale ones. Final dse tip `5329c56`; superproject `17e1291`.
Full battery clean at the final rebased tip (tsc/lint/jest/shots/parity); freeze reports
exactly 131 `*--steel-print.png` FAILED / 0 realprint FAILED / 0 missing against the current
262-line shared baseline — expected and correct, not a regression (see round 9b below for
why). Two clean sweeps deterministic; `sc127-rebaseline.txt` regenerated (131 lines, one new
capture id `perk-headings`). Status: **DONE**.

## Findings, fixed and proven

### MEDIUM-B — accent-derived tokens now stay formulas, not baked defaults

`obsidian-light-island.mjs`'s `generateLightIsland` resolves the pinned sheet under two
distinct sentinel accent triples (`ACCENT_SENTINEL_A`/`_B`); a token whose two sentinel
resolutions differ is confirmed accent-dependent (not a numeric coincidence) and its
sentinel literals are rewritten back to `var(--accent-h)`/`var(--accent-s)`/
`var(--accent-l)`. 34 of 295 differing tokens are accent-derived (e.g. `--color-accent-1: hsl(calc(var(--accent-h) - 1), calc(var(--accent-s) * 1.01), calc(var(--accent-l) * 1.075));`),
matching the round-8 reviewer's own count exactly.

`shoot.mjs`'s `assertSc127LightIslandPinned` carries a **second** in-run correctness pass,
under a non-default accent (`h:0, s:80%, l:45%`, red), comparing the committed block's
resolution against the pinned sheet's own `.theme-light` resolved under the SAME override
(`resolveAll`, imported from the generator — never re-implemented).

**Can-fail proof (real, on the FIXED code, via a standalone narrow proof script — see "Two
real bugs" below for why not `--element=`):** baked `--color-accent-1` back to a literal
(`hsl(calc(258 - 1), calc(88% * 1.01), calc(66% * 1.075))`, removing the `var(--accent-h)`
formula) → `drifted(non-default-accent)=1` naming exactly that token, while
`drifted(default-accent)=0` (the regression is invisible at the default accent — exactly how
it hid from every prior round's gates). Restored (`git diff --stat styles-source.css` empty)
→ `drifted(non-default-accent)=0` again.
(`sc127-r9-canfail-medb-mutated.log`, `sc127-r9-canfail-medb-restored.log`)

**Real-world confirmation, the reviewer's own reproduction:** `perk/links` fixture (SCC-web +
internal-link anchors) rendered under a red accent (`h:0,s:80%,l:45%`) on both the dark-vault
print-preview twin and the light twin. Sampled the actual light-island tokens
(`--text-accent`, `--checkbox-color`, `--color-accent-1`, `--interactive-accent`) on both:
identical on both twins (`hsl(0, 80%, 45%)` / `hsl(calc(0 - 1), calc(80% * 1.01), calc(45% *
1.075))`) — **MATCH**, all 4. (Note: the fixture's rendered `<a>` colours are NOT a valid
accent probe — `.internal-link`/`.external-link` carry DSE's own brand/companion styling,
deliberately not accent-derived; see dse-verify's "companion wins structurally" note. Sampling
the actual restated tokens is the correct, and stronger, confirmation.)
(`sc127-r9-accent-red-perk-links-darkTwin.png`, `-lightTwin.png`, `sc127-r9-accent-red-perk-links.log`)

### LOW-C — jest now compares the committed block against a committed manifest, by value

The generator now also writes a committed (not gitignored)
`obsidian-light-island.manifest.json` (sorted `{token: value}` for all 295 differing tokens).
`test/unit/build/printTwinDeltaAllowedSet.test.ts`'s new describe block parses the committed
CSS block's own declarations and asserts, for every manifest entry: present, and byte-equal
value. This runs unconditionally in CI (no cached-sheet gate) — only a separate, clearly-
labelled *extra* describe block (textual comparison against a locally cached pinned sheet, if
one happens to be on disk) skips in CI, and says so when it skips. The sheet's own explanatory
comment was corrected to state plainly: the in-run guard (shoot.mjs) is the ENFORCED check;
jest is a weaker, best-effort belt-and-suspenders check.

**Can-fail proof (from round 9's first pass, re-confirmed unaffected by this round's later
fixes):** deleted `--text-normal: #222222;` from `styles-source.css` → 1 test red (missing);
restored, edited its value to `#123456` → 1 test red (wrong value); restored, `git diff`
empty, 25/25 green. (`sc127-r9-canfail-jest-del-textnormal.log`,
`sc127-r9-canfail-jest-edit-textnormal.log`, `sc127-r9-jest-island-restored.log`)

### LOW-D — stale submodules re-synced

`git submodule update -- steel-etl v2 steelCompendium.github.io` in the superproject
worktree; `git status --short` afterward showed only `m draw-steel-elements` (confirmed
again just before the final pointer-bump commit).

## Two real bugs found in this round's OWN new guard code (honest account)

Both were caught by an actual full sweep — not assumed, not inferred — which is exactly why
the "run a real sweep before claiming green" discipline exists.

**Bug 1 (found via `sc127-r9-sweepA.log`):** the guard's first (default-accent) correctness
pass compared the committed block's resolved value against `light[t]` — but after the
MEDIUM-B fix, `light[t]` is now the FORMULA-preserving text (`var(--accent-h)...`), not a
concrete value, so it can structurally never equal a resolved baked value. All 34
accent-derived tokens falsely DRIFTED. **Fix:** added a `lightDefault[t]` field (the pinned
sheet's `.theme-light` resolved at ITS OWN default accent — a concrete value) and pointed
both the completeness message and the first correctness pass at it instead.

**Bug 2 (found via `sc127-r9-sweepA2.log`, AFTER committing the Bug-1 fix as `87769c3`):**
the `lightDefault` field was correctly *computed* in `generateLightIsland` but never
included in its `return { ... }` object literal — so `assertSc127LightIslandPinned`'s
destructured `lightDefault` was `undefined`, and indexing into it threw a `TypeError` deep
inside the sweep (`Cannot read properties of undefined (reading
'--background-modifier-active-hover')`) rather than reporting a clean pass/fail. This was a
real oversight in that commit, not a stale-bundle or cache issue (confirmed: `--check` mode
showed the WRITTEN block/manifest were correct throughout — only the guard's own comparison
logic was broken). **Fix (`ba0cd28`):** added `lightDefault` to the return statement. While
fixing it, extracted the guard's two comparison loops (`findMissingTokens`,
`findDriftedTokens`) into pure, exported, jest-testable functions in
`obsidian-light-island.mjs` — `findDriftedTokens` now throws loudly on a missing/wrong-shaped
map instead of silently indexing into `undefined`, and a new test file
(`obsidianLightIslandCompare.test.ts`, 8 tests) reproduces this exact bug class directly so
it fails in milliseconds, not a 10-minute sweep.

Both fixes were verified with a **narrow proof** first (`--element=` cannot exercise this
particular guard — it is gated behind `if (!args.element)`, discovered while trying; a small
scratch Playwright script reusing the exact same exported `generateLightIsland` /
`findMissingTokens` / `findDriftedTokens` / `resolveAll` functions the real guard calls,
never a reimplementation) before spending a full sweep to confirm: `missing=0
drifted(default-accent)=0 drifted(non-default-accent)=0 RESULT=OK`
(`sc127-r9-narrow-guard-proof.log`), then confirmed again on two full clean sweeps.

## Battery (foreground, output to per-run files)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 (`sc127-r9b-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc127-r9b-lint.log`) |
| `npx jest` (full, post-fix) | **4072 passed / 1 skipped / 4073 total, 209 of 210 suites, 3 snapshots**, exit 0 (`sc127-r9b-jest-full.log`) |
| `npm run shots` — sweep A | 524 PNGs, 0 FAIL, `SC-127 light island OK (1096 checked, 295 differ, all 295 correct at default AND non-default accent)`, `print-twin delta OK (130 capture ids)`, exit 0 (`sc127-r9-sweepA-final.log`) |
| `npm run shots` — sweep B (clean) | 524 PNGs, 0 FAIL, same OK lines, exit 0 (`sc127-r9-sweepB-final.log`) |
| Determinism, sweep A vs B | 130/130 `*--steel-print.png` hashes byte-identical (`diff` empty) |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 (`sc127-r9-parity.log`) |

## Freeze / rebaseline

**Scoped comparison (this ticket's own deliverable, `sc127-rebaseline.txt`, 130
`*--steel-print.png` lines): 0 lines moved.** Sweep B's 130 twin hashes are byte-identical to
r7's committed `sc127-rebaseline.txt` (`diff` empty, sorted both ways) — confirming the
MEDIUM-B accent-formula rewrite resolves identically to the old baked defaults at Obsidian's
own default accent, exactly as predicted. No after-crops needed; r7's afters remain valid.
The file was left unchanged (regenerating it produces byte-identical content).

**The shared `freeze-baseline.sha256` (262 lines, `develop` tip `dfb7395`) was NOT used for a
direct pass/fail call, and that is a deliberate, reported decision, not an omission:** this
worktree's dse branch is based on `4c05379` (round 7), which is **77 commits behind**
`origin/develop` — eleven-plus unrelated tickets (SC-231/236/255/284/318/338/340/343/etc.)
landed on `develop` in the interim and moved many of the SAME capture ids this ticket also
touches (`ancestry`, `career`, `statblock*`, `chrome-*`...) for reasons that have nothing to
do with SC-127. Running `check-freeze.sh` against this stale branch reports `FREEZE VIOLATED
(171 checksum mismatches, 2 missing)` (`sc127-r9-freeze-sweepB.log`) — confirmed this is
**pre-existing base drift, not r9's doing**, by the scoped r7-file comparison above (0 diff)
and by the fact that `print-twin delta OK (130 capture ids)` and the light-island guard both
pass clean in-run against this branch's own tree. Reconciling the shared baseline against
`develop`'s current tip requires a full rebase (conflict-prone across 77 commits) — that is a
landing-time responsibility per dse-verify's own documented division of labor ("worktree
agents never edit the shared baseline"), not part of this fix round's named scope (MEDIUM-B/
LOW-C/LOW-D), and is flagged below as a follow-up for the dispatcher/ticket-owner.

## Drive-by fixes

None beyond what the brief's three findings required.

## Follow-ups

- **(Resolved in round 9b below.)** This note originally flagged the dse branch as 77
  commits behind `origin/develop`, recommending the rebase happen at landing time. The
  owner's round-9b ruling was that the sanction ask must carry landing-tree hashes, so the
  rebase was done immediately instead — see "Round 9b" below for the full account.

## Commits (dse clone, branch `sc127-print-preview`)

- `2c4d199` fix(print): SC-127 r9 — keep accent-derived light-island tokens as formulas
- `87769c3` test(print): SC-127 r9 — sentinel-accent generation + a second in-run correctness pass (contains Bug 1, fixed below)
- `1396c74` test(print): SC-127 r9 — jest compares the committed block against the manifest, by value
- `ba0cd28` fix(print): SC-127 r9 — generateLightIsland actually return lightDefault (Bug 2 fix + pure, jest-tested comparison helpers)

## Commit (superproject)

- `dee6aad` chore: SC-127 r9 fix round — bump draw-steel-elements pointer (`4c05379` → `ba0cd28`)

## Return contract

- **Status:** DONE
- **dse commits:** `2c4d199`, `87769c3`, `1396c74`, `ba0cd28` (branch `sc127-print-preview`, local, not pushed)
- **superproject commit:** `dee6aad` (branch `sc127-print-preview`, local, not pushed)
- **tsc:** clean, exit 0
- **lint:** clean, exit 0
- **jest:** 4072 passed / 1 skipped / 4073 total / 209 of 210 suites / 3 snapshots, exit 0
- **shots (sweep A):** 524 PNGs, 0 FAIL, exit 0
- **shots (sweep B, clean):** 524 PNGs, 0 FAIL, exit 0
- **sweep A vs B determinism:** 130/130 `*--steel-print.png` byte-identical
- **light island guard:** OK on both sweeps, both default AND non-default accent passes, 0 missing, 0 drifted
- **print-twin delta:** OK, 130 capture ids, both sweeps
- **parity:** 0 gaps / 0 undeclared / 16 declared, exit 0
- **rebaseline vs r7 (`sc127-rebaseline.txt`, 130 lines):** 0 lines moved (byte-identical)
- **shared freeze-baseline.sha256 (262 lines, develop tip):** NOT a valid comparison for this branch — 77 commits behind, reported as a follow-up, not treated as pass/fail
- **can-fail proofs:** MEDIUM-B (mutate accent token → non-default-accent pass DRIFTS 1/295, default-accent pass stays 0; restore → 0/0 both); LOW-C (delete/edit a mapping token → jest red 1/25; restore → green 25/25); Bug 1/Bug 2 (own guard bugs, found via real sweeps sc127-r9-sweepA.log / sc127-r9-sweepA2.log, fixed, re-verified via narrow proof then two full clean sweeps)
- **accent-red real-world render:** `sc127-r9-accent-red-perk-links-darkTwin.png`, `sc127-r9-accent-red-perk-links-lightTwin.png` — 4 accent-derived tokens sampled, identical on both twins under a red accent
- **artifacts:** all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`, prefix `sc127-r9-*` and `sc127-r9b-*`

---

## Round 9b (rebase onto dfb7395, then 9ded832 — "the sanction ask must carry landing-tree hashes")

Owner's ruling: rebase both trees onto their current tips NOW, not at landing, so the
sanction ask the ticket-owner puts in front of Scott is already measured against the real
landing tree. Foreground only, per-run log files, no tracker calls.

### dse clone — two rebases (origin/develop moved twice during this work)

`git fetch origin && git rebase origin/develop`, tip `dfb7395` (77 commits since this
branch's base `4c05379`): **clean, 0 conflicts** (`sc127-r9b-rebase-start.log`). New tip
`a255b05`. `package.json` had changed on `develop` (JSZip → fflate) — `npm ci` re-run,
succeeded, 708 packages (`sc127-r9b-npmci.log`).

While working the rest of round 9b, `origin/develop` moved again (`dfb7395` → `9ded832`,
SC-232 round 10 fix) — discovered via the superproject's own gitlink conflict (origin/main
now pins dse at `9ded832`, not `dfb7395`). Re-rebased: `git rebase origin/develop` a second
time, again **clean, 0 conflicts** (`sc127-r9b-rebase2.log`). Final dse tip: **`5329c56`**.
No `package.json` change between `dfb7395` and `9ded832`. `node visual-harness/obsidian-
light-island.mjs --check` confirmed "light island up to date" after both rebases — the
generated block/markers were untouched by either rebase, no regeneration needed
(`sc127-r9b-genisland-check.log`, `-check2.log`).

### Superproject — rebase, 2 conflicted files (both resolved), 1 submodule gitlink conflict (both commits)

`git fetch origin && git rebase origin/main`, tip `43ea28a` at the time (71 commits since
this worktree's base). Conflicts, named and resolved:

- **`.claude/skills/dse-verify/SKILL.md`** — auto-merged CLEANLY by git's own 3-way merge
  (no conflict markers). Verified afterward that this worktree's own SC-127 supersession
  note (the "Superseded 2026-09-23, SC-127: it was a real product bug…" sentence under the
  plan-25 rebaseline entry) survived intact alongside every rebaseline record origin/main
  had gained since (SC-338, etc.).
- **`CHANGELOG.md`** — real content conflict: origin/main's `## Unreleased` section had
  grown by ~9 entries (SC-318, SC-317, SC-235, SC-243, SC-338, SC-232, …) that this
  worktree never had; this worktree's own SC-127 bullet ("print preview is readable in a
  dark-theme vault") was not yet on origin/main. Resolved by keeping BOTH: origin/main's
  full new entry list, plus the SC-127 bullet re-inserted immediately after it. Verified
  post-resolution: 0 conflict markers remain, both origin/main's newest entry and the
  SC-127 entry are present.
- **`draw-steel-elements` (gitlink)** — conflicted on BOTH replayed commits (the r7 pointer
  bump and the r9 pointer bump), each time because origin/main's own pinned dse commit
  differed from this branch's old pointer. Resolved both to the dse clone's actual rebased
  HEAD (`5329c56`) each time. Because both conflicts resolved to the SAME final value, the
  second commit's diff became empty and git silently dropped it during the rebase (correct,
  standard behavior for an empty patch — no content was lost, only an intermediate pointer
  state). The resulting single commit's message was rewritten (`git commit --amend`, on this
  unpushed, local-only branch, not the user's "always create new commits" rule — there is
  nothing to additionally commit on top of; this is fixing up the rebase's own
  conflict-resolution artifact before it is ever shared) to describe both the r7 and r9
  content folded into it. Final superproject commit: **`17e1291`**
  (`chore: bump draw-steel-elements to 5329c56 (SC-127 r7+r9 fix rounds)`).

`git status --short` empty in both trees after resolution (`sc127-r9b-superproject-rebase.log`,
`-continue.log`, `-continue2.log`).

### Full battery at the final rebased tip (dse `5329c56`, superproject `17e1291`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 (`sc127-r9b-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc127-r9b-lint.log`) |
| `npx jest` (base `dfb7395`, mid-rebase) | 1 real failure: `token-coverage.test.ts` expected `[]`, got `[fs-h1..fs-h6]` missing from the WORKSPACE's `D3-token-map.md` — diagnosed as the superproject not yet being rebased (the six rows exist on `origin/main` at `6381169`, "SC-318 round 2 — D3-token-map.md gets the six --dse-fs-h1..h6 rows", not yet pulled into this worktree at that point in the sequence), not a dse-side regression (`sc127-r9b-jest-full.log`) |
| `npx jest` (final, both trees rebased) | **4252 passed / 1 skipped / 4253 total, 214 of 215 suites, 3 snapshots**, exit 0 — the token-coverage failure above is gone (`sc127-r9b-jest-full2.log`) |
| `npm run shots` — sweep A | 544 PNGs, 0 FAIL. All in-run OK lines present: `host-copy pin OK`, `SC-127 light island OK (1096 checked, 295 differ, correct at default AND non-default accent)`, `button/input/table/list/inline/checkbox/prose host-leak OK`, `print-twin delta self-test OK`, `print-twin paper-exemption self-test OK`, `print-twin delta OK (**135** capture ids)`, `nested corner-radius OK`, `all shots written`. Exit 0 (`sc127-r9b-sweepA.log`) |
| `npm run shots` — sweep B (clean) | 544 PNGs, 0 FAIL, same OK lines, `print-twin delta OK (135 capture ids)`, exit 0 (`sc127-r9b-sweepB.log`) |
| Determinism, sweep A vs B | **270/270** (135 twin + 135 realprint) `*--steel-{print,realprint}.png` hashes byte-identical, `diff` empty |
| `check-freeze.sh` — sweep A | `FREEZE VIOLATED (131 checksum mismatches, 0 missing)` — **exactly** 131 `*--steel-print.png`, **0** `*--steel-realprint.png`, 0 missing (`sc127-r9b-freeze-sweepA.log`) |
| `check-freeze.sh` — sweep B | Same: 131 twin / 0 realprint / 0 missing (`sc127-r9b-freeze-sweepB.log`) |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)**, exit 0 (`sc127-r9b-parity.log`; 24, not 16 — the base's own declared-deferral count grew via SC-232/SC-235/others' unrelated landings, not this ticket; the contract `exit 0 ⟺ 0 gaps AND 0 undeclared` is what was verified, not a fixed declared-count) |

**The 135 vs 131 capture-id gap is not a discrepancy — verified by name, not assumed:**
`print-twin delta OK` counts 135 capture ids (every print-twin fixture that exists on this
rebased tree); `check-freeze.sh` only ever reports on names its 262-line baseline already
lists. Diffing the full 135-id set against the 131 mismatch names gives exactly 4 ids
present on this tree but absent from the shared baseline entirely (invisible to the freeze
gate by construction, not a failure, per its own documented semantics — "a shot present in
the directory but absent from the baseline is invisible to the check"): `feature-ability-
provenance`, `feature-trait-provenance`, `featureblock-narrow`, `statblock-narrow` — all
fixtures from unrelated tickets' widenings that evidently never froze their print class.

**Why exactly 131 (not 1, not 0) twin lines moved vs. the CURRENT shared baseline — this is
the expected scope of the ticket, not a regression:** SC-127's core fix (the print preview
draws its own white paper, landed across rounds 3–7, still unlanded on `origin/develop`/
`origin/main`) changes the rendered background of **every** print-twin capture, not just a
few fixtures named by this ticket. The shared `freeze-baseline.sha256` has never had SC-127
applied, so once compared against the REBASED (current, non-stale) tree, all 131 producible
`*--steel-print.png` lines this ticket's own `sc127-rebaseline.txt` tracks differ from it —
exactly the owner's own prediction ("its twin moves with the paper fix like every other").
This is the full, complete, and correctly-scoped sanction ask for landing — not a wider
regression introduced by round 9b.

### Two clean sweeps → rebaseline regenerated

`sc127-rebaseline.txt` rewritten: **131 lines, baseline order** (the prior r7 130-line file
backed up to `sc127-r7-rebaseline.txt.bak`). Built from sweep B, cross-checked byte-identical
against sweep A's same 131 names (`diff` empty) — deterministic across both clean sweeps.
**New capture id: `perk-headings`** (SC-318's h1–h6 heading-ladder fixture, landed after r7;
its twin is naturally included since the paper fix reaches it like every other print
capture). The first 3 hashes (`ancestry`, `career`, `characteristics`) are confirmed
byte-identical to r7's original file — same proof as round 9's own (pre-rebase) comparison,
now reproduced on the current tree: the MEDIUM-B accent-formula rewrite itself still moves
zero bytes at the default accent; everything that moved relative to the OLD r7 file is
unrelated-ticket drift (SC-231/236/255/284/318/232, etc.), not this ticket's own content.

### After shots (5 named fixtures, real files from the final rebased-tip sweep)

- `sc127-r9b-after-statblock-charline-two-dark-twin.png`
- `sc127-r9b-after-feature-dark-twin.png`
- `sc127-r9b-after-initiative-dark-twin.png`
- `sc127-r9b-after-negotiation-dark-twin.png`
- `sc127-r9b-after-hero-dark-twin.png`

### Superproject / submodule state

`git submodule update -- steel-etl v2 steelCompendium.github.io` run after the rebase (the
rebase itself already carries their pinned commits forward from origin/main's own history;
this re-confirms the working tree matches). `git status --short` **empty** in both the dse
clone and the superproject after the pointer-bump commit.

### Round 9b commits

- **dse** (same content as round 9's four commits, replayed with new SHAs across two
  rebases): `878ca2c` (accent-formula fix), `c163f0e` (sentinel generation + second
  correctness pass), `8fd72f7` (jest manifest comparison), `5329c56` (lightDefault
  return-statement fix + pure comparison helpers) — branch `sc127-print-preview`, dse clone,
  local only.
- **superproject**: `17e1291` — `chore: bump draw-steel-elements to 5329c56 (SC-127 r7+r9
  fix rounds)` (collapses what were two separate pointer-bump commits, `795c2ae`→`726a9e6`
  and `dee6aad`, into one, since both conflicts resolved to the same final gitlink value —
  see "resolved" note above).

## Return contract (round 9b, final — supersedes round 9's return contract above)

- **Status:** DONE
- **dse final commit:** `5329c56` (branch `sc127-print-preview`, local, not pushed)
- **superproject final commit:** `17e1291` (branch `sc127-print-preview`, local, not pushed)
- **Rebase conflicts:** dse — 0 (two clean rebases, `dfb7395` then `9ded832`). Superproject —
  `.claude/skills/dse-verify/SKILL.md` (auto-merged clean, SC-127 note verified intact),
  `CHANGELOG.md` (real conflict, resolved by keeping both sides' content), `draw-steel-
  elements` gitlink (conflicted on both replayed commits, resolved to final dse HEAD both
  times, second commit became empty and was dropped by git, message rewritten via amend on
  this unpushed branch)
- **tsc:** clean, exit 0
- **lint:** clean, exit 0
- **jest (final):** 4252 passed / 1 skipped / 4253 total / 214 of 215 suites / 3 snapshots, exit 0
- **shots (sweep A):** 544 PNGs, 0 FAIL, exit 0, all in-run OK lines present (host-copy pin, light island at default+non-default accent, 6 host-leak families, print-twin self-tests, print-twin delta OK 135 ids, nested corner-radius)
- **shots (sweep B, clean):** 544 PNGs, 0 FAIL, exit 0, same OK lines
- **sweep A vs B determinism:** 270/270 (135 twin + 135 realprint) byte-identical
- **freeze (both sweeps):** exactly 131 `*--steel-print.png` FAILED / 0 `*--steel-realprint.png` FAILED / 0 missing, against the current 262-line shared baseline — expected (SC-127's paper fix reaches every print twin; the shared baseline has never had SC-127 applied)
- **135 vs 131 capture-id gap:** 4 capture ids exist on this tree but are not yet in the shared baseline at all (invisible to freeze by construction, not a failure)
- **parity:** 0 gaps / 0 undeclared / 24 declared, exit 0
- **rebaseline:** `sc127-rebaseline.txt` regenerated, 131 lines, baseline order, deterministic across 2 clean sweeps (diff empty); new capture id `perk-headings`; first 3 hashes confirmed byte-identical to r7's original 130-line file (prior backup: `sc127-r7-rebaseline.txt.bak`)
- **after-shots:** `sc127-r9b-after-{statblock-charline-two,feature,initiative,negotiation,hero}-dark-twin.png`
- **git status --short:** empty in both trees
- **artifacts:** all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`, prefix `sc127-r9b-*`

---

## Round 11 (small plumbing round — round-10 re-review's three LOW findings)

**Hard scope respected: `visual-harness/shoot.mjs` guard plumbing, the generator's return
shape, and jest tests only.** `styles-source.css` and every fixture are untouched; the stop
condition (any `*--steel-print.png`/`*--steel-realprint.png` byte moving from the
sanctioned hashes) did not fire — see the hash check below.

### L1 — the island guard now names its own exceptions

`assertSc127LightIslandPinned`'s call site in `shoot.mjs` got its own try/catch: an
exception thrown inside it now prints `SC-127 LIGHT ISLAND GUARD FAILED (exception inside
assertSc127LightIslandPinned): <error>` and exits 1 immediately, instead of escaping to the
sweep's one outer try/catch (which reported an indistinguishable generic `FAIL sweep
(exception)` and silently skipped every gate still queued after it for the rest of the run
— exactly what happened in r9's own `sweepA2.log`).

**Can-fail proof:** reproduced r9's own bug 2 deliberately (dropped `lightDefault` from
`generateLightIsland`'s return again) and ran a real full sweep. Result
(`sc127-r11-canfail-L1.log`): `host-copy pin OK` prints, then immediately
`SC-127 LIGHT ISLAND GUARD FAILED (exception inside assertSc127LightIslandPinned):
TypeError: findDriftedTokens: oursMap and targetMap must both be objects (got object and
undefined)`, process exits 1. Zero occurrences of the old generic `FAIL sweep (exception)`
string anywhere in the log; `button host-leak OK` (the very next gate in the file) never
printed — confirmed later gates are skipped, but now via an unambiguous, self-naming
failure rather than a mystery exception. Restored; `git diff --stat` empty against the
tracked file afterward.

### L2 — a jest test on the generator's return shape

Added to `test/unit/build/printTwinDeltaAllowedSet.test.ts`: pins
`generateLightIsland`'s exact return-statement key list (`tokenNames, differing,
accentDerived, light, lightDefault, text`) via the same source-text convention this file
already uses for its other generator-shape assertions.

**Can-fail proof:** dropped `lightDefault` from the return statement (same mutation as
L1's proof, but checked against jest instead of a sweep) — `sc127-r11-canfail-L2.log`:
`1 failed, 25 passed, 26 total`, exit 1, naming exactly the new test. Restored; `git diff`
empty.

### L3 — the tautological manifest-vs-sheet test, fixed

The "extra, local-only" test used to loop over `Object.keys(manifest)` and assert
`t in manifest` — always true by construction, since `t` came from that object's own
keys; deleting a token from BOTH the committed block and the manifest left it green no
matter what. Fixed per the owner's stated preference: derive the expected set
INDEPENDENTLY of the manifest (every token directly redeclared with a different literal
value under `.theme-dark` vs `.theme-light` in the locally cached pinned sheet — 43 tokens
on this machine) and assert that set is a subset of the manifest's keys. The comment was
also corrected to describe what the test actually checks now, and still states plainly
that it skips (with a printed reason) when no pinned sheet is cached locally (true in CI).

**Can-fail proof:** deleted `--color-base-30`'s declaration from both `styles-source.css`'s
generated block (line 15145) and `obsidian-light-island.manifest.json` (single-line
removal, diff-verified) — `sc127-r11-canfail-L3.log`: `1 failed, 25 passed, 26 total`, the
failure naming `--color-base-30` exactly (`Array ["--color-base-30"]` in the jest diff).
Restored from backup; `git diff --stat` empty on both files afterward.

### Battery

| Gate | Result |
|---|---|
| `rm -f main.js styles.css && npx jest` (full) | **4253 passed / 1 skipped / 4254 total, 214 of 215 suites, 3 snapshots**, exit 0 (`sc127-r11-jest-full.log`) — net +1 over round 9b's 4252, exactly the one new L2 test (L3 modified an existing test in place, added none) |
| `npm run shots` (one full clean sweep) | 544 PNGs, 0 FAIL, exit 0. All in-run OK lines present: `host-copy pin OK`, `SC-127 light island OK (1096 checked, 295 differ, correct at default AND non-default accent)`, all 6 host-leak families OK, both print-twin self-tests OK, `print-twin delta OK (135 capture ids)`, `nested corner-radius OK`, `all shots written` (`sc127-r11-sweep.log`) |
| `npm run parity` | 0 gap(s) / 0 undeclared warning(s) / 24 declared deferral(s), exit 0 — unchanged from round 9b/10 (`sc127-r11-parity.log`) |

### Hash check — the stop condition did NOT fire

- **131 `*--steel-print.png` lines in `sc127-rebaseline.txt`:** all 131 byte-identical to
  this sweep's fresh hashes (`diff` empty, filtered to the 131 shared names). 4 additional
  ids on this tree (`feature-ability-provenance`, `featureblock-narrow`,
  `feature-trait-provenance`, `statblock-narrow`) are not in `sc127-rebaseline.txt` at all
  — the same 4 round 9b/10 already identified as unrelated-ticket widenings never frozen,
  not a round-11 effect.
- **`*--steel-realprint.png` vs the shared 262-line `freeze-baseline.sha256`:** 131 names in
  common; all 131 byte-identical (`diff` empty).
- **`check-freeze.sh` against the shared baseline:** `FREEZE VIOLATED (131 checksum
  mismatches, 0 missing)` (`sc127-r11-freeze.log`) — the EXACT SAME 131 names as round 9b/10
  (`diff` against that name list is empty). This is the already-known, already-sanctioned
  "SC-127's paper fix hasn't landed on the shared baseline yet" state, unchanged by round
  11 — not a new regression.
- **Conclusion: 0 bytes moved.** The round's hard stop condition never triggered.

### Commits

- **dse** (branch `sc127-print-preview`, local only):
  - `79d43eb` fix(print): SC-127 r11 L1 — the light-island guard names its own exceptions
  - `3c2ca0b` test(print): SC-127 r11 L2+L3 — pin the generator's return shape; fix a tautological test
- **superproject** (branch `sc127-print-preview`, local only):
  - `89ef816` chore: SC-127 r11 — bump draw-steel-elements pointer (`5329c56` → `3c2ca0b`)

Note: `origin/main` moved again during this round (`a65a429`, unrelated SC-378 landing) —
per the coordinator's explicit instruction, this round does NOT rebase onto it; a landing
rebase round follows after the re-review.

## Return contract (round 11, final)

- **Status:** DONE
- **dse final commit:** `3c2ca0b` (branch `sc127-print-preview`, local, not pushed)
- **superproject final commit:** `89ef816` (branch `sc127-print-preview`, local, not pushed)
- **jest:** 4253 passed / 1 skipped / 4254 total / 214 of 215 suites / 3 snapshots, exit 0
- **shots:** 544 PNGs, 0 FAIL, exit 0, all in-run OK lines present including light island OK (both accents) and print-twin delta OK (135 ids)
- **parity:** 0 gaps / 0 undeclared / 24 declared, exit 0 (unchanged)
- **bytes moved: 0** — 131/131 `sc127-rebaseline.txt` twin hashes byte-identical; 131/131 shared-baseline realprint hashes byte-identical; `check-freeze.sh`'s 131 mismatches are the identical, already-known, already-sanctioned name set from round 9b/10
- **can-fail proofs:** L1 (drop lightDefault → named guard failure line + exit 1, 0 generic messages, later gate's OK line absent; restore → clean); L2 (same drop → 1/26 jest red naming the new test; restore → 26/26); L3 (delete `--color-base-30` from block+manifest → 1/26 jest red naming the token; restore → 26/26)
- **git status --short:** empty in both trees
- **artifacts:** all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`, prefix `sc127-r11-*`

---

## Round 13 (landing rebase, post-sanction)

Scott sanctioned the rebaseline ("approved", 2026-10-02, per the round-11 re-review's
approval). This round rebases both trees onto their current tips so the landing hashes come
from the rebased tree, exactly as round 9b did for the earlier sanction.

### dse clone

`git fetch origin && git rebase origin/develop`: tip moved `9ded832` → `8a256c5` (2 commits,
SC-378's CHANGELOG-only landing). **Clean, 0 conflicts** (`sc127-r13-rebase-dse.log`). Final
dse tip: **`1ac4e5a`**. No `package.json` change between the two tips. `node visual-harness/
obsidian-light-island.mjs --check`: "light island up to date" (295/1096 differing, 34
accent-derived) — no regeneration needed (`sc127-r13-genisland-check.log`).

### Full battery at the rebased dse tip

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 (`sc127-r13-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc127-r13-lint.log`) |
| `rm -f main.js styles.css && npx jest` | **4254 passed / 1 skipped / 4255 total, 214 of 215 suites, 3 snapshots**, exit 0 (`sc127-r13-jest.log`) — +1 over round 11's 4253, from SC-378's own unrelated base growth; round 13 itself adds no `test()` |
| `npm run shots` — sweep A | 544 PNGs, 0 FAIL. All in-run OK lines present: `host-copy pin OK`, `SC-127 light island OK (1096 checked, 295 differ, correct at default AND non-default accent)`, every host-leak family OK, both print-twin self-tests OK, `print-twin delta OK (135 capture ids)`, `nested corner-radius OK`, `all shots written`. Exit 0 (`sc127-r13-sweepA.log`) |
| `npm run shots` — sweep B (clean) | 544 PNGs, 0 FAIL, same OK lines, `print-twin delta OK (135 capture ids)`, exit 0 (`sc127-r13-sweepB.log`) |
| Determinism, sweep A vs B | **270/270** (135 twin + 135 realprint) hashes byte-identical, `diff` empty |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)**, exit 0 (`sc127-r13-parity.log`) — unchanged from rounds 9b/10/11 |

### Freeze against the CURRENT shared baseline (read first: still 262 lines, unchanged since 9ded832 — no new twin ids were baselined by anything that landed in between)

`N = 131` (131 + 0 newly baselined ids, since the baseline's own line count did not move).
Both sweeps: **`FREEZE VIOLATED (131 checksum mismatches, 0 missing)`** — confirmed by name
to be the EXACT SAME 131-name set as rounds 9b/10/11 (`diff` against that name list empty on
both sweeps) — 0 `*--steel-realprint.png` FAILED, 0 missing. **STOP CONDITION did not
fire:** every twin mismatch is the known, already-sanctioned paper-fix effect (no new/
unexplained movement); 0 realprint FAILED.

Hash cross-checks performed directly (not inferred from the freeze summary alone):
- All 131 `sc127-rebaseline.txt` twin hashes are byte-identical to both fresh sweeps.
- All 131 realprint hashes shared with the shared baseline are byte-identical to both
  fresh sweeps.
- Sweep A's and sweep B's full 270-hash sets (twin + realprint) are byte-identical to each
  other.

### Rebaseline regenerated (content unchanged — same 131 lines, byte-identical)

Since the shared baseline's SC-127-relevant name set and every one of this ticket's own
print bytes are unchanged since round 9b/11, the regenerated `sc127-rebaseline.txt` is
byte-identical to what was already committed (verified: `diff` empty against the prior
file before overwriting). The prior file is nonetheless preserved per the brief as
**`sc127-r9b-rebaseline.txt.bak`**, and the file was rewritten (not just left alone) from
sweep B's own fresh hashes, in baseline order, so this round's own artifact is traceable to
its own sweep rather than inherited unchanged.

**I-1 — capture ids on the tree but absent from the shared baseline (4, unchanged from
round 9b/10/11):** `feature-ability-provenance`, `featureblock-narrow`,
`feature-trait-provenance`, `statblock-narrow` — all four unrelated-ticket widenings whose
print class was never frozen. Their post-SC-127 twin + realprint hashes (from sweep B, the
final deterministic sweep) are recorded in **`sc127-r13-unbaselined-ids.sha256`** (8 lines).
One of the four (`feature-ability-provenance`) happens to have an identical twin and
realprint hash — a property of that specific fixture's content, not a new rule.

### Superproject rebase

`git fetch origin && git rebase origin/main`: tip moved `43ea28a` → `f549761` (9 commits,
unrelated SC-385 landing among others). Conflicts, named and resolved:

- **`.claude/skills/dse-verify/SKILL.md`** — auto-merged CLEANLY again (0 conflict
  markers); the SC-127 supersession note confirmed still intact.
- **`CHANGELOG.md`** — auto-merged CLEANLY this time (0 conflict markers, unlike round 9b's
  real conflict); the SC-127 `## Unreleased` bullet confirmed still present (line 97) beside
  everything newer.
- **`draw-steel-elements` (gitlink)** — conflicted on both replayed commits (the r9+r11
  pointer-bump commit and the r11-only pointer-bump commit), same shape as round 9b:
  resolved both to the dse clone's actual rebased HEAD (`1ac4e5a`); the second commit's
  diff became empty and git auto-dropped it. The surviving commit's message was rewritten
  (`git commit --amend`, on this unpushed local branch — nothing lost, fixing up the
  rebase's own conflict-resolution artifact before it is ever shared, same justification as
  round 9b's amend) to describe both the r9 and r11 content it now carries. Final
  superproject commit: **`4836147`**.
- **`steel-etl` (gitlink, not a rebase conflict — a stale LOCAL checkout)**: after the
  rebase completed, `git status --short` showed `M steel-etl` — the submodule's checked-out
  commit (`88aec3b`) had drifted from the superproject's own pinned commit (`0c74f4f`) at
  some earlier point in this long-running worktree. `git submodule update -- steel-etl v2
  steelCompendium.github.io` (the brief's step 4) corrected it; `v2` and
  `steelCompendium.github.io` were already in sync (no change reported for either).

`git status --short` empty in both trees after resolution
(`sc127-r13-rebase-superproject.log`, `-continue.log`, `-continue2.log`).

### Round 13 commits

- **dse**: same content as rounds 9/11, replayed with new SHAs across this rebase — final
  tip **`1ac4e5a`** (branch `sc127-print-preview`, local only; no round-13-specific commit,
  since this round's work is entirely the rebase itself plus the (byte-identical)
  rebaseline regeneration, which lives in the workspace, not the dse repo).
- **superproject**: **`4836147`** — `chore: bump draw-steel-elements to 1ac4e5a (SC-127
  r9+r11 fix rounds)` (collapses what were two separate pointer-bump commits into one,
  same reason as round 9b).

## Return contract (round 13, final — supersedes every earlier round's return contract)

- **Status:** DONE
- **dse final commit:** `1ac4e5a` (branch `sc127-print-preview`, local, not pushed); base moved `9ded832` → `8a256c5` (2 commits), 0 conflicts
- **superproject final commit:** `4836147` (branch `sc127-print-preview`, local, not pushed); base moved `43ea28a` → `f549761` (9 commits)
- **Rebase conflicts:** dse — 0. Superproject — SKILL.md (auto-merged clean), CHANGELOG.md (auto-merged clean this round), `draw-steel-elements` gitlink (conflicted on both replayed commits, resolved to final dse HEAD both times, second became empty and was dropped, message rewritten via amend). Post-rebase, found and fixed a stale LOCAL `steel-etl` checkout via `git submodule update`.
- **tsc:** clean, exit 0
- **lint:** clean, exit 0
- **jest:** 4254 passed / 1 skipped / 4255 total / 214 of 215 suites / 3 snapshots, exit 0
- **shots (sweep A):** 544 PNGs, 0 FAIL, exit 0, all in-run OK lines present
- **shots (sweep B, clean):** 544 PNGs, 0 FAIL, exit 0, same OK lines
- **sweep A vs B determinism:** 270/270 (135 twin + 135 realprint) byte-identical
- **freeze:** N = 131 (shared baseline unchanged at 262 lines since `9ded832`); both sweeps `131 twin FAILED / 0 realprint FAILED / 0 missing`, confirmed by name identical to rounds 9b/10/11; STOP CONDITION did not fire
- **parity:** 0 gaps / 0 undeclared / 24 declared, exit 0
- **rebaseline:** `sc127-rebaseline.txt` rewritten from sweep B (131 lines, baseline order), content byte-identical to the prior file (0 moved); prior file preserved as `sc127-r9b-rebaseline.txt.bak`
- **I-1 (unbaselined ids):** 4, unchanged — `feature-ability-provenance`, `featureblock-narrow`, `feature-trait-provenance`, `statblock-narrow`; hashes in `sc127-r13-unbaselined-ids.sha256` (8 lines, from sweep B)
- **git status --short:** empty in both trees
- **artifacts:** all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`, prefix `sc127-r13-*`, plus `sc127-r9b-rebaseline.txt.bak` and the updated `sc127-rebaseline.txt`
