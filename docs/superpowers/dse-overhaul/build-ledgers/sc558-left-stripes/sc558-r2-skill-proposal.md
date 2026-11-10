# SC-558 r2 — proposed dse-verify SKILL.md text (not applied; I never edit a SKILL.md)

Apply at landing, by the dispatcher, together with the `freeze-baseline.sha256` update from
`rebaseline.txt` (backup `freeze-baseline.sha256.pre-sc558-bak` first).

## 1. "Freeze semantics" — new bullet, newest first (above the SC-349 entry)

  - **2026-11-10, SC-558 (no coloured left stripes in DSE: error card and featureblock
    "Level N Advancement" framed all round, power-roll and montage tier rows, the action-type
    spine and the dead statblock role rule removed; Obsidian's violet blockquote edge removed
    from plugin quotes in print; worktree `sc558-left-stripes`): SANCTIONED 78-line rebaseline,
    280 -> 280.** 39 ids, each `--steel-print` + `--steel-realprint`. 35 are the printed
    action-spine ids: `statblock`, 23 statblock variants (`charbox-on`, `charbox-onword`,
    `charline-two`, `collapsed`, `columns-wide`, `companion-corpus`, `disttarget-ledger`,
    `disttarget-text`, `edit-btn`, `kwusage-grid`, `kwusage-ledger`, `kwusage-text`,
    `roleless-corpus`, `stats-gridc`, `stats-ledger`, `sticky`, `sticky-narrow`, `sticky-nometa`,
    `sticky-off`, `sticky-unscrolled`, `villain-banded`, `villain-corpus`, `with-captain`),
    `featureblock`, `featureblock-advancement` (also loses its grey rail and indent),
    `featureblock-stats`, `featureblock-stats-ledger`, `kit`, `kit-collapsed`,
    `chrome-collapsed-rollout`, `chrome-collapsed-trio`, `chrome-hover-card`,
    `chrome-hover-statblock`, `chrome-placement-trio`. 4 carry a plugin blockquote and lose
    Obsidian's 2px violet `border-inline-start`: `class`, `perk`, `perk-headings`, `perk-narrow`.
    Hashes computed on dse `develop` @ `6270e84a` + the branch, identical across two clean
    `npm run shots` runs. **Scott's sanction, SC-558 comment 83ee1898 (2026-11-10): "5. new
    baselines are good"** (reply to ask fdf6ab10, item 2), and for the quote edge, item 7:
    "Obsidian's left border on quotes should be removed". Any branch that moves one of these
    ids recomputes its hashes on top of SC-558.

## 2. "Parity semantics" / battery row 3 — nothing to change

Parity stayed 0 GAPs / 0 undeclared / 24 DECLARED (border-left is not a compared property).

## 3. "Current expected numbers" — new CURRENT block (fill in at landing)

**CURRENT — dse `develop` @ `<sha>` (2026-11-10; SC-558 landed — ...):** tsc and lint clean ·
jest **6497 passed / 1 skipped / 257 of 258 suites** (+5 over `6270e84a`'s 6492; steelMaterial,
cssSupportFloor inventory 10 -> 11) · lifecycle 52/52 (see the r2 report for the G-S59 note) ·
e2e 128/128, 89/89 pairs · shots 592, 0 FAIL, button host-leak 163/978, `capture clip OK (147 …)` ·
freeze 280/280 after the 78-line rebaseline · parity 0 / 0 / 24.

## 4. Two footguns worth a line

- **Load-sensitive jest (extends "Load-sensitive jest suites")**: at 1-min load 25-50 the full run
  failed 14 then 2 tests, all `Exceeded timeout of 5000 ms`, in `initiative-default-keys`,
  `initiative-sc417-minion-squad`, `twin-reuse`, `formModalStalePreview`, `settings-tab`,
  `fixtures` (218 s). Re-running those suites alone (`-w 2`) was green at the default timeout.
- **G-S59 on a loaded host**: failed 3 of 3 on the branch and 1 of 1 on a clean `git archive`
  of `6270e84a` (same message family: `Emulation.setCPUThrottlingRate` / `Runtime.evaluate`
  "timed out after 30000 ms") at 1-min load 7-28. It is environment (SC-561), but the skill says
  "timed out once, passed on the next"; here it did not pass on a busy host, so quote the load.

## Owner addendum (r5, 2026-11-10) — CURRENT jest figures

- r5 reviewer measured full `--json` runs: base `2ee2e405` = **6586 passed / 1 skipped** in a
  worktree (not the 6584 recorded for SC-435); SC-558 head `10db67e3` = **6591 / 1 / 258 of 259**
  (+5, all in `test/dom/theme/steelMaterial.test.ts`, 80 → 85). Suggest the dispatcher record the
  new CURRENT jest as 6591 / 1 and annotate the 2ee2e405 entry as 6586 measured.
- CURRENT at SC-558 landing: tsc/lint clean · jest 6591/1/258 of 259 · lifecycle 52/52 (parts 1-4
  on r2/r3 heads, CSS-only delta since; part 5 `G-S59 G-S49` 2/2 on 10db67e3) · e2e 163/164 ok,
  0 failed, 1 known-bug (SC-572), 113/113 · shots 592, 0 FAIL, host-leak 163/978, capture clip OK
  (147) · freeze 280/280 after the 78-line sanctioned rebaseline · parity 0/0/24.
