# SC-360 r2 independent review — dse `sc360-flaky-undo` @ 0a8ac82 (base 6bcf9c8)

**Executive summary**
- **Verdict: FIX-THEN-LAND.** Counts: HIGH 0 · MEDIUM 1 · LOW 3 · INFO 3.
- The root cause is real and the impl measured it correctly. The old generator rewrites 2.980% of its ids on the first save (500,000 of all 16^6 ids, counted exhaustively; a 2M sample of the real formula gave 2.981%). I reproduced `Received: "true"` at the base generator.
- The generator fix is complete. All 5,242,880 ids it can produce parse back as the identical string in yaml 2.9.0 (core 1.2, version 1.1, yaml-1.1 schema, failsafe) and in js-yaml 4. None is quoted by stringify, and `readAnchor` reads every one back. 0 failures in each of those checks. The mock's yaml 2.9.0 schema regexes match the ones bundled in Obsidian 1.14.4's app.js.
- The tests guard. With the generator reverted, 8 tests fail. With the encounter formula reverted, 4 fail. With the old reader regexes, 18 fail. The Math.random stubs are restored in every case.
- Stress: 35/35 green, each run 35 tests over both files, at load 11 to 41 (12 busy loops, then 24).
- Gates: tsc clean, lint clean. jest 4948 passed / 1 skipped / 229 of 230 suites. e2e `68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs`.
- **MEDIUM-1:** an encounter block that already carries a pre-fix numeric-looking id keeps producing duplicate tracker blocks after this fix. Re-linking does not repair it, but the CHANGELOG says it does. This is the premise gap in the "DROP quote-at-stamp" ruling. It is a 2-line fix, see below.
- I found no way that the widened readers can mis-read or corrupt a block. Every remaining duplicate-key path existed before this branch except one hand-typed form (LOW-1).

Reviewed sha: `0a8ac82925dc4b5620d23cd89c2db75c0e49c7f0`, 8 commits on `6bcf9c8`. Tree clean before and after (`git status --porcelain` empty).
Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc360-flaky-undo/sc360-evidence/r2-review/`.

## Findings

### MEDIUM-1 — Encounter blocks holding a pre-fix id keep duplicating trackers forever. The CHANGELOG's "repaired by re-linking" is false for them.
- **Where:**
  - `src/elements/encounter/view.ts:451` writes ``const body = `${GENERATED_FROM_KEY}: ${generatorId}\n…` ``, so the id goes in unquoted.
  - `src/elements/encounter/view.ts:542-543` does `if (existing) return existing;` and returns the model value as typed.
  - `src/framework/sidebar/anchor.ts:128` compares with `readGeneratedFrom(block.body) === generatorId`, which is a strict string comparison.
- **Scenario A (the realistic one):** an encounter whose builder minted `056948` before the fix. The encounter persists it quoted (`_dse_anchor: "056948"`), so after this fix it is still reused as a string.
  1. The user presses "Create/Open tracker". The tracker gets `_dse_from: 056948`, unquoted.
  2. The initiative's first save rewrites that line to `_dse_from: 56948`.
  3. The next press can no longer find its tracker and appends a second one. This repeats on every later save and press.
- **Scenario B:** an encounter block that was itself pinned with an old unquoted id (`_dse_anchor: 56948`, `9.2e+51` or `.inf`). Its model value is a **number**, so the comparison `"56948" === 56948` is false. `.inf` is even written as `_dse_from: Infinity`. The second press always duplicates, with no initiative save needed.
- **Probe:** `r2-review/probe-enc.log`, from scratch test `scripts/zzSc360EncProbe.test.ts`. Trackers after the second press:

  | Case | Trackers |
  |---|---|
  | quoted `"056948"` + initiative save | 2 |
  | unquoted `9.2e+51` | 2 |
  | unquoted `56948` | 2 |
  | unquoted `.inf` | 2 |
  | control `abc123` | 1 |

- **Why the fix misses it:** the r1b "DROP quote-at-stamp" ruling rests on "the generator now covers every minting path". That holds for new ids. But ids minted before the fix stay in encounter blocks for good, and view.ts:451 keeps re-emitting them unquoted. Re-linking the panel does not touch the encounter's `_dse_anchor` or the tracker's `_dse_from`.
- **Impact:** limited to beta vaults, because the sidebar and handoff ship first in 7.0.0. About 3% of encounters that used the tracker button before the fix are affected, and those stay broken permanently.
- **Prescribed fix (small):**
  1. In `ensureEncounterAnchor`, normalise the id: `if (existing !== undefined && existing !== null && existing !== '') return String(existing);`. Watch out: the current `if (existing)` also treats a numeric `0` as "no anchor". That case re-mints, which is harmless.
  2. At view.ts:451, write the provenance line quoted, for example ``${GENERATED_FROM_KEY}: ${JSON.stringify(generatorId)}``. The reader already accepts `"…"`, and the initiative's stringify keeps a numeric-looking string quoted.
  3. Add a red-first jest case, scenario A above: an encounter with `_dse_anchor: "056948"`, press, simulate the initiative's parse→stringify save, press again, expect exactly 1 tracker. Add scenario B with `_dse_anchor: 9.2e+51`.
  4. Alternatively, the owner can keep the r1b ruling and reword the CHANGELOG so it does not promise a repair for encounter trackers. This is the judgment call.

### LOW-1 — `\s*` → `[ \t]*` stops reading a value written on the next indented line, so a re-pin appends a duplicate key
- **Where:** `src/framework/sidebar/anchor.ts:26` (`SCALAR_TOKEN`).
- **Scenario:** a hand-edited body with `_dse_anchor:` followed by `  abc123` on the next indented line. This is valid YAML, and the value is `abc123`.
  - The base regex read it as `abc123`.
  - The head regex returns null, so `ensureAnchor` appends a second `_dse_anchor:` line and the block fails with "Map keys must be unique".
  - `stringifyYaml` never emits this shape, so only a hand edit triggers it. Source: `r2-review/probe-reader.log`.
- **Related, and already present at base:** `ensureAnchor` appends a duplicate whenever the regex misses a key that YAML does see. The forms are:
  - an inline comment: `_dse_anchor: abc123 # c`
  - a tag: `!!str 056948`
  - a YAML anchor: `&a abc123`
  - `~`, an empty value, or `""`
  - a folded scalar `>`
  - a space before the colon
  - a quoted key: `"_dse_anchor": x`

  The widening adds none of these, but they share one fix.
