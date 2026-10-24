# SC-479 r1 brief — reproduce + measure (reviewer). Commits nothing.

You are the r1 reproduce/measure worker for SC-479. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/decisions.md` (the spec is quoted there verbatim).
- Scroll-pin history (read the executive summaries; dive only where needed):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc470-scroll-pin-panes-ledger.md` and `.../sc470-scroll-pin-panes/sc470-r1-design-report.md` (Risks item 3 is the origin of this ticket).
  - `.../sc459-scroll-pin-gate-ledger.md` (why G-S8 needs adoption OFF to see the clamp: SC-340 view adoption keeps the writer's tracker DOM, so a write only collapses the sizer when a DSE block is drawn fresh).
  - `.../sc478-livepreview-scroll-ledger.md` (Live Preview mechanism; `livePreviewScrollHold.ts`).
- Reusable probes from SC-470 (CDP probes against the lifecycle harness): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r1-probe-block.mjs.txt`, `sc470-r1-probe-dom.mjs.txt`, `sc470-r1-build.sh`, `sc470-r1-build-variants.sh`, `sc470-r1-disc.sh`; SC-478's in `.../sc478-livepreview-scroll/`. Copy what you need into your private scratch folder; never edit them in place.
- Code: `draw-steel-elements/src/framework/host/previewScrollPin.ts` (writer pin + SC-470 `modify` listener pinning Reading views whose file is the modified file), `livePreviewScrollHold.ts`, `visual-harness/obsidian-lifecycle.mjs` (G-S8, G-S15, G-S18 show how scenarios drive real Obsidian).
- Gate/harness rules: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (lifecycle row and the G-S8/G-S15/G-S18 text, incl. the authoring rule: "never put a timed delay inside a lifecycle step to win a race against Obsidian ... hold back Obsidian's redraw at a hook instead").
- **Workers never call the tracker** (Linear) — not to read history, not to post.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin`, dse submodule on branch `sc479-embed-scroll-pin` at develop `7046eb0`. Verify with `git -C /home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements log --oneline -1` before starting; it must read `7046eb0`. **Leave the tree clean at 7046eb0** (you commit nothing; any temporary edits for variant bundles are reverted, or built from a scratch copy). The main checkout `/home/scott/code/steelCompendium/workspace` is shared state — never write there except your report files in the ledger dir. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. The task

Spec (verbatim): "a tracker in note B, embedded (`![[B]]`) in a tall note A open in Reading view. A write to B pins only Reading views whose file is B (SC-470's `modify` listener). The writer-side pin uses `closest('.markdown-preview-view')`, which inside an embed finds the embed's inner preview, not A's scroller. So A's scroller is never pinned, and if the embed's redraw collapses A's sizer, A's scrollTop would clamp." Fix direction (verbatim): "reproduce first; if it clamps, also pin the scrollers of open Reading views that embed the modified file."

**A. Reproduce in real Obsidian** (the lifecycle harness's Obsidian, Xvfb, CDP — 1.15.0 is what the harness picks; report the version actually run). Build vault notes: B = a tall tracker note (reuse the tall tracker shape G-S8/G-S15 use); A = a tall Reading-view note with enough text above and below `![[B]]` that A can be scrolled well past the embed and also parked with the embed in view. Measure A's scroller (`scrollTop`, sizer inline min-height, scrollHeight) per animation frame across the write. Cases, each at least 2 reps, **with view adoption ON (stock) and OFF** (SC-459 showed adoption hides the clamp for the writer's own write):
  1. A's own click inside the embedded tracker (the writer is the embed).
  2. B open in a second Reading pane; its click writes B (A is a bystander).
  3. An outside write to B (`vault.process`, and a write on disk through the file watcher).
  4. A parked BELOW the embed vs. parked so the embed is in view vs. ABOVE the embed (parking above should hold — it's a control).
  5. Also: does Obsidian redraw the embed at all on a B `modify` (embeds re-render via their own child component)? Record whether the embed's inner sizer / DSE root is replaced, and whether A's outer sizer min-height changes.
  Also record, as information only (out of scope for this ticket): the same embed in a **Live Preview** host note A — does `.cm-scroller` scrollTop clamp on a write to B?

**B. If NO case clamps A in Reading view** (scrollTop identical in every frame on stock and adoption-off across all cases): stop there, write the evidence (per-case frame logs, min/max scrollTop, version, adoption state, reps), and recommend closing as not reproducible. Include one deciding screenshot pair or a frame-trace summary the owner can post.

**C. If any case clamps:** explain the mechanism measured (which sizer collapses: A's outer sizer, or only the embed's inner one; does scrollTop clamp because A's scrollHeight shrinks), then prototype the fix as a patch at `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r1-prototype.patch` (apply in the worktree, measure, then revert so the tree is clean at 7046eb0). Candidate direction from the spec: in the `modify` listener (and the writer pin), also pin the scroller of every open Reading view whose rendered content contains an embed of the modified file (how you identify "embeds the modified file" — e.g. `.internal-embed[src]` resolved via `metadataCache.getFirstLinkpathDest`, or the embed's child component's file — is your call; say which and why, and cover nested embeds and `![[B#heading]]`). The writer pin's `closest('.markdown-preview-view')` inside an embed must reach the host scroller (the OUTERMOST pinnable Reading scroller). Keep SC-470's per-pin stylesheet rule with the child combinator `> .markdown-preview-sizer` (HIGH-1 of SC-470: a descendant selector stretched embeds — do not regress that). Do not change `PIN_TTL_MS` (SC-472 owns it).
  Then draft **lifecycle scenario G-S42** (as part of the patch): it must FAIL on stock 7046eb0 and pass with the prototype; plus one negative control (e.g. host pin disabled) that FAILs. **No timed delay inside a lifecycle step** — if you need to act during a redraw, hold Obsidian's redraw at a hook and release it (the G-S18 phase (d) pattern). Run each 3x stock / 3x proto / 3x control, and the full lifecycle once with the prototype applied (expect 37/37 with G-S42 added; 36/36 is today's baseline).
  Measure the cost of the extra pins (ms set/clear) like SC-470's `P470-COST` probe.

## 3. Gates

This is a measure round: no full battery required. If you apply the prototype: `tsc` + lint clean, targeted jest of anything you touched, `--only=G-S8,G-S15,G-S18,G-S42` 3x, and one full `npm run obsidian-lifecycle` (expect 37/37). Command shapes and devbox rules are in dse-verify.

**Footguns — follow exactly:**
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command; never `cd X && …`. Use `git -C <absolute path>` for every git command.
- Record exit codes from inside a script file run through devbox (writing `rc=$?` to a file inside the script). `devbox run … bash -c '…; echo rc=$?'` always records 0.
- **One blocking foreground gate per Bash call** (split lifecycle runs into separate calls to stay under the 10-minute tool timeout). No `run_in_background`, no `Monitor`, no background jobs. Redirect long output to a file, not the stream (the 600 s stream watchdog kills silent agents).
- **No `rm` with a shell-variable target** (`rm -f $X/…` hangs on a permission prompt nobody answers). No glob `rm`. Never `rm -rf` a shared `/tmp` glob such as `/tmp/dse-obsidian-lifecycle-*` — delete only a path you created and recorded, by its literal absolute path.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains your worktree path, or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad` is shared by every agent. Use ONLY a private subfolder `…/scratchpad/sc479-r1-<your agentId>/` with uniquely named scripts and logs inside. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Never `rm -rf` anything under `.superpowers/` other than files you created.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r1-repro-report.md`. **Open it with a ≤10-line executive summary**: verdict CLAMPS / DOES-NOT-CLAMP (Reading view), per-case result table (case × adoption on/off → scrollTop before→min, reps), Obsidian version, LP-host observation, and (if C) the prototype + G-S42 discrimination numbers. Copy deciding logs/screenshots into the ledger dir with the `sc479-r1-` prefix. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts — verdict, measured numbers, dse HEAD and porcelain at exit (must be `7046eb0`, clean), and the absolute path of every evidence artifact (report, patch, logs, screenshots). No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-479:`.
