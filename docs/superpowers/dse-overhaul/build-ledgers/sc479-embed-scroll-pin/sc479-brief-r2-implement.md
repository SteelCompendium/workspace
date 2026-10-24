# SC-479 r2 brief — implement (implementer)

You are the r2 implementer for SC-479. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (current state, rulings verbatim): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/decisions.md` — read all of it, especially "Owner rulings on r1".
- r1 report: `.../sc479-embed-scroll-pin/sc479-r1-repro-report.md` (executive summary, "Prototype" section, "Risks"). r1 prototype: `.../sc479-r1-prototype.patch` (+335/-15: `src/framework/host/previewScrollPin.ts`, `src/framework/registerFrameworkElements.ts`, `test/dom/framework/previewScrollPin.test.ts`, `visual-harness/obsidian-lifecycle.mjs` G-S42). Control bundles r1 used are described in the report and in `sc479-r1-disc.sh`.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, command shapes, freeze/parity rules, the lifecycle authoring rule "never put a timed delay inside a lifecycle step ... hold back Obsidian's redraw at a hook instead").
- **Workers never call the tracker** (Linear) — not to read, not to post.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin`. dse submodule on branch `sc479-embed-scroll-pin`, currently at develop `c2758a2` with a clean tree. Superproject branch `sc479-embed-scroll-pin` at `aa57411`; it shows ` M draw-steel-elements` (the submodule pointer moved; expected, leave it unstaged).
Verify `pwd`-independent: use `git -C <absolute path>` for every git command; before any write, confirm the path is under `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/`. **Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.** The main checkout is shared state: write nothing there except your report files in the ledger dir. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

**Rebase first:** `git -C …/draw-steel-elements fetch origin develop` and rebase/fast-forward onto `origin/develop` (c2758a2 at dispatch; if it has moved, use the newer tip and report it). Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin fetch origin` and rebase onto `origin/main` (1b3a833 at dispatch) — stash/autostash the unstaged dse pointer; it must stay unstaged. If `package.json`'s obsidian version changed in the rebase, `npm ci` first.

Baselines at c2758a2 (dse-verify CURRENT, dispatcher): tsc (incl. `tsc -p e2e`) / lint clean; jest **6058 passed / 1 skipped / 245 of 246 suites** (fresh worktree without shots cache: one fewer passed / 2 skipped; compare after shots has run); lifecycle **37/37**; e2e **`123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**; shots **592, 0 FAIL**; freeze **280/280**; parity **0 GAPs / 0 undeclared / 24 DECLARED**.

## 2. The task

Implement the r1 prototype as ruled (quoted verbatim from the ledger):

> - **Design: r1's prototype** (host pins from the `modify` listener + writer pin reaches the outermost Reading scroller + `overflow-anchor: none` on host scrollers for the pin's life only; note's own pins unchanged; SC-470 child-combinator rule text and `PIN_TTL_MS` unchanged). The ticket's literal fix (pin alone) was measured not to hold — the anchoring stop is required, proven by ctl-noanchor.
> - **Nested-embed link resolution (resolved from A's path, wrong only for an ambiguous basename / relative link in the middle note) → FOLD:** resolve each embed's link from the path of the note that directly contains that embed (walk the embed chain) if it is cheap; if not, keep A's path and state the limitation in the header with the reason. Implementer's call, say which.
> - **Risk 2 (anchoring off on a host for up to 2.5 s) → ACCEPT, document in the header;**
> - **Docs:** `previewScrollPin.ts` header (embed mechanism + measurements + anchoring stop); CHANGELOG `## Unreleased` bullet in the worktree superproject; dse-verify SKILL.md text (lifecycle row 38/38 with G-S42, G-S42 entry with its two controls) supplied in the land-ready report for the dispatcher.

Steps:
1. Apply `sc479-r1-prototype.patch` (`git apply --3way`), review it as your own code (you own it now), and commit it as a coherent commit.
2. The nested-resolution fold, with jest coverage (a relative/ambiguous link in a middle note resolves against the middle note). Commit.
3. Header comment in `previewScrollPin.ts`: the embed mechanism (embed collapses inside one task; Chrome scroll anchoring with its anchor inside the embed drives the host to 0; a sizer pin alone does not hold; anchoring is off on the host only while the pin lasts), the measured numbers from r1, the Risk-2 note, and a pointer to SC-522 (Live Preview hosts not covered). Update any stale "Not covered (SC-479)" line. Commit.
4. Jest: every new guard must have a test that fails when that guard is removed (mutation-check each one; list them in the report): host pin added for a view embedding B, none for a view that does not, `#heading`/`#^block` subpath stripped, nested embed reached, outermost scroller chosen by the writer pin, anchoring rule present only on host pins and removed on release / TTL / `releaseAll`, child combinator unchanged.
5. G-S42 (lifecycle id reserved for this ticket): keep r1's scenario; confirm it contains **no timed delay inside a step** (if it must act during a redraw, it holds Obsidian's redraw at a hook and releases it). Update the lifecycle header line count/comment as needed.
6. CHANGELOG `## Unreleased` bullet in the worktree superproject (user-facing, one sentence: a Reading-view note no longer jumps to the top when a tracker in a note it embeds changes). Commit in the superproject (the dse pointer stays unstaged).
7. Write the proposed dse-verify text (lifecycle row 38/38 + G-S42 entry naming the two controls: "host pins without the anchoring rule" and "host pin disabled") into your report — do NOT edit the workspace SKILL.md.

