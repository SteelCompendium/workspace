# SC-391 R2 independent review: dse `sc391-scc-prose-renderers` @ `9eb5ffa3` (base `4b233886`)

## Executive summary
- **Verdict: LAND.** 0 BLOCKER, 0 HIGH, 0 MEDIUM, 3 LOW, 5 INFO. No finding blocks landing. LOW-1 (stale counts and comments) can go into the planned `.repo-docs/architecture.md` fold.
- origin/develop has not moved: it is still `4b233886`, so no rebase is needed. The R1 worktree is clean at `9eb5ffa3` before and after this review.
- Corpus probe, base vs head over all 3093 md-dse files (`adapterForType` alias, `baseForSccType` id, reference fence, snapshot fence): **exactly 219 files changed resolution, all `null -> ds-prose/prose`**. Nothing else moved. At head, 0 files are left without a renderer. `type: monster` resolves only for the 51 group-lore files. All 527 `statblock` and 121 `featureblock` files are unchanged.
- I rendered all 219 prose files through `ds-scc` in jsdom: 219/219 give `data-dse-element="prose"`, no notice and the right plain eyebrow. 24 chapters are compact, at most 775 chars of markdown each; `for-the-director` (now 183 KB) gets 353 chars. 2 empty chapters render title-only with no link. `monsters.md` shows the link only.
- Mutation test: 7 source mutations, each caught by the new tests (control 304/304 green).
- Gates (my runs): tsc and `tsc -p e2e` clean · lint clean · jest **14805 passed / 1 skipped** (shots cache present; same as R1; base fresh is 14730/2) · e2e **`845/854 ok, 0 failed, 9 known-bug, coverage: 487/487 pairs`** (PROSE-C01/C02 ok) · shots **636** (592+44) · freeze **280/280** · parity **0 / 0 / 24** · styles.css sha `a4dfc387…` is **byte-identical to a clean base build** (I built base myself). Lifecycle skipped (reason in §Gates).

## Findings

### LOW-1: stale family counts and one false comment
- `AGENTS.md:74` still says "the eleven display elements" and lists 11 aliases. Fourteen lines later (`:88`), R1's text says "a twelfth". The same file contradicts itself.
- `.repo-docs/integration.md:129` says "the 11 internal `displayFamily()`/`genericCard()` definitions". It is 12 now. `withReference` wraps prose too.
- `.repo-docs/architecture.md:192` says "the eleven D6 reference cards". The owner already ruled to fold this into the next round.
- `src/elements/display/index.ts:173` says "eleven display fixtures". The harness now mounts twelve.
- `src/elements/project/view.ts:95` says "No adapter exists for the `project` SCC type (typeAdapters.ts)". **This is now false.** Behaviour is unaffected because `resolveGoal` reads `entity.body()`, not `.model()`. But the comment's reasoning will mislead whoever builds SC-704.
- Failure scenario: none at runtime. The risk is that an agent trusts the router or the comment.
- Fix: change eleven to twelve (or drop the counts) in the four places. Reword `project/view.ts:95` to: "the `project` type resolves to the internal prose family (SC-391), whose model is a `GenericNote`; this reads the body directly".

### LOW-2: title-only (empty) chapter card keeps an empty strip under the head
- Seen in `visual-harness/shots/prose-chapter-empty--steel-{dark,light}.png`. The head's bottom divider is drawn, then about 35 CSS px of empty card padding follows.
- Failure scenario: it reads as "a body that failed to load" rather than a deliberate title-only card. It affects 2 entries: `the-summoner-class` and `the-beastheart-class`.
- The cause is the shared card shell (`DisplayCardView` with zero bands), not prose code.
- Fix: owner's call. Either accept it as is (2 entries; mention to Scott next to the `monsters.md` link-only card), or suppress the head divider and bottom padding when a composition yields zero bands. If you change it, rerun shots and freeze to prove no frozen fixture has zero bands.

### LOW-3: `firstParagraph` (`src/elements/display/prose.ts:69-75`) is a blank-line splitter, not a markdown parser
- It splits on `\n\s*\n` and skips blocks that start with `#`, `|`, `>`, a list marker, a fence or `<`. Three cases slip through:
  - A setext heading (`Title\n=====`) is returned as the "paragraph".
  - A fenced block that contains a blank line is split, and its second half can be returned as a paragraph.
  - A paragraph that starts with inline HTML is skipped.
- Measured: none of these occur today. All 24 non-empty chapters give a correct first paragraph (list in §Probes).
- Fix: optional. Either note the limits in the doc comment, or skip blocks that sit inside an open fence (track fence state) and treat a block whose second line is `=+`/`-+` as a heading. A one-line test for the fence case would pin it.

