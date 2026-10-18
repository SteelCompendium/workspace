# SC-411 r2a report — shared GIF infra + encoder + 4 browser GIFs

**Executive summary**
1. Verdict DONE. Final dse sha `4e609ba` on branch `sc411-docs-gifs` (7 commits over base `a337460`; origin/develop had not moved).
2. Gates (final commit): tsc clean, lint clean, jest 4453 total / 4451 pass / 2 skipped (base 4433: +20), shots 568 PNGs 0 FAIL, freeze 274/274 OK, parity 0 GAP / 0 undeclared / 24 DECLARED exit 0.
3. Full `npm run docs-shots` completes (34 images); `git status` clean afterwards: every existing PNG byte-identical, and the 4 committed GIFs were reproduced byte-identically by that fresh run.
4. `--check-stable` stable for all 4 GIFs (two captures, fresh Chromium each, byte-identical frames); can-fail proof: feature-roll without `seed` fails (frame 1: 2201 px differ, max delta 177).
5. GIF sizes: initiative 576,214 B (2x), negotiation 883,710 B (2x), counter 39,815 B (2x), feature-roll 383,635 B (2x); all under 1,000,000 B, none needed the 1x fallback.
6. Obsidian-camera driver and the 3 Obsidian GIFs not touched (r2b). Two suspected product quirks under Follow-ups.

## Commits (dse, `draw-steel-elements`)
| sha | subject |
|---|---|
| 4656b50 | build(SC-411): plugin devbox adds nodejs@24 (devbox.json + devbox.lock) |
| f9d115c | feat(SC-411): gif-encode.mjs (gifenc 1.0.3 + pngjs 7.0.0 exact-pinned), +5 tests |
| e861238 | feat(SC-411): harness `experimental=0` param + `window.__dseHarnessWrites`, +2 tests |
| 81fef6a | feat(SC-411): deferred guard refuses kind:gif for deferred elements, either source (+requires element), +1 test |
| 59fe96b | feat(SC-411): docs camera error/blocked shots to dist/docs-errors/, `.gif` naming fixed |
| 8a4f90b | feat(SC-411): docs-gif.mjs + docs-shots browser GIF half + `--check-stable`, +12 tests |
| 4e609ba | feat(SC-411): four browser GIF entries + generated GIFs; DOCS_MANUAL shrinks to favicon.ico |

The superproject's submodule pointer for `draw-steel-elements` is not committed (left to wt-finish / land-stack).

## Per-GIF table (all `source: 'browser'`, steel / dark, experimental OFF, cursor on)
| out | captured / gif frames | loop s | bytes | dpr | stable |
|---|---|---|---|---|---|
| initiative-tracker.gif | 19 / 19 | 11.3 | 576,214 | 2 | yes |
| negotiation.gif | 8 / 8 | 9.6 | 883,710 | 2 | yes |
| counter.gif | 8 / 7 (last two identical, merged) | 5.8 | 39,815 | 2 | yes |
| feature-roll.gif (`rollingEnabled`, `seed: 7`, viewport 1000x1600) | 3 / 3 | 5.1 | 383,635 | 2 | yes |

Contact sheets (real GIF decoded with Pillow, so they show what viewers get): `r2a-evidence/*-contact.png`. Review frames (raw PNGs, the exact bytes `--check-stable` hashes): `visual-harness/dist/docs-gif-frames/<out>/NN.png` + `frames.json` (gitignored).

### What I saw in each contact sheet
- **initiative**: resting "The Ford of Bruinen" -> title editor open with the old title selected (blue highlight, teal ring) -> typed "Ambus", "Ambush at", "Ambush at the F", "Ambush at the Ford" -> committed (title no longer in an input) -> Frodo's portrait toggle shows the grey acted badge and the row goes hatched/dimmed, then Samwise the same -> Malice digit (red) 5, 6, 7 -> Amount field focused (teal ring), "3" typed, Label field focused, "Villain action" typed -> after Add the Malice digit is 10 and the log reads "Malice log · 1 entry" -> round advanced: header says Round 2, both hero rows are un-hatched with empty circle toggles. Every frame shows what its step claims. The element chrome (three small icons above the card) is fully inside the frame when the card is focused. No "Pin to sidebar" anywhere.
- **negotiation**: resting (Patience 3, Interest 3) -> Higher Authority chip gets a check mark -> mid tier row gets a teal outline with "CHOSEN" and the blue Complete Argument button lights -> after Complete: Patience 2, Interest 4 (teal "NOW" row), Higher Authority struck through -> Patience 4 set by hand (teal 4) -> Peace marked "Spent" (both motivation chips struck through) -> "Learn Motivation/Pitfall" tab shows the explanatory text and a 3-row table -> back on "Make an Argument". All as claimed.
- **counter**: Health 10 -> 11 -> 12 -> 13 -> 12 -> value box focused (teal ring) showing 12 -> typed "17" -> committed 17 (collapse chevron visible above the card while focused). As claimed. The synthetic cursor arrow (white fill, black outline) sits over the digit in the focused frames; legible but it covers part of the number.
- **feature-roll**: resting card with the small dice button in the "Power Roll + Might" head -> first roll: the Tier 1 row fills solid red-orange, the roll bar and a "Tier 1 · 2 / 2d10 [1, 1] = 2" result card appear -> second roll: Tier 3 row (17+) lit, "Tier 3 · 17 / 2d10 [10, 7]". Different seeded tiers on the two rolls. As claimed. I did not script a third "click a tier row" step: that needs `rollClickToRoll`, which I did not enable (the design sketch listed it; not required by the brief).

