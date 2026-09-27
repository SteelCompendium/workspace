# SC-272 round 1 — independent review

## Executive summary

- **Verdict: APPROVE_WITH_FIXES.** Reviewed DSE `sc272-rule-eyebrow` at `c296c24` against base `6c4f6aa`.
- **Findings: 0 CRITICAL / 1 HIGH / 1 MEDIUM / 2 LOW / 6 INFO.**
- **HIGH-1:** the site's `typeTitles` map also turns `negotiation` into **"Negotiations"**. The plugin prints "Negotiation" for 7 of the 163 corpus rules, and a new test pins that wrong value.
- **Corpus:** latest release `v4.20260924115314` has 163 rules; the local `data/` copy has the same 163. The plugin now shows 16 distinct group labels plus 1 suppressed eyebrow (`rule/damage/damage.md`). It shows no "Rule" fallbacks and no empty strings. Against the site: 15 of 16 groups match and `negotiation` does not.
- **Owner question on the plurals:** the site's rule tile does go through `typeTitles` (`cards.go:263` → `ruleCard` `:674-675` → `dirToTitle` `build.go:1667-1672` → `typeTitles` `build.go:1412`). The generated site prints Monsters (9), Treasures (5) and Negotiations (7), so "Monsters" and "Treasures" are correct.
- **Owner question on the shots harness:** confirmed that the browser harness cannot render by-SCC cards (`visual-harness/entry.ts:1769-1773`). The evidence came from a jsdom DOM dump styled with the harness CSS, not from a real plugin render. The eyebrow text in it is accurate, but the crest icon is missing and the body is raw markdown (MEDIUM-1).
- **Battery (re-run):** tsc clean, lint clean. jest 4006 passed / 1 skipped / 207 of 208 suites / 3 snapshots, 0 failed. shots 524, 0 FAIL. freeze 260/260 OK (0 frozen bytes moved, so no `rebaseline.txt` is needed). parity 0 GAP / 0 undeclared / 16 DECLARED. All match the implementer's numbers.
- **Tests are non-vacuous:** with `src/` reverted to `6c4f6aa`, 5 tests fail (listed in §4).

## 1. Findings

### HIGH-1 — `negotiation` is missing from the plural override map, and a test pins the wrong value

- `src/elements/display/displayFamily.ts:110-124`: the comment says "Two of that map's entries collide" and the map holds only `monster` and `treasure`.
- steel-etl `internal/site/build.go:1431` has `"negotiation": "Negotiations"`, and `negotiation` is a real rule group (7 files).
- `test/dom/elements/ruleCard.test.ts:287-290` pins `rule.negotiation` → `"Negotiation"` and calls it the "non-overridden control". The comments at `:272` and `:275` repeat the "two" claim.

**Failure scenario:** `ds-scc` / `ds-rule` by SCC on any `mcdm.heroes.v1/rule.negotiation/*` rule, for example `motivation`, shows the eyebrow "NEGOTIATION". The site tile for the same rule shows "NEGOTIATIONS": `v2/docs/Browse/rule/negotiation/index.md` has 7 cards, all labelled `Negotiations`. That breaks the ticket's "match the site's humanization" requirement for 7 of 163 rules.

**Fix:**
1. Mirror steel-etl's `typeTitles` map in full (all 22 entries, verbatim, with a pointer to `build.go:1412`). Adding only `negotiation` would repeat the mistake: this subset already drifted once, and any future rule group named `feature`, `skill`, `project`, `god` and so on would collide in the same way.
2. Flip the `negotiation` test to `"Negotiations"` and use a group that is not in the map as the control, for example `rule.dice` → `"Dice"`.
3. Optionally add a table test pinning all 16 corpus groups to the site labels in §2.
4. Fix the "two entries" wording at `displayFamily.ts:112-120` and `ruleCard.test.ts:272,275`.

### MEDIUM-1 — the evidence screenshots are not a faithful plugin render

- The four PNGs in `evidence/` show the right before→after eyebrow change ("RULE" → "COMBAT") in dark and light, and nothing else differs between before and after.
- However, the crest shield is empty, where the real plugin draws the `book-open` icon. The body is raw markdown (`[adjacent](scc.v1:…)`), where the real plugin renders links. Compare the harness's own `visual-harness/shots/rule--steel-dark.png`, which has the icon and rendered links.
- The images are also 1x, while harness shots are 2x.
- The cause is the jsdom mocks (`setIcon` and `renderMarkdown`), which the implementer's DOM-dump method inherits.

**Failure scenario:** the owner posts these to Scott as "before/after of the rule card". Scott sees a card with an empty crest and a garbled body, and reasonably reads it as a rendering regression.

