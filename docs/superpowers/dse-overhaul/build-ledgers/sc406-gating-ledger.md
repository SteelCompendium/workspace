# SC-406 decisions ledger — 7.0.0 release gating (`experimental` data.json switch)

Worktree: /home/scott/code/steelCompendium/worktrees/sc406-gating (every submodule on branch `sc406-gating`)
Repo touched: draw-steel-elements (tracked branch `develop`; base `f8693b5` = origin/develop at dispatch)
Owner: Fable ticket-owner. Workers never call the tracker.

## Scott's rulings (verbatim, dated)

### 2026-10-16 — the ticket description (authored by Scott)

> Decided 2026-10-16 (`draw-steel-elements/docs/superpowers/dse-7.0.0-release-audit.md`, §1 "Gating mechanism"). Scott's bar: deferred features must not be usable with reasonable effort; an undocumented switch is fine; the code stays.
>
> One undocumented boolean in the plugin's `data.json`, `"experimental": true` (absent = off), read once at load like the existing `viewAdoption` kill switch. Not in the Settings UI, not in `DEFAULT_SETTINGS`. When off:
>
> * Deferred elements (`ds-encounter`, `ds-project`, `ds-party`, `ds-conditions`, `ds-resource`, `ds-surges`, `ds-tokens`, `ds-roll`, `ds-hero`) are `hidden: true` (already removes them from `/ds`, Insert commands and docs) **and** the pipeline renders a small inert "not available in this release" card for them instead of the element. Today `hidden` only hides discovery; the block still renders fully (SC-190).
> * The sidebar is not registered: no `ItemView`, ribbon icon, `open-dse-sidebar` / `send-block-to-sidebar` / `send-initiative-to-sidebar` commands, or "Pin/Unpin from sidebar" chrome items.
> * The `authoringControls` and `printPreview` descriptors are not in the catalog (the Authoring page disappears; the Appearance page loses the Print preview row; per-block `prefs:` overrides naming them are rejected with the existing console warning).
> * The legacy command alias `download-data-md-dse` ("Sync compendium (legacy alias)") is removed outright, not gated — Scott: a bound hotkey going silent is acceptable; keeping two sync entries is confusing. One line in `migrating-to-7.md`.
>
> When on: everything above is exactly as it is today. Tests and the visual harness set it on so no fixture or gate moves; add a unit test per gated surface for the off state.
>
> Explicitly NOT gated (ships in 7.0.0): `ds-scc`, `ds-montage`, rolling on ability cards (`rollingEnabled` / `rollerEngine` / `rollClickToRoll`), the three text-scale prefs (SC-372 is fixed for 7.0.0 instead), the `@media print` layout itself, all 6.0.2 elements.

### 2026-10-16 — audit doc §13 decisions record (Scott), the items that bear on SC-406

> 1. Deferral mechanism: single undocumented `experimental` switch in `data.json`; code stays; deferred blocks render a placeholder.
> 3. Sidebar: deferred to 7.1.0 ("a bit risky").
> 4. Rolling on ability cards: ships ("simple enough"). `ds-roll` element: deferred.
> 5. Form editor: hidden, code kept ("ugly, confusing, hard to use; fixing it would take too long").
> 6. Legacy sync command alias: removed; the lost hotkey is acceptable.
> 7. `ds-conditions` strip: deferred; the Conditions manager modal ships via the initiative tracker.
> 9. Print/PDF: the print layout stays (unavoidable; printing is fine) but is not offered as a setting; the Print preview toggle is hidden; the look is "ugly and embarrassing" and gets its own ticket.
> 11. `authoringControls`: no vault migration; no user vault should carry it.

## Owner rulings (ticket-owner interpretation, not Scott's — revisable)

- 2026-10-16: The placeholder card must never write to the note (no write-back, no state mint, no anchor id). Note bytes must be unchanged after opening a deferred block with the switch off.
- 2026-10-16: The Conditions manager modal reached from the initiative tracker is NOT gated (Scott §13.7). Gating `ds-conditions` must not touch it.
- 2026-10-16: Off-state evidence for Scott = real-Obsidian (or harness) screenshots of the placeholder card, dark + light, captured OUTSIDE the frozen set. No new frozen shots this round (no widening sanction needed).
- 2026-10-16: Sidebar-adjacent settings rows / other leftovers the ticket does not name are reported as Follow-ups, not gated, this round.

## Round log
- 2026-10-16 r1 implementer (Sonnet, orchestration:implementer) → dse `3fddf49` (bd80fd4, 8766fc1, 3fddf49). Gates: tsc/lint clean; jest 4412/1 skipped/217 of 218; lifecycle 25/25; shots 568 0 FAIL; freeze 274/274; parity 0/0/24. Report: sc406-r1-impl-report.md. Owner eyeballed evidence-r1 placeholder dark shot: plain grey inert rows, OK.