## Jest counts
Base `a337460`: 220 suites, 4433 tests (4431 pass + 2 skipped; the one failure in that run was the known `sidebarInitiative` SC-288 r2 flake, re-run alone 11/11 green). Final: 222 suites (221 pass + 1 skipped), 4453 tests, 4451 pass, 2 skipped, 0 fail. Delta +20 tests: gifEncode 5, docsGif 12, docsDeferredGuard +1, fixtures (harness hooks) +2.

## Gate table (final commit `4e609ba`; logs in `r2a-evidence/logs/`)
| step | result |
|---|---|
| `npm run tsc` | clean (exit 0) |
| `npm run lint` | clean (exit 0) |
| `rm -f main.js styles.css; npx jest` | 4453 tests, 4451 pass, 2 skipped, 0 fail; load 6.8 |
| `npm run shots` | 568 PNGs in `visual-harness/shots`, 0 FAIL, in-run gates OK, exit 0 |
| freeze | `freeze OK (274/274 frozen print PNGs byte-identical ...)` |
| `npm run parity` | 0 gap(s), 0 undeclared, 24 declared; exit 0 |
| `--only=<each gif> --check-stable` x4 | stable x4 (shas initiative 52405a63a657, negotiation 3e915f7d5ef9, counter e39dca9c08c3, feature-roll a8fec1be4dc0) |
| full `npm run docs-shots` | completed, 34 images (16 browser incl. 4 GIFs + Obsidian half); `git status` clean after |
| devbox node | `devbox run -c <plugin> -- node --version` = v24.12.0 (workspace devbox used for gates: 24.4.1) |

Run order note: docs-shots was run after parity (brief's order). `visual-harness/shots` still holds 568 files after docs-shots.

## Design notes / deviations
- `pad=16` (the SC-169 harness param) is always passed for GIF mounts so the hover/focus chrome above the card is not clipped by the viewport top; `rectOf` also unions the `.dse-chrome` boxes. Crops therefore carry about 28 CSS px of margin.
- Step selectors are strict (must match exactly one node). `.dse-tabs__tab[aria-selected="false"]` is used for the other tab (tab ids carry a per-page counter).
- Palette: sampled first frame at stride 4 plus every pixel that changed between consecutive frames (capped, stride beyond 400k), so a rare new colour is not lost to the stride. rgb565 quantization shifts some colours by 1 (e.g. 20 -> 21 on a slate pixel); PIL decode confirmed delays, loop count and transparent-diff compositing.
- `--check-stable` captures twice in a fresh Chromium each and also compares GIF sha; it narrows `wanted` to gif entries and writes nothing to `docs/Media`. `docs-shots` forwards `--check-stable` to the Obsidian camera (no obsidian gif exists yet; the camera does not implement it, that is r2b). The comparison (`compareFrameSets`) and the driver interface are camera-agnostic.
- Error-shot routing proven with a temporary failing Obsidian entry (reverted): file landed at `dist/docs-errors/docs-zz-errprobe--ERROR.png`, nothing in `shots/`. The `.gif` naming regex fix was not separately exercised (an obsidian gif entry would hit it).
- Unit tests spawn `node --input-type=module` per the repo convention for `.mjs` (jest has no ESM).

## Drive-by fixes:
None.

## Follow-ups:
1. **Possible focus-ring quirk (initiative)**: in the frame after clicking the Malice quick-add "Add" button (#17), both acted hero portraits show a white 2px square outline (focus-visible style) that is gone in the next frame. Repro: `npm run docs-shots -- --only=initiative-tracker.gif`, look at `dist/docs-gif-frames/initiative-tracker.gif/17.png`. Probably keyboard-modality focus-visible from the earlier typing after the view re-renders; cosmetic, element behaviour untouched, worked around by nothing (left in the GIF).
2. **Counter clamps typed values**: typing 25 into the Health counter (max_value 20) commits as 20 with no hint; the GIF types 17 to avoid showing it. May be intended; mention only.
3. Documentation wiring (README, element pages, visual-harness README, release audit, CHANGELOG) deliberately not touched (r2b). Note `visual-harness/README.md` and the manifest header's "two animated GIFs ... recorded by hand" wording is now stale until r2b.
4. The 2b Obsidian camera needs: a CDP driver (same shape as `createPageDriver`), a `kind === 'gif'` branch in step 3h (the PNG docs loop currently treats every `source: 'obsidian'` entry as a PNG), `--check-stable` handling, and `seedScript` via Runtime.evaluate. The camera's `docsShots` filter will pick gif entries up as soon as they exist.
5. negotiation.gif is 883,710 B at 2x, about 12% under budget; adding frames would trigger the 1x fallback.
