# SC-407 decisions ledger — 7.0.0 docs + CHANGELOG + README prune to the shipped set

Worktree: /home/scott/code/steelCompendium/worktrees/sc407-docs-prune (every submodule on branch `sc407-docs-prune`)
Repo touched: draw-steel-elements (tracked branch `develop`; base `05a6ff3` = origin/develop at dispatch, = SC-406 landed)
Owner: Fable ticket-owner. Workers never call the tracker.
Background: SC-406 ledger (landed) at workspace `docs/superpowers/dse-overhaul/build-ledgers/sc406-gating-ledger.md`.

## Scott's rulings (verbatim, dated)

### 2026-10-16 — the ticket description (authored by Scott)

> Follows the gating ticket. Every deferred item in `draw-steel-elements/docs/superpowers/dse-7.0.0-release-audit.md` has a docs footprint that must go (or read "coming in a later release") before the release:
>
> * `docs/index.md` element catalog, `README.md`, `docs/getting-started.md`
> * `docs/migrating-to-7.md` "What's new at a glance" (hero trackers, Director's trackers, sidebar, edit pencil)
> * `docs/gm-trackers.md` → becomes a montage-only page (encounter/project/party out; montage's "pin to the sidebar" prose out)
> * `docs/hero-suite.md` → Stamina pointer only (conditions/resource/surges/tokens out)
> * `docs/Roll.md` out; `docs/Features.md` § "Rolling on ability cards" stays
> * sidebar sections in `initiative-tracker.md`, `running-an-encounter.md`, `writing-blocks.md`, `advanced-usage.md`; `common-element-fields.md` § menu loses the pencil bullet
> * `docs/settings.md`: Authoring page, Print preview row, and the per-block override table rows for `printPreview`
> * `docs/canvas-character-sheet.md` stays
> * `CHANGELOG.md` `## 7.0.0 (unreleased)`: pull or re-word the FEATURE bullets for deferred items (hero trackers, Director's trackers other than montage, sidebar, ds-roll, form editor, print preview), then date the header at release
> * `npm run docs-shots` after the prune; SC-388 negotiation.gif is the one hand-recorded asset; `visual-harness/docs-manifest.mjs` entries for removed images go too
> * `AGENTS.md` / `.repo-docs/` "22 registered elements" wording → describe the experimental switch

### 2026-10-16 — audit doc §13 decisions record (Scott), the items that define "deferred" vs "ships"

> 1. Deferral mechanism: single undocumented `experimental` switch in `data.json`; code stays; deferred blocks render a placeholder.
> 2. `ds-scc`: ships.
> 3. Sidebar: deferred to 7.1.0 ("a bit risky").
> 4. Rolling on ability cards: ships ("simple enough"). `ds-roll` element: deferred.
> 5. Form editor: hidden, code kept ("ugly, confusing, hard to use; fixing it would take too long").
> 6. Legacy sync command alias: removed; the lost hotkey is acceptable.
> 7. `ds-conditions` strip: deferred; the Conditions manager modal ships via the initiative tracker.
> 8. Montage: ships ("nearly prod-ready; shore up what's left").
> 9. Print/PDF: the print layout stays (unavoidable; printing is fine) but is not offered as a setting; the Print preview toggle is hidden; the look is "ugly and embarrassing" and gets its own ticket.
> 10. `LegacyCompendiumModal`: ships (needed by every upgrade).
> 11. `authoringControls`: no vault migration; no user vault should carry it.
> 12. Text-scale trio: ships, with SC-372 fixed for 7.0.0 (cheap).

SC-406 ticket (Scott): deferred elements = `ds-encounter`, `ds-project`, `ds-party`, `ds-conditions`, `ds-resource`, `ds-surges`, `ds-tokens`, `ds-roll`, `ds-hero`. "an undocumented switch is fine" — the `experimental` switch stays undocumented in USER docs (AGENTS.md / .repo-docs are developer docs and may describe it, per the ticket's last bullet).

## Owner rulings (ticket-owner interpretation, not Scott's — revisable)

- 2026-10-16 O1: Deferred content is REMOVED, not teased. No "coming in a later release" lines in user docs, README or CHANGELOG — Scott's bar is "not usable with reasonable effort", and a teaser sends users looking. Single exception: `migrating-to-7.md` gets ONE short note that a block for an element not in this release shows a "not available in this release" card and the note text is untouched (only BRAT beta users can have such blocks; the card already says this, the doc just explains it). No mention of the switch.
- 2026-10-16 O2: Deleted pages/sections are restorable from git (`05a6ff3`). The worker records a restore map (each removed page/section/image/manifest entry → its path at `05a6ff3`) as a new subsection of audit doc §11, so 7.1.0 can bring them back without archaeology.
- 2026-10-16 O3: `docs-shots` captures with the switch OFF — docs depict the shipping product. SC-406 made the camera seed `"experimental": true`; that stays for `obsidian-shots`/gates, and the `--docs` path seeds it off (or does not seed it). Smallest harness change that achieves it; no gate may move.
- 2026-10-16 O4: CHANGELOG — wholly-deferred FEATURE bullets are pulled; mixed bullets are re-worded to the shipped part; follow-on bullets that only fix or polish a deferred surface go too. Header stays `## 7.0.0 (unreleased)` — dating is at release, which is Scott's.
- 2026-10-16 O5: Internal links must not break: no user doc may link to a removed page/anchor; mkdocs nav must not reference removed pages.

## Round log
- 2026-10-16 r1 implementer (Sonnet, orchestration:implementer) dispatched on base 05a6ff3. Brief: sc407-brief-r1-impl.md. Report due: sc407-r1-impl-report.md.
- 2026-10-16 r1 implementer → dse `eef9c63` (7 commits over 05a6ff3: 454ce58 docs, b5ded19 CHANGELOG, 0dcce63 harness+test, 113e366 Media, 07d6c21 dev docs, 54672f8 + eef9c63 restore map §11a). Gates: tsc/lint clean; jest 4430/1 skipped/218 of 219 (+1 docs-mode switch-off test); lifecycle 25/25; shots 568 0 FAIL; freeze 274/274; parity 0/0/24; docs-shots rc=0, 30 images (14 browser + 16 obsidian; was 40), 10 removed, 25 regenerated; link check 229 links 0 broken (mkdocs not runnable: no `material` module). Fresh worktree needs `npm ci` + `npm run host-css` before jest matches (else 4429/2 skipped). Owner eyeballed settings-index.png: 10 rows, no Authoring page. OK.

## Owner rulings on r1 follow-ups (2026-10-16)
- Audit §7 says 8 settings pages after gating; real count 10 → FOLD into the fix round (one-line correction, if the reviewer confirms 10).
- `kind: 'sidebar'` camera code unused by the manifest → DROP: harness code stays for 7.1.0 when sidebar docs return via the §11a restore map (code-stays principle, §13.1).
- `sample.png` regenerated at 1400x6002 (was 3261 tall) → reviewer to explain (content growth vs capture defect) before a ruling.
- No doc references `negotiation.gif` → reviewer to check whether it was referenced at 05a6ff3; if it never was, DROP here (SC-388 owns that asset); if the prune removed the reference, FIX.
- Drive-by fixes (settings.md `feature.md`→`Features.md` link; CHANGELOG legacy-alias contradiction; common-element-fields teaser) accepted pending review.
- 2026-10-16 r1 review (Opus, orchestration:reviewer) dispatched on eef9c63. Brief: sc407-brief-r1-review.md. Report due: sc407-r1-review.md.
- 2026-10-16 r1 review (Opus) on eef9c63: LAND-READY, 0 CRIT/HIGH/MED, 6 LOW, 9 INFO. Gates re-measured identical (jest 4430/1/218 of 219, new test fails on base harness = not vacuous); mkdocs --strict (scratch venv) 8 warnings head vs 11 base, 0 new; O3 proven (switch OFF in docs camera, data.json byte-identical, non-docs camera still ON). Report: sc407-r1-review.md.

## Owner rulings on r1 review (2026-10-16)
- LOW-1..LOW-6 → FOLD all into fix round 1 (all small, all in files this branch touches).
- I1 (`docs/index.md:21` "build it, then run it" vs guide's "Set up the fight") → FOLD (one-line wording consistency).
- Follow-up "audit §7 eight vs ten pages" = LOW-1 (confirmed 10 off / 11 on).
- sample.png 6002px → DROP here: real content (stale image since SC-152 had a ds-hero panel; now a full statblock). README hero-image height is taste; mention to Scott in the land-ready comment, his call.
- negotiation.gif unreferenced → DROP: SC-379 (46c8357) removed the reference before this branch; SC-388 owns the asset.
- I7 (canvas-character-sheet.png "Read-only" badge overlaps "31") → DROP here: pre-existing product layout, already on the audit §4 walkthrough ("badge placement"); not a docs defect.
- I2, I4, I5, I6, I8, I9 → no action.
- 2026-10-16 fix1 dispatched (resume r1 implementer). Brief: sc407-brief-fix1.md.
- 2026-10-16 fix1 implementer → dse `e7dbaa6` (e24ee89 LOW-2/3/6+I1, 50e23c1 LOW-1, 0d3edf7 LOW-4 guard `visual-harness/docs-deferred-guard.cjs` + 2 tests, e7dbaa6 LOW-5). Gates: tsc/lint clean; jest 4432/1 skipped/219 of 220 (+2 guard tests); lifecycle 25/25; shots 568 0 FAIL; freeze 274/274; parity 0/0/24; docs-shots rc=0, 30 images, no Media drift; links 229/0 broken; main data.json md5 unchanged. Report: sc407-fix1-impl-report.md.
- 2026-10-16 fix1 scoped re-review dispatched to the r1 reviewer (Opus; not the author) on eef9c63..e7dbaa6.
- 2026-10-16 fix1 scoped re-review (r1 reviewer, Opus) on e7dbaa6: LAND-READY, 0 CRIT/HIGH/MED, 2 new LOW, 2 INFO. jest 4432/1/219 of 220; mkdocs 8 pre-existing warnings, 0 new; guard mutation probes 8/9 caught (M3 `gallery: true` slips). shots/freeze/parity/lifecycle not re-run (delta touches no runtime/harness-capture code — accepted). Report: sc407-fix1-rereview.md.
- Owner ruling: NEW-LOW-A (guard ignores non-array truthy `gallery`) → FOLD into fix2 as prescribed + test. NEW-LOW-B (running-an-encounter.md:10-11 wrong failure description) → FOLD with the reviewer's prescribed sentence. INFO → no action.
- 2026-10-16 fix2 dispatched (resume implementer).
- 2026-10-16 fix2 implementer → dse `a337460` (1 commit over e7dbaa6). jest 4432/1/219 of 220 (assertion added inside existing test, no new test); tsc/lint clean; docs-shots rc=0, no Media drift; links 0 broken. Scoped re-review of e7dbaa6..a337460 dispatched to the reviewer.
- 2026-10-16 fix2 scoped re-review (r1 reviewer, Opus) on a337460: LAND-READY, 0 findings; M3 + string-gallery probes exit 1; M9 (check deleted) turns test red. jest 4432/1/219 of 220; mkdocs 0 new warnings.
- LAND-READY: dse branch `sc407-docs-prune` @ a337460 (12 commits over 05a6ff3). No freeze rebaseline. Workspace superproject: no changes. Land-ready comment posted.
