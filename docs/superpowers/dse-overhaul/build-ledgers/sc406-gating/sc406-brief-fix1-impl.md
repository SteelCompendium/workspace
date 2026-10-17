# SC-406 fix round 1 — implementer brief

Same worktree, branch, footguns and gate battery as your r1 brief (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/sc406-brief-r1-impl.md) — re-read its sections 1, 3 and Footguns. Head is your `3fddf49`. First confirm `git -C /home/scott/code/steelCompendium/worktrees/sc406-gating/draw-steel-elements fetch origin` still shows origin/develop at `f8693b5`; if it moved, rebase and note the sha. Workers never call the tracker. `git -C <abs path>` for every git command; commit after each fix.

Ledger (read the "Owner rulings on r1 review" section): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/decisions.md

## Fix exactly these four findings — verbatim from the independent review (sc406-r1-review.md)
### MEDIUM-1 — an off-state write deletes a per-block `printPreview` override from the note
- **Where**:
  - `src/framework/prefOverrides.ts` `extractPrefOverrides` drops unknown keys. With the switch off, `printPreview` is unknown.
  - `withPrefOverrides` re-emits only the validated bag.
  - `src/framework/pipeline.ts:616` wires that wrapper.
- **Scenario** (reproduced in jest P2 and in real Obsidian phase C): a vault from the 7.0.0 betas has this block:
  ```
  ```ds-counter
  prefs:
    printPreview: "on"
    reduceMotion: true
  …
  ```
  - The user upgrades to the release (switch off) and clicks +.
  - The block is rewritten with `prefs:\n  reduceMotion: true` only, and the `printPreview` line is gone from the file.
  - If `printPreview` was the only key, the whole `prefs:` map is removed.
  - Turning `experimental` on later cannot bring it back. This breaks the brief's "toggling on→off→on loses no data in blocks". It also writes to user note bytes, which is worse than the `data.json` case.
- **Fix**:
  - While `!isExperimental()`, have `extractPrefOverrides` route keys in `EXPERIMENTAL_PREF_KEYS` into a separate pass-through bag. Keep the existing warning, but do not apply them.
  - Have `withPrefOverrides` re-emit `{...applied, ...passthrough}`, ideally in the author's original key order.
  - Do not widen this to all unknown keys. Typo keys are dropped on write today, and the ON state must stay as it is today.
  - Test: an off-state `ds-counter` write keeps `printPreview: "on"` in the note. An on-state write is byte-identical to develop.

### MEDIUM-2 — a prefs save while off drops stored gated prefs from `data.json` (owner's FOLD item 2, confirmed and sized)
- **Where**: `src/framework/seams/prefs.ts:192-201`. `persist()` builds the snapshot from `descriptorMap` only and then overwrites `persistedSnapshot`.
- **Measured**:
  - Jest P3: `{printPreview:'on', authoringControls:true, textScale:1.2}` becomes `{reduceMotion:true, textScale:1.2}` after a single `prefs.set`.
  - Real Obsidian phase A: `prefs: {}` after `set('reduceMotion', false)`.
  - Phase C shows that a block write alone does not drop them; only a prefs save does.
- **Fix**: in `persist()`, carry forward undescribed keys from the previous snapshot:
  ```ts
  for (const [k, v] of Object.entries(this.persistedSnapshot)) if (!this.descriptorMap.has(k)) snapshot[k] = v;
  ```
  - That generic form also changes ON behaviour for retired or stale keys, which today are dropped on save. To keep ON exactly as today, scope it instead:
    - add a store option or method, e.g. `prefs.retainUndescribed(EXPERIMENTAL_PREF_KEYS)`, called from `initializeElementFrameworkV2` only when the switch is off;
    - this keeps `seams/` free of any catalog import.
  - Decide what "Reset all preferences" does to retained keys while off. The recommendation is to leave them alone, because they are invisible.
  - Test: off, then `set` an unrelated pref → the saved `prefs` still holds `printPreview`/`authoringControls`. On → unchanged.
  - Size: about 10 lines plus 2 tests.

### MEDIUM-3 — camera seeding permanently switches the demo vault to ON
- **Where**: `visual-harness/obsidian-camera.mjs:556-569` (`seedUdd`). It writes `{...saved, experimental:true}` to `<repo>/data.json` and never restores it.
- **Scenario**:
  - In the main checkout, `draw-steel-elements/data.json` exists (309 bytes). `demo-vault/.obsidian/plugins/draw-steel-elements → ../../..`, so that file is the live plugin data of the demo vault Scott reviews in.
  - After any `npm run obsidian-shots` or `docs-shots` from that checkout, his demo vault silently runs with the switch ON: sidebar, deferred elements, Authoring page and so on.
  - The SC-333 / audit §2a release walkthrough done there would then exercise features that do not ship and would never show the placeholder cards.
  - Reproduced in the throwaway worktree: after `docs-shots`, `data.json` holds `"experimental": true`.
- **Secondary (LOW-grade, same lines)**: an existing but unparseable `data.json` falls to `saved = {}` and is overwritten, losing the user's settings.
- **Fix**:
  - Read the raw bytes, or record that the file is absent.
  - Write the seeded copy.
  - Restore the original bytes, or delete the file if it was absent, in the camera's teardown path. That means the same `finally`/signal handler that kills Obsidian.
  - If the file exists but does not parse, abort with a message rather than overwrite.
  - The cleaner alternative is a scratch plugin dir for the camera, as the lifecycle gate does.

### LOW-1 — `schemaSuggest` autocompletes inside deferred fences (owner's FOLD item 1, confirmed). The prescribed guard has an ON-state side effect
- **Where**: `src/authoring/schemaSuggest.ts:73-74` (`const def = this.registry.get(state.lang); if (!def?.schema) return null;`).
- **Measured (P1)**, keys offered with the switch off:

  | Fence | Keys offered |
  |---|---|
  | ds-surges | 2 |
  | ds-tokens | 2 |
  | ds-roll | 14 |
  | ds-resource | 5 |
  | ds-conditions | 1 |
  | ds-hero | 17 |

  Encounter, project and party have no schema, so no keys.
- **Caveat on the ledger's prescribed fix**: "gate it on `isDefinitionHidden`" would also kill ds-hero autocomplete with the switch **ON**. ds-hero is `hidden: true` (SC-190) and has a schema, and P1 measured 17 keys ON today. That would violate "when on: exactly as today".
- **Fix**:
  ```ts
  if (!def?.schema || (def.deferred === true && !isExperimental())) return null;
  ```
  - Alternatively, add a `isDefinitionDeferredOff(def)` helper to registry.ts next to `isDefinitionHidden`.
  - Tests: off → `onTrigger` returns null in a `ds-surges` fence. On → keys are offered. ON ds-hero still gets 17 keys.


## Constraints
- The ON state must stay exactly today's behaviour (Scott: "When on: everything above is exactly as it is today"). Scope every fix to the gated keys while off.
- Each fix gets a test that fails without it (MEDIUM-3: a test or a scripted probe of the camera seeding/restore — report which).
- OUT OF SCOPE (ruled, do not do): stale sidebar leaf handling; docs prose or docs images (SC-407); card copy changes; anything in the main checkout `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (it is dirty with someone else's work — never touch it).
- Integrity probes for MEDIUM-1: content above/below the block survives; two blocks in one note with different gated `prefs:` don't cross-talk; a hand-edited gated key survives a re-trigger.

## Gates — full battery again
Expected: tsc/lint clean · jest 4412 + your new tests passed / 1 skipped / 217 of 218 suites (or +N suites) · lifecycle 25/25 · shots 568, 0 FAIL · freeze `freeze OK (274/274 …)` (must not move; STOP and report if it does) · parity 0 GAPs / 0 undeclared / 24 DECLARED. Per-run unique log paths under .../sc406-gating/logs-fix1/.

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/sc406-fix1-impl-report.md, opening with a ≤10-line executive summary (verdict, final sha, gate numbers). Per finding: commit sha, files:lines, test name. `Drive-by fixes:` / `Follow-ups:` lists. If the write is blocked, return it inline.

## Return
Raw facts to the ticket-owner: verdict, final sha, gate numbers, absolute paths of the report and logs. If you need input, end with STATUS: NEEDS_CONTEXT. Run gates in the foreground; never end your turn waiting on a notification.