## Owner rulings on r1 follow-ups (2026-10-16)
- `schemaSuggest` autocompletes keys inside deferred fences → FOLD into the fix round (~~gate it on `isDefinitionHidden`~~ superseded by r1 review LOW-1: guard on `def.deferred === true && !isExperimental()`, because `isDefinitionHidden` would also kill `ds-hero` autocomplete with the switch on); Scott's bar is "not usable with reasonable effort", and authoring help for a hidden block works against it.
- Stored `printPreview` / `authoringControls` values dropped on the next prefs save while the switch is off → FOLD into the fix round: gated pref values must round-trip untouched so on→off→on is lossless ("When on: everything above is exactly as it is today").
- Stale `dse-sidebar` leaf shows Obsidian's stock "Plugin no longer active … [Close]" tab → DROP: affects only BRAT beta users who had the sidebar open; stock tab is honest and one click closes it.
- Docs/README still describe deferred features → DROP here: covered by SC-407.
- `obsidian-camera.mjs` seeding only syntax-checked → reviewer runs `docs-shots` once (or reports why it can't).

- 2026-10-16 r1 review (Opus, orchestration:reviewer) on 3fddf49: FIX-REQUIRED, 0 CRIT / 0 HIGH / 3 MEDIUM / 1 LOW / 7 INFO. All gates re-measured green; 11/11 mutations red; docs-shots rc=0. Report: sc406-r1-review.md.

## Owner rulings on r1 review (2026-10-16)
- MEDIUM-1 (per-block `prefs: printPreview` stripped from the note on any write while off) → FIX. Gated keys must round-trip through block writes untouched.
- MEDIUM-2 (= fold item 2, prefs `persist()` drops gated keys from data.json while off) → FIX, scoped to the gated keys only while off so the on state is byte-for-byte today's behaviour.
- MEDIUM-3 (`obsidian-camera.mjs` leaves `experimental: true` in repo-root `data.json`; overwrites unparseable data.json) → FIX as prescribed: restore the original file at teardown; abort rather than overwrite when it fails to parse.
- LOW-1 (= fold item 1, schemaSuggest) → FIX with the reviewer's guard (`def.deferred === true && !isExperimental()`).
- INFO-2 (docs-shots images will show hidden surfaces) → not SC-406 code; route to SC-407 (noted in the SC-406 land-ready comment and to the dispatcher).
- INFO-4 (card copy prefix "Draw Steel Elements:") → DROP for now; card shown to Scott in the land-ready comment, his call if he wants it.
- INFO-3, 5, 7 → no action. INFO-6 (main checkout `workspace/draw-steel-elements` dirty: Welcome.md, justfile, compendium-manifest.json, `montage 1.md`; mtime 19:37:16, predates this effort's dispatch) → report to dispatcher; not ours to touch.
- 2026-10-16 fix1 implementer → dse `05a6ff3` (bcfe073 LOW-1, 71c4bc2 MEDIUM-1, 37c1947 MEDIUM-2, 05a6ff3 MEDIUM-3). Gates: tsc/lint clean; jest 4429/1 skipped/218 of 219; lifecycle 25/25; shots 568 0 FAIL; freeze 274/274; parity 0/0/24. Report: sc406-fix1-impl-report.md.
- Owner rulings on fix1 follow-ups: FormModal re-emits `prefs:` without gated passthrough → DROP (FormModal is the Authoring surface, unreachable while off; when on the keys are catalog keys). Camera SIGKILL can't restore data.json → DROP (inherent to SIGKILL; dev tooling only). docs-shots images → SC-407 (as ruled).
- 2026-10-16 fix1 scoped re-review (r1 reviewer, Opus) on 05a6ff3: LAND-READY. 0 CRIT/HIGH/MED/LOW, 4 INFO; 9/9 mutations red; ON state byte-identical to develop (jest probe + real Obsidian). Gates: jest 4429/1/218 of 219; lifecycle 25/25; shots 568 0 FAIL; freeze 274/274; parity 0/0/24. Report: sc406-fix1-rereview.md.
- Owner ruling on fix1 INFO 1-4 → DROP all: key order in data.json prefs is cosmetic; camera restore/SIGINT edge cases are dev tooling only; unquoted `on` matches develop.
- LAND-READY: dse branch `sc406-gating` @ 05a6ff3 (7 commits over f8693b5). No freeze rebaseline needed.
- 2026-10-16 LANDED by dispatcher: dse develop 05a6ff3, workspace main 0254b68 (merge) / 596edd0 (ledger preserved). Ticket left In Progress + Needs Review pending Scott's close/taste answer.

### 2026-10-17 — Scott's ruling on the land-ready / landed ask (comment ce7f0ef7, 14:45Z)

> close

- Read as: the ticket closes as landed; the optional "Draw Steel Elements:" placeholder-card prefix (INFO-4) is NOT wanted. That item stays dropped and needs no follow-up worktree.
- 2026-10-21 (owner, session be71a0a9): ticket flipped In Progress → Done; `Ready for Agent` removed (labels now DSE Plugin, Feature). No code change, no worktree created.
