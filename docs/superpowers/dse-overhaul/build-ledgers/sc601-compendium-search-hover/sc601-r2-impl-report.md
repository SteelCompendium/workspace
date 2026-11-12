# SC-601 r2: implementation report

## Executive summary

- DONE. dse branch `sc601-compendium-search-hover` HEAD `ea849f11` (3 commits on the r1 probe `0da7e1d3`: `ddee8074` fix, `0e1154f2` jest, `ea849f11` lifecycle); `origin/develop` was still `5f7c5336` when fetched, no rebase. Superproject branch `sc601-compendium-search-hover` `7199f0e6` (CHANGELOG bullet only; the ` M draw-steel-elements` pointer is left unbumped for the dispatcher).
- Fix: the SC-595 document click guard is factored into `src/framework/kit/hoverPreviewGuard.ts` (DseModal unchanged in behaviour) and installed by `CompendiumSearchModal` when its target editor is inside a `.hover-popover`, both commands; choose-time Notice + no write if the captured editor is disconnected (reference, Shift inline link and block choice); `activeEditor` never used.
- Gates (expected -> measured): tsc clean / lint clean (rc 0 / 0); jest 7685 + 27 = **7712 passed / 2 skipped / 0 failed** (+25 mine, +2 the kit-index `test.each` over the new kit file); lifecycle **59/59** in six parts (21 / 16 / 9 / 4 / 7 / 2); e2e **278/282 ok, 0 failed, 4 known-bug, coverage 171/171 pairs** (unchanged); shots **592**, host-leak **163/978**, modal host-leak **39/234**, capture clip **147**; freeze **280/280**; parity **0 / 0 / 24**.
- G-S97: 8 real-input trials. **Red on the `5f7c5336` bundle** (6 of 8 trials red, 15 broken expectations, the 2 controls green; 71 s), **green on the branch** (8/8, 55 s with build).
- Part 6 (`G-S92 G-S97`): **154 s** with build and start-up (budget 300 s). Other parts: 185 / 325 / 404 / 302 / 401 s.
- Jest: new `test/dom/authoring/compendiumSearchHoverPreview.test.ts` (25 tests); 14 mutants, 14 killed (log `sc601-r2-mutants-summary.txt`).
- e2e: no pair covers the compendium search (no control ids, in no manifest); coverage count does not move.
- Drive-by fixes: none. SKILL proposal written: `sc601-skill-proposal.md`.

## 1. Design

### Anchor source (typed vs runtime, and why)

`compendiumInsert.ts` `editorTarget(editor, ctx)` (new, exported) resolves `{ anchor, isOpen }` from `editorCallback`'s second argument:

- `ctx.containerEl`: typed on `MarkdownView` (every pane), but at runtime only on the other `MarkdownFileInfo`, the page-preview embed (r1 measured it inside `.hover-popover`). Read through a structural cast.
- Fallback: `editor.cm.dom` (the CodeMirror 6 view; undeclared in `obsidian.d.ts`, which gives an `Editor` no DOM at all).
- `isOpen()` is true iff every element found is connected; with neither (a test double) the editor counts as open. `editorCallback` is now `(editor, ctx: unknown)`, which type-checks against `(editor, ctx: MarkdownView | MarkdownFileInfo)`.
- I used this rather than `ctx.hoverPopover` (typed on `HoverParent`) because that field is the popover of links hovered INSIDE the embed, not the one the embed lives in. Public API is used where there is any; there is no typed way from an `Editor` to its DOM.

### Helper

- `src/framework/kit/hoverPreviewGuard.ts` `guardHoverPreviewClicks(containerEl, owner: Component)`: a document click listener, bubble phase, `composedPath().includes(containerEl)` then `stopPropagation()`, never `preventDefault`; the removal is registered on `owner` and runs one task later (`win.setTimeout(…, 0)`). The full design comment moved here from `managedModal.ts`.
- `managedModal.ts:211-212` (call at `:212`) `keepHoverPreviewAlive` now calls it with `this.lifecycle`; its doc comment points to the helper. Register order is unchanged (guard first), the rest of the method is untouched.
- `CompendiumSearchModal.ts` new option `anchor?: HTMLElement | null`; `onOpen` (`:112`) installs the guard with `this.prefsOwner` when `this.opts.anchor?.closest('.hover-popover')`. No keymap re-push and no `focusHoverPreviewNow`: r1's measurement holds (the search is opened by a command or key with the preview already focused; `T3` never fires; G-S97 green without them).

