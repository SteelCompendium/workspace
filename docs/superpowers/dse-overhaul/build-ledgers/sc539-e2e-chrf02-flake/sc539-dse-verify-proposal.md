# SC-539 proposal: text to add to `.claude/skills/dse-verify/SKILL.md` (not applied; the owner/dispatcher applies it)

## 1. In the "e2e gate" section (`**e2e gate (SC-408; …)**`, after the "Never `--headed` on `:1`" bullet)

Add this bullet:

```
- **One shared private display; the runner parks the X pointer (SC-539).** All shards' Obsidian windows live on
  the one private Xvfb (no window manager; each window opens at 1024x800+288+200, then the driver resizes it to
  1440x1100+288+200; both rectangles contain the screen centre). Xvfb starts its pointer at the screen centre,
  inside every window, and a window another shard maps or unmaps there sends our window a real Leave/Enter that
  drops the synthetic CDP hover (CHR-F02, CHR-F03, CHR-L01, INIT-DEF-E04 then time out waiting for the
  hover-revealed chrome panel; SC-529 / SC-534 are the same cause). `e2e/run.mjs` therefore parks the X pointer
  at 0,0 after Xvfb starts, with a dependency-free X11 client (`e2e/x11-pointer.mjs`: WarpPointer to the root at
  0,0, read back with QueryPointer). The park holds a connection open for the whole run: Xvfb resets and
  recentres the pointer when its last client disconnects, so a one-shot warp from a short-lived client (xdotool,
  say) is lost at once, and lost again whenever every Obsidian has exited between spec files. The Xvfb is also
  started with `-noreset` as a backstop. Expect the line
  `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)` right before `start:`. If you see
  `OBSIDIAN-E2E WARN pointer NOT parked: <reason> — hover tests may flake (SC-539)` (printed at the start and
  again after the `done` line), the run continues, exit code unaffected: treat a hover-timeout red in that run as
  possibly this flake and re-run before believing it. No new tool is needed (no xdotool). Never done with
  `--headed`. If the window size or position in `driver/session.ts` ever changes, the pointer must stay outside
  the new rectangle.
```

## 2. Agent-shell note (same section or the devbox-wrapping section)

```
- In agent shells `grep` is ugrep with `-I` (skip binary files) and reads `e2e/run.mjs` as binary, so a plain
  `grep` on it silently prints nothing. Use `command grep -a`.
```

## 3. CURRENT numbers

Measured at plugin head `88cb7db9` (two commits `c34f6904` + `88cb7db9` on `ad018cda`, SC-522 landed); the baselines are the
ad018cd ones and none moves: tsc and lint clean; jest 6244 passed / 2 skipped / 249 of 250 suites on a fresh worktree without
a shots cache (6245 / 1 / 249 once `npm run shots` has cached the app css); lifecycle 45/45 in three `--only` parts
(21 + 16 + 8); e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (two runs) plus the pointer-parked line;
`main.js` and `styles.css` byte-identical to a build of `ad018cd` (so the ad018cd shots 592 / freeze 280/280 /
parity 0/0/24 numbers carry unchanged).
