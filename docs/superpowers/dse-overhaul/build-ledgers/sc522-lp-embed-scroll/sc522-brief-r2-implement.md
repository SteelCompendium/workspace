# SC-522 r2 brief — implement r1's prototype (implementer)

You are the r2 implementer for SC-522. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/decisions.md` — read all of it; the "Owner rulings on r1 (2026-10-30)" section is your task. The newest baseline entry (4deb8cf) supersedes older ones.
- r1 report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/sc522-r1-repro-report.md` (Executive summary, Mechanism, Prototype, G-S52 phases/discrimination, Risks). The patch: `.../sc522-r1-prototype.patch` (generated on 71437da; +479/-12; 7 files). r1's build/variant/disc scripts are in the same dir as `sc522-r1-*.sh` / `*.txt` — copy into your scratch folder; never edit them in place.
- Gate rules + CURRENT numbers: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll` (superproject branch `sc522-lp-embed-scroll` at `3eca7d3`; dse submodule branch `sc522-lp-embed-scroll` at `71437da`, clean). Verify `pwd`-independent with `git -C <abs path>` before any write. The main checkout `/home/scott/code/steelCompendium/workspace` is shared state — never write there except your report/evidence files in the ledger dir. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected — ignore it. **The workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.**

**Rebase first:**
1. dse: `git -C …/draw-steel-elements fetch origin`, then rebase the branch onto `origin/develop` = **`4deb8cf`** (or newer if it moved — report the sha). Since 71437da develop gained SC-518 (block edit form focus: `focusHandoff.ts`, `FormModal.ts`, `pipeline.ts`; lifecycle G-S50 with a tall-note scroll phase), SC-527 (shots harness only) and SC-531 (lifecycle trust-dialog start-up script + `e2e/driver/recorders.ts`). Run `npm ci` if `package.json`/lockfile changed (or `node_modules` is stale).
2. Apply `sc522-r1-prototype.patch` on the rebased branch (`git apply --3way`, or by hand). Expected contact: `src/framework/pipeline.ts` (SC-518) and `visual-harness/obsidian-lifecycle.mjs` (SC-518 G-S50, SC-531). **Keep their code whole; re-apply only SC-522's hunks** (G-S52 appended after the last scenario; the header line; fixtures).
3. Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll fetch origin` and rebase onto `origin/main` (= `49fc600` at dispatch, or newer). Leave the dse pointer change **unstaged** in the superproject (the dispatcher bumps it at landing).

## 2. The task

Implement the ledger's "Owner rulings on r1 (2026-10-30)" — quoted verbatim:

