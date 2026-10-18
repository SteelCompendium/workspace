# SC-411 r5: scoped re-review of the r4 fix delta

**Summary**
1. **Verdict: LAND-READY.** All 10 folded findings are fixed and verified by behaviour, not only by reading: LOW-1, LOW-2 (timeout half), LOW-3, LOW-4, and INFO-1/2/3/4/5/7. No regression found. New findings: 0 BLOCKER / 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO nits.
2. Delta reviewed: dse `95271bd..4142751` (`b5558a0`, `0b2e780`, `4142751`) on `origin/develop` `be4f002`. `range-diff 0ecb90e..8bb21fa be4f002..95271bd` shows all 11 commits `=`, so the rebase changed nothing.
3. Gates on `4142751`, all matching the expected numbers:

   | Gate | Result |
   |---|---|
   | tsc | clean |
   | lint | clean |
   | jest | 223 suites, **4492 / 4491 pass / 1 skipped / 0 fail** |
   | shots | **568 / 0 FAIL** |
   | freeze | **274/274** |
   | parity | **0 / 0 / 24** |

4. `--check-stable` on all 7 GIFs (one run): all stable. The 5 regenerated GIFs have shas equal to the committed files: initiative `8af895dff992`, counter `0f979d6fecc5`, stamina-bar `72fec47d8b61`, montage `89d5ddf08162`, conditions `7388e6e0806b`. Negotiation and feature-roll are unchanged. Every GIF is under 1,000,000 B; the largest is 883,710.
5. Mutations re-applied by me: each turned jest red, 1 failed / 41 passed, and each was reverted. Those were M9 (covered check), M11 (exactly one node), M12 (write wait after every chunk), M14 (dice seed) and M15 (`--disable-partial-raster`). I also added two new ones, for cursor placement and the quiet wait.
6. Cursor (INFO-7) checked on every typed frame. The white arrow with its black outline now sits at the bottom-right corner of each teal-ringed field, outside the text, in both cameras.

---

## Per-finding verification

| finding | how verified | result |
|---|---|---|
| LOW-1 (refuse keys a camera does not read) | `validateGifEntry` on in-memory copies of manifest entries (`logs/probe-findings.log`) | `frame:'leaf'` and `pref` give `unknown entry key`. Obsidian `bg` / `fixture` and browser `body` give `entry key "…" is not read by the <source> camera (it would be silently ignored)`. All 7 manifest entries still validate (0 problems). **Fixed.** |
| LOW-2 (timeout half) | Real Playwright driver on the counter harness page with no-match selectors | `click` 5000 ms, `hover` 5001 ms, `type into` 5000 ms, `waitFor` 5000 ms. With the cursor off, `click` 5000 ms. Was 30 s. **Fixed.** Syntax parsing at load dropped per ruling; the README says so. |
| LOW-3 (tests kill the 4 survivors, pin the raster flag) | Re-applied in the worktree, ran the 3 suites (42 tests), then `git checkout` | Results, each 1 failed / 41 passed (`logs/mutation-summary.txt`, `logs/mut-*.log`):<br>• M9 → "refuses to click a control that something else covers…"<br>• M11 → "a selector must match EXACTLY ONE node"<br>• M12 → "a typed step with write: true waits for the write ONCE, after the LAST chunk"<br>• M14 → "installs the seeded Math.random BEFORE navigating…"<br>• M15 → "launches Chromium with --disable-partial-raster"<br>• extra: cursor at the centre instead of the corner → "cursorAside tips the cursor at the typed field's bottom-right corner"<br>• extra: browser quiet loop removed → "waitWrite waits for quiet…"<br>**Fixed.** |
| LOW-4 (README wording, SC-424) | Read `visual-harness/README.md:443-448` | Claims GIFs and element PNGs regenerate byte-identically and that Obsidian leaf shots can differ. Cites SC-424 and says to restore with `git checkout -- …`, never commit. **Fixed** (one nit, INFO-a). |
| INFO-1 (guard message per source) | Called `assertNoDeferredBrowserShots` with synthetic entries | Obsidian: "the Obsidian half runs with the switch OFF, so a gif entry … would animate the 'not available in this release' placeholder card". Browser: "…switch ON … would publish an unfinished feature". No element: "must name its `element`…". **Fixed** (nit, INFO-b). |
| INFO-2 (stale `.run2`) | Code `docs-gif.mjs` `runGifEntry` first line; worktree state | `fs.rmSync(\`${framesDir}.run2\`…)`. The r2b leftover `montage.gif.run2` is gone, and no `.run2` exists after my run. Pinned by the r4 M20 test. **Fixed.** |
| INFO-3 (write quiet) | Code (both drivers: `WRITE_QUIET_MS` 450, resets on change) plus my extra mutation | The browser quiet loop removed makes jest go red. The CDP loop mirrors it; r4's M18 shows 2 tests red. **Fixed.** |
| INFO-4 (negative crop origin) | `unionCrop` with rect x=-10 | Throws "part of the element is off the frame's top/left edge (union starts at -10,5)…". A rect at 4,4, where only the pad goes negative, still clamps to 0,0 (correct). **Fixed.** |
| INFO-5 (restore `Math.random`) | Code `obsidian-camera.mjs` ~1723-1726 save + seed, `finally` restore; vm test `docsGif.test.ts:574-577` | Save happens before seeding and the restore is in `finally`, guarded on `entry.seed`. A check-stable second capture re-saves the restored original. No current Obsidian entry uses `seed`. **Fixed** (unit-proven, not exercised live). |
| INFO-7 (cursor off typed values) | Decoded the committed GIFs and looked at every typed and press frame | Details below the table. **Fixed.** |

