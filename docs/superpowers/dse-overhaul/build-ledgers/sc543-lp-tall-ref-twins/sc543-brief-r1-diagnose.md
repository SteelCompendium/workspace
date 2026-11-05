# SC-543 r1 brief — diagnose, in real Obsidian, why two identical tall reference blocks draw one card in Live Preview

You are an independent diagnosis worker (orchestration:reviewer) for ticket SC-543. Your final
text goes to the ticket-owner, not a human.

## 0. Context loading (do this first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc543-lp-tall-ref-twins/decisions.md`
  (read it; it is the current state). Write every file you produce into that same dir, every
  filename prefixed `sc543-r1-`. The dir `.superpowers/sdd/` is shared by every concurrent
  effort: never delete anything there but files you created; never `rm -rf` `.superpowers/`.
- **Workers never call the tracker** (Linear) — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc543-lp-tall-ref-twins`, plugin at
  `…/sc543-lp-tall-ref-twins/draw-steel-elements`, branch `sc543-lp-tall-ref-twins`, which must
  be at `fb24f8a2` (dse `develop`). Verify with
  `git -C /home/scott/code/steelCompendium/worktrees/sc543-lp-tall-ref-twins/draw-steel-elements log --oneline -1`.
  Verify `pwd`/target paths before any write. **This round commits nothing** and leaves the
  worktree clean (`git status --porcelain` empty in the plugin and superproject, before and after).
  Prototypes go in a scratch copy (`git archive` export into your private scratch folder), never
  in the worktree.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared global state: never
  edit or run gates there. Its dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — not yours
  to report or touch.
- Prior evidence (read the summary parts only):
  - SC-536 r3 review, INFO-4 (lines ~109-112) and §3 row "R3-LP twins":
    `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc536-ref-cycle-guard/sc536-r3-review-report.md`
  - Its probe tooling, which you may reuse/adapt (copy into your scratch folder, do not edit in
    place): same dir, `sc536-r3-obsidian-{kit,scenarios}.js.txt`, `sc536-r3-obsidian-run.sh.txt`,
    `sc536-r3-build-bundles.sh.txt`, `sc536-r1-obsidian-{kit,scenarios}.js.txt`; logs with
    `R3-LP-JSON` lines: `sc536-r3-obsidian-head-run4.log`, `sc536-r3-obsidian-base-run2.log`;
    screenshots `sc536-r3-shot-lp-twins-outer-{head,base}.png`.
  - SC-537 r1 diagnosis (identical CALLOUT twins in Live Preview — Obsidian hands the next
    identical callout the OLD widget object of the written one, app.js 1.15.0 @2653395
    `R1(H,kt=>kt.text===Ae)`): executive summary of
    `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r1-diag-report.md`.
    That may or may not be the same mechanism here — no write is involved in SC-543.

## 1. The problem (from the ticket)
In Live Preview, a note with two identical fenced blocks that each reference a tall note
(`@Outer.md`, whose card itself nests an `@Ref.md` card) shows only ONE drawn block (one
`.cm-embed-block` widget), even after scrolling to the end of the note, although 4 reference
lookups ran. Two identical blocks referencing a short note (`@Ref.md`, `@Cyc.md`) draw 2 each.
Same on dse `458abe3` (pre-SC-536), so not caused by SC-536.

## 2. Task — answer these, with measurements, in real Obsidian 1.15.0 on fb24f8a2
1. **Reproduce** in Live Preview. Report what the user actually SEES at the second block's
   position: nothing / a gap / the raw fence source / a collapsed line / the card moved there.
   Screenshot both block positions (scroll so each is on screen).
2. **Where is the second block?** Measure at settle and after scrolling to the end and back:
   - count of `.cm-embed-block` elements and of DSE roots in the editor DOM; whether the one
     widget sits at the first or the second block's document position;
   - the CM6 decorations/widgets Obsidian built for both fences (positions, widget objects —
     are the two decorations the SAME widget object? same `dom`?), `view.viewport`,
     `viewportLineBlocks`/heights for both fence ranges (does CM think the second block is
     there with height 0, or a different height?);
   - which DSE views mounted, into which elements, and whether any DSE code (view adoption /
     twin reuse / remount, `ReadingModeBlockHost.ts`, `remountReused.ts`) moved a DOM subtree
     from one widget into the other. Lookup count per phase.
3. **Isolate the variable.** Each a separate case, same harness, Live Preview:
   - (a) twin `@Outer.md` blocks (the bug); (b) twin `@Ref.md` (expected fine);
   - (c) the two `@Outer.md` blocks made non-identical (e.g. a trailing space or a comment
     line in one) — does it draw 2?
   - (d) two identical TALL blocks that are NOT references (e.g. a long inline statblock or
     feature with a big body, of similar on-screen height to the Outer card) — is it about
     height, nesting, or references?
   - (e) twin `@Outer.md` blocks separated by enough plain text that the first is off-screen
     when the second is drawn; and (f) the cursor placed in/near each block vs parked at the top.
   - (g) **Plugin-free control:** the same shape with no DSE code involved — e.g. a tiny
     throwaway test plugin (in your scratch vault only) whose `registerMarkdownCodeBlockProcessor`
     draws a fixed-height tall `div` (try both: synchronous, and filled after an `await` like a
     reference lookup), two identical fences. If Obsidian alone draws one widget for two
     identical tall async-filled fences, that is an Obsidian-core behavior; say so plainly.
4. **Mechanism.** Name it with app.js 1.15.0 offsets (decompile as SC-537 r1 did) and DSE
   file:line where relevant. Separate "Obsidian does X" from "DSE does Y".
5. **Fixability.** Is it fixable from DSE without touching (i) the SC-537 area (the
   twin-reuse code / a new Live Preview editor update listener in
   `registerFrameworkElements.ts` / `test/dom/framework/twin-reuse.test.ts` / `remountReused.ts`)
   or (ii) `livePreviewScrollHold.ts` (SC-522)? Those two efforts are running; the owner must
   not change their areas until they land. If a fix is possible, prototype it in a scratch
   copy (not the worktree), measure it in real Obsidian on cases (a)–(f) plus the ones that
   should not change, and describe the smallest change with file:line. If it needs SC-537's
   listener, say exactly what from it. If it is unfixable from a plugin, say so and why, with
   the plugin-free control as proof.
6. **Gate proposal.** If fixable: a lifecycle scenario id **G-S58** placed BEFORE G-S56 (G-S56
   runs last and detaches other leaves; see its comment in `visual-harness/obsidian-lifecycle.mjs`)
   and/or jest cases. Show that the proposed check FAILs on fb24f8a2 (or say why it can't).

Keep this bounded: diagnosis + one prototype. Do not run the full battery this round.

## 3. Environment rules (each cost real time once — obey all)
- Devbox: tools are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc543-lp-tall-ref-twins/draw-steel-elements -- <cmd>` or
  `devbox run -c <abs dir> -- bash <script-file>`. Never `cd X && …` in a compound command.
  Devbox eats `$?`/`$PIPESTATUS` and piping a command (`| tail`) eats failures — run scripts
  from FILES and record exit codes inside the script; read each run's own summary line.
