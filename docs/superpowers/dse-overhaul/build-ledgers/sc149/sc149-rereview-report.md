# SC-149 — scoped re-review of the fix round + final rebase

**Verdict: LAND.** Every finding from the first-round adversarial review (H-1, M-1, M-2,
M-3, L-1, L-2, N-1, N-2) is fixed exactly as prescribed and independently reproduced, with
can-fail proofs re-run and confirmed to actually fail without the fix. The `ds-rule`
unregistration matches the orchestrator's ruling and closes the exact failure mode the
review measured. The two rebases (onto `5abfa62`, then onto `23ed677` for SC-141) carry no
lost hunks, no duplicate constants, and their own reconciliation (C1-C3) is real, not
asserted — verified with a second can-fail probe. No new findings.

Reviewer: independent, worktree `/home/scott/code/steelCompendium/worktrees/sc149-ds-scc`,
HEAD `20a78e2` on dse main `23ed677`. No code modified in the worktree itself; two
temporary probe files were added to a throwaway `/tmp` copy of the tree (a reverted-fix
copy for the H-1 can-fail proof and a hand-written `onUpdate` stale-stamp probe), run, and
deleted — worktree `git status` clean, superproject shows only the expected unstaged
`draw-steel-elements` pointer bump.

---

## Battery — reproduced independently at `20a78e2`

