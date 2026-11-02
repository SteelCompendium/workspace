# SC-540 r6 scoped check — plugin f7c9c7ce on eafe76e1 (harness-only commit f7c9c7ce)

## Executive summary
- VERDICT: **LAND**. 0 HIGH, 0 MEDIUM, 1 LOW (optional, does not block), 1 INFO.
- Range-diff `423e798d..31b6235b` vs `eafe76e1..f7c9c7ce`: all 7 reviewed commits are `=`. The one new commit, `f7c9c7ce`, adds 4 lines (2 comment, 2 code) to `visual-harness/obsidian-lifecycle.mjs` G-S62 phase (d) and nothing else.
- The RangeError is Obsidian's, not ours. The stack is entirely `app.js` (`o.field` <- `WE.saveHistory` <- `WE.beforeUnload` <- `at.onUnloadFile` <- `at.loadFile` <- `at.onClose` <- `Tt.detach`). Reproduced with **DSE disabled**: open `Lifecycle/other.md` in a new tab (`getLeaf('tab').openFile`, not awaited), then detach it at once. That gave the RangeError in 4/4 tries at 0 ms, with the plugin enabled and with it disabled, and 0/4 at every delay from 10 to 800 ms in both. `src/` never replaces or reconfigures the editor state (grep).
- The wait does not mask a DSE defect. It only lets Obsidian's own new tab finish loading before the next phase detaches it, and the (d) assertions afterwards are unchanged. It cannot hang: the wait is bounded at 8 s and its timeout is pushed as a problem, so a failure is loud.
- G-S62 alone on HEAD (`main.js` `730f051cd1c0`, identical to the tree's build), port 9547: 3/3 ok (100 s, 100 s, 102 s; 1-min load 4.7, 2.4, 6.5). No page error; (d): new tab `["Lifecycle/other.md"]`, this tab `Lifecycle/callout-link.md`.
- Trees unchanged: plugin clean, superproject ` M draw-steel-elements` (as found). No commits. No `rm` used this round; scratch left in place.

## 1. Range-diff
`5f63a247 … 3d1b31f6` = `b96299d0 … 31b6235b` (7 x `=`), plus `-: > 8: f7c9c7ce`. origin/develop is `eafe76e1` (fetched).

## 2. The 4-line diff (`visual-harness/obsidian-lifecycle.mjs` ~4596-4599, phase (d), after the Ctrl-click's new-tab wait)
```js
await t.waitFor(`app.workspace.getLeavesOfType('markdown').filter((l) => l !== ${G}.main).every((l) => l.view.file?.path === 'Lifecycle/other.md')`, '(d) the new tab shows its note', 8000).catch((e) => problems.push(e.message));
await t.sleep(1500);
```
- **Masking?** No. The unwanted page error comes from detaching a tab whose `loadFile` has not finished. That is Obsidian's internal race, and it reproduces with the plugin off (§3). Phase (d)'s behavioural checks run after the wait exactly as before: a new tab holds `Lifecycle/other.md` and this tab is not navigated. Every other phase keeps the scenario-wide `errorsSince` / `noticesSince` checks. The wait is also stricter, not looser: a Ctrl-click that opened the wrong note now fails at the wait instead of slipping through.
- **Hang?** No. It uses `t.waitFor` with an 8000 ms limit, and the `.catch` pushes a problem so the scenario FAILs. If no new tab opened, the filter is empty and `every` is true; the preceding wait has already pushed "(d) a Ctrl-click on the link opens a new tab" in that case.
- **Misjudge (LOW-1, optional).** The filter is `l !== main`, not "leaves this scenario added". G-S62 deliberately keeps the markdown leaves that existed when it started (`G.keep`). If an earlier scenario in the part ever leaves another markdown leaf open on a different note, the wait cannot be satisfied: (d) waits 8 s and FAILs falsely. It is not a hang and not a mask. Today it does not happen: part 3 was 10/10 after the commit (r5) and G-S62 alone 3/3 (mine). The existing `other` / `includes` check after it has the same scope, but it only needs some new tab to hold the note, so it cannot misjudge this way. Prescribed fix: filter on `!${G}.keep.has(l)` instead of `l !== ${G}.main`. That is a one-word change and can be folded at any later touch.
- **The 1.5 s sleep.** The dse-verify authoring rule forbids a timed delay used to *win a race against Obsidian* inside a step. Here the sleep follows a state-based wait (note shown) and only gives the tab's load time to settle before teardown; the race is avoided, not won by timing. My probe found the race window at 0 ms and gone from 10 ms. A state-only wait (for example, until the leaf's view is a loaded `MarkdownView` with an editor) would be cleaner, but the sleep's margin is large. INFO only.

## 3. Race probe (scratch harness copy + `r6probe.mjs.txt`, scenario `R6RACE`, port 9547)
| plugin | 0 ms | 10 | 30 | 60 | 100 | 200 | 400 | 800 ms |
|---|---|---|---|---|---|---|---|---|
| enabled | 4/4 | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 |
| disabled (`app.plugins.disablePlugin`) | 4/4 | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 |

Each cell counts tries that logged `RangeError: Field is not present in this state`. No other error appeared. Under load the window widens, which matches r5's 2 of 6 runs.

## 4. G-S62 alone, HEAD (3 blocking foreground calls, `DSE_LIFECYCLE_BUNDLE` = the f7c9c7ce build)
| run | result | secs | load |
|---|---|---|---|
| 1 | ok | 100 | 4.71 |
| 2 | ok | 100 | 2.41 |
| 3 | ok | 102 | 6.47 |

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r6-check-report.md`
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r6-evidence/` (`gs62-run1..3.log`, `race.log`, `r6race.txt`, `r6probe.mjs.txt`, `bundles-summary.log`)
- Scratch (left in place): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r6-check-r1/`