### Choose-time backstop

`compendiumInsert.ts`: `CLOSED_EDITOR_NOTICE = 'The note you were editing was closed, so nothing was inserted.'` (the "in the preview" wording was dropped because a closed pane gets it too), `refuseClosedEditor(isOpen)` (Notice + false), and a 4th optional parameter `isOpen = () => true` on `dispatchReferenceChoice` and `dispatchBlockChoice`. Ctrl / Cmd (copy code) returns before the check (it never touches the editor). The two commands pass `target.isOpen` and `anchor: target.anchor`. `app.workspace.activeEditor` is not read anywhere.

Residual: the check is at choose time. The block command awaits `entity.model()` after it, so a preview closed inside that few-ms window would still write into the dead buffer.

## 2. Jest

`test/dom/authoring/compendiumSearchHoverPreview.test.ts`, 25 tests (14 are the 7-test block run for each command). Stand-in: a `window` BUBBLE click listener that removes the popover element unless the click is default-prevented or inside it (the closer r1 found); both commands are driven through their real `editorCallback` with `{ containerEl }`; the modal is captured by spying `CompendiumSearchModal.prototype.onOpen` and calling through; the backdrop is a `.modal-bg` whose click calls `close()` at target phase.

Per command: input / box / results-area press keep the preview (3); backdrop press closes the search, the preview stays and the closing click is stopped; control outside a preview (no guard); control with no context (no guard); anchor from `editor.cm.dom`. Shared: a click outside the search still reaches the window; the click is stopped, not default-prevented; a document listener still sees it; a suggestion press still inserts, in the hovered editor, with the preview kept and no Notice; the guard is removed one task after close and not before (asserted on the guard function itself); reference choice into a closed editor (Notice, nothing written, a host editor on `activeEditor` also untouched); block choice (same, with `await`); block control (lands, no Notice); Shift refused and Ctrl copies with no editor write; `dispatchBlockChoice` alone; the connection test through `editor.cm.dom`.

Existing `managedModal.test.ts` (SC-595 / SC-598) and `compendiumSearchModal.test.ts` run unchanged and green with the refactor (the three files: 195 passed).

### Mutants (runner `sc601-r2-mutate.py.txt`, per-mutant logs `mut-M*.log`, summary `sc601-r2-mutants-summary.txt`; each run over the new file + `compendiumSearchModal.test.ts` + `managedModal.test.ts`)