**Fix (pick one):**
- Crop each PNG to the head only (crest, eyebrow and title), and caption the method honestly: "jsdom DOM + harness CSS; icon/markdown not rendered by the test mocks".
- Produce a real capture with the real-Obsidian camera on a host that has Xvfb, adding a `by-scc-rule` special note modelled on the existing `by-scc-kit` (`visual-harness/obsidian-camera.mjs:96-104`).

Whichever option is chosen, the report should also state the method whenever the images are shown.

### LOW-1 — an `scc:` from a different family on a `type: rule` note sets that family's eyebrow

- `src/services/typeAdapters.ts:175-179` (`sccTypeSegment`) and `:208` accept any middle segment.
- Adapter dispatch uses the frontmatter `type` (`CompendiumIndex.ts:98`), so a note with `type: rule` and `scc: …/feature.trait.fury.level-1/x` reaches `genericNoteAdapter`. Probed results:
  - that scc gives `GenericNote.type = "feature.trait.fury.level-1"` and the eyebrow **"Level 1"**;
  - `…/kit/x` gives the eyebrow **"Kit"**.
- The real corpus never does this, but a hand-authored or miscopied vault note can.

**Fix:** use the segment only when it belongs to the rule family, for example `/^rule(\.[^.]+)+$/.test(segment)`, and otherwise fall back to `fmType`. Add a unit test for the foreign-family case.

### LOW-2 — an `scc:` segment with a trailing dot gives an empty eyebrow

- `scc: …/rule./x` gives `type = "rule."`. `split('.').pop()` then returns `""`, `humanizeRuleGroup("")` returns `""`, and `eyebrow` returns `""` rather than `undefined` or `"Rule"`.
- Before this branch the same thing could only happen with a frontmatter `type: rule.`. Now a malformed `scc` alone reaches it.
- **Fix:** the LOW-1 regex also rejects this case. Independently, `eyebrow` could treat an empty last segment as `'Rule'`.

### INFO

1. **The corpus has 163 rules, not the ticket's 153.** Both the latest release and local `data-unified` have 163 files. All 163 have `type: rule` and an `scc:`, and every scc group equals the file's `rule/<group>/` directory (0 mismatches), so an scc-derived label and a directory-derived label always agree.
2. **`rule/damage/damage.md` is suppressed on purpose.** The group equals the name ("Damage"), so the plugin suppresses the eyebrow (SC-120 ruling 10). The site prints "DAMAGE / Damage". This is an intended divergence, not a bug.
3. **The plural question may need Scott.** `typeTitles` is described as "type directory names to display titles" and was written for landing pages. It leaking onto a single rule's tile ("MONSTERS" over "Swarm") is arguably a site quirk. Matching it is what the ticket asks for, but the owner may want Scott to choose between matching it and filing a steel-etl ticket to make the rule-tile label singular.
4. **Blast radius is contained:**
   - `GenericNote` is produced only by `genericNoteAdapter`, which is used only for rules (`typeAdapters.ts:238`).
   - `GenericNote.type` has two readers: `genericLayout.steel.eyebrow`, and `genericLayout.badges`, which only `renderBase` reads (`CardLayout.ts:477`). `renderBase` never runs for `genericLayout` because the layout has `steel` (`CardLayout.ts:459-461`).
   - Adapter dispatch, `query`/`resolveSlug` filters, insert routing and error text all use `CompendiumEntry.type`, the unchanged frontmatter value.
   - A rule code rendered through `ds-scc` uses the same view, so it gets the group eyebrow too, which is consistent.
   - No other family or class changes.
5. **Tests fail when the fix is reverted:** 5 tests, one more than the implementer's "4 confirmed". The `displaySteelBatchC` case they did not re-run does fail.
6. **The main checkout has uncommitted changes that are not from this work.** `workspace/draw-steel-elements` shows a dirty submodule: `M demo-vault/Welcome.md`, `M justfile`, and untracked `compendium-manifest.json` and `demo-vault/montage 1.md`, all with mtimes of 17:08 before this review started. This review and this branch did not cause them, and I left them untouched. Flagged because deploy recipes abort on a dirty tree.

## 2. Corpus eyebrow tabulation (release v4.20260924115314, real adapter + real `genericLayout.steel.eyebrow`)

