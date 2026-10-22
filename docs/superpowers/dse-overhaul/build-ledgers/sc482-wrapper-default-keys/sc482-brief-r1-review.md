# SC-482 r1 independent review brief — six blocks stop writing default keys

You are an independent adversarial reviewer. You did not write this code. EXECUTE AND PROBE — do not only read.

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/decisions.md` (the ledger — authoritative; the rulings you review against are there verbatim).
- Then: `sc482-r0-survey-report.md` (executive summary + §2 measured leaks + §4 helper design), `sc482-brief-r1-impl.md` (what the implementer was asked), `sc482-r1-impl-report.md` (what it says it did) — all in the same ledger dir. Treat the impl report's claims as claims to verify.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys`. Plugin repo `.../draw-steel-elements`, branch `sc482-wrapper-default-keys`. Review range: `bc4a0c5..<HEAD sha given in the impl report>` (confirm HEAD matches). Superproject CHANGELOG commit on the superproject worktree branch.
- `git -C <plugin repo> fetch origin`; if origin/develop moved past `bc4a0c5`, say so (do not rebase).
- **Workers never call the tracker** (Linear). The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — ignore it.
- You change NO tracked file and make no commit. Temporary probe tests go under `test/` and are DELETED before you return (`git -C <plugin repo> status --short` must match what you found).

## 2. What to check

1. **Rule conformance** (ledger, verbatim rule): for each of counter, project, montage, party, encounter, negotiation, and stamina-bar (moved onto the helper): absent+unchanged omitted; absent+changed written; present (even = default, even `undefined`-valued per SC-466 r2 → absent) handled per the rule; fully-authored block byte-identical to `bc4a0c5`'s output — PROVE this by running the same inputs through `bc4a0c5`'s serializer (e.g. a scratch `git worktree add` of bc4a0c5 at an absolute path in your scratch dir — never re-point or reset an existing checkout) and diffing bytes, across a combinatorial set of present/absent keys per element.
2. **Presence survives every writer** — every write entry point r0 §1 lists for the 6 elements (and stamina-bar's). In-place mutations of object/array defaults (`rolls.push`, `members`, `currentArgument`, `party: {...}` reassignment, negotiation `resetData`). Re-parse paths (external edit, pipeline echo, sidebar) recompute the record.
3. **Integrity probes** (user files): content above/below the fence survives; two same-type blocks in one note — one minimal, one fully authored — never cross-talk; a hand-edited block survives a re-trigger; the record never serializes (real `stringifyYaml`).
4. **Negotiation nested Motivation** and **montage ordered DTO**: shape and key order unchanged for authored keys.
5. **Scope fences**: no edits to `src/authoring/FormModal.ts`, `src/elements/initiative/`, `src/elements/hero/`, `src/framework/host/`. Encounter `_computed` behaviour unchanged apart from dropping `party: {}` / `monsters: []`.
6. **Test quality**: changed fixtures only where the SOURCE omitted a default; no weakened assertions. Mutation-test the helper and at least two element wirings (revert/alter one line, confirm a test goes red, restore).
7. **Real Obsidian probes**: drive at least 3 of the elements (counter, montage, negotiation suggested) in a real Obsidian and read the NOTE FILE after a write — use the lifecycle harness's machinery or the e2e driver ad hoc (no committed spec). Never `--headed` / `DISPLAY=:1`; own Xvfb only.
8. **Gates**: re-run the full `dse-verify` battery on the branch head. Expected: tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5457 + the branch's new tests passed / 1 skipped / 232+N of 233+N suites** · lifecycle **30/30** · e2e **`OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **580**, 0 FAIL · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Compare with the impl report's numbers.

## 3. Run rules

- Exit codes: write one script file per gate with the Write tool in your private scratch dir (it `cd`s into the plugin repo, redirects output to a unique log, then `echo rc=$? > <unique rc file>`), run with `devbox run -c /home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/draw-steel-elements -- bash <script>`. `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's summary line.
- One gate per Bash call. Never a compound `cd X && …` in the Bash call. Never pipe a gate through `tail`.
- `rm -f main.js styles.css` (exact paths, plugin root) before `npx jest`.
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r1-review-<your agentId>/`. Unique names. Write tool, not heredocs. Never glob `rm`; delete only exact paths you created. Never `rm -rf` anything under `.superpowers/`.
- Own `DSE_LIFECYCLE_PORT` (e.g. 9299). Never `pkill`/`killall` by pattern; kill only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree or scratch dir. Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or any shared glob.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND; never background a gate and wait for a notification (it never comes). Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches.
- `git -C <absolute path>` for every git command. No tags, releases, pushes.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/sc482-r1-review-report.md`. Open with a ≤10-line executive summary: verdict (LAND-READY / FIX-REQUIRED), counts by severity, gate numbers. Body: findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) each with file:line, failure scenario and prescribed fix; then probes run and their results. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS, verdict, findings one line each, reviewed sha, gate numbers, `git status --short` at the end, plus the filesystem path of every artifact. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-482:`.
