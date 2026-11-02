# SC-540 r4 scoped re-review — plugin 31b6235b on 423e798d, superproject d4e68447 on baab5315

## Executive summary
- VERDICT: **LAND**. 0 HIGH, 0 MEDIUM, 0 LOW, 3 INFO. r2 HIGH-1, LOW-1 and LOW-2 are closed.
- Range-diff `eaf64ba6..992375b6` vs `423e798d..31b6235b`: the 4 r1 commits are `=` (identical). The new commits are `a78a4837` (jest), `fb71e8ac` (fix + comments) and `31b6235b` (G-S62 (g)(h)(i)). The fix is my prescribed code, byte for byte: HEAD `main.js` `bfe2f8427147`, the same as my r2 fixprobe.
- HIGH-1 closed in real Obsidian 1.15.0 LP. Advance round in a callout: card, selection 0-0, written. Add project roll in a callout: card, 0-0, written. Advance round in an LP embed: the embed is not selected, 0-0, scroll 530 -> 530. A button fuzz over all 19 element kinds in a callout found 0 bad clicks out of about 62 on HEAD; the r1 bundle had 13 bad out of 52 (5 kinds), so the gap was wider than r2 reported and r3 closes all of it.
- Blast radius of the climb: it only runs for a marked root (LP widget) whose target has left the root. A target moved into the live document, a DocumentFragment or another window reaches a non-element top and marks nothing. A replaced root marks nothing. Fuzz: 0 live stray `.interactive-child` elements. One theoretical edge (INFO-1).
- Red/green: G-S62 on `8f672965` FAILs (g) (0-0 -> 316-151) and (h) (0-0 -> 243-212). The "mark every `.callout`" mutant FAILs (i) only (`[true,false]`). HEAD is ok (98 s). Jest: 2 red on the `8f672965` source with the new tests, 53/53 at HEAD, 2 red on the mutant.
- Gates at HEAD (mine): lifecycle part 3 `done: 10/10 ok, 0 failed` in 451 s (G-S52, G-S57, G-S62 ok); e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` with the pointer parked. All other gate numbers are the implementer's, taken on trust per the brief.
- origin/develop is now `eafe76e1` (SC-511). Not rebased, per the owner. Trees unchanged: plugin clean, superproject ` M draw-steel-elements` as found.

## 1. Range-diff and the new commits
- `e04a1d8c = b96299d0`, `c11f7d11 = 40223c54`, `98b4b65e = 1b6868a5`, `992375b6 = 8f672965`.
- `src/framework/pipeline.ts:222-228` (`fb71e8ac`): a bubble `click` listener. It returns unless the root is marked and `event.target` is outside the root, then climbs `parentNode` to the top and adds the class only if that top is an element (`nodeType === 1`). It neither stops nor cancels the click. The comment block at `:199-201` (Mod+A, LOW-1 wording) and `:212-216` (the rebuild case with the measured numbers) is accurate. `livePreviewScrollHold.ts:125-126` gains a pointer clause; it is comment only.
- `test/dom/framework/pipeline.test.ts:723-764`: callout and embed rebuild pins (the walk from the detached target must stop on `.interactive-child`), plus a Reading-view guard (a rebuilt card marks nothing).
- `visual-harness/obsidian-lifecycle.mjs` G-S62 (g) Advance round in a callout (expectDrawn: raw, roots, selection, scroll), (h) the same in an LP embed (selection, scroll, card), and (i) Reading view + (no card or ancestor carries the class). The fixtures follow the harness convention and are reset in `finally`.
- Superproject `d4e68447`: the CHANGELOG bullet gains one sentence on buttons that redraw the card and on the embedded tracker.

## 2. HIGH-1 in real Obsidian (port 9547, scratch harness copy + `r4probe2.mjs.txt`)
| case (HEAD 31b6235b) | result |
|---|---|
| Advance round, initiative in callout | card, sel 0-0, st 316 -> 316, written; walk from the detached target hits `DIV.dse-init.interactive-child` |
| Add project roll, project in callout | card, sel 0-0, st 374 -> 374, written; walk hits `DIV.dse-prj.interactive-child` |
| Advance round, initiative in LP embed | embed not selected, sel 0-0, st 530 -> 530, written |
| Advance round, plain fence (control) | sel 0-0; nothing marked (root not in a widget) |
| guards: + in callout / callout text / link plain / link Ctrl / checkbox / Reading view / pencil Enter | [6,5] card 0-0 / RAW 197-316 / navigates / new tab / toggles, card / written, roots unmarked / form opens, card 0-0 |

Button fuzz: every visible, hit-testable, enabled non-chrome button in the example card of each element kind, inside a callout, real click, up to 8 per kind. "Bad" means a raw callout line, the card gone, or a moved selection.
- HEAD: 0 bad. Kinds and clicks: characteristics 0, conditions 3, counter 2, encounter 2, featureblock 0, feature 0, hero 8, initiative 7, montage 7, negotiation 8, party 8, project 3, resource 2, roll 2, skills 5, stamina-bar 0, statblock 1, surges 2, tokens 2. 0 live stray marks after any click.
- r1 bundle `8f672965` (9 kinds): 13 bad.
  - conditions: Roll save, Remove condition x3
  - hero: Roll save x2, Remove condition
  - initiative: Advance round
  - montage: Test tiers, End round 1
  - project: Add project roll, Roll a project test, Log respite

  Negotiation, roll, skills and party had 0 bad.

## 3. Blast radius of the climb (probe `blast-*` on HEAD: a test click handler re-parents the clicked + during the click)
| how the target leaves the root | climb top | marked | note |
|---|---|---|---|
| moved into a live `div` in `document.body` | `document` (9) | nothing (`liveHostMarked false`, html/body unmarked) | the callout is then selected, because Obsidian's walk ends outside the root (synthetic case; no DSE code does this) |
| moved into a DocumentFragment | fragment (11) | nothing | same |
| moved into a detached `div`, attached to `body` a tick later | that `div` (1) | **the div, now live** | INFO-1 |
| the whole root replaced (target still inside the detached root) | — (`root.contains` true) | nothing new | walk reaches the marked root; no selection |
| another window or popout | that window's `document` (9) | nothing | by the same nodeType rule (reasoned, not run) |

The listener is attached to every root but returns at its first line unless the root is marked. Only LP-embed and LP-callout roots get marked, so Reading view, plain fences, the sidebar and modals never reach the climb (jest guard plus G-S62 (i)). The only consumers of a stray class are Obsidian's: the LP widget click walk, Mod+A in an input (measured r2: same behaviour either way) and the canvas click-to-edit skip. DSE's own CSS and code never read the class beyond these two listeners (grep of `src/`).

## INFO
1. A detached subtree that DSE later re-attaches would keep `interactive-child` on a live element (measured in `blast-later`). No DSE path does this today: the fuzz found 0 live stray marks, and r1/r3 measured that rebuilds throw the old DOM away. The effect would be bounded to the consumers listed in §3. No action, unless a future kit starts recycling button DOM.
2. Not covered by design (no instance found): a rebuild done by a click listener on the root that is registered after `armClickShield`, on an ancestor of the root, or asynchronously within Obsidian's 10-150 ms window. In each case the target is still inside the root when this listener runs. `src/` has no click listeners on a root or a host container (grep), and the fuzz found no failing button. Worth one sentence in the comment if a future reviewer needs it.
3. HIGH-1's real scope (from the fuzz above) also included conditions' Roll save / Remove condition, hero's Roll save / Remove condition, montage's Test tiers / End round, and project's Roll a project test / Log respite. All are fixed. The CHANGELOG's "buttons that redraw the whole card" already covers them, so no change is needed.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r4-rereview-report.md`
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r4-evidence/`:
  - `probe-summaries.txt`, raw `r540-*-summary.jsonl`
  - `gs62-{prev,mutreading,head}.log`, `jest-{prev,head,mutreading}.log`, `gate-lc3.log`, `gate-e2e.log`, `bundles-summary.log`
  - probe sources `r4probe2.mjs.txt`, `r4mkharness.cjs`, `r4run.sh`, `r4fz.py`; the r2 base probe is `sc540-r2-evidence/r2probe.mjs.txt`
- Scratch (bundles head/prev/mutreading, per-case PNGs): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r4-review-r1/`