| Gate | Result | Exit |
|---|---|---|
| `npm run tsc` | clean, no output | 0 |
| `npm run lint` | clean (only the pre-existing `.eslintignore` deprecation warning) | 0 |
| `npx jest` | **2680 passed / 1 skipped / 2681 total, 164 passed suites (1 skipped) of 165, 3 snapshots** | 0 |
| `npm run shots` | **334 `ok` lines, 0 FAIL** | 0 |
| `check-freeze.sh <shots>` | **`freeze OK (200/200 legacy+print PNGs byte-identical)`** | 0 |
| `npm run parity` (last) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`** | 0 |

Every number matches the impl report's "Battery at `20a78e2`" section exactly.

**Shared workspace baseline untouched.** `.superpowers/sdd/freeze-baseline.sha256` is still
200 lines, md5 `ad1d197aef4794661dd62d21b0075e1d`, no `*.pre-sc149*` backup exists (none was
needed — this branch never edits the baseline). Workspace `git status` shows only
`m draw-steel-elements`; the sc149 worktree superproject carries only the unstaged pointer
bump, matching the impl report.

`obsidian-shots` NOT run (no display), as instructed.

---

## Per-finding verdicts

### H-1 (HIGH) — `ds-scc` renders sb/feature/fb unstyled — FIXED, verified two ways

`RefUnwrapView.mountBase` (`src/elements/shared/RefUnwrapView.ts:305`) re-stamps
`data-dse-element` to the resolved base's id on the success path only
(`if (resolved.id !== this.base.id) root.setAttribute(...)`); error/notice cards keep
`scc` (`errorCard` never touches the attribute). `onUpdate` resets the stamp to
`this.base.id` before re-resolving (`RefUnwrapView.ts:108-112`) — exactly the reviewer's
one-line prescription.

- **Oracle parses the real stylesheet, not a hand-list.** `sccStyleParity.test.ts` reads
  `styles-source.css` from disk (`STYLESHEET = path.join(__dirname, '../../../styles-source.css')`)
  with a brace-depth walk (handles nested `@media`), filters selectors requiring
  `[data-dse-element='<id>']`, and asserts the matching set on a `ds-scc` render equals the
  typed element's — a non-vacuity guard (`length > 0`) on both sides.
- **Can-fail, re-run independently.** Reverted the one-line re-stamp in a scratch copy of
  the tree: all 8 tests in the suite failed (the suite grew from the fix-round's original 6
  to 8 after the final rebase added the real-corpus-ability duplicate row — expected, see
  the impl report's own note on this). Restored the fix: all 8 pass again.
- **`onUpdate` stale-stamp probe (not in the shipped suite — written fresh for this
  re-review).** Rendered a `ds-scc` block against a kit code (root stamped `kit`), then
  called `view.update()` on the SAME view instance with a prepared statblock model: the
  root re-stamps to `statblock`, not left stale at `kit`. Passed.
- Regression coverage also pins the action-spine rule by name and three preference
  variants (`sbDensity`, `sbStats`, `sbColumns`) — all reproduced green.

**Verdict: FIXED, correctly and durably.**

### `ds-rule` — UNREGISTERED per orchestrator ruling — CONFIRMED

Only `registry.register(sccElement)` remains at the old registration site in `main.ts`;
`ruleElement` lives in `src/elements/display/index.ts`'s `INTERNAL_DISPLAY_ELEMENTS`
(harness-only), and `visual-harness/aliases.json` has no `rule` entry (`scc: ds-scc` sits
where the ten used to). Grepped `ds-rule` across `src/`, `main.ts`, `visual-harness/`,
`demo-vault/` (regenerated, checked directly — no hits), `docs/`, `README.md`,
`.repo-docs/`, `CLAUDE.md`: every hit is either internal-machinery description (accurate —
"internal machinery, not public") or an internal string literal (`BASE_BY_ALIAS['ds-rule']`,
`genericNoteAdapter(..., 'ds-rule')`) used only for dispatch bookkeeping, never a
registered code-block language. Public registry is 22 elements, `ds-scc` is the one
reference block. No dangling public-facing claim anywhere.

**Verdict: CONFIRMED, clean.**

### M-3/L-1 — raw-body forms and the error frame — FIXED, verified verbatim

`ElementDefinition.parseHandlesRawBody` (new, `registry.ts`) routes a `parseYaml` failure
to `def.parse(undefined, source)` instead of error-carding with the YAML parser's words
(`pipeline.ts:244-248`); `ds-scc` is the only def that sets it. All five reviewer-listed
bodies are pinned in `sccElement.test.ts` (`test.each`, lines ~283-296) and rendered
end-to-end: the insert modal's own inline-link paste
(`[Panther](scc.v1:mcdm.heroes.v1/kit/panther)`) names the code it contains, a backticked
code says "remove the backticks," a fenced code lands on the same message, a broken YAML
flow sequence reads "not a full SCC code," and a tab-indented code **resolves** (its own
test, `errorText(root)` empty, `data-dse-element` = `kit`). Every case additionally asserts
`text).not.toMatch(/line \d+, column \d+/)` — no parser jargon survives. The six original
pinned messages (empty / inline-YAML / wikilink-@path / bare-slug / `scc.v2:` / trailing
whitespace) are unchanged, each still verified against the rendered `.dse-ref-notice`
DOM, not just the throw (`errorText()` helper explicitly also asserts `.dse-error-card` is
absent).

**Verdict: FIXED, both findings, verified against the actual DOM the user sees.**

### M-1 — `obsidian-camera.mjs` GENERIC_SIDEBAR_IDS — FIXED, coheres with the consumer

`GENERIC_SIDEBAR_IDS` entries are now `{ id, element? }` objects; the `perk` slot is
replaced by `{ id: 'scc', element: 'kit' }`. Read the consumer (`obsidian-camera.mjs`
~1024-1060): `openNote(id, ...)` opens `Harness/scc.md` (a real generated note — verified
present after `npm run shots`, which regenerates the harness); `element` (not `id`) drives
the DOM selector (`[data-dse-element="${element}"]`), which is correct because `ds-scc`
re-stamps the mounted root to `kit` for this note's code (`kit/panther`) — exactly the H-1
mechanism. The comment at `:110-124` explains the markdown-pipe-table coverage the
constant exists for is preserved (kit/panther's real body carries the signature ability's
pipe table). `visual-harness/README.md`'s `--element=` table lists `sidebar-scc` in place
of the stale `sidebar-perk`/`ds-kit` rows (L-2 fixed in the same table).

**Verdict: FIXED, and the fix genuinely relies on the H-1 mechanism rather than working
around it.**

### M-2 — CHANGELOG advertising retired aliases — FIXED

`grep` for all eleven aliases (`ds-kit`, `ds-condition`, `ds-treasure`, `ds-ancestry`,
`ds-culture`, `ds-career`, `ds-class`, `ds-title`, `ds-perk`, `ds-complication`, `ds-rule`)
across `CHANGELOG.md` returns zero hits (the one incidental `ds-conditions` match is an
unrelated, still-public element, not a retired display alias). The rewritten `## 7.0.0`
"compendium reference cards" entry (`:293-301`) now describes `ds-scc` plus the
`ds-sb`/`ds-ft`/`ds-fb` reference forms, correctly drops the bare-slug/`@path`/`[[wikilink]]`
claim for the display families, and the insert-command entry correctly scopes the snapshot
to "(for statblocks, features and featureblocks)." The kit-card entry (`:438`) names "the
kit card," not `ds-kit`. The `ds-scc` FEATURE entry at the top of the release is unchanged
and accurate.

