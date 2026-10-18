# SC-411 r2b report — Obsidian-camera GIFs + docs wiring

**Executive summary**
1. Verdict DONE. dse `8bb21fa`: the whole branch (11 commits) REBASED onto origin/develop `0ecb90e` (SC-155, sdk 3.0.1; conflict only in package.json / package-lock.json, resolved by taking develop's and re-running `npm i -E -D gifenc@1.0.3 pngjs@7.0.0`; `npm ci` after). Superproject branch `sc411-docs-gifs` `b53caba` (PROJECT.md only; the `draw-steel-elements` pointer is uncommitted, for wt-finish/land-stack).
2. Gates on `8bb21fa`: tsc clean, lint clean, jest 4458 total / 4457 pass / 1 skipped (new base 4432: +26 = 2a's 20 + 6; upstream removed 1 featureblockConfig test), shots 568 / 0 FAIL, freeze 274/274, parity 0 / 0 / 24 exit 0.
3. All 7 GIFs `--check-stable` stable (4 browser re-verified, 3 Obsidian new). Full `npm run docs-shots` (159-182 s, 37 images) leaves `git status` clean twice: every PNG and all 7 GIFs byte-identical across fresh processes. `visual-harness/shots` untouched (568 files, none new); `dist/docs-errors` empty.
4. Sizes (all 2x, none needed the 1x fallback): stamina-bar 119,173 B, montage 639,852, conditions 713,169 (browser four unchanged: 576,214 / 883,710 / 39,815 / 383,635).
5. F1 diagnosed: REAL product behaviour (reproduced with real mouse clicks in real Obsidian) — not changed; repro under Follow-ups. initiative GIF left as is.
6. Found and fixed a real nondeterminism in the Obsidian GIFs (focus-visible ring on a modal's autofocused button depended on input history: a lone `--only` run differed from a full docs-shots run by 1,935 px). Fix: blur focused buttons before each capture.

## Commits
dse (`draw-steel-elements`), after the rebase onto `0ecb90e` (r2a's commits were re-written by it; old r2a final `4e609ba` = `5925e0a` now):
| sha | subject |
|---|---|
| c10b81e | build: plugin devbox adds nodejs@24 |
| 05d1bbd | feat: gif-encode.mjs (gifenc 1.0.3 + pngjs 7.0.0), +5 tests |
| 29394e6 | feat: harness `experimental=0` + `__dseHarnessWrites`, +2 tests |
| 09b17b4 | feat: deferred guard for kind:gif, +1 test |
| 0058de8 | feat: docs camera error shots to `dist/docs-errors/` |
| d175ce8 | feat: docs-gif.mjs + browser GIF half + `--check-stable`, +12 tests |
| 5925e0a | feat: four browser GIF entries + GIFs (r2a final) |
| 6988bd2 | **r2b** feat: CDP driver + obsidian-camera gif branch, shared `runGifEntry`, cropped `--check-stable`, +6 tests |
| 19ec768 | **r2b** feat: three Obsidian GIF entries |
| e65c908 | **r2b** docs: GIFs wired into pages + README; visual-harness README; release audit; CHANGELOG |
| 8bb21fa | **r2b** fix: blur a focused button before each Obsidian GIF capture; regenerated montage + conditions GIFs (+1 assertion) |

Superproject: `b53caba docs(SC-411): PROJECT.md footgun 8.1 — devbox resolves its project from the caller's cwd; use -c`. Note 6988bd2's message mentions "modality priming"; that mechanism was replaced by the blur in 8bb21fa (priming alone did not survive a full run).

## What was built
- `createCdpDriver` in `docs-gif.mjs` (same interface as the Playwright driver): real `Input.dispatchMouseEvent` move/press/release, real `Input.dispatchKeyEvent` per character, `modal:` resolves inside `.dse-modal`, exactly-one-match selectors, `point()` refuses an element that is not visible or is covered, `write: true` polls `app.vault.adapter.read(note)` then waits 500 ms, freeze CSS + `.tooltip`/`.notice` removal + pointer parked in a free corner + button blur before every frame, fixed clip = union of element, chrome and modal rects + PAD, side panels collapsed for the capture.
- `obsidian-camera.mjs --docs`: a `kind === 'gif'` branch. Each capture gets a **fresh scratch note** (`Harness/docs-<out>-<n>.md`, created via the vault, deleted after) so `--check-stable`'s second capture starts from the same text and session state; `note:` entries copy the generated note's text instead of mutating it; `viewport` via `Emulation.setDeviceMetricsOverride`; `prefs` set/restored; `seed` via `Runtime.evaluate`. The error window shot is now taken at the failing step (before cleanup) and not overwritten by the outer catch.
- `renderGifEntry` / `runGifEntry` moved into `docs-gif.mjs` and shared by both cameras (docs-shots.mjs lost its own copy). `--check-stable` compares inside the GIF's crop (the Obsidian window title carries the scratch note's name, which differs by design) and keeps the second run's frames in `<out>.run2/` on a mismatch.
- Entry notes: `stamina-bar.gif` uses a small window (`viewport 980x620`) so the centred modal and the card share a small clip; `montage.gif` uses `MONTAGE_GIF` (MONTAGE_MID with successes 2 / failures 1 and 5 rounds — MONTAGE_MID sits one success / one failure from the limits, so the first quick-log completes the test and hides the controls); `initiative-tracker-conditions.gif` uses `INITIATIVE_COMPACT` (same heroes and malice, one small enemy group): with INITIATIVE_WITH_SQUAD the 2x GIF was 1,091,284 B and fell back to 1x. A hero's Add Condition button is addressed with `.dse-init__entry:has(button[aria-label="Toggle turn taken: Frodo Baggins"]) .dse-cond--add`. Brief said body MONTAGE_MID / INITIATIVE_WITH_SQUAD; these two deviations are for the reasons above.

## Per-GIF table (all 7)
| out | camera | captured / gif frames | loop s | bytes | dpr | stable |
|---|---|---|---|---|---|---|
| initiative-tracker.gif | browser | 19 / 19 | 11.3 | 576,214 | 2 | yes |
| negotiation.gif | browser | 8 / 8 | 9.6 | 883,710 | 2 | yes |
| counter.gif | browser | 8 / 7 | 5.8 | 39,815 | 2 | yes |
| feature-roll.gif | browser | 3 / 3 | 5.1 | 383,635 | 2 | yes |
| stamina-bar.gif | obsidian | 7 / 6 | 7.9 | 119,173 | 2 | yes |
| montage.gif | obsidian | 10 / 9 | 8.6 | 639,852 | 2 | yes |
| initiative-tracker-conditions.gif | obsidian | 9 / 8 | 8.4 | 713,169 | 2 | yes |

## What I saw in the three new contact sheets (`r2b-evidence/*-contact.png`, real GIF decoded)
- **stamina-bar** (window ~884x358 CSS px): resting card, 31 / 48, green bar with an amber threshold tick, six recovery pips filled -> click: the Stamina editor opens centred (dark panel, teal focus ring on the Apply field, teal "No Stamina Change" button dimmed) with the card dimmed behind it -> "7" typed -> Damage pressed: the preview bar shows a red hatched slice and the accent button reads "Lose 7 Stamina" in teal -> applied: card is 24 / 48 with an amber "WINDED" tag, amber bar and amber outline -> Catch Breath: 40 / 48, green again, one fewer recovery pip filled. All as claimed. The editor shows once at 1,400 ms (the click and the waitFor frames are identical and merge).
- **montage**: round 3 / 5, Total Failure "if ended now" (red) -> Kira's quick success logged: check mark in her round-3 cell, state flips to Partial Success (teal) -> "Log an action…" sheet titled "BRAM · ROUND 3" (the next hero), Success chip with a double teal ring -> Failure chosen -> "Climb" typed (Cl, Clim, Climb) in a teal-ringed field -> Log: Bram's round-3 cell shows a red circled X labelled CLIMB, the Log an action… button greys out (everyone has acted), Total Failure again -> End round 3: header "ROUND 4 / 5", round-4 column highlighted teal, button now "End round 4". As claimed. (Ledger-style detail: the board behind the dimmed sheet shows clipped text, as the real modal does.)
- **initiative-tracker-conditions**: resting squad tracker -> Add Condition on Frodo: the Conditions manager opens small, with an "Add condition" button focused (teal ring) -> combobox opens, filter field focused, list Bleeding / Dazed / Frightened / … -> "Bl" then "Ble": list narrows to Bleeding, Invisible and "Add custom: "Ble"" -> Enter: "Bleeding" row (with gear and trash icons) at the top of the manager, a small droplet icon now on Frodo's row behind the dimmed panel -> Done: manager shrinks to the Bleeding row + "Add condition" -> Done again: modal closed, droplet icon on Frodo's row. As claimed. Last frame: the two Orc minion cells show a pale grey rectangle outline (focus-style) — see Follow-ups.
- Colours / look: all frames steel-dark (near-black slate, teal accents). I saw no stray tooltip, notice, file-explorer strip or cursor misplacement. The synthetic cursor (white arrow, black outline) sits mid-control and covers part of small controls (e.g. the Damage button label) while hovering.

## Gate table (final commit `8bb21fa`, on develop `0ecb90e`)
| step | result |
|---|---|
| `npm run tsc` / `npm run lint` | clean / clean |
| `rm -f main.js styles.css; npx jest` | 222 suites (221 pass, 1 skipped), 4458 tests: 4457 pass, 1 skipped, 0 fail. The new base (`0ecb90e`) is 4432 by arithmetic, not a measured run (a337460 measured 4433; SC-155 removed 1 featureblockConfig test, 4 -> 3 `it`s): +26 = 2a's 20 + this round's 6 (docsGif CDP driver). One conditionally skipped test runs now where it skipped before (the skips are environment gated: `printTwinDeltaAllowedSet` needs the cached `dist/obsidian-app.css`, which `npm run shots`/`host-css` creates) |
| `npm run shots` | 568 PNGs, 0 FAIL, in-run gates OK, exit 0 |
| freeze | `freeze OK (274/274 frozen print PNGs byte-identical ...)` |
| `npm run parity` | 0 gap(s), 0 undeclared, 24 declared, exit 0 |
| `--only=<each of 7> --check-stable` | stable x7 (re-run after the rebase, identical shas: initiative 52405a63a657, negotiation 3e915f7d5ef9, counter e39dca9c08c3, feature-roll a8fec1be4dc0, stamina-bar d453a39ebfb0, montage 36adec6f55f4, conditions f489beab9ffb) |
| full `npm run docs-shots` (private Xvfb/port 9312, own scratch udd) | 148 s after the rebase (earlier runs 159 s, 182 s), 37 images; `git status` clean afterwards (all PNGs + 7 GIFs byte-identical); `git status --porcelain visual-harness/shots` empty; `dist/docs-errors` empty |
| lifecycle | not required (nothing under `src/` or `main.ts` changed) |

Obsidian ran from a copy of the existing updated asar (1.14.4) in my own `DSE_CAMERA_TMP`; no asar change.

## Docs pages touched
`docs/initiative-tracker.md` (conditions GIF above the existing add-conditions PNG; existing line-7 GIF now the regenerated one), `docs/running-an-encounter.md` (conditions GIF above the PNG), `docs/negotiation-tracker.md` (line-11 PNG replaced by `negotiation.gif`; the same PNG remains at the Quick Start), `docs/counter.md` (GIF under the intro; `counter.png` stays below the example), `docs/Features.md` (rolling section: `feature-roll.gif` + one sentence about the dice button), `docs/stamina-bar.md` (GIF before the modal PNG; both PNGs stay), `docs/gm-trackers.md` (montage GIF before the sheet PNG; both PNGs stay), `README.md` (initiative GIF after the sample image; the "two animated GIFs ... by hand" passage rewritten; `--check-stable` example), `visual-harness/README.md` (new "Animated GIFs (SC-411)" section: shape, steps, selector convention, drivers, `--check-stable`, determinism-knob table with measured rates, error-shot location; the `DOCS_MANUAL`/"two GIFs" passage replaced), `docs/superpowers/dse-7.0.0-release-audit.md` (lines 57 and 331), `CHANGELOG.md`, and in the superproject `.claude/orchestrate/PROJECT.md` §8.1. No still was deleted. `negotiation.png` (line 11) is superseded by the GIF at that position but is still used at the Quick Start; `counter.png` / `stamina-bar.png` / `montage.png` still add the static view.
- CHANGELOG: the file has no `## Unreleased` heading; the unreleased section is `## 7.0.0 (unreleased; previously numbered 6.0.0)`, so the SC-411 bullet is there (after the SC-142 INTERNAL bullet), and that bullet's stale sentence "Two images (the animated GIFs) still need a human ..." was reworded.

## Drive-by fixes:
- `docs/superpowers/dse-7.0.0-release-audit.md` / `CHANGELOG.md` / README sentences that said GIFs are hand-recorded were stale; reworded in the course of the wiring (these are the passages the task names; listed here because the CHANGELOG one was not).

## Follow-ups:
1. **F1 (initiative, acted portraits) — REAL product behaviour, not a capture artefact; product code untouched.** The "white square outline" is the Steel acted-state frame `inset 0 0 0 2px var(--dse-metal)` (`styles-source.css` ~13848, `.dse-init__portrait-toggle[data-taken]`). It paints only after a **full re-render** of the tracker; the in-place repaint after a portrait click (`repaintTurn`, `view.ts` ~737) sets `data-taken` and `aria-pressed` but the toggle then renders WITHOUT the frame (computed box-shadow stays the plain button shadow; the rebuilt button also carries `data-pressed`, which the in-place path never stamps). So an acted hero's portrait looks one way right after the click and another after any re-render. Repro (real Obsidian, real mouse clicks, verified): note with a `ds-initiative` block (2 heroes), click Frodo's portrait -> grey seal badge, no frame, and it stays that way through the 500 ms write; type a Malice amount + label and click Add (the Malice-entry add re-renders the tracker) -> Frodo's and Sam's portraits now have a pale grey 2px rectangular frame, and it persists (not one frame). Evidence: `r2b-evidence/f1-obsidian-portrait.png` (row of crops: frames 1-7 no frame, 8-9 frame). In the browser harness the frame disappears again at "advance round" (reset). The same family, probably: the two Orc minion cells in the last frame of `initiative-tracker-conditions.gif` have a pale rectangular outline after the Conditions manager closes (not investigated). Owner to decide whether to file.
2. `--check-stable` is per environment: Obsidian self-updates its asar, so Obsidian GIF bytes can move across Obsidian releases (as the PNGs already do).
3. The GIF captures' synthetic cursor covers part of small controls; `cursor: false` turns it off per entry (owner ruling O6 stays).
4. `visual-harness/README.md` "Known deltas" etc. untouched; the 7 browser/Obsidian entries are the only gif entries, SC-414's parked elements still need theirs.
