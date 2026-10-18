# SC-411 r4 report — fix round for the r3 review (LOW 4, INFO 7 folded)

**Executive summary**
1. Verdict DONE. dse tip `4142751` (11 + 4 commits). origin/develop had moved to `be4f002` (SC-417) before I started, so the branch was rebased onto it first (clean, no conflicts); my r2b tip `8bb21fa` is `95271bd` now. Superproject `sc411-docs-gifs` still `b53caba` (unchanged; the pointer bump is for wt-finish).
2. All 4 LOW and 7 INFO folded as ruled (INFO-6 and INFO-8 not mine; SC-423 / SC-424 untouched). No product code changed (nothing under `src/` or `main.ts`; lifecycle not required).
3. Gates on `4142751`: tsc clean, lint clean, jest 4492 total / 4491 pass / 1 skipped / 0 fail (new base 4476 = 4458 + SC-417's 18; +16 mine), shots 568 / 0 FAIL, freeze 274/274, parity 0 / 0 / 24 exit 0.
4. LOW-3 proof: all 5 named mutations (covered check, one-match strictness, write-after-every-chunk, dice seed, `--disable-partial-raster`) turn jest red when re-applied, plus 8 more for the INFO fixes; table below. All reverted (`git status` clean).
5. 5 GIFs regenerated (cursor now steps off typed fields); negotiation and feature-roll unchanged. All 7 `--check-stable` stable; a second full `docs-shots` (137 s) left `git status` clean; `visual-harness/shots` untouched; every GIF < 1,000,000 B (largest 883,710).

## Per finding
| finding | commit | what |
|---|---|---|
| LOW-1 | `0b2e780` | entry keys are per camera: browser reads `fixture/width/bg`, Obsidian `note/body`, both `prefs/seed/dpr/cursor/viewport`; `frame` and `pref` removed outright (nothing read them); a key of the other camera is refused with "is not read by the <source> camera". Header comment updated |
| LOW-2 (timeout half) | `0b2e780` | the Playwright driver passes `SELECTOR_TIMEOUT_MS` (5 s) to `scrollIntoViewIfNeeded`, `boundingBox`, `click`, `hover`, `press`, `pressSequentially`, `waitFor`; selector-syntax parsing at load dropped per ruling (README says so) |
| LOW-3 | `0b2e780` | +15 tests (jsdom-backed CDP driver tests for strict one-match and "covered by"; fake-driver test for the single write wait after the last typed chunk; `launchGifBrowser` / `BROWSER_LAUNCH_ARGS` / `openBrowserGifPage` extracted from `docs-shots.mjs` so jest pins the launch flag, the seed install before navigation, and the URL params); proof table below |
| LOW-4 | `4142751` | README: GIFs and element PNGs regenerate byte-identically; Obsidian leaf shots can differ by sub-visible noise; cites SC-424 (`tutorial-source-mode.png`, pre-existing, restore with `git checkout --`, never commit) |
| INFO-1 | `b5558a0` | the guard message gives the reason that applies per source (browser: switch ON would publish it; Obsidian gif: the switch-OFF placeholder would be animated; no element: cannot be checked); +1 test |
| INFO-2 | `0b2e780` | `runGifEntry` removes `<framesDir>.run2` first |
| INFO-3 | `0b2e780` | `waitWrite` in both drivers, after the first change, waits for `WRITE_QUIET_MS` (450 ms, just over the 400 ms persist debounce) with no further change; injectable `now` for tests |
| INFO-4 | `0b2e780` | `unionCrop` throws when the union starts left of / above the frame; none of the 7 GIFs trips it |
| INFO-5 | `0b2e780` | the camera saves `Math.random` before seeding and restores it in the entry's `finally` (`saveRandomScript` / `restoreRandomScript`, tested with `vm`) |
| INFO-7 | `0b2e780`, GIFs `4142751` | a driver `cursorAside(sel\|null)`: after every typed chunk and after a `press` the synthetic cursor's tip goes to the typed field's bottom-right corner (arrow sits outside the box); both cameras; the click frame still points at the control |

## LOW-3 mutation proof (jest: `docsGif` + `docsDeferredGuard` suites, 37 tests)
Each mutation applied to the source alone, suites run, source restored (`mut.py`; raw rows `r4-evidence/logs/mutations-low3.json` and `mutations-r4-info.json`).
| mutation | jest | test that went red |
|---|---|---|
| M9 CDP `point()`: drop the "covered by" check | 1 failed / 36 passed | refuses to click a control that something else covers |
| M11 CDP `one()`: exactly one -> at least one | 1 failed | a selector must match EXACTLY ONE node |
| M12 runner: wait for the write after EVERY typed chunk | 1 failed | a typed step with write: true waits for the write ONCE, after the LAST chunk |
| M14 browser: drop the seeded `Math.random` init script | 1 failed | installs the seeded Math.random BEFORE navigating, only when a seed is set |
| M15 browser: drop `--disable-partial-raster` | 1 failed | launches Chromium with --disable-partial-raster |
| M16 validation accepts `frame` / `pref` again | 1 failed | refuses `frame`, `pref`, and keys that belong to the other camera |
| M17 selector waits back to 30 s | 1 failed | every selector wait is bounded by SELECTOR_TIMEOUT_MS (5 s) |
| M18 no write-quiet wait | 2 failed | both drivers' waitWrite quiet tests |
| M19 no negative-origin throw in `unionCrop` | 1 failed | unionCrop refuses a rect that starts left of / above the frame |
| M20 keep a stale `.run2` | 1 failed | runGifEntry removes a stale <out>.run2 |
| M21 `restoreRandomScript` never restores | 1 failed | the Obsidian seed is saved and restored |
| M22 cursor never steps aside after `type` | 1 failed | the synthetic cursor steps aside after each typed chunk and after a press |
| M23 guard: one message for every source | 1 failed | the refusal message gives the reason that applies to the entry's source |

## Gate table (final commit `4142751`, on develop `be4f002`)
| step | result |
|---|---|
| `npm ci`, `npm run tsc`, `npm run lint` | ok, clean, clean |
| `rm -f main.js styles.css; npx jest` | 223 suites (222 pass, 1 skipped), 4492 tests: 4491 pass, 1 skipped, 0 fail. New base `be4f002` = 4458 (r3) + 18 (SC-417's `it`s, counted from the diff, not a measured run) = 4476; mine +16 (docsGif 15, docsDeferredGuard 1) |
| `npm run shots` | 568 PNGs, 0 FAIL, exit 0 (487 s) |
| freeze | `freeze OK (274/274 ...)` |
| `npm run parity` | 0 gap(s), 0 undeclared, 24 declared, exit 0 |
| `--only=<each of 7> --check-stable` | stable x7 (shas: initiative 8af895dff992, negotiation 3e915f7d5ef9, counter 0f979d6fecc5, feature-roll a8fec1be4dc0, stamina-bar 72fec47d8b61, montage 89d5ddf08162, conditions 7388e6e0806b) |
| full `npm run docs-shots` x2 (private Xvfb / port 9312) | run 1: 138 s, 37 images, exit 0, exactly the 5 intended GIFs changed (no PNG drifted; `tutorial-source-mode.png` did not flake this time); run 2 (after committing): 137 s, exit 0, `git status` clean; `visual-harness/shots` 568 files, nothing new; `dist/docs-errors` empty; no `.run2` left |
| lifecycle | not required (no `src/` or `main.ts` change; the rebase brought SC-417's, which is theirs) |

## Per-GIF table (all dpr 2, none needed the 1x fallback)
| out | camera | captured / gif frames | loop s | bytes (r3 -> r4) | stable |
|---|---|---|---|---|---|
| initiative-tracker.gif | browser | 19 / 19 | 11.3 | 576,214 -> 570,381 | yes |
| negotiation.gif | browser | 8 / 8 | 9.6 | 883,710 (unchanged) | yes |
| counter.gif | browser | 8 / 7 | 5.8 | 39,815 -> 40,434 | yes |
| feature-roll.gif | browser | 3 / 3 | 5.1 | 383,635 (unchanged) | yes |
| stamina-bar.gif | obsidian | 7 / 6 | 7.9 | 119,173 -> 119,745 | yes |
| montage.gif | obsidian | 10 / 9 | 8.6 | 639,852 -> 640,721 | yes |
| initiative-tracker-conditions.gif | obsidian | 9 / 8 | 8.4 | 713,169 -> 717,396 | yes |

## What I looked at (`r4-evidence/*-contact.png`, `counter-zoom.png`)
- **counter**: frame 6 (the 2.0 s hold) now shows a clear "17" in the teal-ringed box; the white arrow (black outline) sits at the box's lower-right corner, covering the lower-left of the "+" button and a sliver of the "H" of "Health", not the digits. Frame 5 (the click that focuses the box) keeps the arrow on the "12", on purpose (it shows where the click lands).
- **initiative**: frames 2-5 (typing the title) and 13-16 (typing the Amount and label) have the arrow just off the bottom-right corner of the teal-ringed field, outside the text; frame 6 (Enter) keeps it there. All other frames unchanged. Frame 17 still shows the pale acted-portrait frame (SC-423, product, left as is).
- **stamina-bar, montage, conditions**: arrow beside the typed field ("7", "Climb", "Ble") instead of on it; modals fully inside the crop; no other change.

## Drive-by fixes:
None.

## Follow-ups:
- None new. SC-423 (acted-portrait frame) and SC-424 (`tutorial-source-mode.png` noise) stay filed and untouched; INFO-6 (browser vs CDP blur) dropped per ruling.

## r6 (two INFO wording nits from the scoped re-review)
- Commit `b3be096` (one `fix(SC-411)`), on `4142751`.
- `visual-harness/README.md` SC-424 sentence now says what was measured: lone runs of `tutorial-source-mode.png` match each other but can differ from the committed file, and full runs vary from run to run (base branch too; SC-424 cited).
- `docs-deferred-guard.cjs`: the closing advice follows what was refused. A deferred element gets "Remove the entry ... or un-defer the element first."; a gif entry with no `element` gets "Give each gif entry its `element`."; a mix gets both. `docsDeferredGuard.test.ts` +1 test pins all three shapes.
- Gates: tsc clean, lint clean, jest 222 suites pass + 1 skipped; **4493 tests: 4492 pass, 1 skipped, 0 fail** (4492 + 1 new). shots, freeze, parity and docs-shots were not re-run: nothing they read changed (guard and README text only; the guard runs at `docs-shots` start but the manifest is unchanged). `git status` clean after the commit.
