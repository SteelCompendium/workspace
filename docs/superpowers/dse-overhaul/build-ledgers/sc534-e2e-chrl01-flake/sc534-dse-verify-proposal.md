# SC-534 proposal: text for `.claude/skills/dse-verify/SKILL.md` (not applied; the dispatcher applies it at landing)

## 1. e2e gate section — the SC-539 bullet ("One shared private display; the runner parks the X pointer (SC-539).")

Replace the parenthetical `SC-529 / SC-534 are the same cause` with:

```
SC-534 confirmed it for CHR-L01 (SC-529 is its duplicate): with the park, 20/20 under a foreign window flipping
every 150 ms and 10/10 with the renderer CPU slowed x20; with the park off, 0/5, and the old re-hover loop did not
rescue a single run
```

and append this sentence at the end of the bullet:

```
Spec rule (SC-534): do not rescue a hover-revealed control with a re-hover loop, a settle wait or a forced CDP click
(`ClickOptions.cdp` was removed). One `dse.hover` must reveal it, and the driver's default click must hit-test it; a
lost hover in an e2e run means the park failed (look for the WARN line), not timing.
```

## 2. CURRENT numbers

dse `develop` @ `eaf64ba6` (2026-11-02; SC-534 landed — e2e CHR-L01 hovers once and presses Collapse with the default
click; the unused `ClickOptions.cdp` driver option is gone; test-only, no user-visible change): every number is the
`dabfb518` one, unchanged — tsc and lint clean · jest 6262 / 1 / 249 of 250 (fresh worktree 6261 / 2) · lifecycle
46/46 (21 + 16 + 9) · e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` · `main.js` and `styles.css`
byte-identical to `dabfb518`'s build, so shots 592 / 0 FAIL / 161/966, freeze 280/280 and parity 0/0/24 carry.
