# SC-406 fix round 1 — implementer report

**Executive summary**
- Verdict: DONE. All four findings fixed, each with a test that fails without the fix. Branch `sc406-gating`, base `f8693b5` (origin/develop unchanged), final sha **05a6ff3** (4 commits on top of 3fddf49). Tree clean.
- Gates (measured): tsc clean; lint clean; jest **4429 passed / 1 skipped / 218 of 219 suites** (+17 tests, +1 suite vs 4412/217-of-218); lifecycle **25/25**; shots **568**, 0 FAIL; freeze **`freeze OK (274/274 …)`** unmoved; parity **0 GAPs / 0 undeclared / 24 DECLARED**.
- ON state unchanged: every fix is scoped to the gated keys / deferred defs while the switch is off; ON behaviour has its own control test per fix.
- MEDIUM-3 was probed end to end: a real `npm run docs-shots -- --only=scc-reference.png` run with a pre-existing `data.json` left it sha256-identical afterwards.
- Main checkout `/home/scott/code/steelCompendium/workspace/draw-steel-elements` not touched.

## Per finding
**LOW-1 — schemaSuggest** — `bcfe073`. `src/framework/registry.ts` new `isDefinitionDeferredOff(def)` (`deferred && !experimental`, deliberately NOT including `hidden`); `src/authoring/schemaSuggest.ts` `onTrigger`: `if (!def?.schema || isDefinitionDeferredOff(def)) return null;`. Tests (`test/dom/authoring/schemaSuggest.test.ts`): `off: no trigger inside a ds-surges or ds-hero fence`; `on: ds-surges and the hidden ds-hero are offered their keys exactly as before` (ds-hero >= 17 keys ON). Verified red without the guard (1 failed), green with.

**MEDIUM-1 — gated per-block `prefs:` keys deleted from the note** — `71c4bc2`. `src/framework/prefOverrides.ts`: new `PrefPassthrough {values, order}`; `extractPrefOverrides(raw, prefs, passthrough?)` still warns and does not apply, but while `!isExperimental()` keeps `EXPERIMENTAL_PREF_KEYS` entries (only those; typo keys still dropped) and records the author's key order; `withPrefOverrides(serialize, overrides, passthrough?)` re-emits applied + kept in the author's order (no passthrough => byte-identical to before). `src/framework/pipeline.ts`: `prepareModel` returns `prefPassthrough`; the serializer wrapper is installed when `prefOverrides || prefPassthrough`. Tests (`test/dom/framework/experimentalGate.test.ts`, describe "gated per-block `prefs:` keys survive a block write"): printPreview keeps place/value next to an applied key; printPreview as the ONLY key keeps the map; authoringControls kept and a typo key still dropped; two blocks with different gated prefs don't cross-talk; a block with no gated key writes what it always did; ON: pre-SC-406 shape. Driven through the real `onload` pipeline + a real click on `+` + debounce. Red without the fix: 4 failed (35 passed). Hand-edited gated key surviving a re-trigger holds by construction (each render re-extracts from the source); content above/below the block is untouched because only the block body is re-serialized. FormModal also calls `extractPrefOverrides`/`withPrefOverrides` (unchanged, no passthrough): it is unreachable while off (pencil needs `authoringControls`, ds-hero is deferred), so left as is.

**MEDIUM-2 — prefs `persist()` drops stored gated prefs** — `37c1947`. `src/framework/seams/prefs.ts`: `PreferenceStore.retainUndescribed(keys)` (new interface method + class impl), `persist()` carries forward retained keys that have no descriptor; `main.ts initializeElementFrameworkV2`: `if (!isExperimental()) prefs.retainUndescribed(EXPERIMENTAL_PREF_KEYS)`. No catalog import in `seams/`. "Reset all preferences" while off: left alone (resets the visible prefs, retained ones stay). Tests (`experimentalGate.test.ts`, describe "stored gated prefs survive a prefs save while off"): off: an unrelated change keeps printPreview + authoringControls (a retired key is still dropped); off: Reset all keeps them; on: unchanged (retired key dropped as before); on-after-off loses nothing (value read back with switch on). Red without the fix: 3 failed (40 passed).

**MEDIUM-3 — camera leaves `experimental: true` in repo-root data.json** — `05a6ff3`. New `visual-harness/camera-data-json.cjs` (`seedExperimental(file)` -> `{restore()}`): records the original bytes (or absence), merges the switch on, restores bytes / deletes the file; throws BEFORE writing when the file exists but is not a JSON object. `visual-harness/obsidian-camera.mjs`: the inline seeding removed from `seedUdd`; `main()` now seeds right after the port check (aborts there on an unparseable file), restores in the `finally` after `killChild`, and on process `exit` and SIGINT/SIGTERM (the signal handler kills Obsidian first, then restores). Tests (`test/unit/build/cameraDataJson.test.ts`, 5): merged on for the run; original BYTES restored even after Obsidian rewrote the file mid-run; absent file deleted again and restore idempotent; already-`true` file byte-identical; unparseable / array / `null` / empty file aborts untouched. Scripted end-to-end probe (not a committed test): wrote a distinctive `data.json`, ran `npm run docs-shots -- --only=scc-reference.png` (real Obsidian, own Xvfb) — shot rendered, and sha256 before/after identical (`logs-fix1/camera-probe-{before,after}.sha`, `camera-probe.log`); the probe's `docs/Media/scc-reference.png` change was reverted and the probe `data.json` removed.

## Gates (logs: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/logs-fix1/)
| Step | Result | Log |
|---|---|---|
| tsc | clean | g1-tsc.log |
| lint | clean | g2-lint.log |
| jest | 4429 passed / 1 skipped / 218 of 219 suites (delta +17 = 2 + 6 + 4 + 5; +1 suite) | g3-jest.log |
| lifecycle | `done: 25/25 ok, 0 failed` | g4-lifecycle.log |
| shots | 568 PNGs, 0 FAIL, in-run gates OK | g5-shots.log |
| freeze | `freeze OK (274/274 frozen print PNGs byte-identical …)` | g6-freeze.log |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | g7-parity.log |
Per-fix focused runs: jest-low1(.log/-neg), jest-m1(.log/-neg), jest-m2(.log/-neg), jest-m3.log.

## Drive-by fixes:
- none.

## Follow-ups:
1. `FormModal` (form editor) re-emits `prefs:` without the gated passthrough; unreachable while off (authoringControls withheld, ds-hero deferred). Wire `PrefPassthrough` through it if the form editor is ever re-enabled with the switch off.
2. Camera signal handler restores `data.json` after killing only the main Obsidian child; a SIGKILL of the camera process itself cannot restore (no handler can). A stale seeded file would then remain; a `git`-ignored `data.json` is the only residue.
3. `docs-shots` images still render hidden surfaces (ruled INFO-2, SC-407).
