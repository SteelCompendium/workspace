# SC-411 r3: independent review of the docs-GIF branch

**Executive summary**
1. **Verdict: LAND-READY.** BLOCKER 0, HIGH 0, MEDIUM 0, LOW 4, INFO 8. Reviewed dse `8bb21fa` (diff `0ecb90e..8bb21fa`) and superproject `b53caba` (PROJECT.md only, diffed against merge-base with `origin/main`).
2. Acceptance holds. A fresh clone with only `devbox run -c` + `npm ci` (node v24.12.0 from the plugin devbox) regenerated `counter.gif` and `stamina-bar.gif` **byte-identical**, including from an empty camera tmp: Obsidian self-updated to 1.14.4 in 3 s.
3. `--check-stable` reported all 7 GIFs stable, with the same shas as the committed files. It can fail: a browser probe with no `seed` gave exit 1 (`frame 1: 1438 px, max Δ116; frame 2: 285732 px, Δ209`). An Obsidian probe with the blur knob removed gave exit 1 (`frames 2,3: 1935 px, Δ173`).
4. Gates unmoved: tsc/lint clean, jest 4458 (4457 pass / 1 skip), shots 568 / 0 FAIL with all 568 PNGs byte-identical to r2b's, freeze 274/274, parity 0/0/24. Two full `docs-shots` runs (131 s, 154 s) wrote 37 images. Nothing new under `shots/` and `docs-errors/` stayed empty in both runs.
5. Full run 1 left one **pre-existing** diff: `tutorial-source-mode.png`, 141 px, Δ1, invisible. Run 2 was clean. The same entry on base `0ecb90e` gives the same off-sha in a lone run, so SC-411 did not cause it (LOW-4).
6. Encoder correct. Pillow decodes all 7 GIFs. Frame counts match the merged source, every delay matches the manifest holds, all loop forever. Error vs source frames: mean Δ 1.09–1.90, max Δ 8–19 (out of 255). No pixel is off by more than 40.
7. **P10: one product bug, not two.** F1 is real. The kit "sheen" rule (`styles-source.css:11218-11227`, specificity 0,8,0, `:not([data-pressed])`) beats the acted frame (`:13848`, 0,5,0). The in-place `repaintTurn` (`view.ts:740-744`) never sets `data-pressed`; only a rebuild through `iconButton` (`iconButton.ts:101`) does.
8. The "pale outline after the Conditions modal closes" is not a change. Frames 0 and 7 of `initiative-tracker-conditions.gif` have **pixel Δ 0** on every portrait and minion cell. The outline is the resting look; it only seems to appear because the modal's dim backdrop covers frames 1–6.
9. The LOW findings are validation and test gaps plus a docs claim. None affects the shipped GIFs or the gates.

---

## Findings

### LOW-1: Validation accepts entry keys that are silently ignored (`frame: 'leaf'` most of all)
- `visual-harness/docs-gif.mjs:94-97` (ENTRY_KEYS) and `:177` (`frame` validated as `'element' | 'leaf'`). Nothing reads `entry.frame`: the CDP `rect()` (`:615`) always uses the element plus modal union. Header `:33` says "obsidian only (2b)", but 2b never implemented it.
- Other keys are also accepted and ignored: `pref` (neither driver reads it), `bg` for obsidian gifs, and `fixture` / `width` for obsidian gifs.
- **Probe:** adding `frame: 'leaf'` to `stamina-bar.gif` gave `ok`, and the output was byte-identical to the committed GIF (`d453a39e…`). Log: `r3-evidence/logs/p4-leaf-frame.log`.
- **Failure scenario:** a future author writes `frame: 'leaf'` to show Live Preview context. They get the element crop with no warning, which breaks the "a malformed entry is a loud error at load" contract (`:10-11`).
- **Fix:** delete `frame` (and `pref`) from ENTRY_KEYS and the header, or implement `'leaf'`. Make the entry-key set source-specific: browser `fixture/width/prefs/bg`, obsidian `note/body/prefs`.

