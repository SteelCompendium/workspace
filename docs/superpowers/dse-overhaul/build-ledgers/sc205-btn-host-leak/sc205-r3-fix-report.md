# SC-205 — round 3 fix report

**Verdict: COMPLETE. All 11 findings addressed (1 HIGH, 4 MEDIUM, 6 LOW). Battery green, zero
pixels and zero frozen bytes moved.**

- Branch `sc205-btn-host-leak`, dse submodule. **Commit `c32bc35dddf10e9bc4f69b5e7b945cb5a5ee75c9`
  (`c32bc35`)** on top of R1's `b2a92f5`. Not pushed; superproject pointer untouched; tree clean.
- Obsidian still 1.13.7 (`~/.config/obsidian/obsidian-1.13.7.asar`); no re-extraction was needed.
- **No new REAL diff appeared** from the newly-covered contexts — the sweep is still 0-diff, so
  no STOP condition was hit and no CSS was restyled.

## Headline movement

| | R1 (`b2a92f5`) | R3 (`c32bc35`) |
|---|---|---|
| button kinds sampled | 80 | **111** |
| comparisons | 480 | **666** |
| exemptions | 104 | **12** |
| diffs | 0 | **0** |
| pin coverage | 6 rules + 14 tokens | **6 rules + 14 tokens + the styles-source.css listing**, and 20 further plain-button-subject rules excluded by documented scope |

## Finding-by-finding disposition

