# SC-651 decisions ledger — Preset dropdown "Custom" pick

Ticket: SC-651 "Choosing "Custom" in the settings Preset dropdown shows "Custom" although nothing changed" (Low, DSE Plugin, Bug).
Worktree: `/home/scott/code/steelCompendium/worktrees/sc651-preset-custom` (branch `sc651-preset-custom` in every submodule).
Base: dse `develop` @ `cefa9ca8`; superproject `origin/main` @ `c63ec316`.

## Ticket text (the spec, verbatim)

> **Repro:** Settings → Draw Steel Elements, with the preset at Steel card. Pick Custom in the Preset dropdown. It reads Custom. Open another settings page and come back: it reads Steel card.
>
> **Expected:** the dropdown always shows what reopening the page would show. Either picking Custom is refused and the dropdown snaps back, or it means something and is saved.

## Owner rulings

- 2026-11-15 (owner): **Refuse and snap back.** No Scott decision needed. Grounds:
  - D4 §3.2 (`docs/superpowers/dse-overhaul/D4-preferences-spec.md`): "The preset is **not a stored pref** — like the site, D4 stores the seven members and *derives* the preset label."
  - `src/views/SettingsTab.ts` design comment above `renderPresetControl`: "\"custom\" is a label the user cannot select into."
  - So "Custom" has no meaning to save. The fix: when the pick is `custom`, put the dropdown back to `deriveSbPreset(prefs)` and write nothing. When the derived state already is `custom`, the pick is a no-op that still reads Custom.
  - Do NOT disable the `<option>`: a keyboard End / ArrowDown on a closed native select skips disabled options, so End would land on "Index card" and APPLY that preset (a write the user did not ask for). The option stays enabled; the change handler refuses it.
- 2026-11-15 (owner): scope is the Preset dropdown only (`renderPresetControl`). No change to `pipeline.ts`, `main.ts` sync paths, or the settings change path (SC-644 / SC-646 / SC-653 are other owners').
- 2026-11-15 (owner): the e2e `knownBug('SC-651', '[SET-D16] …')` in `e2e/specs/settings/dropdowns.e2e.ts` becomes a plain test (drop the `failsWith` option). Add a jsdom test in the settings suites that pins the snap-back (Steel card -> pick custom -> shows steel, no prefs write) and the derived-custom no-op.
- 2026-11-15 (owner): user-facing, so a `## Unreleased` CHANGELOG bullet in the worktree's superproject `CHANGELOG.md`.
- 2026-11-15 (owner): follow-up — the website's settings panel (`v2/docs/javascripts/settings-panel.js:730`, `if (this.value === "custom") return;`) has the same shape. Filed as **SC-664** (Backlog, Low, related to SC-651); not in this ticket's scope.

## Follow-ups filed

- SC-664 — website settings panel, same Custom-pick bug (`v2/docs/javascripts/settings-panel.js:730`). Out of scope here.

## Rounds

- r1 implementer (Sonnet, agent a5ee0e36): DONE. dse `884555a0` (fix + 3 jsdom), `031f6ca0` (SET-D16 plain). superproject CHANGELOG `e2014106`, no pointer bump. jest 13392/2 fresh, lifecycle 64/64, e2e 612/622 ok 0 failed 10 known-bug 417/417, styles.css identical -> shots/freeze/parity carry. Report `sc651-r1-impl-report.md`.
- r2 independent review (Opus, agent a88e9c23): LAND. 0 HIGH / 0 MEDIUM / 1 LOW / 4 INFO. Measured: snap-back in real Obsidian 1.14.4 (End, ArrowDown, mouse), no write, no Notice, focus kept; setValue does not fire onChange; disabled-option variant measured to apply Index card on End (ruling confirmed). Report `sc651-r2-review-report.md`.
  - Rulings (owner, 2026-11-15): LOW-1 (CHANGELOG says Custom "only appears" sometimes; the option is always listed) -> FOLD: reword the bullet (r3 chore). INFO-1 (jsdom tests 2/3 pass on unfixed code by design) -> drop, controls by design. INFO-2 (SET-D16 does not assert no-write) -> drop: no-write is pinned by jsdom test 1 and measured in real Obsidian by the r2 probes; adding it costs a full e2e re-run on a Low ticket. INFO-3 (dse-verify CURRENT numbers move to 612/622, 10 known-bug at landing) -> dispatcher's landing bookkeeping; named in the land-ready report. INFO-4 (main checkout dse dirt) -> drop: Scott's expected live-vault dirt (adapter §5).
- r3 chore (Haiku): reword the CHANGELOG bullet (amend `e2014106`) + the ONE pointer bump to `031f6ca0`. Brief `sc651-r3-chore-brief.md`.
- 2026-11-15 (dispatcher, verbatim): "SC-651 baseline: SC-646 landed, so dse develop is now ad21dc87 and workspace main is f7c064b0. Rebase onto ad21dc87, and put your superproject branch on current workspace main with the CHANGELOG commit and ONE pointer bump, before you report land-ready. New numbers at ad21dc87: jest 13403 passed / 2 skipped fresh · lifecycle 64/64 · e2e `612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. SC-646 touched `main.ts` sync paths and the settings tab's Sync button handler."
  - Owner: expected after rebase: jest 13406 / 2 fresh (13403 + 3), lifecycle 64/64, e2e `613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`. r4 = r1 implementer resumed for the rebase + full battery; r3's pointer bump gets redone on f7c064b0.
- r4 (r1 implementer resumed): DONE. dse `9e465377` + `fcc7278e` on develop `ad21dc87`, clean rebase, range-diff identical to reviewed `884555a0`/`031f6ca0` (no re-review needed: zero delta). Superproject `b58ec168` (CHANGELOG) + `77165646` (ONE bump to fcc7278e) on origin/main `63843336`; status clean. Gates: tsc/lint clean, jest 13406/2 fresh, lifecycle 64/64, e2e 613/622 ok 0 failed 9 known-bug 417/417 (first run: INIT-W10, SET-X03/X04 known flakes; re-run clean), styles.css identical to ad21dc87 -> shots/freeze/parity carry.
- 2026-11-15 owner: posted result comment on SC-651 (no ask). LAND-READY reported to the dispatcher. Landing bookkeeping (review INFO-3): dse-verify SKILL.md line 33 "today" + CURRENT paragraph -> e2e 613/622, 9 known-bug; the SC-440 known-bug list there drops SC-651.
