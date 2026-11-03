# SC-545 r5: scoped re-review of r4 (dse c0ce04cf on 0698550f, superproject 586c82ef)

## Executive summary
- **Verdict: NOT LAND-READY.** There is one MEDIUM and it is test-only: the relaxed G-S63 (b) no longer checks the ruled rule that a normal off/on must never rebuild the note, for embeds. My mutant K rebuilds every Live Preview host note that embeds a DSE card, on every off/on. It passes all 30 replug jest tests and G-S63 (b). Fixing it is about 15 lines (MEDIUM-1). Everything else in the delta is right: MEDIUM-1 and LOW-1..4 from r3 are fixed and verified in real Obsidian.
- Findings: HIGH 0, MEDIUM 1, LOW 2, INFO 3.
- Measured on c0ce04cf:
  - tsc, `tsc -p e2e` and lint: rc 0.
  - jest: 6408 passed / 1 skipped / 254 of 255 suites.
  - lifecycle part 3: 8/8, 308 s, G-S63 (a)-(h) all ok.
  - lifecycle part 4: 3/4 on the first run, because G-S61 (e) failed on 4 stale frames in a row (the limit is 3). Re-runs: 3/3 green on HEAD, and the 0698550f base shows the same 2-frame margin (INFO-1, not SC-545).
  - G-S6e, G-S59 and G-S61: 3/3 ok.
- G-S63 is red on a 0698550f bundle (sha 2ca03084…): FAIL (a)-(f) and (h), (g) passes, 128 s. It is green on HEAD 4 times out of 4. Phase (b) needed 0 rebuilds in all 4 green runs.
- Delta probes on HEAD, all pass:
  - P16a (the r3 MEDIUM-1 repro): the card off the page at the toggle is redrawn on scroll-back, owned, + writes [7]. The old root is gone.
  - P18: the detach threshold is unchanged (CodeMirror drops the callout between scrollTop 1000 and 1250).
  - P19: a scroll back, away and back mounts exactly once, and the same root stays.
  - P20: off-page twin callouts each get their own card; clicks write [6,6], [7,6], [7,7].
  - P21: a scroll-back while the plugin is off mounts nothing and the mark stays; enable then draws the card once.
  - P7g, and P7h (one throwing stash among three): the other two cards are drawn, the bad one goes to the fallback, there is no unhandled rejection, and the error is logged.