| # | Fix | Where | Proof |
|---|---|---|---|
| **HIGH-1** | Deleted the stale two-rule transcription. The sheet now carries a bare index of all six rules (selector + specificity) inside a `[SC205-HOST-RULES]` fence, and the pin parses that fence out of `styles-source.css` and fails if it does not name exactly the rules the model carries. `app-region` → `-webkit-app-region` at both sites. Mechanism lives in the harness; the sheet keeps only a comment. | `styles-source.css` (comment block), `shoot.mjs` `assertHostCopyPinnedToObsidian` | **can-fail G**: deleted one line from the fence → `exit 1`, drift printed sheet-list vs model-list side by side. Sheet change proven comment-only (below). |
| **MEDIUM-1** | Added `CHROME_REVEAL_CSS` (the reviewer's 3 lines), injected after `goto` and **before** tagging, so both passes see one DOM. Boundary line reworded from "provably unreachable" to "the mounted DOM cannot put it into that state", and the `focusTagged` reason drops the false "unfocusable in a real vault too". | `shoot.mjs` `CHROME_REVEAL_CSS`, `assertBtnHostLeak`, `focusTagged` | Exemptions **104 → 12**, exactly the reviewer's predicted residual (8× `focus-visible: disabled`, 2× `hover: no point hit-tests`, 2× `focus-visible: visibility: hidden`); sweep still 0-diff. |
| **MEDIUM-2** | Kind key now carries the nearest chrome surface (`\|in:chrome` / `\|in:chrome-summary`), so the panel button and the summary button are separate records instead of whichever mounted first. | `shoot.mjs` `tagButtons` | Kinds **80 → 111**, comparisons **480 → 666**. The 31 new kinds are the previously-shadowed instances; none produced a diff. |
| **MEDIUM-3** | Replaced the `/^button\b/` prefix filter with subject-compound selection (`splitSubject` + `subjectIsPlainButton`) minus an explicit `EXCLUDED_ANCESTOR_SCOPES` list — 5 entries, each with a `why`. A plain-button-subject rule matching no entry must be modelled or the pin fails. Per **ruling 6**, modal/prompt/settings surfaces are NOT added as coverage; `.setting-item-control` scopes appear as documented exclusions, with SC-202 named. The gate prints the excluded count every run. | `obsidian-host-pin.mjs` `splitSubject`, `subjectIsPlainButton`, `EXCLUDED_ANCESTOR_SCOPES`, `exclusionFor`, `partitionButtonRules` | Measured against real 1.13.7 app.css: **26 plain-button-subject rules = 6 reaching + 20 excluded**, nothing unaccounted (`sc205-r3-pin-partition.log`, `sc205-r3-pin-subject-scan.log`). |
| **MEDIUM-4** | `export const PINNED_OBSIDIAN = '1.13.7'` + `compareVersions`. `findObsidianAsar` now returns `{usable, why}`; the pin compares only against an asar provably **≥** pinned. Older, or the version-less `/opt` copy, is a loud SKIP that names the staleness and explicitly says **not** to re-extract from it. A newer asar stays a hard drift failure. Drift message updated to name the asar's version and the `PINNED_OBSIDIAN` bump. | `obsidian-host-pin.mjs`, `shoot.mjs` skip/drift messages | **can-fail E** (module, 3 worlds): 1.13.7 → usable; only-1.9.0 → `usable:false` naming the version; `/opt` → `usable:false` naming the missing version. **can-fail F** (end-to-end): the exact scenario that was `exit 1 / HOST COPY DRIFTED / re-extract` in R1 is now **exit 0**, loud SKIP, sweep still runs. |
| **LOW-1** | `cornerShape` added to `BTN_PROPS` (Chromium 149 supports it, computes `round`, plugin never declares it → free to pin). `BTN_PROPS_EXCLUDED` entry renamed `-webkit-app-region`. Sheet comment records the decision. | `shoot.mjs` `BTN_PROPS`, `BTN_PROPS_EXCLUDED`; `styles-source.css` | Verified support live before deciding (`CSS.supports('corner-shape','round')` → true, Chrome 149.0.7827.55). OK line now prints `user-select and -webkit-app-region`. |
| **LOW-2** | The comparison loop now fails when `b.blocked !== h.blocked` — both passes must have reached the same state before the pair counts. | `shoot.mjs`, the per-state compare loop | 0 occurrences across the full battery (agreement holds, as the reviewer measured); the assertion is now the thing that guarantees it rather than an observation. |
| **LOW-3** | Comment restated per **ruling 6**: Playwright **can** emulate `forced-colors: active`; not measuring is a scoping decision, with the three reasons stated (niche mode, single border declaration, existence covered by the pin). Stops claiming impossibility. | `shoot.mjs`, the forced-colors block in the host copy | Text change; rule stays modelled and unmeasured as ruled. |
| **LOW-4** | `readAsarFile` fully guarded (open, short reads, absurd header length, `JSON.parse`) → returns `null`, which falls through to the loud SKIP path instead of throwing into `FAIL sweep (exception)` and skipping both the sweep and print-twin parity. | `obsidian-host-pin.mjs` `readAsarFile` | `readAsarFile('/dev/null')` and a nonexistent path both → `null` (`sc205-r3-pin-partition.log`, `sc205-r3-canfail-E-staleasar.log`). |
| **LOW-5** | `hitPointForTagged` counts on-screen candidates and reports "no candidate point is inside the WxH viewport (larger than the viewport, or could not be scrolled into it)" separately from the ancestor-clip diagnosis. | `shoot.mjs` `hitPointForTagged` | The 2 real records still report the clip reason (correctly); the new branch is reachable only for an oversized control, which the gallery has none of today. |
| **LOW-6** | "Two smaller drifts" → **three**; "three of the five rules" → **four of the six**, reconciled where the reader meets it; the pin module header's "two of the five" → "two of the six" and now names the third copy. | `shoot.mjs` provenance comment, `BTN_STATES` comment, `obsidian-host-pin.mjs` header | Text only. |

**Ruling 5** (the R1-flagged "hovered-then-focused 4th state"): closed by MEDIUM-1's reveal, not
deferred, no ticket filed. **Ruling 8** (runtime): no action taken.

## Gate numbers (this commit)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 (only the pre-existing `.eslintignore` deprecation warning) |
| `npx jest` (after `rm -f main.js styles.css`) | **3257 passed / 1 skipped / 3258 total · 184 passed + 1 skipped = 185 suites · 3 snapshots**, exit 0, load 9.75 at start — unchanged from R1 (no test surface touched this round) |
| `npm run shots` ×2 (full) | **474 PNGs, 0 FAIL** both runs; gate blocks **byte-identical** (`diff` empty) |
| `check-freeze.sh` ×2 | **`freeze OK (210/210 …)`, exit 0, 0 mismatches**, before and after run 2 |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 |

### New gate OK lines

```
host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.13.7; 20 further rules whose subject is a plain button were excluded by documented ancestor scope — see EXCLUDED_ANCESTOR_SCOPES)

button host-leak OK (111 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 666 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)
  12 of those (kind,state) records sampled the node at rest because the mounted DOM cannot put it into that state — each one proved per record, never assumed, and the authoring chrome is MOUNTED for the sweep so this is no longer a claim about controls the product merely had not revealed:
      8× focus-visible: disabled
      2× hover: no point in its box hit-tests to it (clipped by an ancestor overflow, or covered)
      2× focus-visible: visibility: hidden
```

## styles-source.css change is comment-only — proven, not asserted

Stripping every `/* … */` block from the sheet before and after gives **byte-identical** output
(322,690 chars both sides). Freeze 210/210 is the independent confirmation.

## Can-fail proofs re-run this round

All reverted; no `SC205-CANFAIL` marker survives in the committed tree (grepped).

| Proof | Perturbation | Result |
|---|---|---|
| **E — stale/unversioned asar** (ruling 7) | `findObsidianAsar` exercised in 3 worlds via the real module | 1.13.7 → `usable:true`; only-1.9.0 → `usable:false`, "OLDER than the 1.13.7 the host copy was extracted from"; `/opt` → `usable:false`, "carries no version". `compareVersions('1.14.0','1.13.7') = 1` (newer still a hard drift). |
| **F — the MEDIUM-4 regression, end to end** | config-dir scan forced empty → `/opt` fallback | **exit 0**, loud `host-copy pin SKIPPED` naming the staleness and saying not to re-extract, sweep still ran and printed OK. In R1 this same world was `exit 1 / HOST COPY DRIFTED`. |
| **G — the sheet-listing pin** (HIGH-1) | removed `button:focus-visible` from the `[SC205-HOST-RULES]` fence | **exit 1**, drift printed the sheet's list and the model's list side by side. |
| **H — exemption loudness under the reveal** | `disabled` exemption removed | **exit 1, 16 loud failures** (4 disabled kinds × 2 passes × 2 schemes), each saying the sweep "would have sampled its resting style and called it a pass". |

R1's proofs A–D still stand and were not re-run; the machinery they exercise (the `!important`
control, the drift pin's rule/token halves, focus loudness, the asar-absent SKIP) is unchanged or
strictly tightened, and G/H/F re-exercise the same failure paths on the new code.

## One process note worth recording

`git checkout styles-source.css` to revert can-fail G's perturbation **also discarded the round-3
HIGH-1 edits**, because those were uncommitted at the time. Caught immediately (`grep -c
SC205-HOST-RULES` → 0) and re-applied, and the final committed sheet is the intended one — but
the general rule is worth keeping: on a branch with uncommitted work, revert a perturbation from a
file backup, never with `git checkout <path>`. R1's proofs used sha-verified backups for exactly
this reason; this round's one lapse cost a re-edit.

## Evidence artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc205-btn-host-leak/`:

- `sc205-r3-gate-shots-run1.log`, `sc205-r3-gate-shots-run2.log` — two full runs, 474 PNGs / 0 FAIL, gate blocks byte-identical
- `sc205-r3-gate-freeze.log` — `freeze OK (210/210 …)`
- `sc205-r3-gate-parity.log` — 0 / 0 / 16
- `sc205-r3-gate-jest.log` — 3257 passed / 1 skipped / 185 suites
- `sc205-r3-canfail-E-staleasar.log` — ruling-7 version-floor proof, 3 worlds
- `sc205-r3-canfail-F-optfallback.log` — MEDIUM-4 end-to-end SKIP (exit 0)
- `sc205-r3-canfail-G-sheetlisting.log` — HIGH-1 sheet-listing drift (exit 1)
- `sc205-r3-canfail-H-exemption.log` — exemption loudness under the reveal (exit 1, 16)
- `sc205-r3-pin-partition.log` — 6 reaching + 20 excluded, by reason; corrupt-asar guard
- `sc205-r3-pin-subject-scan.log` — the raw 26-rule subject scan the exclusion list was built from

R1 artifacts (`sc205-r1-implementer-report.md`, `sc205-canfail-A..D`, `sc205-gate-*`,
`sc205-appcss-1.13.7-*`) are unchanged and still in the same directory.

## Left for the ticket-owner / dispatcher

- **INFO-1** (harness `.mjs` is neither linted nor tsc'd) and **INFO-2** (`dse-verify` SKILL.md
  has no entry for the two new in-run gates, and does not say `host-copy pin SKIPPED` is expected
  on a machine without Obsidian) were INFO in the review and are outside a worktree agent's remit.
  INFO-2 in particular is a workspace-level doc that will matter to the next agent who sees a SKIP.

STATUS: COMPLETE
