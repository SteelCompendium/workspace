# SC-299 round 4 — implementer brief: harness-gate hardening + one comment (no plugin behaviour change)

`orchestration:implementer`. **Never call Linear.** Final text → ticket-owner, raw facts.

## 1. Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-decisions.md`
  (entry "Re-review 2 DONE" = acceptance criteria). Reports: `sc299-round3-report.md`,
  `sc299-rereview2-report.md` (§ NEW findings — read those sections in full).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements`, branch
  `sc299-montage`, head `b2e40d1` on `origin/develop` `5a5ed49`; superproject `f229603` on
  `origin/main` `8685b65`. **Verify `pwd`; never touch `/home/scott/code/steelCompendium/workspace/`.**
  `git fetch origin` first; if `origin/develop` moved past 5a5ed49, rebase and say so.
- Only files you may touch: `visual-harness/shoot.mjs` (the `assertMontageCoarseContainment`
  gate, ~line 660-740 and its call site ~4918) and the one CSS comment in `styles-source.css`
  (~3862). NO change to any CSS declaration, TS, test behaviour, docs, or fixtures. Out of scope:
  SC-326 (board clipping) — do not touch `overflow`, `--dse-mt-colmin`, or the breakpoint.

## 2. Findings to fix (reviewer's text, verbatim)
> NEW MED-1 — shoot.mjs:672 + :725-733. elementFromPoint is viewport-relative and returns null below the viewport; the gate never scrolls the cell in and never distinguishes `hit === null` from `hitCell !== cell`, so both print as WRONG-WRITE. That is exactly the misleading `hit null[aria-label="null"] (round null)` line the --dse-mt-colmin-only variant produced — right verdict, wrong diagnosis … Measured in the gate's own context at 560px: shipped (2-row trio) puts Talin's probe at y=953 in a 1000px viewport — 47px of margin; at 5.2em (3-row trio) it is y=1172, off-screen, hit=NULL. A sixth hero in fixture-mid or ~50px more chrome above the board turns `npm run shots` red on a healthy tree. Fix: viewport height 2400 (the gate captures no PNG, so no frozen byte can move) AND classify null hits separately (`if (!hit) { offscreen.push(...); continue; }` with its own loud "PROBE POINT OFF-SCREEN — not a wrong-write" line); re-verify with the colmin-only injection.

> NEW LOW-1 — styles-source.css:3862 claims part 2 makes the trio "stay on ONE row at ordinary round counts; wrapping ... not the everyday look" … Measured: the trio wraps to TWO rows in every coarse configuration including 3 rounds at a full 900px pane. … 5.2em -> 3 rows, cell 183px; shipped 9.2em -> 2 rows, cell 134.2px; 10.4em -> 1 row … Owner ruling: (a) correct the comment.

> INFO (i) the gate's containment invariant measures the max-width-capped CONTAINER, so it can only fire when max-width is also absent; the flex ITEMS are what can paint outside … cheap hardening while touching the gate for MED-1 is to measure the union of the .dse-mt__quick boxes. (ii) shoot.mjs:681 navigates without sheet=1 unlike every screen capture; … harmless, worth one line in the gate's doc.

Owner rulings: MED-1 fold exactly as prescribed (viewport 2400; null hit → its own
`PROBE POINT OFF-SCREEN — not a wrong-write` counter that still FAILS the gate, loudly and
separately). LOW-1 option (a): rewrite the comment to the measured truth (two rows under coarse
at 9.2em; 5.2em would be three; one row needs ≥10.4em which is deliberately NOT chosen — SC-326).
INFO (i): measure the union of `.dse-mt__quick` boxes against the cell box in addition to the
container. INFO (ii): one doc line in the gate explaining why it omits `sheet=1` (numbers identical).

## 3. Proof, then gates
1. Can-fail re-proof, in the ledger dir as `sc299-r4-canfail.log`: with the gate patched, (a)
   remove `--dse-mt-colmin` only → gate must exit non-zero with CONTAINMENT lines and NO
   `hit null` WRONG-WRITE lines (an off-screen probe, if any, must print as OFF-SCREEN); (b)
   remove all three fix declarations → exit non-zero with CONTAINMENT + WRONG-WRITE lines; (c)
   restore, `git diff --stat` must show only your intended files. Rebuild the harness bundle
   between injections as the reviewer did (see `sc299-rereview2-report.md` § can-fail).
2. Full battery per dse-verify, logs `…/sc299-montage/sc299-r4-<gate>.log`, gate LAST in
   `bash -c`, foreground: tsc, lint, `rm -f main.js styles.css && npx jest`, shots (read the
   new OK line — update its text if you changed what it measures), freeze (`freeze OK
   (260/260 …)` — nothing here can move a frozen byte; if it does, STOP), parity LAST
   (0/0/16).
3. Commit in dse (`test(harness): SC-299 round 4 — …` / `style(montage): SC-299 round 4 —
   comment …`), then the superproject pointer bump `chore: bump draw-steel-elements submodule
   pointer (SC-299 r4)`. No trailers, no push, no tags.

## 4. Report
`…/sc299-montage/sc299-round4-report.md`, ≤10-line executive summary: verdict, dse/ws heads,
the gate lines verbatim, the can-fail results (a)(b)(c). Return raw facts + paths.

## 5. Footguns
Report write blocked → inline. Never key a wait-loop on a scratch filename/contents. Long output
→ files; gates in the FOREGROUND; never background one and wait. You cannot SendMessage the
owner (`to:'main'` = dispatcher); need input → end with `STATUS: NEEDS_CONTEXT`; if you message
anyway, FIRST WORD `SC-299:`. Devbox eats `$?`; `| tail` masks failures. Never `rm -rf` under
`.superpowers/`; never edit `freeze-baseline.sha256`. Logs in the ledger dir, never the worktree.