- **Prescribed fix (optional, one guard covers all of them):** in `ensureAnchor`, before appending, parse the body. If the parsed object already has `ANCHOR_KEY`, reuse `String(value)` when it is a scalar the readers can match, or else refuse to stamp. Alternatively, accept this as hand-edit-only and leave it.

### LOW-2 — Pre-fix ids that the old code has not yet rewritten still break once after the upgrade
- **Scenario:** a note pinned before the fix whose block was never written by the sidebar. For example, `_dse_anchor: 092e50` is still in the note.
  - After the upgrade, the panel or a re-pin reuses `092e50` as found.
  - The first sidebar write rewrites it to `9.2e+51`, and the panel shows "Backing block not found — re-link this panel from the note." (probed: `r2-review/probe-damaged.log`, all four old ids).
  - One re-link then repairs the note: 1 anchor line, valid YAML, 1 live panel, the stale panel evicted.
- **Impact:** the CHANGELOG's "New ids can no longer take that shape" is true. But a reader could take it to mean that existing pins are safe from now on.
- **Prescribed fix:** reword the bullet's last sentence, for example: "A note pinned before this fix may lose its panel once more on its next save; re-linking the panel from the note ("Send to sidebar" again) repairs it for good." Optional code fix instead: when `ensureAnchor` or the host meets an existing unquoted anchor that YAML reads as a non-string, rewrite it quoted at pin time.

### LOW-3 — The CHANGELOG bullet doesn't mention the encounter-side symptom that 1aaba8f fixes
- **Where:** `CHANGELOG.md:31-37`.
- The bullet describes only the sidebar "Backing block not found" symptom. The encounter builder's "Open in sidebar" adding a second tracker (about 1 in 33 new encounters) is also a user-visible fix in this branch. MEDIUM-1 also changes what may be claimed about repairing it.
- **Prescribed fix:** add a clause, for example: "…and the encounter builder's "Open in sidebar" no longer sometimes adds a second tracker block."