### LOW-2: CSS-syntax errors and no-match selectors are not caught at load; a no-match waits 30 s in the browser driver
- `selectorProblems` (`docs-gif.mjs:105-113`) checks only empty strings and the prefix.
- **Probes:**
  - `button[aria-label="Increase Health"` (unclosed bracket) passed load. It failed mid-run at step 2 with Playwright's parse error.
  - `button.dse-no-such-thing` failed only after Playwright's default **30 s** timeout (`scrollIntoViewIfNeeded`, `:457`; `loc.click`, `:476`). The design and the CDP driver use 5 s.
  - Logs: `logs/p4-bad-css.log`, `logs/p4-nomatch.log`.
- The brief's P4 expects "bad selector fails at manifest load". The prefix half does (`logs/p4-bad-prefix.log`); the syntax half does not. The failure is still loud, just late.
- **Fix:**
  - Syntax-check at load with a dependency-free, bracket- and quote-balanced scan. Alternatively, keep load as is and narrow the README claim, which today says only "malformed selector prefix" and so is accurate.
  - In `createPageDriver`, pass `{ timeout: 5000 }` to `scrollIntoViewIfNeeded`, `click` and `hover`, so a stale selector fails in 5 s like the CDP driver.

### LOW-3: Four load-bearing behaviours survive mutation; jest does not pin them
Mutation run in a scratch clone over the three new suites (`logs/mutation-summary.txt`): 10 of 14 one-line mutations were killed. These 4 survived with **26/26 green**:
- **M9:** remove the CDP `point()` "covered by" check (`docs-gif.mjs:612`).
- **M11:** relax `one()` from "exactly one" to "at least one" (`:602`). The README advertises strictness as a contract.
- **M12:** wait for the write after *every* typed chunk instead of the last (`:239`).
- **M14:** drop `page.addInitScript(seedScript(...))` (`docs-shots.mjs:193`). Jest also does not pin `--disable-partial-raster` (`docs-shots.mjs:184`), which the r1 design asked for ("a unit test on the launch args").

M14 and the raster flag are caught by a full `docs-shots` (git diff) or by `--check-stable`, but only when someone runs them. M9, M11 and M12 are caught by nothing.

**Fix:**
- Add fake-CDP cases: two matches → throw; a covered point → throw; a 3-chunk type with `write` calls `waitWrite` once.
- Extract the browser launch args and the seed install into a small exported helper and assert on it.

