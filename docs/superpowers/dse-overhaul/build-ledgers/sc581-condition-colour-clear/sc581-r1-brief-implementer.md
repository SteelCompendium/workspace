# SC-581 r1 — implementer brief: a "Default" option that clears a condition's colour

## 0. Context loading (do this first)

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/decisions.md`. It is the current state; it overrides anything else you read.
- **You never call the tracker (Linear)** — not to read, not to post. Everything you need is here and in the ledger.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc581-condition-colour-clear` (superproject), plugin at `.../sc581-condition-colour-clear/draw-steel-elements`, branch `sc581-condition-colour-clear` in both. Verify `pwd`/`git -C <abs> branch --show-current` before any write. **Every git command is `git -C <absolute path>`**, never `cd X; git …` (adapter footgun 10: a failed `cd` once ran git in the shared main checkout).
- Base: dse `develop` @ `1516f894` (your branch already sits there). Run `git -C <plugin> fetch origin` and confirm `origin/develop` is still `1516f894`; if it moved, rebase onto it and say so in your report (and `npm ci` if `package.json`'s obsidian version changed).
- **Never edit anything under `/home/scott/code/steelCompendium/workspace/`** except your report files in the ledger dir. The workspace-level files you may touch (`CHANGELOG.md`, `DESIGN.md`) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc581-condition-colour-clear/` (adapter footgun 3). The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.
- Read the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — it is ~400 KB; read "The battery, in order" (lines ~20-220), "Lifecycle and e2e notes", "Freeze semantics" only as needed, and the CURRENT line of "Current expected numbers" (~line 1480). Read `/home/scott/code/steelCompendium/workspace/DESIGN.md` for the look of the new control.

## 1. The task

Bug: in the Conditions window's row editor (cog), once a colour swatch is picked, nothing returns the condition to no colour. Icon has "Default", Duration "Until removed", Effect "static"; Color has none.

Scott's ruling (verbatim, ticket description 2026-11-10): "Any fix is fine (a "Default" swatch, or clicking the selected swatch to unset it); the SC-436 marker accepts either."

Owner ruling (ledger, 2026-11-13) — implement exactly this:
> Fix shape: an explicit **"Default" option, first in the Color group**, mirroring the Icon group's "Default" button ("Use default condition icon"). Pressing it deletes `color` from the condition (key removed, not written as empty). It is pressed (`aria-pressed=true`) when the condition has no valid colour. Re-pressing a selected preset swatch keeps its current behaviour (writes that colour again, stays pressed) — no toggle-to-unset.
> The Default option must be identifiable without hue (Scott is colorblind): visible text or a non-colour glyph, plus accessible name "Default" (the group already says "Color").

Code: `draw-steel-elements/src/views/ConditionsModal.ts` — `renderSwatches` (~l.468) and `setColor` (~l.500). The Icon group's Default button (~l.390-410) is the pattern to mirror. Requirements:

1. The Default button is a `<button type="button">` inside the `[role="group"][aria-label="Color"]` row, first, with `aria-label="Default"`, a tooltip (`title`) that says what it does (e.g. "Default (no colour)"), its own `stampControl` id (e.g. `cond.color-default` — check how stamps feed e2e coverage pairs and keep coverage at Y/Y), `setPressedState` true when the entry has no valid colour (consistent with SC-361: an unparseable YAML colour is "no colour" everywhere else, so Default is the pressed one then; check what the custom swatch and presets do in that case and keep exactly one option pressed).
2. Pressing it `delete`s `entry.color`, emits the change, re-renders, and focuses the Default button (via the existing `focusPickedOption(index, 'Color', 'Default')` path or equivalent). The row preview (glyph/badge colour in the list) must update to the uncoloured look.
3. Styling: a swatch-sized control that reads as "no colour" without hue — e.g. a neutral swatch with a diagonal slash, or a compact "Default" text chip matching the row height. Use existing tokens only (no colour literals; `test/dom/kit/kit-index.test.ts` and the token tests police this). Follow DESIGN.md and the Steel scoping rule in dse-verify. Check it in both light and dark and in the Steel theme.
4. Keyboard: it is reachable and operable like the swatches (Tab/arrow behaviour identical to the other swatches — check how the group handles keys and include the new button).
5. Do not change what re-pressing a selected preset does.

Tests:
- Jest: `test/dom/views/conditions-modal-matrix.test.ts` l.~870 holds `test.failing('SC-581: some control in the Color group removes a colour that was set', …)`. Make it a normal passing `test(...)` (it must fail without your fix — prove it by stashing the src change and running it). Update the row title at l.~211 `[current behaviour — SC-581 may change this]` so it states settled behaviour (no "may change"). Add targeted tests: Default pressed state for no colour / preset / custom / unparseable colour; clearing from a preset and from a custom colour removes the key (`'color' in emitted === false`); focus lands on Default; the row preview loses its colour; exactly one option pressed after each action.
- e2e (real Obsidian, `npm run e2e`): add a test to the Conditions-modal spec (find it under `e2e/` — SC-436's) that sets a colour, presses Default, and asserts the note's YAML no longer has `color` for that condition. **Never put a bracketed ticket id (e.g. `[SC-581]`) in any test title** — the runner reads bracketed ids as scenario ids. Scenario ids are global; if the spec uses `[CONDMOD-nn]`-style ids, take the next free one.
- No lifecycle scenario is needed (no write-lifecycle change). Do not add one.

Docs (part of done):
- If the plugin's user docs describe the Conditions window's Color group (grep `draw-steel-elements/docs` and README for "swatch"/"Color"/"colour"), add the Default option.
- Add a bullet under `## Unreleased` in YOUR worktree's `/home/scott/code/steelCompendium/worktrees/sc581-condition-colour-clear/CHANGELOG.md` (follow the style of the neighbouring dse bullets).
- DESIGN.md only if its component map lists the swatch row's members.

Commits: commit in `draw-steel-elements` on branch `sc581-condition-colour-clear` after each coherent step (code+jest, e2e, docs). In the superproject commit only `CHANGELOG.md` (and DESIGN.md if touched). **Do NOT commit a superproject pointer bump for draw-steel-elements** — the owner does one bump at the end.

## 2. Gates (dse-verify battery, in order) — expected numbers at dispatch

Baseline at `1516f894`: tsc + lint clean · jest **11692 passed / 2 skipped** without the shots cache (11693 / 1 with it) → yours = 11692 + your new tests, with the flipped marker counted as passing · lifecycle **61/61** · e2e **`OBSIDIAN-E2E done: 328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (known bugs SC-257, SC-355, SC-384) → yours = 328+k / 331+k, still 3 known-bug, coverage Y/Y (Y may rise by one if the new stamp adds a pair) · shots **592**, 0 FAIL, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.

Lifecycle runs in SIX `--only` parts (comma-separated ids), one part per Bash call, each output to its own log:
1. `G-S7a … G-S9a` (21) — take the exact id lists from dse-verify's battery row / CURRENT section;
2. `G-S9b … G-S40` (16);
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9);
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays last;
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7);
6. `G-S92,G-S96,G-S97,G-S99` (4).
Known noise, not your change: **G-S91 flakes** (SC-616 in flight) — if part 5 fails only on G-S91, re-run part 5 alone before believing it. **SC-622**: the Obsidian camera tool can leave `draw-steel-elements/demo-vault/.obsidian/appearance.json` dirty in your worktree, which makes G-S97 fail — `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` before blaming your change. Report the union, e.g. `61/61 (21+16+9+4+7+4)`.

Freeze: your CSS change may move frozen shots if the Conditions editor's Color row is in the frozen class. **You never touch the shared baseline** (`.superpowers/sdd/freeze-baseline.sha256`). If any frozen shot moves, ship `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/rebaseline.txt` (ready-to-apply hash lines) plus before/after crops of every moved shot, and list each moved shot in your report. Non-frozen shots changing is expected; list which.

## 3. Evidence

Produce a before/after crop of the Color row with the editor open, in the default theme (and Steel if cheap): (a) before = base `1516f894` with a colour set (no Default option); (b) after = your branch, colour set (preset pressed, Default not); (c) after pressing Default (Default pressed, row preview uncoloured). Use the visual-harness shot of the Conditions editor if one exists, else the real-Obsidian camera (`npm run obsidian-shots` / the camera tool named in dse-verify; restore `appearance.json` after, SC-622). Name colours in words in captions (Scott is colorblind). Put PNGs under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/evidence/` with `sc581-` prefixed names.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/sc581-r1-implementer-report.md`. It opens with a **≤10-line executive summary** (verdict, dse sha, superproject sha, each gate's measured line). Then: what changed (file:line), the proof the flipped marker fails without the fix, each gate's exact summary line, which shots moved (frozen or not), `Drive-by fixes:` (made — obviously correct, local, can't move a baseline) and `Follow-ups:` (left alone) lists. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict (DONE / BLOCKED / NEEDS_CONTEXT), shas, measured numbers — no prose, **plus the absolute path of every evidence artifact** (report, logs, PNGs, rebaseline.txt if any).

## 6. Footguns (each has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc581-condition-colour-clear/draw-steel-elements -- bash <script-file>`; never `cd` inside a compound command. Devbox's sh wrapper eats `$?` and pipes eat failures — record exit codes from a script FILE run through devbox, output redirected to a log, and read each gate's summary line. Never pipe a gate into `tail`.
- Scratch: use your own subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc581-r1-impl/` with uniquely named scripts/logs (the scratchpad is shared by every agent). Create files with the Write tool.
- **No `rm` with a variable or glob target** (held by the safety check; a background worker then hangs). **Never `rm -rf` a `/tmp` glob** — other efforts' lifecycle/e2e vaults match it. Delete only literal absolute paths you created. Never `rm -rf` anything under `.superpowers/`.
- **Never `pkill`/`killall` by pattern** — other efforts run the same gates concurrently. Kill only a PID whose `/proc/<pid>/cwd` is inside your worktree.
- Run each gate as one blocking foreground call (timeout 600000). The Bash tool moves calls over ~180 s to the background; when that happens, do NOT just wait for a notification — loop `timeout 175 tail --pid=<your node pid> -f /dev/null` (pick your pid by `/proc/<pid>/cwd`), then read the gate's OWN log. Never key a wait on a scratch filename or its contents from another run; write per-run unique log paths.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Stale `main.js`/`styles.css` in the plugin root can shadow sources for jest — see dse-verify "Stale main.js".
- Commit after every coherent step; nothing sits uncommitted through a gate.
- You cannot `SendMessage` me — `to: "main"` reaches the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I'll resume you. If you ever message anyway, the FIRST WORD must be `SC-581:`.