### INFO-1 — The generator test is a sweep, not exhaustive. The exhaustive proof now exists again (reviewer-run)
- `anchor.test.ts`'s sweep covers 50,755 Math.random values. My `r2-review/scripts/exhaust.js` enumerates all 5 × 16^5 outputs and gets 0 failures in every check (`r2-review/exhaust.out`).
- The script runs in about 10 minutes, too slow for jest. No action needed. Reasoning over the regexes agrees:
  - every non-string scalar regex in Obsidian 1.14.4's bundle starts with a digit, a sign, a `.` or `~`, or is a bool/null word, with one exception;
  - the exception is the 1.1 EXP float's empty mantissa (`e14000`), which is why `e` is excluded as the leading letter.
- The `/opt/Obsidian` bundle is older (`/^true|false$/` only in the JSON schema), and none of the differences can match a letter-led id.

### INFO-2 — Edge cases the widened reader accepts but YAML rejects (harmless)
- Mismatched or unterminated quotes (`'abc123"`, `"abc123`), no space after the colon (`_dse_anchor:abc123`), and a lone `\r` mid-line are all read as an id. These were also accepted at base.
- YAML fails to parse each of them, so the block is already an error card. The reader does not add a line, so nothing gets worse.

### INFO-3 — Already-damaged notes: the impl's account is correct
- What the user sees: right after the first write, the panel shows "Backing block not found — re-link this panel from the note.". It stays that way after any later edit. It does not heal on its own, because the panel holds the original id and the note holds the rewritten one.
- A re-link with the stale panel still open repairs the note: 1 anchor line, valid YAML, 1 panel bound to the rewritten scalar (`9.2e+51`, `.inf`, `56948`, `0`). The rewritten value is stable through later round trips (`.inf`, `-.inf`, `.nan`, `1e-7`, `1e+21`, `1.23e+47` all checked).
- No further recovery is needed for sidebar panels. Encounter trackers do need more, see MEDIUM-1.

## Verified, no finding
- **Root cause.** With the generator reverted, the initiative undo case fails with `Received: "true"` (×3 pinned) and the sweep fails with `Received: "number"`. Log: `mut-A-generator.log`.
- **Other minting paths.** The only `Math.random` uses in `src/` are dice (`roll/service.ts:33`) and `generateAnchorId`. `main.ts` has none. Example yaml anchors (`a01b22`, `77aa10`, `4c19ff`) are letter-bearing strings.
- **Consumers.**
  - Every existing well-formed id still matches: the new charset is a superset of the old one.
  - `findAnchoredBlock` and `findGeneratedBlock` are text-based.
  - `pipeline.ts`'s schema exemption is key-based.
  - Element models pass the key through without coercing it.
  - The only consumer that uses the model value as an id is the encounter (MEDIUM-1).
- **Reader probes** (`probe-reader.log`). None of these is taken: trailing words, `#` comments, `, other`, flow `[a, b]`, other, prefixed or suffixed keys, indented keys, `_dse_from` as the anchor, an empty value followed by the next key.
  - CRLF: `$` with the `m` flag stops before `\r`, both quoted and unquoted. `ensureAnchor` reuses the anchor without mixing EOLs (impl tests plus my probes).
  - Multiple anchors: the first one wins, the same as base, and YAML rejects the block anyway.
- **Stub hygiene.** anchor.test uses `afterEach(restoreAllMocks)`. The initiative and handoff tests use `mockRestore` in `finally`. The full suite stays green.
- **Stress** (`r2-review/stress/summary.txt`): 35/35 runs green over both files, each run 35 tests. Runs 1-21 at load 11-17 (12 busy loops), runs 22-35 at load 23-41 (24 busy loops). 0 timeouts. The loops were killed by recorded PID.
- **Gates** (`r2-review/g-*.log`; exit codes captured inside a script file, `g-rc.txt` / `g-e2e-rc.txt`, all rc=0):
  - tsc clean, lint clean
  - jest `Tests: 1 skipped, 4948 passed, 4949 total` / `Test Suites: 1 skipped, 229 passed, 229 of 230 total` (base 4908 + 40)
  - e2e `OBSIDIAN-E2E done: 68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs`
  - Lifecycle, shots, freeze and parity: not re-run; I trust the impl's numbers because the diff touches no rendering code.