| Group dir | Files | Plugin eyebrow | Site tile label | Match |
|---|---|---|---|---|
| character | 10 | Character | Character | yes |
| combat | 36 | Combat | Combat | yes |
| damage | 5 | Damage ×4, suppressed ×1 | Damage | yes (1 suppression is intended) |
| dice | 10 | Dice | Dice | yes |
| downtime | 9 | Downtime | Downtime | yes |
| general | 14 | General | General | yes |
| health | 7 | Health | Health | yes |
| keyword | 17 | Keyword | Keyword | yes |
| monster | 9 | Monsters | Monsters | yes |
| **negotiation** | **7** | **Negotiation** | **Negotiations** | **NO (HIGH-1)** |
| organization | 6 | Organization | Organization | yes |
| resource | 8 | Resource | Resource | yes |
| role | 9 | Role | Role | yes |
| test | 7 | Test | Test | yes |
| treasure | 5 | Treasures | Treasures | yes |
| world | 4 | World | World | yes |

Totals: 163 files. There are 0 "Rule" fallbacks, 0 empty eyebrows and 0 odd casings. The local `data-unified` corpus gives identical rows.

## 3. Fallback probes (real adapter + eyebrow)

| Case | GenericNote.type | Eyebrow |
|---|---|---|
| no scc | rule | Rule |
| scc without `/` (`rule.combat`) | rule | Rule |
| scc `a//b` | rule | Rule |
| scc segment is bare `rule` | rule | Rule |
| scc is not a string (array) | rule | Rule |
| frontmatter `type: rule.dice` + scc combat | rule.dice | Dice (frontmatter wins, as before) |
| frontmatter `type: rule.x.hidden-cover` | rule.x.hidden-cover | Hidden Cover |
| scc `rule.combat.hidden-cover` | rule.combat.hidden-cover | Hidden Cover |
| scc with `scc.v1:` prefix | rule.combat | Combat |
| scc from another family, `feature.trait.fury.level-1` | feature.trait.fury.level-1 | **Level 1** (LOW-1) |
| scc from another family, `kit` | kit | **Kit** (LOW-1) |
| scc `rule.` (trailing dot) | rule. | **""** (LOW-2) |
| group equals name (`rule.negotiation` / "Negotiation") | rule.negotiation | suppressed |
| plural equals name (`rule.monster` / "Monsters") | rule.monster | suppressed |

SC-120's duplicate-title suppression still works: inline "Rule"/"Rule", derived "Combat"/"Combat" and the real `damage/damage` case are all suppressed.

## 4. Non-vacuity

I replaced both `src/` files with their `6c4f6aa` versions, kept the tests, and ran the three test files: **5 failed, 27 passed, 32 total**. The failing tests are:

- `ruleCard.test.ts` › full scc.v1: code and bare slug both resolve…
- `displaySteelBatchC.test.ts` › ds-rule hybrid: eyebrow shows the scc:-derived group…
- `typeAdapters.test.ts` › bare frontmatter type + a scc: code with a namespaced group…
- `ruleCard.test.ts` › "rule.monster" group → "Monsters"
- `ruleCard.test.ts` › "rule.treasure" group → "Treasures"

I restored the files afterwards with `git checkout HEAD -- src/...`, and `git status` was clean.

## 5. Battery (re-run at c296c24, load average around 1.4–4.5)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean (only the existing `.eslintignore` deprecation warning) |
| `npx jest` (after `rm -f main.js styles.css`) | 4006 passed / 1 skipped / 207 of 208 suites / 3 snapshots, 0 failed |
| `npm run shots` | 524 PNGs, 0 FAIL. host-copy pin OK (Obsidian 1.14.2). button host-leak OK (114 kinds × 3 states × 2 themes = 684 comparisons) |
| `check-freeze.sh` (baseline 260 lines) | `freeze OK (260/260 …)`, exit 0. No frozen bytes moved and no rebaseline is needed |
| `npm run parity` | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)` |

`obsidian-lifecycle` was not run: this host has no Xvfb, and the change touches no lifecycle code.

## 6. Hygiene

The DSE worktree tree is clean at `c296c24`, before and after. I moved my probe test files out of the tree before running the battery, and removed the ignored build artifacts that jest wrote (`main.js`, `styles.css`, `main.css`). The workspace superproject shows only the pre-existing submodule dirt from INFO-6.

## 7. Artifacts

Everything is under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/`:

- `sc272-r1-review.md`: this report.
- `review-r1/probe-release.tsv`: per-file corpus tabulation. Columns: path, frontmatter type, scc, GenericNote.type, name, eyebrow.
- `review-r1/zzSc272Probe.test.ts` and `review-r1/zzSc272Edge.test.ts`: the probe sources. They were not committed and are not in the tree.
- `review-r1/edge.log`, `review-r1/revert.log`, `review-r1/jest-full.log`, `review-r1/shots.log`, `review-r1/freeze.log`, `review-r1/parity.log`.
