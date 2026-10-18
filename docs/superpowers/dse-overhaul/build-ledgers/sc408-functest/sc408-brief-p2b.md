# SC-408 pilot round P2b — jsdom fill of the stamina surfaces' uncovered logic

## 0. Context loading

1. Read and obey `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-brief-common.md`
   — BUT your worktree is different from the one it names:
   **`/home/scott/code/steelCompendium/worktrees/sc408-jsdom/draw-steel-elements`**, branch
   `sc408-jsdom`, base `be4f002` (`node_modules` installed). Everywhere the preamble says
   `sc408-functest`, read `sc408-jsdom`. You never touch `worktrees/sc408-functest`.
2. The ledger `decisions.md` (especially the known-bug convention, B5/B6 handling, ticket
   keys SC-425…SC-430, and the P2 split).
3. Your ground truth: `sc408-s1-stamina-inventory.md` §2 (inventory + coverage map; rows E,
   M, A, S, T, Q, F, W, R, K — NOT PM) and §3 (bug details), plus the throwaway probe source
   `sc408-s1-probes.ts.txt`, which already exercises many of these rows in jsdom.
4. Workers never call the tracker.

## 1. Task

Scott's ask (verbatim, ledger): "I want the tests to be comprehensive and able to be ran
relatively easily to find regressions and other bugs."

The layering (ledger, Architecture entry): **L1 jsdom owns the combinatorial logic matrix** —
every variant of every control's logic (values × states × host kind), labels and disabled
reasons, table-driven. A sibling worker is building the real-Obsidian layer; you do only
jsdom.

1. For every S1 inventory row in sections E, M, A, S, T, Q, F, W, R, K that S1 marked
   **UNCOVERED** and NOT `needs-real-obsidian`, add a jsdom test. Prefer table-driven
   `test.each` matrices (e.g. Damage / Healing / Kill / Full Heal × full / winded / dying /
   dead × temp present / absent × hero / creature). Put the S1 row id in each test title
   (`[A07] …`).
2. New files only, under `test/dom/views/` (e.g. `stamina-edit-modal-matrix.test.ts`,
   `stamina-recoveries-matrix.test.ts`) and, if an entry-point row needs it,
   `test/dom/elements/`. Reuse the existing suites' setup helpers; do not edit existing test
   files except to extract a shared helper if that is clearly cleaner (say so).
3. **Known bugs** (ledger convention): a test of correct behaviour that fails today because
   of a filed bug uses jest's `test.failing(...)` with the ticket key in the title, e.g.
   `test.failing('[A12] typed value above max: Apply label matches the applied change [known bug SC-427]', …)`.
   Relevant tickets: SC-427 (label vs applied for out-of-range typed values; inverted controls
   on out-of-range current; "1e3" read as 1; Reset keeps the Apply box), SC-428 (Catch Breath
   at full Stamina spends a Recovery; popover Catch Breath never disabled; recovery value 0
   reason text), SC-426 (initiative detail row stale after grid-cell edit), SC-425 (ds-hero
   unresolved class → max 0 zeroes Stamina; ds-hero is experimental, the test setup already
   runs with experimental ON). SC-430 (B7) is NOT jsdom-reproducible — skip it.
4. **B5 and B6** (design calls pending Scott): existing tests already pin current behaviour.
   Do not add known-bug markers for them; if you add a test touching them, suffix the title
   "[current behaviour — ruling pending SC-408]".
5. No source changes. If a row cannot be tested without a source change, list it under
   Follow-ups instead.

Commit after every coherent step (`git -C <your dse path> …`). No push. No Claude/AI
attribution in commit messages.

## 2. Gates (absolute paths; devbox from the workspace shape)

1. `npm run tsc` clean · 2. `npm run lint` clean ·
3. `rm -f main.js styles.css` then `npx jest`: measure the baseline at `be4f002` first
   (expected **4448 passed / 2 skipped / 220 of 221 suites**), then after. Expected = baseline
   + your new tests, 0 failures; `test.failing` tests count as passed. Settings-tab timeouts
   under load = noise (check `/proc/loadavg`, re-run); `sidebarInitiative` "SC-288 r2" ~3%
   flake = SC-383.
4. Run your new files 3 times (`npx jest <files>`) to show they are deterministic.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-p2b-report.md`,
opening with a ≤10-line executive summary: verdict, final sha, jest before/after, new test
count, known-bug (`test.failing`) count by ticket, how many S1 uncovered rows are now covered
vs left (with reasons). Then a row-by-row table (S1 row id → test title → file), NEW suspected
bugs found (steps, expected vs actual, severity), and `Drive-by fixes:` / `Follow-ups:`.

Return contract: final text to the ticket-owner, not a human — raw facts, sha, numbers,
absolute paths of every artifact. If the report write is blocked, return it inline. If you
need input, end with `STATUS: NEEDS_CONTEXT`.
