# SC-260 round 2: scoped re-review (delta only)

**Executive summary**
- Verdict: **APPROVE**. Reviewed head `f818002` on `sc260-noop-write`. Its commits are `db40b9f` (r1 rebased) and `f818002` (the LOW-1/LOW-2 folds). `merge-base HEAD origin/develop` = `8ab5e91` = `origin/develop`.
- Rebase: the src+test diff of `8ab5e91..db40b9f` is byte-identical (`cmp`) to that of `c78a06b..f79c0d6`. In the CHANGELOG, `8ab5e91..HEAD` only adds the SC-260 `[FIX]` bullet at the top of `7.0.0 (unreleased)`, and SC-429's and SC-426's entries are untouched.
- LOW-1 fold (`src/framework/host/ReadingModeBlockHost.ts:410-416`): the pin is wrapped in try/catch with a `console.warn`. When I strip it back to a bare call, the new test fails (`1 failed, 15 passed, 16 total`, "Received promise rejected … pin exploded"). Restored, it passes 16/16.
- LOW-2 fold (`test/dom/framework/previewScrollPin.test.ts:159`): the title now reads "pins inside the vault.process callback, before the write lands — …".
- Measured by me: tsc (incl. e2e) clean · lint clean · jest **4810 passed / 1 skipped / 227 of 228 suites** (4806 baseline + 4).
- Spot-checked from the implementer's logs (all rc=0, run at f818002's commit time 13:56): lifecycle 25/25 (G-S8 ok), e2e `63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`, freeze `OK (276/276)`, parity `0 gap(s), 0 undeclared, 24 declared`.
- Findings: none. The tree is clean and HEAD is unchanged.

## Delta details
- **Comment accuracy:** the new comment at `:404-409` says the pin runs after `knownBody = newSource` and that a throw is contained. That is accurate.
- **Swallowing the error is safe:** `pin()` mutates only the scroller attribute, a CSS variable and a timer, so a partial pin is at worst released by `releaseAll` or the TTL. The write itself is never affected.
- **What the new test covers:** first write resolves true, the disk changes, one warn fires, the second write lands, and the spy is called twice. That covers both the abort and the `knownBody` desync seen in the r1 probe.

## Logs (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/)
| What | Log file(s) |
|---|---|
| Gate script and result codes | `sc260-rev2-gate-1792433663.sh`, `sc260-rev2-rc-1792433663.log` |
| tsc | `sc260-rev2-tsc-1792433663.log` |
| lint | `sc260-rev2-lint-1792433663.log` |
| jest | `sc260-rev2-jest-1792433663.log` |
| LOW-1 test, red then green | `sc260-rev2-low1-RED-1792433764.log`, `sc260-rev2-low1-green-1792433766.log` |
| Rebuild of the ignored `main.js` | `sc260-rev2-rebuild-1792433789.log` |