### LOW-4: The README says a full run "leaves `git status` clean"; one pre-existing PNG is nondeterministic
- `visual-harness/README.md:439-441`: "a full `npm run docs-shots` in one environment leaves `git status` clean when nothing changed".
- **Measured:**
  - Full run 1: `docs/Media/tutorial-source-mode.png` differed in 141 px, max Δ1, in the view-header back-arrow / breadcrumb strip (bbox 28,5–452,73). Run 2 was clean.
  - A lone `--only=tutorial-source-mode.png` gives sha `bb9aecb3…` 3/3 times on the branch, **and the same sha on base `0ecb90e`**. The committed file is `080bc5dd…`.
  - Pre-existing (SC-142's tutorial capture), not caused by SC-411. GIF entries run after the tutorial entries.
- Evidence: `r3-evidence/p3/tutorial-source-mode-diff-zoom.png` (committed left, run 1 right), `logs/p3-tut-shas.txt`, `logs/p3-tut-base.log`.
- **Fix (not SC-411 scope):** owner files a Backlog bug for the leaf-shot nondeterminism. In this branch, soften the README sentence to "the GIFs and the element PNGs regenerate byte-identically; Obsidian leaf shots can differ by sub-visible raster noise".

### INFO
1. **Deferred-guard message is wrong for Obsidian gif entries.** `docs-deferred-guard.cjs:63` always says "The browser half renders with the experimental switch ON". For `party.gif (gif, obsidian)` the real reason is that the switch-OFF placeholder would be animated (`logs/p4-deferred-obsidian.log`). Word it per source.
2. **Stale `.run2` frames.** `docs-gif.mjs:420` writes `<out>.run2/` on a stability failure, and nothing removes it after a later success. The worktree still holds `dist/docs-gif-frames/montage.gif.run2` from 11:24, beside a 15:16 `montage.gif/`. Fix: `fs.rmSync(\`${framesDir}.run2\`, …)` at the top of `runGifEntry`.
3. **Latent write race, not occurring today.** A `write: true` step's mark (`:232`; browser counter `:499`; Obsidian note text `:693`) could be satisfied by a debounced write from the *previous* step.
   - Measured on initiative, negotiation and counter by logging the write counter after each capture and again 1.2 s later. Every `write: true` step produced exactly +1. No non-write step wrote, and no write landed late (`logs/p9-write-race.log`).
   - Hardening, if wanted: in `waitWrite`, after the first change, also wait for quiescence (no further change for ~PERSIST_DEBOUNCE_MS).
4. **Crop guard.** `unionCrop` (`:279-289`) refuses overflow to the right and bottom only. A negative x0/y0 is clamped silently. In Obsidian, part of the element hidden under the status bar or scrolled inside the leaf would pass. No current entry hits this; add an `x0 < 0 || y0 < 0` throw.
5. **Obsidian `seed` leaks.** `obsidian-camera.mjs:1715` overrides `Math.random` app-wide and never restores it. Today only the browser `feature-roll` uses a seed; any later Obsidian entry in the same session would inherit it.
6. **Browser and Obsidian drivers differ on focus.** Only the CDP driver blurs a focused button (`:720-723`). In `initiative-tracker.gif` frames 6–10, the committed title keeps its teal focus ring and dashed underline while the portraits and Malice + are clicked. This is real behaviour under real clicks, and the browser GIF is stable, so no action is needed. Note it if the two cameras ever need to match.
7. **The synthetic cursor covers the typed value.** In `counter.gif`'s final 2.0 s frame, the white arrow sits on the "17" in the teal-ringed box. It is legible (`r3-evidence/p7/counter-f05-f06-zoom.png`). O6 stands; an offset for `type` / `press` frames would help.
8. **Out of scope, flagged for the owner.** The shared main checkout `workspace/draw-steel-elements` now shows unrelated dirty content: `demo-vault/Welcome.md`, `justfile`, untracked `compendium-manifest.json`, `demo-vault/montage 1.md`. I never touched it (every probe ran in the worktree or a scratch clone). It matters before any `just deploy*`.

---

## P10: portrait / cell outline diagnosis

**Answer: one product bug, F1. The conditions-GIF observation is not a bug.**

1. **Conditions GIF, the last frame against frame 0.** Pixel diff of the decoded committed GIF, frame 0 vs frame 7:
   - Every pixel with Δ>3 lies in Frodo's new Bleeding (droplet) icon slot and at the synthetic cursor (`r3-evidence/p10/f0-vs-f7-diffmask.png`, changed pixels painted red).
   - Region max Δ: Frodo portrait 0, Sam portrait 0, Orc #1 portrait 0, both minion cells 0.
   - Side-by-side: `r3-evidence/p10/portraits-f0-vs-f7.png`. The pale grey rectangle edge on the portraits and the light hairline around the minion cells are the resting look in frame 0 too.
   - In frames 1–6 the Conditions modal's backdrop dims the whole board, so the edges reappear when it closes. That reads as "gained an outline" only against frame 6, not frame 0.
   - Cross-check with a live CDP probe of that capture, run in a scratch clone (the GIF was still byte-identical with the probe in place). For all 10 portrait / toggle / turn / cell nodes, attributes, computed `box-shadow` / `outline` / `border` / `background` / `::after`, and the set of matching CSS rules are **identical** between the first and last frames. The tracker root is the same node, adopted rather than rebuilt (`r3-evidence/p10/p10-diff-f0-f8.txt`, raw `r3-evidence/p10/probe/frame-*.json`).
2. **F1 (acted portrait frame).** Root cause, verified by computed style in the browser harness (`r3-evidence/p10/f1-probe.json`):
   - Not taken: `box-shadow: rgba(255,255,255,.08) 0 1px 0 inset, rgba(0,0,0,.3) 0 1px 3px`, the kit bevel.
   - After clicking Frodo's portrait, the in-place repaint sets `aria-pressed=true` and `data-taken`, but the box-shadow is **unchanged (the bevel)**.
   - Stamping `data-pressed` by hand (what a rebuild via `iconButton(pressed: true)` stamps, `iconButton.ts:101`) gives `rgb(169,176,181) 0 0 0 2px inset, rgba(0,0,0,.55) 0 0 12px inset`, the §12b acted frame.
   - **Why:** the sheen rule `[data-dse-theme='steel']:not([data-dse-print="on"]) :is(.dse-btn, .dse-tabs__tab):not(.dse-btn--accent):not(.dse-btn--ghost):not(.dse-btn--danger):not([data-pressed]):not([aria-selected='true'])` (`styles-source.css:11218-11227`, specificity 0,8,0) sets `box-shadow: var(--dse-chip-bevel)`. It outranks `…[data-dse-element='initiative'] .dse-init__portrait-toggle[data-taken]` (`:13848`, 0,5,0) whenever `data-pressed` is absent. `repaintTurn` (`view.ts:734-745`) toggles `data-taken` / `aria-pressed` and never `data-pressed`.
   - The same hazard runs in reverse: after a rebuild has stamped `data-pressed`, an in-place un-toggle leaves it in place, so the not-acted portrait loses its bevel until the next rebuild. This follows from the code; I did not exercise it.
   - The same section's comment (`:13944-13948`) already documents this trap for the group / turn button; the portrait toggle was missed.
   - Visible in the committed `initiative-tracker.gif`: frame 16 shows acted portraits with no frame, frame 17 (after Malice Add re-renders) shows the 2px light-grey metal frame, and frame 18 (round advanced, not acted) shows none (`r3-evidence/p10/initiative-f06-f16-f17-f18.png`, frames 6 / 16 / 17 / 18 clockwise from top left).
   - **Minimal repro (harness):** open `visual-harness/index.html?theme=steel&bg=dark&element=initiative&fixture=default&experimental=0&pad=16` and click Frodo's portrait. `getComputedStyle(toggle).boxShadow` is the bevel. Run `toggle.setAttribute('data-pressed','')` and it becomes the 2px metal frame. Script: `r3-evidence/p10/f1.mjs` + `probe-el.js`.
   - **Real Obsidian repro:** r2b's (click a portrait, then Add a Malice entry; the frame appears).
   - **Prescribed fix (product, for the Backlog bug):** in `repaintTurn` also `el.toggleAttribute('data-pressed', taken)` on `.dse-init__portrait-toggle` (or use the iconButton handle's own pressed setter). Alternatively, raise `:13848` above 0,8,0 the way `:13950+` does for the turn button. Add a computed-style assertion like `assertTurnMarkParity`.

---

## Probe table

| probe | result (measured) |
|---|---|
| **P1** fresh clone + devbox | Clone of `8bb21fa` into `r3-clone/`. `devbox run -c <clone>`: node **v24.12.0** from the clone's own `.devbox`, npm 11.6.2, `npm ci` 710 packages / 7 s. `docs-shots --only=counter.gif`: ok, 39,815 B, `git status` clean (byte-identical). `--only=stamina-bar.gif`: Xvfb from the clone's devbox profile on `:141`, ok, 119,173 B, byte-identical. Same again with an **empty** `DSE_CAMERA_TMP`: warm-up downloaded `obsidian-1.14.4.asar` in 3,004 ms, byte-identical. Clone deleted. Preconditions outside devbox: `/usr/bin/obsidian` and the Playwright Chromium cache, both shared with the existing shots / camera gates. |
| **P2** stability | `docs-shots --check-stable` (all 7, one run): all stable. Shas: initiative 52405a63a657, negotiation 3e915f7d5ef9, counter e39dca9c08c3, feature-roll a8fec1be4dc0, stamina-bar d453a39ebfb0, montage 36adec6f55f4, conditions f489beab9ffb (= committed). Can-fail: no `seed` gave exit 1, `frame 1: 1438 px differ, max channel delta 116 / frame 2: 285732 px, 209`, with the run2 path printed. CDP blur disabled gave exit 1, `frame 2/3: 1935 px, Δ173`. Both reverted (scratch clone). |
| **P3** full docs-shots | Run 1: 131 s, 37 images, exit 0; `git status`: only `tutorial-source-mode.png` (pre-existing flake, LOW-4). Run 2: 154 s, 37 images, **clean**. Both: all 7 GIFs byte-identical, `visual-harness/shots` 568 files with 0 newer than the run start, `dist/docs-errors` empty. |
| **P4** failure modes | Browser `write: true` on a non-writing click gave `step 6/8 … no block write landed within 5000 ms`, exit 1. Obsidian same on the bar click gave `Harness/docs-stamina-bar-1.md did not change within 5000 ms`, exit 1. Error shot `dist/docs-errors/docs-stamina-bar--ERROR.png` taken at the failing step (modal open; copy `r3-evidence/p4/`). Scratch note deleted; `shots/` not created. Unknown step key `clik` and prefix `modl:` are refused at load, before launch. Deferred `party.gif` is refused for browser *and* obsidian. A gif entry with no `element` is refused. CSS syntax and no-match only fail at runtime (LOW-2). All probes ran in the clone; reverted. |
| **P5** encoder (Pillow 12.3.0) | initiative 19/19 frames; negotiation 8/8; counter 7 (8 captured, 1 merge); feature-roll 3/3; stamina 6 (7); montage 9 (10); conditions 8 (9). Delays equal the merged manifest holds for all 7. `loop=0` (forever) for all 7. Mean / max Δ vs source crop: 1.48/15, 1.38/13, 1.09/8, 1.90/19, 1.53/15, 1.45/14, 1.40/14. 0 pixels with Δ>40. (`logs/p5-pillow.jsonl`) |
| **P6** gates | tsc 0, lint 0 (`eslint src main.ts`; visual-harness is not linted, which predates this branch). Jest: 221/222 suites, **4458 total / 4457 pass / 1 skip**, load 2.35. Shots: exit 0, **568**, 0 FAIL, host-copy pin OK (Obsidian 1.14.4), all 568 byte-identical to r2b's set. Freeze: **274/274**. Parity: **0 gaps / 0 undeclared / 24 declared**, exit 0. Lifecycle not required (no `src/` / `main.ts` change). Workspace devbox node v24.4.1. |
| **P7** visual | Own contact sheets plus every frame in `r3-evidence/p7/`. All steel-dark (near-black slate cards, teal / cyan accents, red Malice digit, green stamina bars, amber WINDED state, coral / red-orange lit tier row in feature-roll). No "Pin to sidebar" chrome, no tooltip, no notice, no deferred element in any frame. Each frame shows its step (details in r2a/r2b match what I saw). Notes: initiative frames 6–10 keep the committed title's teal focus ring (INFO-6); frame 17 is F1. The conditions-GIF "outline" is a backdrop illusion (P10). In counter the cursor partly covers the digit (INFO-7). Modals are fully inside the crop in stamina, montage and conditions. Montage is 1344 CSS px wide and stays legible scaled to 800 px (`p7/montage-at-800px.png`). |
| **P8** docs | All 9 GIF references (8 doc lines + README) resolve to the 7 tracked `docs/Media/*.gif`. README shows `initiative-tracker.gif` and the hand-record passage is rewritten. `visual-harness/README.md` documents the shape, steps, selector rule, load validation, both drivers, `--check-stable`, and a knob table matching the code (the one overclaim is LOW-4). Release audit `:57` and `:331` cite SC-411, not SC-388. CHANGELOG: user-facing bullet under `## 7.0.0 (unreleased…)` (the accepted deviation), and the old "two GIFs need a human" sentence is reworded. `DOCS_MANUAL` = favicon only; no orphans reported. PROJECT.md 8.1 is accurate (plugin devbox carries nodejs@24 — verified v24.12.0; `-c` selects the project). |
| **P9** code review | Step runner: write mark taken before the action, typed chunks wait once on the last chunk, failures are re-thrown naming entry, step and JSON. Cleanup: the browser closes Chromium in `finally`. The Obsidian `finally` restores prefs, splits and emulation, closes modals and deletes the scratch note, verified after the forced failure (no `docs-stamina-bar-1.md` left). Selector scoping: browser `#mount` / `.dse-modal`, CDP root expr / `.dse-modal`, strict one-match (the CDP strictness is untested, LOW-3). Mutation: 10/14 killed (LOW-3). No late writes measured (INFO-3). Code style matches the harness: header-comment contracts, measured-rate comments, `node --input-type=module` tests. |
| **P10** | One bug (F1). Details above. |

Clean-up: the worktree plugin `git status --porcelain` is empty before and after. The ignored-file set is unchanged (`logs/status-ignored-before.txt` = `-after.txt`). HEAD is still `8bb21fa`, and the superproject is still `b53caba` with ` M draw-steel-elements` as found. `r3-clone/` is deleted. All probes ran on private Xvfb `:141`/`:142`/`:143` and CDP 9341/9342/9343 with scratch camera tmp dirs; no process is left behind.