### INFO-1: two chapters' "first paragraph" is a fiction epigraph, not a summary
- `the-beastheart-and-the-faeries` ("Lives lay in moments wasted…") and `the-summoner` ("The process by which essence…").
- This comes from the content, not a bug. Mention it to Scott together with the `monsters.md` link-only card.

### INFO-2: upstream steel-etl linker splits words around scc links (pre-existing, out of scope)
- In the corpus, 20 files have a link that starts mid-word.
- Prose examples: `l[and prone](scc.v1:…/condition/prone)` ×4 (`movement/climb-or-swim.md:31,34`; visible in `prose-movement--steel-light.png` as "l" plus a linked "and prone"), `r[ranged]`, `n[stability]`, `m[patience]`.
- Statblocks: `G[, prone]` 42, `K[, prone]` 39, `E[, prone]` 39.
- SC-391 makes the prose instances visible to users for the first time.
- Fix: a steel-etl Backlog ticket for the owner to file, linked to SC-391.

### INFO-3: "Open chapter" was only exercised as a Reading-view click
- e2e PROSE-C02 clicks it in real Obsidian 1.14.4.
- Not exercised: hover preview, Ctrl/Cmd-click to a new tab, and Live Preview.
- The anchor has the same shape that `rewriteSccAnchors` produces (`a.internal-link` + `data-href`), so it should behave the same as existing scc links. This is untested here, not a defect.

### INFO-4: `CompendiumIndex.getEntity().model()` now returns a `GenericNote` for the 219 prose codes (it was `undefined`)
I checked every `.model()` caller and none changes behaviour:
- `hero/resolve.ts:100` and `hero/view.ts:798`: their `instanceof` guards fail as before, with the same message.
- `compendiumInsert.ts:278`: snapshots for prose types are still refused earlier by `snapshotAliasForType`, which is unchanged (the probe shows `snap: null` before and after).
- `project/view.ts:105`: uses `.body()`, not `.model()`.

The LRU model cache can now hold prose bodies, at most 183 KB per chapter.

### INFO-5: plugin registration surface unchanged
- `INTERNAL_DISPLAY_ELEMENTS` is registered only by the visual harness (`visual-harness/entry.ts:2216`). `main.ts` never registers `ds-prose`, so no user-facing `ds-prose` fence, `/ds` suggestion or schema entry exists.
- `BASE_BY_ALIAS['ds-prose']` (`scc/definition.ts:177`) is the only plugin-side hook.
- No CSS rule anywhere is scoped to `data-dse-element='rule'` or `'prose'`, so prose loses no rule-card styling.
- The family id is `prose`. It is pinned by test and by mutation M3.

## Spec checks (brief §2)
1. **Nine types render via `ds-scc`, with plain eyebrow and crest.** Confirmed by the jsdom corpus render (219/219) and by 11 harness shots.
   - Eyebrow counts: Skill 57, Monster group 51, Saint 28, Chapter 26, Project 16, Movement 13, Negotiation 12, God 11, Skill group 5. The eyebrow guard never suppresses one in the corpus.
   - An unknown type still shows "has no renderer": tested by `sccElement.test.ts` on a real unclaimed-type file, and by mutation M2.
   - `statblock`, `rule`, `dynamic-terrain`, `kit` and the rest resolve exactly as before (corpus probe: 0 non-prose changes).
2. **`monster` matching is exact.** `PROSE_TYPE_RE` is anchored. Mutation M2, which removes the anchors, fails 2 tests. In the corpus, `monster` = 51 files, all `monster/group/*`.
3. **Family id is `prose`.** `data-dse-element="prose"` on all 219 rendered roots. No styles.css change (byte-identical to the base build).
4. **Chapters are compact.** First paragraph only. "Open chapter" carries `data-href = <dest>/chapter/<id>.md`, and the real Obsidian click opens it (PROSE-C02). The link is absent when there is no source file (unit test). Empty chapters render title-only, with no band and no link. `for-the-director` (183 KB) gets 353 chars.
5. **Inline `scc.v1:` links inside prose bodies are rewritten.** This happens through the same `renderMarkdown` wrapper (`framework/view.ts:275`) the rule card uses. Unit test on `negotiation/discovery`; shots show the links rendered.
6. **The tests are not vacuous.** Mutations on a throwaway copy, 304 SC-391-touching tests each run:

   | Mutation | Failing tests |
   |---|---|
   | M0 control | 0 failed (304 passed) |
   | M1 drop the prose adapter (the src revert) | 50 |
   | M2 unanchored regex | 2 |
   | M3 id `negotiation` | 19 |
   | M4 chapters render full body | 2 |
   | M5 link without `data-href` | 1 |
   | M6 constant eyebrow | 21 |
   | M7 `genericCard` ignores `layout` | 11 |

