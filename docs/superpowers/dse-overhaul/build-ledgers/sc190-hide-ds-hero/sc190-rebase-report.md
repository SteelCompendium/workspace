# SC-190 rebase + battery re-verify report (2026-08-29)

Worktree: `/home/scott/code/steelCompendium/worktrees/sc190-hide-hero/draw-steel-elements`
Branch: `sc190-hide-hero`. Not pushed. No Linear calls made.

## Rebase result

- Base: `origin/develop` @ `c09cf6f` (confirmed via `git fetch origin` + `git log origin/develop -1`).
- Original commit: `089d65e` ("SC-190: hide ds-hero from discovery for 7.0.0"), 1 ahead / 33 behind before rebase.
- Final commit after rebase: **`6035d12`** (single commit, same message, `git rebase origin/develop` then `--continue` — no extra follow-up commit needed). `git merge-base --is-ancestor origin/develop HEAD` confirms `6035d12` sits directly on `c09cf6f`. Working tree clean.
- Conflicts hit: exactly 2 files — `CHANGELOG.md` and `CLAUDE.md` (both docs, as anticipated). No conflicts in `hero-suite.md`, `README.md`, `docs/index.md`, `migrating-to-7.md`, `visual-harness/docs-manifest.mjs`, or the `insert.ts`/`suggest.ts` test files — those all applied cleanly.
  - `CHANGELOG.md`: develop had added six new `[FIX]`/`[BUGFIX]` bullets under `## 7.0.0 (unreleased)` (SC-198, SC-189, SC-185, SC-187, SC-193, SC-188) ahead of where SC-190's bullet was inserted. Resolved by keeping all develop bullets, then SC-190's own bullet, in sequence — both intents preserved, nothing dropped.
  - `CLAUDE.md`: develop had extended the same "Key Architecture" sentence with a `(2026-04-06 revert decision, executed by D1)` parenthetical on the Framework-v2/Vue-3 clause. Resolved by keeping SC-190's `hidden: true` sentence in full and appending develop's revert-decision clause onto the trailing "Framework v2 replaced Vue 3" sentence — both facts preserved.
- `package.json`'s `obsidian` version was unchanged across the rebase (`1.13.1` both before and after) — `npm ci` was not required, per the brief's footgun check.

## Drift check (33 new commits since original cut)

**None found.** The 33 commits (`005664c..c09cf6f`, listed and reviewed: SC-183 tracker/SC-185 type-scale/SC-187+193 settings/SC-188 flat style/SC-189 chrome/SC-198 scroll/SC-197/SC-203+204+205 host-leak+radius rounds/SC-126/SC-264 docs) touch tracker, chrome, settings, type-scale, and harness-pin surfaces — none of them touch hero docs, add a new `registry.all()` discovery loop, or add hero advertising copy. Verified directly:

- `grep -rniE "ds-hero|hero sheet" README.md docs/*.md` → **0 hits** (the SC-190 doc removals held clean through the rebase).
- `visual-harness/docs-manifest.mjs` still carries the SC-190 comments explaining why `hero.png` and the `hero` gallery entry are omitted — untouched by the rebase.
- `grep -rn "registry.all()" src/` → still exactly the 3 known call sites: `registerFrameworkElements.ts` (wiring, by design untouched), `insert.ts` (has `if (def.hidden) continue;`), `suggest.ts` (has `.filter((d) => !d.hidden)`). No new discovery-loop code was introduced.
- `grep -rn "insert-hero"` across `src/` and `visual-harness/` → 0 hits (command stays absent).
- `grep -rn "ds-hero|hero sheet"` in `src/views/SettingsTab.ts` and `src/prefs/catalog.ts` → 0 hits (no new settings-tab copy advertising it).
- Remaining `ds-hero`/`hero sheet` string hits inside `src/` are all internal wiring (pipeline, `_dse_anchor`, sidebar registration, kit/characteristics rendering, StaminaEditModal, etc.) — expected, load-bearing, untouched per the brief (did not touch `heroSheet.test.ts`, `heroInSidebar.test.ts`, `anchor.ts`, or the `_dse_anchor` pipeline exemption).

No drift fixes were needed. Branch stays as the single rebased commit `6035d12` — no follow-up commit.

## Battery results (full, in dse-verify order)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean (only an unrelated ESLintIgnoreWarning notice), exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | **first run: 1 real failure** — `test/dom/framework/token-coverage.test.ts` (the documented non-defect footgun: worktree's superproject checkout pinned to stale `06351c1`, its `docs/superpowers/dse-overhaul/D3-token-map.md` lacks 12 `fs-*` scale token rows present in the current main workspace copy — confirmed `grep -c fs-small-scale`: worktree copy = 0, `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md` = 5). Re-run with `DSE_TOKEN_MAP_PATH=/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md` (env override only, no branch edit) → **3259 passed / 1 skipped / 185 suites (184 passed + 1 skipped), 0 failures.** Matches expected (base 3257 + SC-190's 2 tests = 3259). |
| `npm run shots` | **474 PNGs, all captures OK**, print-twin parity OK (118 capture ids byte-identical), `chrome placement OK`, `chrome host-leak OK`, `nested corner-radius OK`. Both in-run gates printed OK: `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing … 21 further rules … excluded …, 0 unclassifiable …)` and `button host-leak OK (111 button kinds × 3 states … = 666 comparisons …)`. Run twice; `diff -rq` between the two full `shots/` directories is **empty** (byte-identical, deterministic), both runs 474 PNGs. |
| `check-freeze.sh` | `freeze OK (210/210 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` — 0 checksum mismatches, exactly matching expected. |
| `npm run parity` (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 — matches expected exactly. |
| `npm run obsidian-shots` | Skipped per brief (no display available in this environment). |

No baseline changes made or needed (SC-190 is docs/discovery-only; freeze count and parity DECLARED set both unchanged from the SC-205 baseline).

## Known non-defect footgun encountered

Hit exactly as documented in the brief: the worktree's SUPERPROJECT checkout (`/home/scott/code/steelCompendium/worktrees/sc190-hide-hero/`, distinct from the `draw-steel-elements` submodule that was rebased) is pinned to an old workspace-main commit (`06351c1`), so `token-coverage.test.ts`'s candidate-path search finds that stale copy of `docs/superpowers/dse-overhaul/D3-token-map.md` before the current one. Diagnosed by `grep -c fs-small-scale` on both copies (0 vs 5) rather than assumed. Cleared with the test's own `DSE_TOKEN_MAP_PATH` env override pointed at `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md` — the branch was **not** edited for this.

## Artifacts (filesystem paths)

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/tsc.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/lint.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/jest.log` (first run, the token-coverage footgun red)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/jest2.log` (re-run with `DSE_TOKEN_MAP_PATH` override — clean)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/shots1.log` (first shots run)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/shots2.log` (second shots run, determinism check)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/freeze.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/parity.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/sc190-rebase-attempt1.log` (rebase conflict output)
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/sc190-rebase-report.md`
- Rendered shots directory (not committed, regenerated each run): `/home/scott/code/steelCompendium/worktrees/sc190-hide-hero/draw-steel-elements/visual-harness/shots`

## Verdict

Rebase clean (2 doc conflicts, both intents preserved). No drift found — nothing to fix. Full battery green: tsc/lint/jest(3259p/1s/185suites,0 fail)/shots(474 OK, both in-run gates OK, deterministic ×2)/freeze(210/210)/parity(0/0/16, exit 0). Branch is `6035d12`, single commit, rebased onto `origin/develop @ c09cf6f`. Not pushed, not landed, per instructions.