- Embed explanation: **not confirmed.** In 0 of 18 toggles did the embed go raw on its own: 4 G-S63 runs, 4 toggles with no write first, 3 right after a + write, 2 twelve seconds after a write, one 9 s off-window starting 1 s after the write, one resize while off, and 3 more F-case toggles where I made the embed raw by hand. Also, the embed's preview renderer is not subscribed to `post-processor-change`: firing that event by hand does not redraw a raw embed. So "Obsidian re-renders the embed at the toggle on about two runs in three" is not what this machine shows, and the trigger r4 saw is unidentified.
- **Embed-redraw feasibility: possible only through private API, so I recommend a Backlog ticket.** A targeted `rerender(true)` on the embed's own preview renderer redraws the raw embed. The card is owned, + writes [6], the host note's undo history is kept, and nothing is rebuilt. But that renderer instance can only be reached through Obsidian internals (by hooking a private class's prototype, or a widget field). The public options do not work: `workspace.trigger('post-processor-change')` and `vault.trigger('modify')` leave it raw, and `metadataCache.trigger('changed')` empties the embed (0 cards, 0 raw). Keep the fallback for embeds.

## Findings

### MEDIUM-1: G-S63 (b) with "at most one rebuild" leaves the normal path for embeds ungated
- Where: `visual-harness/obsidian-lifecycle.mjs:4402` (`expectReplugged('(b) counter in an LP embed', o, { allowRebuild: true })`) and `:4403` (`> 1` check). No other phase has an embed. In jest, the only test that an owned card does not trigger the fallback is for a callout: `test/dom/framework/replugRemount.test.ts:376`.
- Failure scenario: mutant K, in `sc545-r5-mutants.py.txt`. It inserts `if (w.classList.contains('internal-embed') && w.querySelector('[data-dse-element]')) return true;` at the top of the loop in `hasUndrawnBlocks`. Every host note with a DSE card in an LP embed is then rebuilt on every off/on, so its undo history is lost.
  - jest: 30/30 pass (`sc545-r5-mut-jest.log`).
  - G-S63: ok, with (b) reporting "rebuilds 1" (`sc545-r5-gs63-mutK.log`).
  - The ruling "Normal off/on must never trigger B (asserted)" is therefore no longer asserted for embeds. The reason for relaxing it (2 runs in 3) did not reproduce here (0/18).
- Prescribed fix, both parts:
  - (a) G-S63 (b): sample the embed while the plugin is off (the 800 ms dwell in `offOn`, e.g. a `beforeEnable` hook or a 15 ms sampler). Allow the one rebuild only if a raw `pre > code.language-ds-counter` was seen inside the embed during the off window. If the embed kept its card (every run I measured), require `rebuilds === 0`. Report which branch ran.
  - (b) jest: add the embed twin of `:376`. An owned DSE card inside `.markdown-source-view .internal-embed` must not call `setViewData`; an unowned one must. Mutant K must fail it.

### LOW-1: the architecture row and the proposal state the embed frequency as fact, and the architecture row says the rule is still asserted
- `.repo-docs/architecture.md:123` (the `host/replugRemount.ts` row) says "an embed that Obsidian itself re-renders while the plugin is off … (measured on about two toggles in three)", and also "a normal off/on must never reach it (asserted)". The proposal's G-S63 sentence, `sc545-dse-verify-proposal.md:23`, says "Obsidian re-renders the embed at the toggle on about two runs in three". On this machine the rate is 0/18, and the trigger is not `post-processor-change`.
- Fix: write "on some toggles (seen at SC-545 r4; trigger not identified; the embed's renderer does not listen to `post-processor-change`)". Once MEDIUM-1 (a) lands, "asserted" holds again.

### LOW-2: `dispose()` re-marks only connected in-flight elements
- `src/framework/host/replugRemount.ts:198` has `if (el.isConnected) writeStash(el, stash)`. Failure case: a card that CodeMirror detaches (the user scrolls more than a screen) in the roughly 10-25 ms between `replaceChildren` and the end of `mount`, while the plugin is also being disabled. Its element is then left unmarked: it holds the half-finished card of a dead instance, and the next enable cannot find it. That needs three things at once, so it is near-impossible in practice; it is noted only because r4 removed the `isConnected` requirement on the stash side.
- Fix (optional): drop `el.isConnected` at `:198`, which matches the stash side; `remountWithin` already skips a detached element.

### INFO
- INFO-1: G-S61 (e) failed once in my part-4 run (`sc545-r5-gate-lifecycle-part4.log`): 4 stale frames in a row against a limit of 3, disk correct ([5,6,5]). Re-runs: HEAD ok 3 times (stale 1, 2 and 2 frames: `sc545-r5-gate-gs6e-gs59-gs61.log`, `sc545-r5-gs61-green-rep1/2.log`). Base 0698550f was ok with stale 2 (`sc545-r5-gs61-base0698-rep1.log`). That is the same 1-2 frame margin with or without SC-545, and SC-545 adds only one `querySelector` per update when nothing is marked. So it is a pre-existing load flake in SC-544's recorder (loadavg was 5-13). Worth a Backlog note against G-S61 (e); not an SC-545 blocker.
- INFO-2 (feasibility detail, `sc545-r5-probe-f1.json` and `-f2.json`, run on bundle `nofb`, i.e. the probe build with the fallback switched off): F0 is the control. The raw embed was made by hand while the plugin was off and stays raw after enable, which reproduces r4's end state. F1 `workspace.trigger('post-processor-change')`: still raw. F2 `renderer.rerender(true)` on the embed's own preview renderer (instance captured by hooking the renderer prototype's `queueRender`): card drawn, owned, + writes [6], host rebuilds 0, host undo kept (Q reverted), embedded source unchanged. F3 `vault.trigger('modify', file)`: still raw. F4 `metadataCache.trigger('changed', …)`: the embed emptied (raw 0, cards 0). F2 is the only one that works, and it depends on Obsidian internals (`MarkdownPreviewView.rerender` is public, but the embed's instance is not reachable through public API). A fake `modify` or `changed` event would also reach every other plugin. Recommendation: Backlog ticket "redraw a raw LP embed without rebuilding the host note (needs a public handle on the embed's preview renderer)"; keep the fallback.
- INFO-3: what I checked and found no problem with. The rebase interplay is fine: G-S6e and G-S59 are ok, G-S63 (e) scroll 2519 -> 2519 and 522 -> 522 with SC-472's backstop, and SC-544's quick twin clicks after off/on in r3 P13 were not re-run (no change in that path). The reattach path cannot double-mount: the mark is cleared synchronously before `mount`; the SC-537 `reconcile` runs after `remountReattached` in the same update and sees only already-registered views; P19 and P20 show 1 mount per card. Nothing runs after dispose: the `disposed` check is at `:209`, mutant L fails jest, and P21 measured it in real Obsidian. LOW-4 (comment) and LOW-2 (jest dispose case) from r3 are fixed. The CHANGELOG wording (`586c82ef`) is accurate: off-page redraw, whole-note redraw clears undo, the one-time update limit, and "Not covered: cards on a canvas and in hover previews".

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/`)
- Gates: `sc545-r5-gate-tsc-lint.log`, `sc545-r5-gate-jest.log`, `sc545-r5-gate-lifecycle-part3.log`, `sc545-r5-gate-lifecycle-part4.log`, `sc545-r5-gate-gs6e-gs59-gs61.log`
- G-S63: `sc545-r5-gs63-base0698.log` (red), `sc545-r5-gs63-green-rep{1,2,3}.log`, `sc545-r5-gs63-mutK.log`
- G-S61 flake check: `sc545-r5-gs61-green-rep{1,2}.log`, `sc545-r5-gs61-base0698-rep1.log`
- Mutants: `sc545-r5-mut-jest.log`, `sc545-r5-mutants.py.txt`
- Probes:
  - `sc545-r5-probe-d1.{json,log}`: the delta probes P1, P7g, P7h, P12, P16a, P18, P19, P20, P21.
  - `sc545-r5-probe-e1.{json,log}`, `-f2.json` (E4, E5) and `-f3.json` (E6): the embed explanation.
  - `sc545-r5-probe-f1.{json,log}` and `-f2.json` (F4): feasibility.
  - Probe scenario source: `sc545-r5-probe-scenario.mjs.txt`.
- Scratch (bundles `bundle-{base0698,green,probe,nofb,mutK,mutL}`, sources, harness copies): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r5-review-x7m2/`
- Tree: plugin `git status --porcelain` is empty, and the superproject shows ` M draw-steel-elements`, both as found. I removed only my own kept dirs, `/tmp/dse-obsidian-lifecycle-cYcDO2` and `-Eq9v8o`.