Out of scope: SC-522 (Live Preview hosts), SC-472 (`PIN_TTL_MS`). Do not touch either.

Commit after every coherent step so nothing sits uncommitted through a gate.

## 3. Gates (full battery, in dse-verify order) — expected numbers

tsc + lint clean · jest **6058 + your new tests passed / 1 skipped / 245 of 246 suites** (if your tests live in an existing suite; say how many you added) · lifecycle **38/38** · e2e **123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs** · shots **592, 0 FAIL** · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (last).
If built `main.js`/`styles.css` differ from base only by this change, shots/freeze/parity still run (the pin changes runtime CSS injection, not the static stylesheet — confirm `styles.css` is byte-identical to a base build and say so).
Discrimination on your final head, 2 runs each with `--only=G-S8,G-S15,G-S18,G-S42`: base bundle G-S42 FAIL; head ok; control "host pins without the anchoring rule" G-S42 FAIL; control "host pin disabled" G-S42 FAIL; G-S8/G-S15/G-S18 ok throughout. Build controls as temporary bundle variants run via `DSE_LIFECYCLE_BUNDLE` (never committed).

**Footguns — follow exactly:**
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command. `git -C <absolute path>` for every git command.
- Record exit codes inside a script file run through devbox (`rc=$?` written to a file by the script). `devbox run … bash -c '…; echo rc=$?'` always records 0. Read each gate's summary line, too.
- **One blocking foreground gate per Bash call** — lifecycle, e2e and shots each in separate calls to stay under the 10-minute tool timeout. No `run_in_background`, no `Monitor`, no background jobs. Redirect long output to a file (the 600 s stream watchdog kills silent agents).
- **No `rm` with a shell-variable target**, no glob `rm`. Never `rm -rf` a shared `/tmp` glob such as `/tmp/dse-obsidian-lifecycle-*`; delete only a literal path you created. Never `rm -rf` anything under `.superpowers/` except your own files.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains your worktree path or whose `readlink /proc/<pid>/cwd` is inside your worktree (the shots `node visual-harness/shoot.mjs` has no path in its command line).
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad` is shared. Use only `…/scratchpad/sc479-r2-<your agentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches match). Read the process's own output or a per-run unique path.
- Never touch the shared freeze baseline.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r2-implement-report.md`, opening with a **≤10-line executive summary** (dse head sha + base sha, superproject head + base, gate numbers, discrimination table, nested-resolution choice). Then: commits, mutation-check list, the proposed dse-verify text, follow-ups. Two kinds of extras: `Drive-by fixes:` (already made, obviously correct, local to a touched file, cannot move a baseline) and `Follow-ups:` (left alone). Copy deciding logs into the ledger dir with the `sc479-r2-` prefix. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts — verdict, shas, measured numbers, and the absolute path of every evidence artifact. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you with the answer. If you ever send a message anyway, its FIRST WORD must be `SC-479:`.
