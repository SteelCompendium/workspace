# SC-202 round 6a — fetch-and-pin recipe for Obsidian's app.css

**STATUS: DONE.** Commits: plugin `a4123ae7b83bac819eb2a2e043bd992da2f1a9f5` on
`draw-steel-elements` (stacked on round-5-approved `189aaf1`), superproject
`d85fc4e11ad17094a8899a2dac3c3ee3fce7846e` (justfile only — submodule pointer left for the
owner/dispatcher). Pin: Obsidian **1.13.7**, app.css sha256 **f612f1e8f36486…**, per the
coordinator's revised brief (1.14.0 confirmed an Insider build with no public GitHub release
asset — my earlier NEEDS_CONTEXT stop on this same round). Three hashes verified against the
ledger's recorded probe exactly: `.asar.gz` `69253e39aa0b98…`, `.asar` `a52a7daf1e2460…`,
`app.css` `f612f1e8f36486…` (637,090 B). Fetch timing: ~1.8–2.0 s cold, ~0.29 s cached.
Every rounds 1-5 host-leak family re-proven against the PINNED sheet and still prints "…
OK" with 0 problems — **no fix-round needed**. Can-fail: corrupted cache → loud exit 1,
restore → OK, delete cache → re-fetches, no-network+no-cache → installed fallback + WARNING
(exit 0), no-network+no-cache+no-installed-asar → writes nothing (exit 0, sweeps SKIP).
Battery: tsc/lint clean; jest **3821/1sk/199 of 200 suites** (+8 tests, +1 suite, this
round's own test file); shots **524/0**, every gate line byte-identical to
`sc202-r5rerev-shots.log` except the five retired per-sweep drift clauses (nothing else in
any line changed); `freeze OK (252/252 …)`; **8/8 widening hashes unchanged**; full-tree
sha256 vs `sc202-r5rerev-allshots.sha256`: **0/524 moved**; parity **0 GAPs/0 undeclared/16
DECLARED**, exit 0. No push, no tags, no attribution trailers.

## 1. Context and the pin decision (round 2, after NEEDS_CONTEXT)

My first pass on this round stopped with `NEEDS_CONTEXT`: the brief's original pin
candidate, Obsidian 1.14.0, has **no public GitHub release at all** in
`obsidianmd/obsidian-releases` — I enumerated every release (3 pages, ~100/release-page)
and found the newest tag is `v1.13.8`, itself carrying only an Android `.apk` asset, no
desktop `.asar.gz`. The 1.14.0 app.css hash the owner specified was independently correct
(it matched the installed asar's extract exactly) — the problem was only that the approved
public-URL fetch scheme had nothing to fetch it from.

The coordinator's reply (2026-09-07) confirmed 1.14.0 is an **Obsidian Insider build**, not
a public release, and reinstated the 2026-09-02 ruling's original starting pin: **1.13.7**,
app.css sha256 `f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41`. Before
writing anything, I re-verified this end to end against the real public asset:

```
URL: https://github.com/obsidianmd/obsidian-releases/releases/download/v1.13.7/obsidian-1.13.7.asar.gz
HTTP 200, 8,773,048 bytes, 1.6 s
.asar.gz sha256: 69253e39aa0b980e3cf96e9e8a8a4bed6b6481ef7021cd762f67872662d8d25a
.asar (gunzipped) sha256: a52a7daf1e2460bae03de80f2816604bd16a56cd374fbe5ce8d1a9ef5604059d, 25,787,463 bytes
app.css (extracted with SC-205's readAsarFile) sha256: f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41, 637,090 bytes
```

All three hashes match the ledger's recorded probe (`.asar.gz` `69253e39…`, `.asar`
`a52a7daf…`, `app.css` `f612f1e8…`, 637,090 B) exactly. The three consequences the revised
brief named were handled as follows (see §4 for the proof of each):

- **(a) the drift line fires by design** — every run on this machine prints one
  `OBSIDIAN APP.CSS PIN DRIFT` line (installed 1.14.0 vs. pinned 1.13.7). Expected, not a
  defect — the r6a scope fence doesn't turn the sheet on yet, so nothing depends on which
  version is pinned besides the sweeps' own OK/FAIL verdict.
- **(b) every rounds 1-5 host-leak family re-proven against 1.13.7** — all five
  (`input`/`table`/`list`/`inline`/`checkbox` host-leak) still print `… OK` with 0
  problems against the pinned sheet. No family needed an in-round fix.
- **(c) `.meta.json` records which sheet is in use** — see §2's schema; `source` is one of
  `pinned-fetch` / `pinned-cache` / `installed-fallback`, and the fallback case additionally
  carries `pinnedVersion`/`pinnedSha256` alongside the installed values so a report can
  never again confuse the two.

## 2. What was built (brief §2 items 1-9)

1. **Pin file:** `visual-harness/obsidian-app-css.pin.mjs` — an ESM module (not
   `.pin.json`) exporting `OBSIDIAN_APP_CSS_PIN = { obsidianVersion, appCssSha256,
   asarGzSha256, source }`. Chose `.mjs` over `.json` specifically so the pin's reasoning
   can live as a real code comment right beside the data (the brief's own "state it … in
   the pin file's comment" reads most naturally as an actual comment, and this codebase's
   convention throughout `visual-harness/` is heavily-commented `.mjs`, including SC-205's
   own `obsidian-host-pin.mjs`). Named `obsidian-app-css.pin.mjs` rather than
   `obsidian-host.pin.mjs` (or similar) to keep it visually distinct from
   `obsidian-host-pin.mjs` — the header comment spells out why they're different pins for
   different things (a version FLOOR for a hand-model vs. an exact CONTENT hash for the
   real sheet) and records the full pin history (2026-09-02 ruling → the 1.14.0 dead end →
   this round's reinstated 1.13.7).
2. **`npm run host-css`** → `visual-harness/fetch-obsidian-app-css.mjs`. Cache-first:
   a cached `dist/obsidian-<ver>.asar.gz` skips the network, but the WHOLE chain
   (`.asar.gz` → gunzip → `app.css`) is re-verified against the pin on *every* run, cached
   or fresh — a corrupted cache fails loudly, never trusted silently. On success writes
   `dist/obsidian-app.css` (the path the sweeps already read) and
   `dist/obsidian-app.css.meta.json`:
   ```json
   {
     "source": "pinned-fetch",
     "version": "1.13.7",
     "sha256": "f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41",
     "asarGzSha256": "69253e39aa0b980e3cf96e9e8a8a4bed6b6481ef7021cd762f67872662d8d25a",
     "asarSha256": "a52a7daf1e2460bae03de80f2816604bd16a56cd374fbe5ce8d1a9ef5604059d",
     "sourceUrl": "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.13.7/obsidian-1.13.7.asar.gz",
     "fetchedAt": "…"
   }
   ```
   The `.asar` is regenerated fresh from the verified `.asar.gz` on every run rather than
   itself cached-and-trusted (SC-205's own LOW-3 lesson: nothing reads it back, so caching
   it would just be one more invalidation case for an 8.8 MB gunzip that's already cheap).
3. **`npm run shots` calls it first** via an npm **`preshots`** lifecycle hook (not an
   explicit call inside `shoot.mjs`). Picked preshots because: (a) it needs no change to
   `shoot.mjs`'s own control flow — that file's job stays "read whatever
   `dist/obsidian-app.css` says," full stop; (b) `fetch-obsidian-app-css.mjs` stays
   independently runnable (`npm run host-css`) and independently testable without any
   `shoot.mjs` involvement; (c) it's the literal, standard npm mechanism for "run this
   before that." Verified: `npm run shots -- --element=doesnotexist` shows `preshots` →
   `host-css` run and complete *before* `shots` itself starts.
4. **Offline fallback** — implemented in `resolvePinnedObsidianAppCss`: fetch fails + no
   cache → falls back to the installed Obsidian's own asar (SC-205's `findObsidianAsar`/
   `readAsarFile`, reused, not forked), prints a WARNING naming the sheet actually in use
   (version + hash, explicitly NOT the pin), writes `dist/obsidian-app.css` +
   `installed-fallback` meta, and returns success (exit 0 — an unreachable network is not a
   hash violation). No installed asar either → writes nothing, `dist/obsidian-app.css`
   stays absent, and the sweeps print their pre-existing `SKIPPED (no local asar)` line
   unchanged.
5. **Warn-on-drift** — `checkDriftAgainstInstalled`, independent of the resolve step,
   always hashes the installed Obsidian's `app.css` (if any) and prints exactly ONE
   `OBSIDIAN APP.CSS PIN DRIFT` line if it differs from the pin (version and/or hash),
   pointing at the new `visual-harness/README.md` → "Obsidian app.css pin" section for the
   bump procedure. Never throws; the gate keeps running against the pin regardless.
6. **Retired the five per-sweep drift clauses.** Each of `input`/`table`/`list`/`inline`/
   `checkbox` host-leak's own `pinNote` computation and its `; Obsidian …, sha256 … does
   not match the round's pin … — sweeping against it anyway, a version drift, not a
   defect)` clause is gone from the print line — confirmed byte-identical otherwise by
   diffing the full shots log against `sc202-r5rerev-shots.log` (§4).
7. **SC-205's own pin kept separate and unchanged.** `PINNED_OBSIDIAN`, `findObsidianAsar`,
   `readAsarFile`, and the `host-copy pin` / `button host-leak` gates are untouched —
   `host-copy pin OK` and `button host-leak OK (… 678 …)` print identically to before.
   Decided NOT to merge the two pins: they gate genuinely different things (a version
   floor for a hand-maintained rule MODEL vs. an exact content hash for the real sheet),
   and merging would force both to move together for no reason — see the header comment
   in `obsidian-app-css.pin.mjs` for the full reasoning.
8. **Tests** — `test/unit/build/obsidianAppCssPin.test.ts`, 8 tests, 3 `describe` blocks:
   pin shape/parses (5 tests, incl. the exact current values); the documented version
   relationship to `PINNED_OBSIDIAN` (1 test — codifies "allowed to differ, and currently
   at-or-behind the floor" rather than leaving it as prose only); hash-verification
   can-fail (2 tests — `assertHash` directly, and an end-to-end
   `resolvePinnedObsidianAppCss` run with a mocked `fetchImpl` + a deliberately wrong
   `asarGzSha256`, no network, writing to a scratch `distDir` so the proof never touches
   the real cache). **Jest can't `import()` a `.mjs` file directly** (this repo's
   `jest.config.ts` has no ESM support — confirmed by trying it against
   `obsidian-host-pin.mjs` first and getting `SyntaxError: Cannot use import statement
   outside a module`), so — mirroring this repo's own established pattern for exercising a
   real script from jest (`test/unit/build/cssNesting.test.ts` spawns
   `node esbuild.config.mjs production` via `execFileSync`) — each test spawns a real
   `node --input-type=module -e "<script>"` subprocess that imports the module under test
   and prints one JSON line, which the test then parses and asserts on. No network in any
   of them.
9. **CI unchanged** — `plugin-ci.yml` was not touched; it doesn't run `npm run shots` today
   and this round doesn't add the fetch to it. A future CI shots job COULD use this recipe
   as-is: the fetch is ~8.8 MB over plain HTTPS with no auth (~1.8–2.0 s measured here), and
   `preshots` already wires it in automatically — the only new CI cost would be that
   download on a cold cache (no cache = no cost saved across runs unless CI persists
   `visual-harness/dist/*.asar.gz` between jobs).

**LOW-4 fold (r5 re-review residual, same commit):** `assertCheckboxHostLeak` now asserts
`document.querySelectorAll('[data-dse-tlul]').length === 0` after both of its
`removeSyntheticTaskList()` calls (the per-scheme pass and the host-appended-order pass).
The build/remove pairing was already correct — this pins it so a future edit that breaks it
fails loudly instead of leaving a stray synthetic `<ul>` silently unread.

## 3. Docs added

`visual-harness/README.md` → new "Obsidian app.css pin (SC-202 r6a)" section: what
`preshots`/`host-css` does, the cache/idempotency contract, the offline fallback, the
warn-on-drift line, and a 4-step bump procedure (confirm a real public release asset exists
first — naming this exact round's 1.14.0 dead end as the cautionary example — then
fetch/extract, update the pin file, run the full battery).

## 4. Verification (brief §3, in order)

**Fetch proof.** Cold run (no cache): `.asar.gz` fetched in ~1.8 s (8,773,048 B), all three
hashes recorded and matching the pin (§1). Warm run (cache present): 0.29 s, `mode:
pinned-cache`, cached `.asar.gz`'s mtime provably unchanged (no network touched). Per the
revised scope fence, the fetched `app.css` is verified against the **pin**, not the
installed asar (they differ by design — that's the whole point of this round's pin
decision) — sha256 `f612f1e8…` == pin; the installed 1.14.0 extract is separately
`013ed841…`, both recorded in the drift line and in this report.

**Can-fail.**
- Corrupted cached `.asar.gz` (one byte flipped) → `OBSIDIAN APP.CSS PIN VERIFICATION
  FAILED: HASH MISMATCH (asar.gz): got bbe4ffdf…, expected 69253e39…`, exit 1;
  `dist/obsidian-app.css` provably untouched (still hashed to the pin from before the
  corruption).
- Restored the good `.asar.gz` → back to `OK (pinned-cache)`.
- Deleted the cached `.asar.gz`/`.asar` → re-fetched (`mode: pinned-fetch`, ~2.0 s, gz
  reappeared on disk).
- No-network simulation via `SC202_HOST_CSS_URL_OVERRIDE=http://127.0.0.1:1/unreachable`
  with no cache → `OBSIDIAN APP.CSS FETCH UNAVAILABLE …, falling back to the INSTALLED
  Obsidian's app.css: Obsidian 1.14.0, sha256 013ed841…`, exit 0, `meta.json` recorded
  `source: "installed-fallback"` with both the installed and pinned version/hash.
- Same override **plus** `HOME` pointed at an empty scratch dir (no installed Obsidian
  either) → `… no cached copy, and no usable installed Obsidian asar either — host-leak
  sweeps will SKIP this run`, exit 0, nothing written to `dist/`.
- Same override **with** the real cache present → cache wins, no network touched (already
  covered by the idempotent-cache proof above — the override is only consulted when a
  fetch is actually attempted).
- How the override was added: `SC202_HOST_CSS_URL_OVERRIDE` env var, read only by the CLI
  entrypoint (`main()`), threaded through as `resolvePinnedObsidianAppCss({ urlOverride
  })`'s `urlOverride` parameter — never consulted when a cache hit skips the fetch
  entirely.

**Battery** (all foreground, logs prefixed `sc202-r6a-` under
`.superpowers/sdd/sc202-visual-harness-obsidian/`):

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 (`sc202-r6a-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc202-r6a-lint.log`) |
| `npx jest` (main.js/styles.css removed first) | **3821 passed / 1 skipped / 199 of 200 suites**, 3 snapshots (baseline 3813/1sk/198-of-199 — delta is exactly this round's +8 tests in +1 new suite file) (`sc202-r6a-jest.log`) |
| `npm run shots` | **524 PNGs, 0 FAIL** (`sc202-r6a-shots.log`) |
| `check-freeze.sh` | `freeze OK (252/252 frozen print PNGs byte-identical …)`, exit 0 (`sc202-r6a-freeze.log`) |
| 8 widening hashes (r3 six + r4 two) | all `OK` against `sc202-r3-widening.txt` + `sc202-r4-widening.txt` |
| full-tree sha256 vs `sc202-r5rerev-allshots.sha256` | **0 of 524 moved**, exit 0 |
| `npm run parity` | **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0 (`sc202-r6a-parity.log`) |

**Changed gate lines** — diffed the complete `sc202-r6a-shots.log` against
`sc202-r5rerev-shots.log`. Every difference accounted for and none unexpected:
- New preamble lines from the `preshots`/`host-css` npm wrapper (its own "> …" banner
  lines) and the single new `OBSIDIAN APP.CSS PIN DRIFT` line — additions, not changes to
  any existing gate line.
- `⚡ Done in 309ms` → `181ms` — esbuild's own timing noise, not a gate assertion.
- Exactly five lines changed, one per host-leak family (`input`, `table`, `list`,
  `inline`, `checkbox`), each losing **only** its trailing `; Obsidian 1.14.0, sha256
  013ed841… does not match the round's pin f612f1e8… — sweeping against it anyway, a
  version drift, not a defect)` clause — every other character in each line, including the
  comparison counts, is byte-identical.
- No other line in the 589-line log differs.

**Host-leak results against the pinned 1.13.7 sheet** (brief consequence (b) — no fix-round
needed): `input host-leak OK (… 154 …)`, `table host-leak OK (… 278 …)` (+340 declared
exceptions, unchanged), `list host-leak OK (… 340 …)`, `inline host-leak OK (… 1126 …)`,
`checkbox host-leak OK (… 46 comparisons …)` — all 0 problems, all comparison counts
unchanged from the 1.14.0-sweep baseline. `host-copy pin OK` and `button host-leak OK (…
678 …)` (SC-205's own gate) unchanged. `link token-override probe OK (157 links …)`
unchanged. `print-twin parity OK (130 capture ids …)` unchanged.

## 5. Not done / deferred by scope

Turning the real sheet on in the harness, re-formulating the six host-leak assertions
against it, and realprint option C are round 6b/6c's own scope (untouched here, per the
brief's explicit fence).

## Drive-by fixes

None.

## Follow-ups

- **A future CI shots job could adopt this recipe as-is** (§2 item 9) — flagging for the
  owner to decide, not doing it here (brief: "do NOT add the fetch to CI").
- The r6a brief's own scope-fence text (§2, "the sweeps read the same 1.14.0 bytes they
  read before, now from the fetched copy") was written before the pin reverted to 1.13.7
  and was self-corrected in the same paragraph ("the installed 1.14.0 extract is DIFFERENT
  by design — record both hashes"); no action needed, noting only so the discrepancy in
  the brief text itself doesn't read as something I missed.

## Artifacts

- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc202-visual-harness-obsidian/sc202-r6a-report.md`
- Gate logs: `sc202-r6a-tsc.log`, `sc202-r6a-lint.log`, `sc202-r6a-jest.log`,
  `sc202-r6a-shots.log`, `sc202-r6a-freeze.log`, `sc202-r6a-parity.log` (same directory)
- Plugin commit: `a4123ae7b83bac819eb2a2e043bd992da2f1a9f5` on
  `/home/scott/code/steelCompendium/worktrees/sc202-visual-harness-obsidian/draw-steel-elements`
  (branch `sc202-visual-harness-obsidian`, stacked on `189aaf1`)
- Superproject commit: `d85fc4e11ad17094a8899a2dac3c3ee3fce7846e` on
  `/home/scott/code/steelCompendium/worktrees/sc202-visual-harness-obsidian/justfile`
  (justfile only; submodule pointer intentionally left unbumped)
- New source files: `visual-harness/obsidian-app-css.pin.mjs`,
  `visual-harness/fetch-obsidian-app-css.mjs`,
  `test/unit/build/obsidianAppCssPin.test.ts` (all under the plugin worktree above)

## Fix round (2026-09-08)

**STATUS: DONE.** Independent review of `a4123ae` (`sc202-r6a-review.md`):
FIX-ROUND-NEEDED, 0 HIGH / 4 MED / 4 LOW (+4 INFO). All closed in one commit:
`742bcd92c1598ed8a0012eb305caeb16197270f8` on the same branch (`189aaf1 → a4123ae →
742bcd9`). Nothing pixel-visible touched — full-tree sha256 vs the reviewer's own
`sc202-r6arev-allshots.sha256`: **0/537 moved**. Pin unchanged (1.13.7, `f612f1e8…`).
`visual-harness/dist/` restored to the pinned state before finishing.

### Per-finding closure, with the probe I ran myself

- **MED-1** (a 34-byte fake sheet under the genuine `pinned-cache` meta made all six
  sweeps print "OK against the real Obsidian app.css") — **CLOSED.** New
  `readVerifiedSheet` (exported from `fetch-obsidian-app-css.mjs`, no browser needed to
  test it) re-hashes the bytes on every read against the meta's own recorded hash and,
  for anything claiming pinned equivalence, the committed pin itself. Isolated probe:
  planted a fake `obsidian-app.css` + the genuine meta in a scratch `distDir` →
  `readVerifiedSheet` threw `OBSIDIAN APP.CSS MISMATCH — … does not match its own …
  (sha256 bc7370d2… on disk, meta says f612f1e8…)`. End-to-end probe (the review's exact
  scenario): planted the same fake 34-byte file over the REAL `visual-harness/dist/`,
  then ran `node visual-harness/fetch-obsidian-app-css.mjs` directly — it **self-healed**
  the fake file back to the correct 637,090-byte sheet before any sweep could run, via
  the same cached-`.asar.gz`-backed resolution MED-4 now runs at `shoot.mjs` startup.
  This is a STRONGER guarantee than the finding literally asked for (verify-on-read
  alone): two independent layers (resolve-time self-heal, read-time re-verify) now both
  reject a wrong sheet, not just one. Outcome-4 second leg (a stale sheet surviving a
  true SKIP): reproduced the review's exact setup (empty `HOME`, unreachable URL
  override, a leftover fake sheet+meta pre-planted in a scratch `distDir`) →
  `resolvePinnedObsidianAppCss` now deletes both files before returning
  `{resolved:false}` — confirmed `obsidian-app.css`/`.meta.json` both absent after.
- **MED-2** (a 404 on the pinned URL degraded to the installed sheet, exit 0) —
  **CLOSED.** A completed non-OK HTTP response is now classified separately from a
  genuine connection failure and re-thrown. Probe: a temp pin at `9.9.9` →
  `resolvePinnedObsidianAppCss` threw `HTTP 404 fetching the pinned Obsidian release
  asset (…v9.9.9/obsidian-9.9.9.asar.gz) — the pin likely names a version with no public
  asset; check https://github.com/obsidianmd/obsidian-releases/releases …` — no
  fallback attempted, no file written.
- **MED-3** (the fallback/drift floor was SC-205's `PINNED_OBSIDIAN` 1.14.0, so a machine
  running exactly the pin, 1.13.7, got neither) — **CLOSED**, with the "Better" upgrade
  from the review (a real gate, not a labelled fallback, when the installed version
  equals the pin). Probe: `HOME` pointed at a scratch dir carrying only
  `.config/obsidian/obsidian-1.13.7.asar` (the pinned asar itself), unreachable URL
  override, no cache → `OBSIDIAN APP.CSS FETCH UNAVAILABLE (fetch failed), no cached
  copy — but the installed Obsidian IS the pinned version and its app.css verifies
  against the pin: Obsidian 1.13.7, sha256 f612f1e8… Using it as a verified pinned sheet
  (not a fallback).` — `{resolved:true, mode:"installed-pinned", version:"1.13.7",
  sha256:"f612f1e8…"}`, meta `source: "installed-pinned"`.
- **MED-4** (six gates depended on the npm `preshots` hook; a direct/`--ignore-scripts`
  invocation silently SKIPped all six) — **CLOSED.** `shoot.mjs` now imports and awaits
  `ensurePinnedObsidianAppCss()` itself, before launching a browser. The `preshots` hook
  is **removed** (kept, it would double-print the provenance/drift lines once `shoot.mjs`
  also ensures on its own — `npm run shots` = `harness:build && node shoot.mjs` now,
  nothing else); `npm run host-css` stays as the standalone pre-warm command. Probe: ran
  `node visual-harness/shoot.mjs` **directly** (no `npm run shots`, and there is no
  longer any lifecycle hook to bypass) — all six gate lines printed `OK`, 524 shots, 0
  FAIL, one `host sheet: pinned-cache, Obsidian 1.13.7, sha256 f612f1e8…` provenance line
  and one `OBSIDIAN APP.CSS PIN DRIFT` line, 6m18s. This run doubled as this round's
  official shots-gate result (see Battery below). SKIP wording reworded from `SKIPPED (no
  local asar)` to `SKIPPED (no resolved Obsidian app.css sheet)` on all six lines.
- **LOW-1** (jest can-fail covered only the `.asar.gz` leg; deleting the `app.css` hash
  check left the suite green) — **FOLDED.** New test builds a minimal real asar (correct
  `asarGzSha256`, deliberately wrong `appCssSha256`) to reach and prove the `app.css` leg
  specifically. Mutation-proven before committing: deleting the checked line reddened
  exactly this one new test (11 passed / 1 failed), restored → 12/12 green again.
- **LOW-2** (no remedy line; a corrupt cache never self-healed) — **FOLDED.** A cached
  copy failing verification is now deleted and ONE fresh fetch attempted before giving
  up (logged: `OBSIDIAN APP.CSS cached copy failed verification (…) — deleting the cache
  and re-fetching once before giving up.`); every top-level failure print appends the new
  `HASH_FAILURE_REMEDY` sentence.
- **LOW-3** (fragile `import.meta.url === \`file://${process.argv[1]}\`` guard) —
  **FOLDED.** Now `import.meta.url === pathToFileURL(process.argv[1] ?? '').href`.
- **LOW-4** (dead provenance fields; OK lines didn't name the swept sheet) — **FOLDED**
  via MED-1/MED-4: `ensurePinnedObsidianAppCss` prints the one `host sheet: <mode>,
  Obsidian <version>, sha256 <hash>` line visible in every battery run below.
- **INFO-1** (README bump-step wording implied one failure names both hashes) —
  **FOLDED**, reworded to say a second pass is needed for the `app.css` hash
  specifically. **INFO-2** (lint doesn't cover `visual-harness/*.mjs`) and **INFO-3**
  (SC-205's own fence check ignores the specificity column) — **DROPPED** as directed,
  pre-existing and out of this round's scope; carried into Follow-ups below.

### Battery (foreground, gate last, logs prefixed `sc202-r6afix-`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` (`rm -f main.js styles.css` first) | first full run: 1 failure, `sidebarEncounterHandoff.test.ts:416` — the documented load flake; isolated re-run (`npx jest test/dom/framework/sidebarEncounterHandoff.test.ts`) green (10/10); clean full re-run: **3825 passed / 1 skipped / 199 of 200 suites**, 3 snapshots (was 3821/1sk/199-of-200 before this round — delta is exactly this round's +4 new tests, same suite count) |
| `node visual-harness/shoot.mjs` (direct, no npm) | **524 shots, 0 FAIL**, 6m18.780s real, one provenance line + one drift line, every sweep `OK` — this run doubles as the MED-4 probe |
| `check-freeze.sh` | `freeze OK (252/252 frozen print PNGs byte-identical …)`, exit 0 |
| 8 widening hashes (r3 six + r4 two) | all `OK` |
| full-tree sha256 vs `sc202-r6arev-allshots.sha256` (the reviewer's own baseline) | **0 of 537 moved**, exit 0 |
| `npm run parity` (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |

### Drive-by fixes

None beyond the findings themselves (all directed fixes).

### Follow-ups

- INFO-2: `npm run lint` (`eslint src main.ts`) still doesn't cover `visual-harness/*.mjs`
  — pre-existing repo config, not introduced by SC-202; the owner may want a Backlog
  ticket if broader `.mjs` linting is desired.
- INFO-3: SC-205's `checkSheetHostRuleListing` strips the `(a,b,c)` specificity prefix
  before comparing, so those annotations in `[SC205-HOST-RULES]` are unverified prose —
  the reviewer's own finding, out of r6a's scope; flagged for the next SC-205 touch.

### Fix-round artifacts

- Commit: `742bcd92c1598ed8a0012eb305caeb16197270f8`
- Gate logs: `sc202-r6afix-{tsc,lint,jest,shots,freeze,parity}.log` (same directory as
  the round-1 logs above)
