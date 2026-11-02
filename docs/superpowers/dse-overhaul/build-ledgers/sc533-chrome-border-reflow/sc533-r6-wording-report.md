# SC-533 r6: wording-only round

- **dse branch HEAD `f81a277`** (on `9c8cad5`; `origin/develop` still `458abe3`, no rebase). Comments and spec only: `src/framework/chrome/mountChrome.ts` (+12 -5), `docs/superpowers/sc169-element-menu-panel-spec.md` (+8 -5). Not pushed.
- **Worktree superproject HEAD `33bc518c`** (was `2648822a`, amended; CHANGELOG.md only, +8; SKILL.md not re-added; dse pointer left unstaged).
- **Built `main.js` is byte-identical** to the one from `9c8cad5` (both from `git archive` exports, `node esbuild.config.mjs production`):
  `753da90db7f56d22b8f96b6cc71592f00e97c35cd7661d17472a901e3b502772` for both; `styles.css` `ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0` for both. So the r4 battery (lifecycle 43/43, e2e 124/124 and 87/87, shots 592 / 157/942 / 0 FAIL, freeze 280/280, parity 0/0/24) carries; not re-run.
- Gates re-run on `f81a277`: tsc (incl. `tsc -p e2e`) clean rc 0; lint (incl. `e2e/`) clean rc 0; jest `Tests: 1 skipped, 6208 passed, 6209 total`, `Test Suites: 1 skipped, 249 passed, 249 of 250 total`, rc 0.

## What changed in the wording
- `parkFrameBorders` comment on `rootMargin: '200px 0px'` (kept): says it only widens the window rectangle, the scroller's clip still applies, and the callback is a task that runs after that frame is painted, so a panel can show the 1 px fallback for a frame or two as it scrolls in (a collapsed block expanded by a click, for a few frames), visible only on a hovered panel or on mobile. The false "measures a little before the card scrolls into view" is gone.
- `FRAME_BORDER_VARS` comment block: "at most a 1px offset for one frame" now reads "for a panel that is in the document ... at most a 1px offset until the frame"; the parked path gets the same frame-or-two / few-frames caveat. Same change in the sc169 spec (~line 168-178). No other "one frame" claim remains in either file (the only other hits are "one framework-level implementation" and "the one frame" in the queue doc comment, which describes the batching).
- CHANGELOG line 17: "sat 1 px too low and 1 px too far left, on the card's top border".

## Artifacts
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/sc533-r6-wording-report.md`, `sc533-r6-gate-{tsc,lint,jest}.log`
- Scratch bundles: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r4-08f91447/bundles/{r6old,r6new}/`

Drive-by fixes: none. Follow-ups: none.
