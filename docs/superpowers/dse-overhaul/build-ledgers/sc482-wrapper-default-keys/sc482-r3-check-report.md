# SC-482 r3 scoped check — the MEDIUM-1 fix and the FormModal interaction

Reviewer R (agent acc2988fc38efadbd). Reviewed dse `9f6d247` (r3 commits 90de644, 4f112c5 and 9f6d247, on `54f8f88`) and superproject `9d9c945` (on `46ae296`).

## Executive summary

- **Verdict: FIX-REQUIRED.** 1 MEDIUM (new), 0 BLOCKER/HIGH/LOW, 5 INFO.
- **MEDIUM-1 is fixed.** Probed through the real write path plus a re-render, and in real Obsidian 1.14.4:
  - counter `title: Deaths`, + then − → `{}`, which re-renders (ZZ482R2-C1 now ok);
  - negotiation, party and encounter: a mapping source → `{}`, which re-parses;
  - montage and project: a blank source → `''`.
- **MEDIUM-2 (new).** A source that holds only a `prefs:` map (plus keys the element ignores) and returns to its defaults is written as `prefs: … \n{}`. That is invalid YAML, so the block becomes an error card. Seen in real Obsidian for counter and montage, and in jest for negotiation. The same probe on 54f8f88 renders fine.
- **Byte check against bc4a0c5:** 54,666 cases match the r1 oracle. The other 8 are encounter `{}` sources, which now write `{}`, the shape the ruling prescribes for a mapping source.
  - The head's output is identical to r1's head on all 54,674 cases.
  - It differs from r2 on exactly those 8 cases (`''` → `{}`).
- **Mutation tests:** 18 of 19 mutants go red. The survivor (the `kept !== dto` guard dropped) is equivalent now; see INFO-1.
- **FormModal claim verified.** Of the 7 SC-482 elements, only stamina-bar has a schema form; the other 6 open the raw textarea, which Save writes verbatim.
  - A stamina-bar Save that clears every field is blocked, because `max_stamina` is required.
  - Clearing every field except `max_stamina` writes a body that re-parses.
- **Range-diff:** commits 1–8 are identical (`=`) to 053b625; 9–11 are the r3 commits. The superproject CHANGELOG has 0 conflict markers, and the SC-483 and SC-482 bullets are both present.
- **Targeted jest:** 507/507 on the 11 touched suites plus `test/dom/authoring/`.
- **The implementer's `j-*` logs:** every rc is 0, and each summary matches the expected numbers:

  | Gate | Result |
  |---|---|
  | jest | 5682 / 1 / 237 of 238 (= 5601 + 81 branch tests) |
  | lifecycle | 31/31 |
  | e2e | 95/98, 0 failed, 3 known-bug, 66/66 |
  | shots | 580, plus both text-scale lines |
  | freeze | 280/280 |
  | parity | 0/0/24 |

## Findings

### MEDIUM-2 — a `prefs:`-only source that returns to its defaults is written as invalid YAML
- **Where:** `stringifyOmittingUntouched` (`src/elements/shared/undeclaredDefaults.ts`) returns `{}` for a mapping source, and the serializer wrappers then put the re-emitted keys in front of it:
  - `src/framework/prefOverrides.ts:145` and `:152`: `stringifyYaml({ prefs }) + serialize(model)`
  - `src/framework/chrome/collapsedKey.ts:265`: `stringifyYaml(missing) + body`

  The result is `prefs:\n  sbDensity: compact\n{}`, which YAML rejects: "Implicit map keys need to be followed by map values".
- **Failure scenario** (real Obsidian, run `20261022-033948-541c`):
  - A ```` ```ds-counter ```` body of `prefs:\n  sbDensity: compact\ntitle: Deaths`. Press + then −, then reopen the note. The block shows `Counter: failed to render (parse)Implicit map keys need to be followed by map values at line 3`.
  - The same happens for a ```` ```ds-montage ```` whose body is only `prefs:\n  sbDensity: compact`, after End round 1 then Back to round 1.
  - In jest (real pipeline), negotiation `prefs:` only, slot 3 then slot 5, gives the same error.
  - On base `54f8f88`, the same spec passes 4/4: the full default block is written after the `prefs:` lines.
- **The collapse-key variant:** montage `collapsed: false` gives `collapsed: false\n{}`. It re-renders only because the pipeline's `peelLeadingCollapseKeys` rescue happens to catch it (jest probe); it is still not the shape the user wrote.
- **History:** r1's `{}` had the same latent problem, which I did not probe in r1. r2's `''` avoided it but broke the elements that throw on an empty body (MEDIUM-1). r3 brings it back.
- **Reachability:** narrow. The block must declare none of its own keys besides the reserved `prefs:`/collapse keys. The result is a broken block until the user hand-edits it, so it is the same class as MEDIUM-1.
- **Prescribed fix:**
  - Change both wrappers (framework, not `framework/host/`): when the inner `serialize(model)` body is exactly `{}`, prepend the keys to `''` instead, and `trimEnd()` the result.
  - The written block is still a mapping. The pipeline pops `prefs:` and the collapse keys back out, so `def.parse` receives `{}`.
  - FormModal's serialize path uses the same `withPrefOverrides` and gets the fix for free, with no edit to `FormModal.ts`.
- **Tests:**
  - counter `prefs:\n  sbDensity: compact\ntitle: Deaths`, + then − → body `prefs:\n  sbDensity: compact`, and it re-renders with no error card;
  - montage `prefs:` only, End round then Back → the same;
  - montage `collapsed: false`, End round then Back → body `collapsed: false`.

