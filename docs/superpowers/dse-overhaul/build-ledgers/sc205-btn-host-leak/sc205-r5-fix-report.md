# SC-205 — round 5 fix report

**Verdict: COMPLETE. All 6 R4 findings addressed (2 MEDIUM, 3 LOW, 1 INFO). Battery green, zero
pixels and zero frozen bytes moved.**

- Branch `sc205-btn-host-leak`, dse submodule. **Commit `c09cf6f1258311b43701a536042744fa325aa202`
  (`c09cf6f`)** on top of `c32bc35`. Not pushed; superproject pointer untouched; tree clean.
- **Harness-only round.** `styles-source.css` is byte-identical to `c32bc35`
  (sha256 `608807cb…`, unchanged) — only `visual-harness/shoot.mjs` and
  `visual-harness/obsidian-host-pin.mjs` changed.
- Obsidian still 1.13.7; `PINNED_OBSIDIAN` unchanged; no re-extraction.

## Disposition

| # | Fix | Where | Proof |
|---|---|---|---|
| **R4-M1** — sheet-listing pin unreachable without a local Obsidian ≥1.13.7 | Extracted to `checkSheetHostRuleListing(model)`, called **first and unconditionally**, before `findObsidianAsar()` and all three `skip()` returns. Both operands are in-repo so it needs no Obsidian. It prints its own `IN-REPO HOST-MODEL CHECK FAILED` header with an in-repo remedy, and the asar-gated skip now reads **`host-copy pin PARTIAL`** and states that the sheet listing *was* checked. | `shoot.mjs` `checkSheetHostRuleListing`, `assertHostCopyPinnedToObsidian` | **can-fail I** — the reviewer's exact scenario: simulated 1.9.0-only machine **and** `button:focus-visible` deleted from the fence → **exit 1**, both lists printed, and `button host-leak OK` appeared **0 times** (sweep never ran). At `c32bc35` this same world was exit 0 and silent. |
| **R4-M2** — partition not exhaustive; comma inside `:is()`/`:not()` made rules invisible to both halves | Three parts: (1) `splitSelectorList()` — depth-aware, used in `partitionButtonRules` **and** `normalizeSelector`; (2) `stripBalancedParens()` — iterative, so nested groups reduce (fixes the subject-level `button:not(:is(.mod-cta))` miss); (3) the durable half — `classifySubject()` returns `plain` / `qualified` / `not-button` / **`unparsed`**, and every `unparsed` fragment is returned in `partitionButtonRules().unaccounted` and **fails the pin by name**. | `obsidian-host-pin.mjs` `splitSelectorList`, `stripBalancedParens`, `classifySubject`, `subjectIsPlainButton`, `partitionButtonRules`; `shoot.mjs` drift loop | All 7 R4-M2 cases re-run through the real exported functions (`sc205-r5-partition-verify.log`): the 4 previously-INVISIBLE selectors now classify **plain**, the qualified ones **qualified**. Real 1.13.7: **6 reaching / 21 excluded / 0 unaccounted**. **can-fail II** — doctored app.css with `.some-new-scope button&.mod-x` → **exit 1** naming the unclassifiable fragment; sweep never ran. |
| **R4-M2 consequence** (new, in-scope) | With the parser fixed, the `@container … .setting-item:not(:is(…)) .setting-item-control button:not(.clickable-icon)` rule became visible as **reaching**. Per **ruling 6** the settings tab is SC-202's surface, so it gets an explicit documented exclusion entry (`/\.setting-item-control$/`) naming SC-202 and saying what to delete if SC-202 ever takes it on. It was out of scope *by accident*; it is out of scope *on purpose* now. | `obsidian-host-pin.mjs` `EXCLUDED_ANCESTOR_SCOPES` | Excluded **20 → 21**, reaching still **6**, unaccounted **0**. No coverage was added to the gate. |
| **R4-L1** — drift remedy wrong for a sheet-listing drift | The two drift classes print separate remedies. In-repo: "Obsidian is NOT involved and nothing needs re-extracting… fix the sheet or the model, in one commit." Obsidian-side keeps the re-extract instruction and adds: an unclassifiable-selector line means *teach the parser*, do not re-extract around it. | `shoot.mjs`, both error blocks | Verbatim in can-fail I (in-repo remedy) and can-fail II (parser remedy) logs. |
| **R4-L2** — "three of the six rules only ever fire in the other two" | Corrected to **two** (`button:hover`, `button:focus-visible`), with the remaining four accounted: three fire at rest (base, `:not(.clickable-icon)`, and the `[disabled]` group — R1's can-fail measured that group under `rest`), and forced-colors fires in no state this harness renders. | `shoot.mjs` `BTN_STATES` comment | Text. |
| **R4-L3** — the mount superposition's soundness dependency unrecorded | Recorded in the `CHROME_REVEAL_CSS` comment (naming the rule at `styles-source.css` ~:12856 and what to do instead if the constraint breaks) **and enforced**: `checkCollapseCascadeAssumption()` scans the sheet the harness already reads and fails the gate if any `[data-dse-collapsed]`-keyed rule ever reaches a button. Runs in the same unconditional in-repo block, no extra navigation, no browser work. | `shoot.mjs` `CHROME_REVEAL_CSS`, `checkCollapseCascadeAssumption` | Passes on the current sheet (0 offenders) across the full battery; the reviewer's grep independently confirmed the four collapsed-keyed rules target root/container only. |
| **R4-INFO** — unguarded `readFileSync`, non-greedy fence regex | Sheet read wrapped in try/catch → a loud pin failure, not `FAIL sweep (exception)` taking the sweep and print-twin parity with it. Marker counting asserts **exactly one** opening and one closing fence; a duplicated block is an error rather than silently pinning the first. | `shoot.mjs` `checkSheetHostRuleListing` | Both paths return drift lines rather than throwing (code-inspectable; the count assertion runs on every gate invocation). |

## Gate numbers (at `c09cf6f`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 (only the pre-existing `.eslintignore` deprecation warning) |
| `npx jest` (after `rm -f main.js styles.css`) | **3257 passed / 1 skipped / 3258 · 184 passed + 1 skipped = 185 suites · 3 snapshots**, exit 0, load 3.32 |
| `npm run shots` (full) | **474 PNGs, 0 FAIL**, exit 0 |
| `check-freeze.sh` | **`freeze OK (210/210 …)`, exit 0**, 0 mismatches |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 |
| print-twin parity | `OK (118 capture ids byte-identical)` |

**Jest and parity were run rather than reasoned away.** The peer's brief allowed skipping both
(jest: no `.ts` touched; parity: neither `.mjs` is a harness-bundle input, and
`styles-source.css` is byte-identical to the already-parity-verified `c32bc35`). Both
reasonings hold, and both gates were run anyway — they are cheap and this is the closing round.

### Gate OK lines

```
host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.13.7; 21 further rules whose subject is a plain button were excluded by documented ancestor scope, 0 unclassifiable — see EXCLUDED_ANCESTOR_SCOPES)

button host-leak OK (111 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 666 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)
  12 of those (kind,state) records sampled the node at rest because the mounted DOM cannot put it into that state …
      8× focus-visible: disabled
      2× hover: no point in its box hit-tests to it (clipped by an ancestor overflow, or covered)
      2× focus-visible: visibility: hidden
```

Sweep numbers are unchanged from `c32bc35` (111 / 666 / 12 / 0 diffs), as expected — this round
touched the pin's parser and the pin's ordering, not the sweep.

## Process

Every perturbation was reverted **from sha-verified file backups, never `git checkout <path>`**
(the R3 lesson). Pre-perturbation shas captured in `sc205-r5-restore-shas.txt`; post-restore
verification: `styles-source.css` back to `608807cb…` (identical to `c32bc35`), and the two
`.mjs` files back to their pre-can-fail R5 state. No `SC205-CANFAIL` marker and no `sc205-probe*`
file survives in the tree; `git status --porcelain` empty after commit.

## Evidence artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc205-btn-host-leak/`:

- `sc205-r5-gate-shots.log` — full run, 474 PNGs / 0 FAIL, both gate blocks
- `sc205-r5-gate-freeze.log` — `freeze OK (210/210 …)`
- `sc205-r5-gate-parity.log` — 0 / 0 / 16
- `sc205-r5-gate-jest.log` — 3257 passed / 1 skipped / 185 suites
- `sc205-r5-canfail-I-fence-no-obsidian.log` — **R4-M1**: 1.9.0-only world + broken fence → exit 1, sweep never ran
- `sc205-r5-canfail-II-unaccounted.log` — **R4-M2**: unclassifiable selector → exit 1 naming the fragment
- `sc205-r5-partition-verify.log` — the 7 R4-M2 classifier cases + real-app.css partition (6 / 21 / 0)
- `sc205-r5-restore-shas.txt` — the sha-verified restore points

R1/R3/R4 artifacts unchanged in the same directory.

## Left for the ticket-owner / dispatcher (unchanged from R3, still open)

- **INFO-1** — `npm run lint` covers `src main.ts` only; neither `visual-harness/shoot.mjs` nor
  `obsidian-host-pin.mjs` is linted, and as `.mjs` both are outside `tsc`. This round added
  another ~120 lines of gate logic with no static checking. Pre-existing condition, outside a
  worktree agent's remit, but the surface keeps growing.
- **INFO-2** — `dse-verify` SKILL.md has no entry for the two in-run gates and does not tell a
  future agent that `host-copy pin PARTIAL` (renamed this round from `SKIPPED`) on a machine
  without Obsidian ≥1.13.7 is expected, not a failure.

STATUS: COMPLETE
