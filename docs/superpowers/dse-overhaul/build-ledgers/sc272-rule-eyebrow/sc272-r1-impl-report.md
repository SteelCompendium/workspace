# SC-272 round 1 — implementer report

## Executive summary

- **STATUS: DONE**
- DSE branch `sc272-rule-eyebrow`, head `c296c24`, base `6c4f6aa` (== `origin/develop`, no rebase needed — the ledger's cut point was still current).
- Fix: `genericNoteAdapter` (typeAdapters.ts) now derives `GenericNote.type` from the file's own `scc:` code's type segment (e.g. `rule.combat`) instead of always the bare frontmatter `type: rule`; the eyebrow's humanization now also mirrors the site's `typeTitles` plural overrides (`monster`→"Monsters", `treasure`→"Treasures").
- Tests: jest baseline (6c4f6aa) 3997 passed/1 skipped/206 of 207 suites → branch 4006 passed/1 skipped/207 of 208 suites, **0 failed** (net +9 = 5 new + 4 new, plus 2 existing assertions flipped to the new correct value).
- Gates: tsc clean; lint clean exit 0; shots 524 PNGs, 0 FAIL (no fixture added — reason below); freeze `260/260`, 0 frozen bytes moved; parity `0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0`.
- Visual evidence: 4 before/after screenshots (dark+light) produced via a standalone Playwright script over the real compiled Steel CSS, since the browser shots harness cannot render by-SCC cards at all (see Follow-ups).
- No drive-by fixes. Two follow-ups noted below (harness limitation; override-map drift risk).

## 1. Survey (≤10 lines)

`genericNoteAdapter` / `GenericNote` / `TYPE_ADAPTERS`: `src/services/typeAdapters.ts`. `genericLayout.steel.eyebrow` + SC-120's duplicate-title suppression: `src/elements/display/displayFamily.ts`. Confirmed bug: `genericNoteAdapter.fromFile` built `GenericNote.type` only from frontmatter `type:` (always bare `"rule"`); the eyebrow's `m.type.split('.').pop()` could therefore only ever yield `"rule"` → "Rule". Corpus check (`workspace/data/data-unified/en/unified/md-dse/rule/`, 163 `.md` files, all `type: rule`, all carry `scc:`): **16 distinct rule-group `scc:` segments**, all single-level (`rule.<group>`, no `rule.x.y` multi-level in the real corpus) — `character, combat, damage, dice, downtime, general, health, keyword, monster, negotiation, organization, resource, role, test, treasure, world`. `steel-etl/internal/site/cards.go` `ruleCard` (line 674) passes the leaf group DIRECTORY name to `dirToTitle` (`build.go` line 1667), which checks a general `typeTitles` override map (line 1412) before falling back to `titleCase(strings.ReplaceAll(name, "-", " "))` (capitalize each word's first letter, keep the rest, hyphens→spaces). Two `typeTitles` entries collide with real rule-group segments: `monster`→"Monsters", `treasure`→"Treasures" (plural) — every other rule group falls through to plain title-casing. The plugin's own `titleCase` (CardLayout.ts) already matches the site's split/capitalize behavior byte-for-byte; only the override-map collision was missing.

## 2. Implementation

- `src/services/typeAdapters.ts`: added `sccTypeSegment(fm)` (splits `fm.scc` on `/`, returns the middle segment or `undefined` if `scc:` is missing/not a string/has no second segment). `genericNoteAdapter.fromFile` now computes `noteType = fmType.includes('.') ? fmType : (sccTypeSegment(fm) ?? fmType)` — an explicit, already-namespaced frontmatter `type:` (e.g. a hand-authored `rule.combat`) is left untouched (today's behavior for that case, per brief); otherwise the scc-derived group wins when present, else falls back to the unchanged bare frontmatter value.
- `src/elements/display/displayFamily.ts`: added `RULE_GROUP_TITLE_OVERRIDES` (`{monster: 'Monsters', treasure: 'Treasures'}`) + `humanizeRuleGroup()`, and changed `genericLayout.steel.eyebrow` to call `humanizeRuleGroup(...)` instead of bare `titleCase(...)`. SC-120's duplicate-title suppression logic is unchanged (still compares the humanized eyebrow to the title case-insensitively) — updated only the surrounding comments, which previously said this path was unreachable with real data (SC-272 makes it reachable).
- Scope: touched only the `rule.*` adapter/eyebrow path, per the brief's "narrowest change" instruction. `genericLayout.badges` also computes a `titleCase(m.type)` type pill, but it's confirmed dead code (`renderSteel()` never calls `layout.badges` since Steel is the sole theme, per an existing code comment) — left untouched, not in scope.

## 3. Tests

- `test/unit/services/typeAdapters.test.ts` (new file, 5 tests): pins `genericNoteAdapter.fromFile`'s own derivation directly (via `fakeObsidian` helpers, no full pipeline) — scc group wins over bare frontmatter type; missing `scc:` falls back; malformed `scc:` (no second segment) falls back; scc segment itself bare (`"rule"`) falls back; an explicit already-specific frontmatter `type:` wins over a conflicting `scc:` group (precedence/today's-behavior-preserved case).
- `test/dom/elements/ruleCard.test.ts`: flipped the existing by-SCC `opportunity-attack` fixture assertion from `'Rule'` to `'Combat'` (this is the "make at least one test fail on pre-fix code" case — see below) with an updated comment explaining the flip; added 4 new tests — the SC-272 duplicate-suppression case (derived group "Combat" duplicating a name "Combat" → suppressed), plus a 3-test group pinning the site-matching humanization (`rule.monster`→"Monsters", `rule.treasure`→"Treasures", `rule.negotiation`→"Negotiation" as a non-overridden control).
- `test/dom/elements/displaySteelBatchC.test.ts`: same fixture, same flip (`'Rule'`→`'Combat'`) — this file independently pinned the identical bug through a different pipeline path (`ruleElement` mounted directly rather than via `ds-rule`'s slug lookup) and would otherwise have re-encoded the bug right next to the fix.

**Tests that fail on pre-fix code** (verified via `git stash` of only the two `src/` files, keeping all test changes, then `npx jest`):
- `test/unit/services/typeAdapters.test.ts` › "bare frontmatter type + a scc: code with a namespaced group -> type is the scc group..." — `Expected: "rule.dice", Received: "rule"`.
- `test/dom/elements/ruleCard.test.ts` › "full scc.v1: code and bare slug both resolve..." — `Expected: "Combat", Received: "Rule"`.
- `test/dom/elements/ruleCard.test.ts` › `"rule.monster"` and `"rule.treasure"` group humanization tests — `Expected: "Monsters"/"Treasures", Received: "Monster"/"Treasure"`.
- `test/dom/elements/displaySteelBatchC.test.ts` › "ds-rule hybrid..." (same fixture, separate pipeline entry point) — same `"Rule"` vs `"Combat"` failure (confirmed when the full suite was first run post-fix-code/pre-test-fix and caught this second pre-existing pin of the bug; not independently re-run against stashed src, but mechanically identical to the ruleCard.test.ts case above).

Total: 4 confirmed failures out of the 16 tests run in that stash check (`4 failed, 12 passed, 16 total`); the other 12 pass unchanged because they exercise fallback paths whose output is identical whether derived from the (absent/malformed) scc or the bare frontmatter type.

## 4. Visual evidence

The browser shots harness (`npm run shots`, `visual-harness/entry.ts`/`shoot.mjs`) **cannot render any by-SCC/hybrid-mode display card at all** — confirmed by `entry.ts`'s own doc comment: *"There is deliberately NO `scc` fixture: `ds-scc` renders nothing without a synced compendium, and this harness has no `cx.compendium`..."* This is a pre-existing architectural limitation of the browser harness (not introduced by this ticket, not fixable within its narrow scope) affecting every display family, not just rule — flagged as a follow-up below. The real-Obsidian camera (which does have a seeded compendium) needs Xvfb, which is **not installed in this environment** (`which Xvfb` empty, no `dpkg -l | grep xvfb` hit), so `npm run obsidian-shots` could not be run here either, and using Scott's live `:1` display for a capture was avoided per the skill's guidance.

Instead: a temporary (uncommitted, deleted before the final commit) jest test dumped the real production DOM (`ElementPipeline` + real services + the real `rule/combat/opportunity-attack.md` fixture, identical to `ruleCard.test.ts`'s own by-SCC test) to an HTML fragment, once against pre-fix `src/` (via `git stash`) and once against the fix. A standalone (uncommitted) Playwright script then wrapped each fragment in the harness's own already-built, unaffected-by-this-ticket CSS (`visual-harness/vars.css` + `visual-harness/dist/harness.css` — this ticket changes no CSS) and screenshotted the `.dse-card` element, dark and light, for both versions. Verified: the before/after HTML diff is exactly the one `dse-head__eyebrow--left` text node, `Rule`→`Combat`; nothing else moved.

Evidence files (all under `.superpowers/sdd/sc272-rule-eyebrow/evidence/`):
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/evidence/sc272-rule-eyebrow-before-dark.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/evidence/sc272-rule-eyebrow-before-light.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/evidence/sc272-rule-eyebrow-after-dark.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/evidence/sc272-rule-eyebrow-after-light.png`

## 5. Gates

| Gate | Baseline (`6c4f6aa`) | Branch (`c296c24`) |
|---|---|---|
| `npm run tsc` | — | clean |
| `npm run lint` | — | clean, exit 0 |
| `npx jest` | 3997 passed / 1 skipped / 206 of 207 suites / 3 snapshots | **4006 passed / 1 skipped / 207 of 208 suites / 3 snapshots, 0 failed** (net +9) |
| `npm run shots` | — | **524 PNGs, 0 FAIL** (unchanged — no new fixture; see §4 for why one wasn't added) |
| `check-freeze.sh` | — | **`freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 — 0 frozen bytes moved |
| `npm run parity` | — | **16 DECLARED, 0 GAP mentions, exit 0** (composition unchanged from the skill doc's documented 8-finding/16-row set) |

`obsidian-lifecycle` skipped per brief (no lifecycle code touched). `obsidian-shots` not run (no Xvfb in this environment; see §4).

## 6. Drive-by fixes

None.

## 7. Follow-ups (for the ticket-owner to decide whether to file)

1. **Browser shots harness cannot render any by-SCC/hybrid display card.** `visual-harness/entry.ts` has no `cx.compendium` by design, so there is no way to get a deterministic, freeze/widen-eligible capture of `ds-rule` (or any other display family) in hybrid mode — the only regression coverage for this whole code path is jsdom (`ruleCard.test.ts`, `displaySteelBatchC.test.ts`) plus one-off evidence captures like this round's. Worth a ticket if by-SCC visual regression coverage is wanted (either wiring a minimal compendium into the browser harness, or a documented real-Obsidian-camera equivalent — the camera already has one working precedent, `by-scc-kit` in `obsidian-camera.mjs`).
2. **`RULE_GROUP_TITLE_OVERRIDES` is a hand-maintained mirror of a subset of steel-etl's `typeTitles` map**, limited to the two entries (`monster`, `treasure`) that collide with today's real rule-group corpus. If steel-etl's `typeTitles` map ever gains a new override that also collides with a future rule-group segment, this mirror will silently drift out of sync with the site with no automated cross-repo check. Not fixed here (a genuine design tradeoff, not an obvious bug) — flagging in case Scott wants a stronger guarantee later (e.g., a test that cross-checks against a generated snapshot of steel-etl's map, or generating this table at build time).

## 8. Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/sc272-r1-impl-report.md`
- Evidence screenshots: listed in §4 above.
- Jest logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-jest-baseline-20260924.log` (baseline), `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-jest-full-20260924b.log` (branch, final green run).
- Shots log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-shots-20260924.log`.
- Parity log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-parity-2.log`.
- No `rebaseline.txt` — 0 frozen bytes moved.
