# SC-408 review round R1 — independent review of the whole functional-test pilot

## 0. Context loading

1. Read and obey `sc408-brief-common.md` (same dir). Worktree:
   `/home/scott/code/steelCompendium/worktrees/sc408-functest` (DSE branch `sc408-functest`,
   head `52f0099`; superproject worktree branch `sc408-functest` carries a dse-verify skill
   docs commit `85216b6`).
2. The ledger `decisions.md` — the Architecture, Pilot, P2 split, known-bug convention and
   B5/B6 entries are the spec you review against.
3. The design: `sc408-s2-tooling.md` §4. The ground truth for coverage:
   `sc408-s1-stamina-inventory.md` §2 and §4.
4. The authors' reports: `sc408-p1-report.md`, `sc408-p2a-report.md`, `sc408-p2b-report.md`
   (executive summaries first; dive in only where you need to).
5. You did not write any of this code. Workers never call the tracker.

## 1. What you are reviewing

The diff `be4f002..52f0099` in DSE: a WebdriverIO + `wdio-obsidian-service` real-Obsidian
e2e layer under `e2e/` (runner, driver, manifests, coverage gates, scenarios), a
`pendingWrites()` source seam, `data-dse-control` ids stamped into kit factories and the
pilot surfaces (StaminaEditModal, ds-stamina-bar + RecoveriesStrip, initiative stamina entry
points), a jsdom census test, new jsdom matrix tests (merged from branch `sc408-jsdom`), and
docs (DSE `e2e/README.md`, `AGENTS.md`, `.repo-docs`, and the superproject dse-verify skill).

Scott's ask (verbatim): "I want the tests to be comprehensive and able to be ran relatively
easily to find regressions and other bugs."

## 2. Execute and probe — do not just read

1. **Mutation probes (the most important part).** The failure mode we fear is a vacuous
   suite: green tests that would not catch a real regression. In a scratch copy or with
   changes you revert byte-clean afterwards (`git -C … diff` empty), inject at least 10
   distinct realistic bugs into `src/views/StaminaEditModal.ts`, the stamina-bar view, the
   RecoveriesStrip and initiative's stamina callback — e.g. Damage applies +1 too little;
   temp no longer absorbs damage first; Apply writes nothing; Escape writes; Kill sets
   floor+1; Full Heal keeps damage; Catch Breath doesn't decrement Recoveries; a disabled
   reason is wrong; the grid-cell path writes the wrong instance; the control's listener is
   detached so the click does nothing. For each mutation, run jest (relevant suites) and
   `npm run e2e` and record which layer(s) caught it. A mutation neither layer catches is a
   HIGH finding (name the gap). Report a table: mutation → caught by jest? by e2e? → test ids.
2. **Gate bite.** Verify the coverage gate, both censuses and the knownBug markers actually
   fail when they should (add an un-id'd button; drop a scenario; "fix" a known bug locally
   and confirm its marker fails). Revert.
3. **Run the battery yourself**: tsc, lint, jest (`rm -f main.js styles.css` first), lifecycle
   (`DSE_LIFECYCLE_PORT=9308`), `npm run e2e` ×3, shots, freeze, parity — per the dse-verify
   skill. Compare to the authors' numbers.
4. **Flake and safety probes**: run e2e under artificial load (e.g. a parallel `npx jest`
   in the same shell session) and with `--shards=4`; check that no run ever inherits
   `DISPLAY=:1` (read `run.mjs`; also check the environment of spawned Obsidian processes
   via `/proc/<pid>/environ` during a run); SIGINT mid-run leaves no Xvfb / chromedriver /
   Obsidian behind (`pgrep -af` for this worktree + chromedriver).
5. **Read for correctness**: waits keyed on real events (no sleeps hiding races), the
   invariants (do they really check note integrity outside the block?), the knownBug
   semantics, the exercised-set accounting (can a scenario "exercise" a pair without really
   driving it?), the census scope, `package-lock.json` (did any EXISTING package version
   change?), the `data-dse-control` stamping (no rendered pixel/class/text change; any CSS
   that could match the new attribute?), and the docs' accuracy against what the code does.
6. **Authoring ergonomics**: write one NEW small scenario yourself for an uncovered-ish
   variation using only the README; note any friction. Delete it afterwards.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-r1-review.md`,
opening with a ≤10-line executive summary: verdict (land-ready / fix round needed), counts by
severity, the mutation table's headline (N of M caught; which escaped), battery numbers.
Then findings by severity (HIGH / MEDIUM / LOW / INFO), each with `file:line`, a failure
scenario, and a prescribed fix. Leave the worktree byte-clean (`git status --short` empty in
both DSE and superproject) and say so.

Return contract: final text to the ticket-owner, not a human — raw facts, numbers, absolute
paths of every artifact. If the report write is blocked, return it inline. If you need
input, end with `STATUS: NEEDS_CONTEXT`.
