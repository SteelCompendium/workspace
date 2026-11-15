# SC-656 r2 — independent adversarial review: negotiation focus kept across an outside redraw

You are an independent reviewer for ticket SC-656. You did not write this code. Your final text goes to the
ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger (rulings, verbatim; read instead of any thread):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/decisions.md`
- Implementer report (read its executive summary first; the body where you need it):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/sc656-r1-impl-report.md`
- Prior art for the traps already found in `src/framework/chrome/windowHandoff.ts`:
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc650-montage-outside-edit-window-ledger.md`
  (owner rulings on r2/r4/r6/r8: two blocks in one note, slow redraw 700 ms, LP callout sibling rebuild, sidebar) and
  `sc608-outside-edit-tracker-window-ledger.md`; `sc642-*` and `sc639-*` (negotiation focusRules / controlFocus,
  self-disabling buttons).
- Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~490 KB, read in parts:
  "The battery, in order", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code footgun", "Current
  expected numbers").
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus`, plugin dir
  `.../draw-steel-elements`. Range to review: `42c26272..79a6b241` (dse branch `sc656-negotiation-outside-edit-focus`).
  Do not commit to the branch. For probes that need a modified build, use your own scratch worktree
  (`git -C <plugin dir> worktree add <your scratch dir>/dse-<x> <sha>`) with `node_modules` symlinked or `npm ci`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
  Scott's live vault — expected; ignore it.

## 2. The task

Execute and probe, do not just read. Rulings to check against (verbatim from the ledger, "Owner rulings").

Probe at least, in REAL Obsidian (e2e driver or a scratch spec / lifecycle-style probe), Reading view AND Live Preview:
1. Focus on Complete Argument, a chip, a tab, a text field; outside edit (`vault.process`, and a disk write via the
   watcher) → focus on the same control after the redraw? Note keeps the outside edit?
2. Focus outside the card (elsewhere in the note, in another pane, in a popout) → never pulled in.
3. Own writes (Complete Argument, Reset, chip press, Spent) → SC-642/SC-639 focus targets unchanged; no double move;
   no hand-off fires on an own write, including at a slow redraw (delay the redraw ~700 ms as SC-650 r4 did).
4. Two negotiation blocks in one note; outside edit that deletes the one above / changes both / inserts one above.
5. Outside edit that removes or disables the focused control (e.g. the argument was completed outside).
6. User moves focus during the gap before the redraw lands.
7. Sync-like burst (two outside edits ~100 ms apart).
8. Pinned sidebar, if negotiation can be pinned (measure; SidebarPanel.ts is SC-662's, in flight, so a sidebar-host
   change is a follow-up, not a fix here). Popout window.
9. Plugin disable while a hand-off is pending (no leak, no throw).
10. Does it leak listeners or records (many redraws; unload)? Did initiative/montage behaviour change (jest
    `initiative-outside-edit*`, montage OW*, e2e INIT-W*, MONT-OW* green)?

11. The own-write skip is a 3000 ms window since the last `persist()` (NegotiationView). Probe an OUTSIDE edit
    0.5 / 1.5 / 2.9 s after the user's own action (chip press then outside edit) in RV and LP: is focus lost? If so,
    prescribe a non-timer own-write test (SC-650 used content snapshots; the implementer suggests the registry's
    write tickets / SC-602 claim tickets) and say which is sound.
12. Complete Argument: after an outside redraw the chosen tier (view-only `ArgumentView.selectedId`) resets, so the
    button is disabled and focus lands on the first Motivation chip. The owner leans toward carrying the chosen tier
    across an outside redraw when the argument it belongs to is unchanged (and dropping it when the outside edit
    changed that argument). Measure feasibility and risk: where the state lives, what "unchanged" should compare,
    what goes wrong if a Sync completed the argument elsewhere. Prescribe the guard.

Vacuity: confirm the new jsdom and e2e tests are red on base `42c26272`; run mutants of your own (at least 4, on the
new trigger and the guards) and report which survive.

Re-run the full battery at `79a6b241` (or as much as the implementer's numbers need confirming — at minimum tsc, lint,
jest, full e2e, and all SEVEN lifecycle parts; shots/freeze/parity if any CSS/DOM output changed).

## 3. Gates and expected numbers

Base `42c26272`: jest 13448 passed / 1 skipped with the shots cache (13447 / 2 fresh) · lifecycle 64/64 in SEVEN
`--only=` parts (with the equals sign; a space runs the whole suite): 1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9) 4. `G-S57,G-S62,G-S61,G-S56` (4)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7) 6. `G-S92,G-S96,G-S97,G-S99` (4) 7. `G-S108,G-S112,G-S115` (3)
(+G-S147 if the implementer added it; take parts 1/2 id lists from dse-verify). One part per Bash call; part 7 takes
~200 s (over the 180 s auto-background limit): log to a unique file + rc file and POLL it. · e2e
`622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` on base (+N new) · shots 592, host-leak 163/978, modal
host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24 (LAST).
Expected at head: the implementer's numbers in its report.

Known flakes: G-S61 (part 4) is red on clean base 42c26272 on this host (SC-668) — re-run part 4 once, then compare
against base before counting it. A G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) suspected flake
(SC-633): re-run part 7 once on a loaded host. INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05 (suspected)
e2e flake under load; a re-run passes. SC-622: `git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json`
if G-S97 fails. Jest timeout 30 s: an "Exceeded timeout" is a real hang until proven otherwise.

## 4. Footguns

- Devbox: `devbox run -c <abs plugin dir> -- bash <script-file>`; never `cd` inside a compound command; record exit
  codes inside the script file; read each gate's summary line.
- Private scratch folder:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r2-<your agent id>/`,
  uniquely named scripts and logs; Write tool for scratch files.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, no `rm` with a variable target** —
  it hangs on a permission prompt. Leave throwaway files in place. Never glob-delete `/tmp/dse-*`.
- Never `pkill`/`killall` by pattern; kill only a PID whose `readlink /proc/<pid>/cwd` is inside your worktree/scratch.
- `git -C <abs path>` for every git command. Never push anything.
- Long output to files, not streamed. Never key a wait-loop on a scratch filename from another run.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever send a
  message anyway, its FIRST WORD must be `SC-656:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/sc656-r2-review-report.md`
— opens with a ≤10-line executive summary (verdict LAND / FIX / BLOCK, counts by severity). Findings by severity
(CRIT/HIGH/MED/LOW/INFO) with file:line, failure scenario, measured evidence, prescribed fix. Then the probe table,
vacuity/mutant table, battery summary lines, out-of-scope findings separately, and the path of every log.

## 6. Return contract

Final text: raw facts only — STATUS, verdict, severity counts, head sha reviewed, measured gate numbers, and the
absolute path of the report and every evidence log.