INFO-7 frame by frame:
- **counter** frame 6 (the 2.0 s end hold): a clear white-on-slate "17" in the teal box, with the arrow at the box's lower-right corner. It touches the "+" button's lower-left and the "n" of "Health", not the digits. Frame 5 (the click that focuses the box) deliberately keeps the arrow on "12"; it is a click frame.
- **initiative**:
  - Title frames 2–5: arrow just off the bottom-right end of the full-width teal title field, clear of "Ambus…Ford".
  - Frames 12–16: arrow at the bottom-right of the teal Amount and Label fields. In 14–16 it touches the edge of the "Add" button. Values "3", "Villa", "Villain ac", "Villain action" are fully visible.
- **stamina** frame 2: "7" visible; arrow at the Apply field corner.
- **montage** frames 4–6: "Cl" / "Clim" / "Climb" visible; arrow at the Skill field corner.
- **conditions** frames 3–5: "Bl" / "Ble" visible. The arrow sits at the filter field's corner, over the top-right edge of the suggestion list.

Evidence for INFO-7: `r5-evidence/counter-f4-f5-f6-zoom.png`, `initiative-f03-f14-full.png`, `initiative-title-typing.png`, `frames/*-contact.png`.

Colours, in words: slate / near-black cards; teal / cyan focus rings and accent buttons; a red Malice digit; green stamina bars with an amber threshold tick; an amber WINDED state; red failure marks and a red failure bar in the montage; a white arrow cursor with a black outline. The initiative frame-17 pale-grey acted-portrait frame is still present (SC-423, out of scope, unchanged).

## INFO nits (no action needed to land)
- **INFO-a, README precision.** `visual-harness/README.md:445` says `tutorial-source-mode.png` "is not byte-stable even in a lone run". What I measured in r3: lone runs are byte-stable *with each other* (3/3 `bb9aecb3…`, the same on base) but differ from the committed file; full runs flip between the committed sha and a third sha. Suggested wording: "differs between a lone run and a full run, and between full runs".
- **INFO-b, guard tail sentence.** The guard message always ends "…or un-defer the element first." For the no-`element` reason, "add `element:`" would fit better (`docs-deferred-guard.cjs` closing sentence). Cosmetic.

## Clean-up
- Worktree plugin `git status --porcelain`: empty before and after; ignored-file set unchanged (`logs/status-ignored-before.txt` = `-after.txt`).
- HEAD `4142751`; superproject unchanged (` M draw-steel-elements`, as found).
- Mutations reverted after each run.
- Camera on private Xvfb `:143` / CDP 9343 / scratch tmp; nothing left running. `dist/docs-errors` is empty and `visual-harness/shots` has 568 files.
- No commits, no Linear.