### INFO-1 — an equivalent mutant
- Dropping `kept !== dto` from the empty-body guard in `stringifyOmittingUntouched` leaves 507/507 green.
- It is equivalent: only a parsed blank-source instance enters `blankSource`, and such an instance always has a non-empty record, so `kept !== dto` already holds. The guard is redundant; removing it is optional.

### INFO-2 — a blank fence comes back with one empty line
- Real Obsidian (ZZ482R3-M2): a ```` ```ds-montage ```` fence with no body lines, after End round then Back, comes back as the fence, one empty line, then the closing fence. It still renders.
- This is the host splice of an empty body, and `framework/host/` is off limits. The r2 montage write-path test starts from one empty line, so it cannot see this. Cosmetic.

### INFO-3 — FormModal claim verified (code read plus probe)
- Code: `FormModal.ts` `onOpen` sets `rawMode = !this.def.schema || fields.length === 0`, and `currentBody` returns `this.rawText` verbatim in raw mode.
- Schemas: `grep '^\s*schema:'` finds one only in `stamina-bar/definition.ts`; counter, project, montage, party, encounter and negotiation have none.
- Probe (temporary `test/dom/authoring` test, deleted afterwards), clearing every text field of the stamina form:
  - with `max_stamina` cleared too, `canSave()` is false and nothing is written;
  - keeping `max_stamina`, minimal → `max_stamina: 20`;
  - full → `collapsible: false\ncollapse_default: true\nmax_stamina: 20\nstyle: sheet`;
  - with prefs → `prefs:\n  sbDensity: compact\nmax_stamina: 20`;
  - every written body re-parses.
- The 8 new interaction tests cover stamina-bar's form and the raw path that the other 6 share.

### INFO-4 — a pre-existing raw-editor inconsistency (not SC-482; code read, not probed)
- Raw-mode `revalidate` parses `parseYaml(rawText) ?? {}`, so an empty textarea validates. The pipeline then parses the empty body as `null`, and counter, negotiation, party and encounter throw on it.
- Saving a blank raw body for one of those elements would error-card the block. This belongs to FormModal / SC-483; the owner may file it.

### INFO-5 — commit count slip in the implementer's report
- The r3 report says 10 commits; there are 11 on 54f8f88 (6 r1 + 2 r2 + 3 r3).

## Probes run

1. **Empty-body write path plus re-render** (jest, real `ElementPipeline` and `ReadingModeBlockHost`; `r3probe.json`):

   | Case | Written body | Re-render |
   |---|---|---|
   | counter typo | `{}` | ok |
   | negotiation typo | `{}` | ok |
   | montage blank | `''` | ok |
   | montage `{}` | `{}` | ok |
   | montage `collapsed: false` | `collapsed: false\n{}` | ok (rescued) |
   | **counter prefs** | `prefs…\n{}` | **error** |
   | **negotiation prefs** | `prefs…\n{}` | **error** |
   | **montage prefs** | `prefs…\n{}` | **error** |
   | encounter `{}` | `_computed` only | ok |

   Model level: `serialize(parse({}))` is `{}` and re-parses for all 6 elements. `serialize(parse(null))` is `''` for montage and project; the other four throw on null at parse.
2. **Real Obsidian 1.14.4:**
   - Head, run `20261022-033948-541c`: C1 ok, C2 FAIL, M1 FAIL, M2 ok.
   - Base 54f8f88: 4/4 ok.
   - The temporary spec and fixtures were deleted, and the scratch base worktree removed.
3. **Byte check:** the same probe and oracle as r1, against r1's stored bc4a0c5 dump.
4. **Mutation tests** against 11 suites (baseline 507 passed):

   | Mutant | Failed |
   |---|---|
   | undef-as-present | 5 |
   | presence-after-parse | 14 |
   | identity-compare | 57 |
   | reference-snapshot | 45 |
   | counter name_height | 24 |
   | montage wrong owner | 9 |
   | negotiation pitfall map | 1 |
   | negotiation nested record | 24 |
   | encounter monsters | 2 |
   | project rolls | 3 |
   | party unwrapped | 6 |
   | stamina style | 18 |
   | blank guard dropped | 7 |
   | empty-body return dropped | 5 |
   | `kept !== dto` dropped | **0** (equivalent, INFO-1) |
   | undefined counted as content | 1 |
   | blank never recorded | 5 |
   | blank inverted | 11 |
   | negotiation `''` guard re-added | 2 |

5. **Form Save probe:** see INFO-3.

## Tree state

- Plugin `git status --short`: empty.
- Superproject worktree: ` M draw-steel-elements`, the same as at the start.
- Scratch worktrees removed and pruned. dse origin/develop is still 54f8f88; superproject origin/main is still 46ae296.

## Artifacts

Folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r3-check-acc2988fc38efadbd/`

- Write-path probe: `zzR3Probe.test.ts`, `r3probe.json`
- Form Save probe: `zzR3FormProbe.test.ts`, `r3form.json`
- Real-Obsidian probes: `zz482r3-probe.e2e.ts`, `e2e-r3.log`, `e2e-notes.jsonl`, `e2e-r3-base.log`, `e2e-notes-base.jsonl`
- Byte check: `probe-head.json`, `compare.log`
- Mutation tests: `mutate3.sh`, `mutate-results.txt`, `mut-*.log`