7. **Gates:** see §Gates.
8. **Screenshots.** I viewed every R1 shot (skill, skill-group, monster, saint, god, chapter, chapter-empty, project, movement, negotiation, inline default), plus 4 probe shots I made: the 6-column `monster/group/animal` table, the 22 KB `project/imbue-treasure`, `chapter/monsters` (link only) and `chapter/monster-basics` (opens with a blockquote).
   - Every card has its crest and its eyebrow. The inline default has no type, so it correctly shows no eyebrow.
   - No table overflows at harness width. The 6-column animal table wraps inside its rounded border.
   - Headings inside the card are modest: `####` is bold body-plus size, and `######` is smaller and regular weight ("Climbing Other Creatures", "Crafting Skills Table").
   - No broken layouts. The only empty-looking card is LOW-2.
   - Colours: links are teal, a dark blue-green on the light scheme and a light cyan on the dark scheme, and always underlined, so they don't rely on colour alone. Body text is near-black on light grey, or light grey on charcoal. Eyebrows are small grey caps after a grey diamond.
   - Not checked: a real-Obsidian theme (`obsidian-shots` was not run; no display).
9. **User-facing docs are truthful:** `docs/compendium-sync.md` (what renders), `docs/index.md`, `docs/advanced-usage.md` ("every kind of entry in today's compendium renders" is true per the corpus probe), `docs/migrating-to-7.md`, README and CHANGELOG. The internal/agent docs have stale counts (LOW-1).

## Gates (measured by me, at `9eb5ffa3`)

| Gate | Result | CURRENT @ `4b233886` | R1 |
|---|---|---|---|
| tsc (+ e2e) | clean, rc 0 | clean | clean |
| lint | clean, rc 0 | clean | clean |
| jest | 14805 / 1 skipped (cache present) | 14730 / 2 fresh | 14805 / 1 |
| e2e | `845/854 ok, 0 failed, 9 known-bug, coverage: 487/487 pairs`, rc 0 | 843/852, 486/486 | same as mine |
| shots | 636 PNGs, rc 0; every host-leak sweep OK; capture clip OK (152) | 592 | 636 |
| freeze | `280/280`, rc 0 | 280/280 | 280/280 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared`, rc 0 | 0/0/24 | 0/0/24 |
| styles.css | `a4dfc387…`, identical to a clean `4b233886` production build | n/a | `a4dfc387…` |

- **Lifecycle not run.** R1 touched nothing lifecycle-relevant. `RefUnwrapView` is not in the diff, and the plugin registry is unchanged (`INTERNAL_DISPLAY_ELEMENTS` is harness-only). The new family mounts through the unchanged `mountBase` path, and it is a read-only card with no write path. R1's 64/64 stands.
- The jest delta is +74 tests: +64 in the dom project (base 12283, head 12347, measured), plus the unit `crestIconValidity` rows.

## Probes (what I ran)
- `probe-{base,head}.json` hold the per-file type, adapter, base, ref and snap at base and at head. The diff gave exactly 219 changes.
- `prose-corpus.json` holds the per-file render result for all 219 prose files through `ds-scc` in jsdom: element, notice, eyebrow, title, markdown chars passed, and link.
- `fp.py` computes chapter first paragraphs for review. It replicates `firstParagraph`.
- Mutation logs `mut-*.log`.
- Throwaway worktrees (base and head, detached) were created under my scratch dir and removed afterwards (`git worktree remove --force`, then `prune`). The R1 worktree status is clean before and after; HEAD is still `9eb5ffa3`. The main checkout's dirt is unchanged (Scott's vault files plus the `draw-steel-elements` pointer, as found).

## Artifacts
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc391-r2-rev-q8m4/`:
- Gate logs: `r2-tsc.log`, `r2-tsce2e.log`, `r2-lint.log`, `r2-jest.log`, `r2-e2e.log`, `r2-shots.log`, `r2-freeze.log`, `r2-parity.log`, `r2-styles-sha.log`, `basebuild.log`
- Corpus probe: `probe-base.json`, `probe-head.json`, `zz-probe.test.ts`
- Corpus render: `prose-corpus.json`, `prose-corpus.log`, `zz-prose-corpus.test.ts`
- Mutations: `mutate.sh`, `mutate-run.log`, `mut-m0-control.log` … `mut-m7-ignore-layout.log`
- Probe shots: `probe-shots/prose-zz-{animal,imbue,monsters,mb}--steel-{dark,light}.png`, `crop-animal-a.png`, `crop-animal-b.png`, `crop-imbue-a.png`