**Verdict: FIXED, coherent with the shipped code.**

### C2/C3 — SC-141 reconciliation — VERIFIED, not just asserted

- **C3.** `referenceAliasForType`/`snapshotAliasForType` route through a single
  `TYPED_FAMILIES` table keyed on the exported `STATBLOCK_TYPE_RE`/`FEATURE_TYPE_RE`/
  `FEATUREBLOCK_TYPE_RE` — the SAME constants `TYPE_ADAPTERS` dispatches on
  (`typeAdapters.ts:238-246`). `grep` for `FEATURE_TYPE_RE\s*=`/`FEATUREBLOCK_TYPE_RE\s*=`/
  `STATBLOCK_TYPE_RE\s*=` across `src/` returns exactly one definition each, all in
  `typeAdapters.ts`; every other consumer imports.
- **C2.** All five of SC-141's `typeToAlias` assertions live on, ported to BOTH
  `referenceAliasForType` and `snapshotAliasForType` in
  `describe('SC-141 type scopes, on both insert lookups (SC-149 C2 port)')`
  (`compendiumSearchModal.test.ts:223-250`), including the substituted
  `nonsense.unknown-type` case (was `ds-rule`, now `ds-scc` — same intent, current answer,
  with a comment explaining the substitution).
- **Invariant test** (`describe('insert routing agrees with TYPE_ADAPTERS about family
  membership (SC-149 C3)')`) consumes the landed regexes via `adapterForType` and the two
  new functions — one set of constants, confirmed by the grep above — over 17 types
  including `ability`/`trait`/`dynamic-terrain`/`dynamic-terrain.mechanisms`, the four that
  moved family without either branch being edited.
- **Can-fail, re-run independently.** Narrowed `FEATURE_TYPE_RE` back to its pre-SC-141
  `/^feature($|\.)/` in a scratch copy and ran the three affected suites: **exactly 10
  tests failed**, matching the impl report's claim precisely.

**Verdict: VERIFIED — the reconciliation is real, and the invariant test would actually
catch a future drift.**

## Rebase integrity

- `FEATURE_TYPE_RE`/`FEATUREBLOCK_TYPE_RE`/`STATBLOCK_TYPE_RE`: exactly one export each,
  SC-141's landed regexes (`FEATURE_TYPE_RE = /^(feature|ability|trait)($|\.)/`,
  `FEATUREBLOCK_TYPE_RE = /(^|\.)featureblock$|^dynamic-terrain($|\.)/`), no duplicates.
- SC-141's stub-twin slug tie-break is present and untouched
  (`src/services/CompendiumIndex.ts:227-248`, "SC-141 fix round (M1)").
- The featureblock shim is intact and unchanged (`src/elements/featureblock/definition.ts`,
  "UNTOUCHED from the pre-D6 shape").
- `20a78e2` itself (the final rebase's own commit) touches only two test files
  (`sccElement.test.ts` +39, `sccStyleParity.test.ts` +24/-7) — no production code, pure
  coverage addition for the corpus shapes SC-141's landing newly makes reachable.
- Full delta diffstat (`23ed677..20a78e2`, 32 files, +1562/-199) reviewed file-by-file for
  `main.ts`, `compendiumInsert.ts`, `CompendiumSearchModal.ts`, `typeAdapters.ts`,
  `RefUnwrapView.ts`, `registry.ts`, `pipeline.ts`, `definition.ts`, `obsidian-camera.mjs`,
  `CHANGELOG.md`, `styles-source.css`: every hunk maps to a named finding or the SC-141
  reconciliation. No collateral changes found.

## What I did not re-verify

- `obsidian-shots` ground truth (no display available) — same limitation as round 1. The
  M-1 fix's correctness was verified by reading the consumer code and confirming the
  generated `Harness/scc.md` note exists and resolves as claimed, not by running the camera.
- Obsidian's own theme chrome for H-1 (verified via jsdom selector-matching against the
  real shipped stylesheet, matching round 1's own caveat about this being theme-independent
  by construction).

## Recommendation

**LAND.** No new findings. All eight round-1 items (H-1, M-1, M-2, M-3, L-1, L-2, N-1, N-2)
are closed with evidence, not just assertion; the `ds-rule` call matches the orchestrator's
ruling and is independently justified by the same empty-card/half-render evidence the
review measured; the two rebases carry no lost work and their own reconciliation logic
(C1-C3) is real and covered by a passing invariant test with a genuine can-fail proof.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc149/sc149-rereview-report.md`