| # | Mutant | Result (failed / 195) | Killed by |
|---|---|---|---|
| M1 | guard install removed (`if (false)`) | KILLED 11 | 11 SC-601 |
| M2 | `preventDefault` instead of `stopPropagation` | KILLED 16 | 10 SC-601 + 6 SC-595 |
| M3 | guard removed synchronously at close | KILLED 5 | 3 SC-601 (both commands' backdrop test + guard-gone test) + 2 SC-595 |
| M4 | connected check dropped (`isOpen` always true) | KILLED 3 | 3 SC-601 |
| M5 | re-target `activeEditor` when the editor is gone (both commands, no check) | KILLED 3 | 3 SC-601 |
| M6 | commands do not pass the anchor | KILLED 11 | 11 SC-601 |
| M7 | guard installed unconditionally (no `.hover-popover` test) | KILLED 4 | 4 SC-601 |
| M8 | guard stops every click (no `composedPath` test) | KILLED 19 | 6 SC-601 + 13 SC-595 |
| M9 | Ctrl copy gated by the connected check too | KILLED 1 | 1 SC-601 |
| M10 | block choice check dropped | KILLED 2 | 2 SC-601 |
| M11 | reference choice check dropped | KILLED 3 | 3 SC-601 |
| M12 | connection test ignores `editor.cm.dom` | KILLED 3 | 3 SC-601 |
| M13 | refusal without the Notice | KILLED 5 | 5 SC-601 |
| M14 | `DseModal` no longer calls the shared helper | KILLED 6 | 6 SC-595 (proves the refactor is covered) |

All requested mutants are killed: remove the guard install (M1), `preventDefault` (M2), synchronous removal (M3), drop the connected check (M4, M10, M11), re-target `activeEditor` (M5). Sources were restored after each run (`git status` clean after the run, the log's last lines).

## 3. Lifecycle G-S97 (the probe replaced; `visual-harness/obsidian-lifecycle.mjs`)

Header comment (line ~192) no longer says PROBE and states 59 scenarios, part 6, eight trials. SCENARIOS order: G-S92, G-S97, G-S56 (last). Fixtures: two compendium statblocks built from the jest goblin fixture (renamed), so the snapshot command can resolve them. Per trial outcome (branch run, `lc-a1.log`): every hover trial ends with the preview `shown` and `editing` after the press and after the pick.

| # | Trial | Branch | Base `5f7c5336` |
|---|---|---|---|
| 1 | cmd, press input, press suggestion | ok; lands in hovered note, not host | RED: press closed the preview, pick did not land, preview gone |
| 2 | cmd, press box, ArrowDown + Enter | ok | RED (same three) |
| 3 | cmd, press backdrop | ok (search closed, preview kept) | RED (press closed the preview) |
| 4 | command palette opener, press input, press suggestion | ok | RED (same three) |
| 5 | snapshot command, press input, press suggestion | ok (`ds-` fence lands) | RED (same three + no `ds-` fence) |
| 6 | cmd, press a suggestion | ok | ok (control) |
| 7 | pane, press input, press suggestion | ok | ok (control) |
| 8 | preview hidden by script behind the open search, then keys | ok; one Notice `The note you were editing was closed, so nothing was inserted.`, nothing on disk, search still open | RED (no Notice; the write went into the dead editor) |

Red-on-base recipe: `git archive 5f7c5336 | tar -x -C <scratch>/base-5f7c5336`, symlinked `node_modules`, `node esbuild.config.mjs production` (verified the bundle lacks the Notice text), `DSE_LIFECYCLE_BUNDLE=<that> node visual-harness/obsidian-lifecycle.mjs --only=G-S97` from the worktree: `15 broken expectations`, exit 1. The kept FAIL temp dir `/tmp/dse-obsidian-lifecycle-b9qj0W` (printed by the run) was deleted by its literal path.

Lifecycle parts on the branch (union 59/59, each `0 failed`): `G-S7a … G-S9a` 21 / 185 s; `G-S9b … G-S40` 16 / 325 s; `G-S45 … G-S64` 9 / 404 s; `G-S57 G-S62 G-S61 G-S56` 4 / 302 s; `G-S59 … G-S91` 7 / 401 s; `G-S92 G-S97` 2 / **154 s**. Times include `build-no-check` and start-up; loadavg 0.5-2.5, with one other effort's lifecycle running at times.

## 4. e2e coverage

`grep -ril compendium e2e` is empty; the search carries no `data-dse-control` ids and is in no manifest, so there is no pair to add and the count stays `171/171`. No bracketed ticket id in any test title.

## 5. Evidence (absolute paths)

Scratch `S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r2-adc7b64beb5b40fd5`:

- tsc/lint `S/tsc-final.log`, `S/lint-final.log`; full jest `S/jest-full.log`; targeted jest `S/jest-t1.log` .. `jest-t3.log`
- mutants `S/mut-M1.log` .. `S/mut-M14.log`, `S/mutants-summary.txt`, `S/mutate.py`, `S/mutate-run.log`; copies in the sdd dir below
- lifecycle: G-S97 on the branch `S/lc-a1.log`; G-S97 on the base `S/lc-base.log`; parts `S/lc-p1.log` .. `S/lc-p6.log`
- e2e `S/e2e.log`; shots `S/shots.log`; freeze `S/freeze.log`; parity `S/parity.log`
- base bundle `S/base-5f7c5336/` (+ `S/basebuild.log`); gate scripts `S/g-*.sh`

sdd dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/`: this report, `sc601-skill-proposal.md`, `sc601-r2-mutants-summary.txt`, `sc601-r2-mutate.py.txt`.

## Drive-by fixes:

None.

## Follow-ups:

- The choose-time check is at choose time only (see Design residual); `insertFullBlock` could re-check right before `replaceSelection` if the owner wants the last few ms closed. Not done: out of the stated scope.
- A closed PANE editor now also gets the Notice (the check is not preview-specific); intended, noted for the review.
- Host-wide closures (Quick switcher, Command palette, Insert template) still close an editing preview; owner dropped these in the r1 rulings.
- `queueMicrotask`-style removal of the guard is invisible to jsdom (same limit as SC-595's R4); G-S97 trial 3 (backdrop press, preview kept) is what catches it in real Obsidian.
