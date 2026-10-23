# SC-485 r2 — fold review findings (tests/comment/CHANGELOG only), rebase, full battery

Resume of implementer I. Read the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/decisions.md` — the "Review rulings (owner, 2026-10-23)" block is your spec (quoted below). Review report: `…/sc485-initiative-default-keys/sc485-r1-review-report.md` (MEDIUM-1, LOW-1..3 sections). Reviewer scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r1-review-w7n2qa/` (`zzSc485RDom2.test.ts`, `sc485-r-mutate.py`). Workers never call the tracker.

## Task (rulings verbatim)

- "MEDIUM-1 … FOLD — adopt the FIRST test of R's `zzSc485RDom2.test.ts` into the pool-unit describe of `test/dom/elements/initiative-default-keys.test.ts`; prove it red under M11 and M20 (R's `sc485-r-mutate.py`), then restore."
- "LOW-1 … FOLD — adopt the SECOND test of `zzSc485RDom2.test.ts`; prove red under M14."
- "LOW-2 (`stamina-entry.e2e.ts:56` comment says \"it was 25\"; E08 goes 30 -> 22 -> 30): FOLD — comment says 22."
- "LOW-3 (CHANGELOG \"A save now changes only what you touched\" overclaims): FOLD — reword to: \"The initiative tracker no longer adds keys you never wrote (`isHero`, empty `conditions`, `malice`, per-creature Stamina) when you click in it. Values it fills in for you stay out of the note until they change; damaging one creature writes that group's instance list. A combatant written as just a statblock keeps following that statblock.\" (implementer may tighten wording but must not overclaim)."
- Out of scope (already filed): SC-500, SC-503. No src change in this round. If a test you adopt fails on the current src, STOP and return NEEDS_CONTEXT (that would be a real bug).

Order: (1) commit the two tests + comment fix (red-proof each test under its mutant using a COPY of the tree or apply-then-revert, and record the mutant's red test names; restore and confirm `git status --porcelain` clean); (2) CHANGELOG reword commit in the superproject; (3) rebase plugin onto `origin/develop` = **`2c61511`** (SC-478 + SC-497 since your base; SC-478 touches `src/framework/host/` + `visual-harness/obsidian-lifecycle.mjs`, SC-497 the shots host pin — neither on your branch), and superproject onto `origin/main` = **`2ba04a6`** (CHANGELOG conflicts in `## Unreleased`: keep every bullet). If origin/develop is newer than 2c61511, rebase onto the newer one and report its sha. List any hand-resolved conflict in src/ or test/. (4) `npm ci`. (5) FULL battery on the rebased head = evidence of record.

## Gates — expected on the rebased head (2c61511 + this branch)

tsc (incl. `tsc -p e2e`) + lint (incl. `e2e/`) clean · jest **5797 + 26 + 2 = 5825 passed / 1 skipped / 240 of 241 suites** (after shots has cached obsidian-app.css; before that one fewer passed + 2 skipped) · lifecycle **33/33** (`DSE_LIFECYCLE_PORT=9347`) · e2e **108/108 ok, 0 failed, 0 known-bug, coverage 69/69** · shots **592 and runs to the end**, with `host-copy pin OK (… 1.15.0; 18 further rules …)`, `button host-leak OK (113 … 678 …)`, `modal button host-leak OK (10 … 228 …)`, both text-scale lines incl. `text scale once OK (107256 / 214 loads …)`, and an EXPECTED `OBSIDIAN APP.CSS PIN DRIFT` warning, rc 0 · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Any deviation: report it, don't paper over it.

## Command rules (unchanged from r1 — re-read §4 of `sc485-brief-r1-impl.md`)

devbox `-c <abs plugin path> -- bash <script file>`, one gate per blocking foreground call (`timeout: 600000`), rc from inside the script; no compound `cd`, no heredoc (Write tool), no glob `rm`, no pattern kill, no background jobs/Monitor; private scratch folder (reuse `sc485-r1-impl-x4k7qp/` with `sc485-i2-` prefixed names); `git -C <abs path>`; never push/tag; main checkout untouched except your report; Scott's vault dirt there is expected.

## Report / return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/sc485-r2-fix-rebase-report.md` (≤10-line exec summary first). Return raw facts: plugin head + base, superproject head + base, conflicts, mutant-red proofs (mutant -> red test names), each gate summary line + rc, e2e run id, and `ls -la` of every artifact path. Need input → `STATUS: NEEDS_CONTEXT`. You cannot message me; if you ever do, first word `SC-485:`.