- Every git command is `git -C <absolute path> …`. Never `cd` then git.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc543-r1-<yourAgentId>/`
  (the session scratchpad is shared by every agent — never use a generic script name or
  write outside your own subfolder). Use the Write tool to create script files there.
- **No `rm` with a shell-variable target** (`rm -f $X/…` hangs on a permission prompt nobody
  answers). No glob `rm`. Delete only literal absolute paths you created and recorded, and
  never a shared `/tmp` glob like `/tmp/dse-obsidian-lifecycle-*` — other efforts' vaults live
  there.
- **Kill only by PID**, only a PID whose command line contains your own scratch/worktree path
  (`pgrep -af "sc543"`) or whose `readlink /proc/<pid>/cwd` is inside your paths. Never
  `pkill`/`killall` by pattern — concurrent efforts run the same commands.
- Real Obsidian: own Xvfb display in `:160–:239` that is free (check), never `:1`; pick a CDP
  port range that is free (check with `ss -ltn`), e.g. 9600–9620. Other efforts (SC-537,
  SC-522) run Obsidian concurrently right now.
- **No background jobs, no Monitor, no waiting on a completion notice.** Run each step as one
  blocking foreground call under 600 s, with long output redirected to a uniquely named log in
  your folder (the 600 s stream watchdog kills silent agents). If something must run in the
  background, poll its own log/rc file. Never key a wait-loop on a scratch filename or its
  contents that might pre-exist — the scratch dir is pre-populated across sessions; write to a
  per-run unique path.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me (the owner) — a message to `main` goes to the dispatcher, not me.
  If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If
  you ever do send a message anyway, its first word must be `SC-543:`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc543-lp-tall-ref-twins/sc543-r1-diag-report.md`,
opening with a **≤10-line executive summary**: reproduced (y/n), what the user sees, mechanism
in one sentence (Obsidian vs DSE), plugin-free control result, fixable (y/n/needs SC-537),
recommended fix + its measured result, proposed gate. Then the measurements, then file:line /
app.js offsets. Describe on-screen state in words, not by color.

## 5. Return contract
Final text: raw facts only — verdict, sha you tested, case table (case → widgets drawn /
lookups), mechanism, fixability, tree state (plugin + superproject `git status --porcelain`),
and the absolute path of every artifact you produced (report, screenshots, logs, scripts,
prototype diff). No prose padding.