> - **Design: r1's prototype, both parts** (Part 1 embed-widget hold + Part 2 `interactive-child` click shield inside LP embeds only). `PIN_TTL_MS` unchanged.
> - **Part 2 behaviour change** (a click inside a DSE card in an LP embed no longer selects the embed: no cursor jump, no selected-embed outline) → **ACCEPT.** Stock's behaviour is a 1528 px jump on a tracker click; the mark is scoped to the DSE root inside an LP embed, so the rest of the embed still selects. Name it plainly in the header, the CHANGELOG bullet and the land-ready comment. […]
> - **Risk 1** (one post-paint sample of +109/-110 px before CM's next measure on a height change above the viewport; rAF sampler 0; settled 0; stock settled +69 with transients +178/-41..+69) → **ACCEPT.** […] Document in the header.
> - **Risk 5** […] `box-sizing: border-box` → DROP (handled in code; jest only if cheap, r2's call).
> - **Follow-up 5** (dse-verify text) → r2 re-derives it for the rebased head (lifecycle 42/42 = 41 at 4deb8cf + G-S52; halves) and supplies it in its report for the dispatcher.

Concretely:
- Commit the prototype as coherent commits on the dse branch (e.g. fix commit `fix(SC-522): …` for src + jest, `test(SC-522): G-S52 …` for the lifecycle scenario). Commit after every coherent step; nothing sits uncommitted through a gate.
- `livePreviewScrollHold.ts` header "EMBEDS: A LIVE PREVIEW HOST NOTE (SC-522)": both mechanisms with r1's measured numbers, Part 1 hold + release + TTL backstop, Part 2 click shield and its user-visible behaviour change (stated plainly), Risk 1 (one-frame CM measure lag; settled position is held), dependence on Obsidian internals (Risk 3), TTL-bounded floor (Risk 4). Keep `previewScrollPin.ts`'s "NOT COVERED" line accurate.
- `pipeline.ts` click shield: one short comment at `markInEditorEmbed` saying why (Obsidian's embed click handler `selectElement` + `scrollIntoView`, skipped for `.interactive-child`) and that Reading view / DSE LP code-block widgets are untouched. Make sure it composes correctly with SC-518's focus-handoff changes in the same file (read them; say in the report how they interact).
- CHANGELOG `## Unreleased` bullet in the worktree superproject, user-facing words: a Live Preview note that embeds a tracker note no longer jumps when that tracker changes or is clicked; a click on a tracker inside an embed no longer selects the embed.
- **Mutation-check the jest**: for each new/changed assertion group, break the source line it guards and show the test fails; restore. Report a count (killed / total). Show the new positive tests FAIL on stock (rebased develop) source.
- **Discrimination on the rebased head** (G-S52 with r1's controls, rebuilt from the rebased sources): head ok; base (4deb8cf) FAIL; ctl-nohold FAIL (a)-(d) only; ctl-norelease FAIL (a)-(d) only; ctl-noclick FAIL (e) only. 2 runs each. Plus `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S52` ok 2/2 on head (SC-518's G-S50 has a tall-note scroll phase — it must stay ok).
- Re-check once on the rebased head with r1's probe: geometry (a) `vault.process` (expect held 6800) and the own-click case (expect held 5420).

## 3. Gates (dse-verify battery, in order; expected numbers at 4deb8cf)

tsc (incl. `tsc -p e2e`) / lint (incl. `e2e/`) clean · jest **6153 passed / 1 skipped / 248 of 249** + your new tests (fresh worktree without a shots cache reads one fewer passed / 2 skipped until shots has run — compare after shots) · lifecycle **42/42** (= 41 + G-S52) run as **two `--only` halves** (each its own Bash call, report the union) · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592, 0 FAIL** with `button host-leak OK (157 … 942 …)` (34-record boundary) · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (last). `styles.css` should be byte-identical to a 4deb8cf base build (r1: styles unchanged) — check and report. Since SC-531, a lifecycle exit 2 at start-up is a real signal, not a known flake: report it with the log.

**Footguns — follow exactly:**
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command; never `cd X && …`. Use `git -C <absolute path>` for every git command.
- Record exit codes from inside a script file run through devbox (`rc=$?` written to a file inside the script). `devbox run … bash -c '…; echo rc=$?'` always records 0. Read each gate's own summary line.
- **One blocking foreground gate per Bash call** (each lifecycle half, e2e, shots each its own call; pass `timeout: 600000`). No `run_in_background`, no `Monitor`, no detached subshells or `&`/`nohup`, no background jobs. Redirect long output to a file, not the stream (the 600 s stream watchdog kills silent agents).
- **No `rm` with a shell-variable target** (hangs on a permission prompt nobody answers). No glob `rm`. Never `rm -rf` a shared `/tmp` glob such as `/tmp/dse-obsidian-lifecycle-*` — delete only a path you created and recorded, by literal absolute path. Prefer fresh uniquely named files over deleting.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains your worktree path, or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad` is shared by every agent. Use ONLY a private subfolder `…/scratchpad/sc522-r2-<your agentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Never `rm -rf` anything under `.superpowers/` other than files you created. Never touch `.superpowers/sdd/freeze-baseline.sha256`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/sc522-r2-implement-report.md`. **Open with a ≤10-line executive summary**: dse head sha + commits, develop sha it sits on, superproject sha + origin/main sha, rebase conflicts and how resolved, every gate number, discrimination table, mutation count, styles.css identity. Then: how the click shield composes with SC-518; `Drive-by fixes:` (already made — obviously correct, local to a touched file, can't move a baseline) and `Follow-ups:` (left alone — I rule on each); and a section **"Proposed dse-verify SKILL.md text"** (lifecycle row 42/42 with halves and a G-S52 entry with its three controls; new CURRENT line). Copy deciding logs into the ledger dir with the `sc522-r2-` prefix. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts — STATUS, shas, measured numbers, porcelain of dse and superproject at exit (dse clean; superproject only ` M draw-steel-elements`), and the absolute path of every evidence artifact. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-522:`.
