# SC-479 r3 brief — independent review (reviewer). Execute and probe, don't just read.

You are the r3 independent reviewer for SC-479. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/decisions.md` (all rulings, verbatim).
- r1 measurement report `sc479-r1-repro-report.md` (mechanism: the embed collapses inside one task; Chrome scroll anchoring with its anchor inside the embed drives the host Reading view to 0; a sizer pin alone does not hold). r1 probes you may reuse (copy into your private scratch, never edit in place): `sc479-r1-probe-{common,repro,dom,cost}.mjs.txt`, `sc479-r1-mkharness.cjs.txt`, `sc479-r1-run.sh`, `sc479-r1-disc.sh`.
- r2 implement report `sc479-r2-implement-report.md` (executive summary first).
- SC-470 history (child-combinator HIGH-1; floor/MutationObserver; popout sweep): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc470-scroll-pin-panes-ledger.md`.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **Workers never call the tracker** (Linear).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin` — dse branch `sc479-embed-scroll-pin` @ `84ba65a` on develop `253aa5f`; superproject branch @ `d53782a (on origin/main 104dd85)`. Review there; do not commit. Any temporary probe edits are reverted before you exit (tree clean at `84ba65a`). The main checkout is shared state — write only report files in the ledger dir. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — ignore it.

## 2. The task

Review `git -C …/draw-steel-elements diff 253aa5f..84ba65a` plus the superproject CHANGELOG commit. Probe live in real Obsidian (lifecycle harness):

1. Correctness of the design as ruled (quote): "host pins from the `modify` listener + writer pin reaches the outermost Reading scroller + `overflow-anchor: none` on host scrollers for the pin's life only; note's own pins unchanged; SC-470 child-combinator rule text and `PIN_TTL_MS` unchanged."
2. Re-run G-S42 discrimination yourself (base FAIL, head ok, both controls FAIL) and the r1 "end" geometry cases (`vault.process`, disk write, second pane, own click adoption off).
3. **Owner-flagged probes (from the ledger rulings):**
   (a) "Form Save from inside an embed (SC-509: form saves now redraw; not driven in r1) → r3 drives it live" — note develop 253aa5f also has SC-519 (the edit form picks up a pending card write); Reading view host on the "end" geometry, open the block edit form from the embedded tracker, Save, report scrollTop per frame.
   (b) Risk 2: "anchoring off on a host for up to 2.5 s ... r3 to probe one case where content above the viewport changes height during the pin" — report any visible shift of on-screen text.
   (c) The nested-embed resolution r2 chose — try a relative / ambiguous link in a middle note.
4. Integrity / regressions: embeds still keep their own height during a pin (SC-470 HIGH-1 must not regress); two embeds of the same B in one host; a host that embeds B AND is B's own view open elsewhere; a popout host closed while pinned (no leaked Map entry / style element / observer); pin release on TTL / `releaseAll` / plugin unload removes the anchoring rule; no pin on a view that embeds a DIFFERENT note; cost of the per-view embed scan on a vault write when many Reading views are open.
5. Jest: are the new tests mutation-sensitive (spot-check 3 guards by removing them)?
6. Lifecycle: G-S42 has no timed delay inside a step.

Full battery is the implementer's; re-run tsc/lint/jest, `--only=G-S8,G-S15,G-S18,G-S42` 2x, and one full lifecycle (expect 39/39: 38 on develop 253aa5f incl. SC-519 G-S45, plus G-S42). Re-run e2e only if you find a reason.

**Footguns — follow exactly:** `devbox run -c <dse abs path> -- bash <script file>`; never `cd` in a compound command; `git -C <abs path>` always. Exit codes from inside a script file. One blocking foreground gate per Bash call; no `run_in_background`, no `Monitor`, no background jobs; long output to a file. No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — literal paths you created only. Never `pkill`/`killall` by pattern; kill only by PID inside your worktree (`readlink /proc/<pid>/cwd`). Scratch: only `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r3-<your agentId>/`, uniquely named files, written with the Write tool. Never key a wait-loop on a scratch filename or its contents.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r3-review-report.md`, opening with a ≤10-line executive summary: verdict APPROVE / APPROVE_WITH_NITS / REQUEST_CHANGES, counts by severity. Findings by severity with file:line, failure scenario (measured numbers), prescribed fix. Copy deciding logs/screenshots into the ledger dir with the `sc479-r3-` prefix. If the report-file write is blocked, return the report inline.

## 4. Return contract

Final text: raw facts — verdict, finding list (severity, file:line, one line each), gate numbers, tree state at exit, and absolute paths of every artifact. No prose.

You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not to me. If you need input, end with STATUS: NEEDS_CONTEXT and the question; I will resume you. Any message you do send must start with `SC-479:`.

## Addendum (owner, after r2)
- 7. G-S42 contains parking `t.sleep` settle waits (r2: "no timed delay decides an outcome, because the recorder samples every frame from before the write; the remaining `t.sleep` calls are parking settle waits, like G-S15's"). Judge each against the dse-verify authoring rule; flag any sleep that decides an outcome or races Obsidian.
- r2 evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r2-evidence/` (`build-variants.sh`, `disc.sh` build the controls; `mutations.txt` lists the 18 mutations).
