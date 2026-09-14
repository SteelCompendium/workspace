# SC-202 round 6a — INDEPENDENT REVIEW of `189aaf1..a4123ae` (fetch-and-pin recipe)

**VERDICT: FIX-ROUND-NEEDED — 0 HIGH / 4 MED / 4 LOW (+4 INFO).** The round's substance is
sound and independently reproduced: pin 1.13.7 correct end to end (`.asar.gz`
`69253e39aa0b980e3cf96e9e8a8a4bed6b6481ef7021cd762f67872662d8d25a`, `.asar`
`a52a7daf1e2460bae03de80f2816604bd16a56cd374fbe5ce8d1a9ef5604059d`, `app.css`
`f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41` / 637,090 B), 2.03 s
cold / 0.39 s warm with **0 `connect()` syscalls** on a warm run, no proprietary byte in
the diff, `dist/` gitignored, battery green and byte-stable (jest 3821/1sk/199-of-200;
shots 524/0; `freeze OK (252/252 …)`; 8/8 widenings; 0/524 PNGs moved; parity 0/0/16), the
five per-sweep drift clauses cleanly retired, the LOW-4 fold load-bearing, SC-205's own pin
still can-failing. Every MED is the same architectural asymmetry: **the recipe verifies,
but the consumer trusts.** `shoot.mjs` now injects whatever bytes sit at
`dist/obsidian-app.css` without hashing them (proved: a **34-byte fake sheet** under the
genuine pinned meta makes all six SC-202 sweeps print `… OK … against the real Obsidian
app.css`, exit 0), a 404 on the pinned URL is treated as "offline" and silently degrades to
the installed sheet, the fallback is gated by SC-205's 1.14.0 floor so a machine running
*exactly the pin* gets no fallback, and six gates now vanish into SKIPs for any invocation
that doesn't run npm lifecycle scripts. Fixes are ~20 lines in two files plus one test.

---

## 0. What was executed (not read)

| Probe | Command / mutation | Log |
|---|---|---|
| Cold fetch | cache deleted → `npm run host-css` | `sc202-r6arev-fetch-cold.log` |
| Warm fetch | `npm run host-css` (cache present) | `sc202-r6arev-fetch-warm.log` |
| Warm, no network | `SC202_HOST_CSS_URL_OVERRIDE=http://127.0.0.1:1/unreachable` + cache | `sc202-r6arev-fetch-warm-override.log` |
| Warm, syscall proof | `strace -f -e trace=connect` on the warm run | `sc202-r6arev-warm-strace-connectcount.txt` (**0**) |
| Can-fail: corrupt cache | one byte flipped in the cached `.asar.gz` | `sc202-r6arev-canfail-corruptcache.log` |
| Can-fail: wrong `appCssSha256` | temp pin edit, reverted | `sc202-r6arev-canfail-badpin-appcss.log` |
| Can-fail: broken pin (404) | pin temp-set to `9.9.9`, reverted | `sc202-r6arev-canfail-404pin.log` |
| Offline fallback + item 5 sheet swap | gz parked + unreachable URL → full `npm run shots` on the **installed 1.14.0** sheet | `sc202-r6arev-shots-fallback1140.log` |
| No sheet at all | `dist/obsidian-app.css`+meta removed → `node visual-harness/shoot.mjs` | `sc202-r6arev-shots-nosheet.log` |
| **Fake sheet** | 34-byte `obsidian-app.css` under the genuine `pinned-cache` meta → `node visual-harness/shoot.mjs` | `sc202-r6arev-probe-fakesheet.log` |
| Outcome-3 leaves stale sheet | unreachable URL + no cache + empty `HOME` with a leftover sheet present | `sc202-r6arev-probe-outcome3-stale.log` |
| Fallback on an install == the pin | `HOME` with `.config/obsidian/obsidian-1.13.7.asar` | `sc202-r6arev-probe-fallback-1137.log` |
| `preshots` failure aborts `shots` | corrupt cache → `npm run shots` | `sc202-r6arev-probe-preshots-abort.log` |
| SC-205 pin can-fail | `[SC205-HOST-RULES]` selector perturbed, reverted | `sc202-r6arev-canfail-sc205pin.log` |
| LOW-4 can-fail | one `removeSyntheticTaskList()` call skipped, reverted | `sc202-r6arev-canfail-low4.log` |
| Test can-fail | `assertHash` neutered → 2 fail; `app.css` check deleted → **8 pass** | `sc202-r6arev-jest-mutated-assertHash.log`, `sc202-r6arev-jest-appcss-check-removed.log` |
| `just` recipe | `cd <worktree> && just dse-host-css` under devbox | `sc202-r6arev-just-recipe.log` |

Battery logs: `sc202-r6arev-{tsc,lint,jest,shots,freeze,parity}.log`,
`sc202-r6arev-allshots.sha256`. Tree left exactly as found (plugin clean at `a4123ae`;
superproject `d85fc4e` with its pre-existing ` M draw-steel-elements`); `visual-harness/dist/`
restored to the pinned state (`f612f1e8…` / `69253e39…` / `a52a7daf…`, meta `pinned-cache`).

---

## 1. Brief items 1–10, answered

1. **ToS boundary — CLEAN.** The 796-line diff touches 6 files (`package.json`,
   `test/unit/build/obsidianAppCssPin.test.ts`, `visual-harness/README.md`,
   `fetch-obsidian-app-css.mjs`, `obsidian-app-css.pin.mjs`, `shoot.mjs`). Grepping every
   added line for Obsidian CSS signatures (`--background-primary`, `--text-normal`,
   `.theme-dark`, `.markdown-rendered {`, `@media`, `!important`, `rgba(`) → **0 hits**; the
   longest added line is a test title. `git ls-files visual-harness/dist` → 0.
   `git check-ignore -v` confirms `.gitignore:31 visual-harness/dist` covers
   `obsidian-app.css`, `obsidian-1.13.7.asar.gz` and `obsidian-app.css.meta.json`.
2. **Fetch correctness — CONFIRMED.** Cold (cache deleted): HTTP 200, 8,773,048 B, **2.03 s**,
   `.asar.gz` `69253e39…`, `.asar` `a52a7daf…`, `app.css` `f612f1e8…` (637,090 B) — all three
   identical to the ledger's probe. Warm: **0.39 s**, `mode: pinned-cache`, cached gz mtime
   unchanged; warm with an unreachable `SC202_HOST_CSS_URL_OVERRIDE` still succeeds in
   0.39 s; `strace` counts **0 `connect()` syscalls** on a warm run. The asar reader is
   SC-205's, imported not forked (`fetch-obsidian-app-css.mjs:42`:
   `import { findObsidianAsar, readAsarFile } from './obsidian-host-pin.mjs'`);
   `obsidian-host-pin.mjs` is untouched by the diff (0 lines).
3. **Can-fail — all four reproduced**, plus two the brief didn't ask for. Corrupt cache →
   `OBSIDIAN APP.CSS PIN VERIFICATION FAILED: HASH MISMATCH (asar.gz): got b4b1329d…,
   expected 69253e39…`, exit 1, `dist/obsidian-app.css` provably untouched. Wrong pin hash →
   `HASH MISMATCH (app.css): got f612f1e8…, expected deadbeef…`, exit 1. No network + no
   cache → installed fallback + WARNING naming `Obsidian 1.14.0, sha256 013ed841…`, exit 0.
   No network + no cache + no installed asar → nothing written, exit 0, sweeps SKIP (proved
   separately, see below). **Bonus:** `npm run shots` aborts on a `preshots` failure with
   exit 1 **before any capture** (0 `ok` lines) — the safety property the whole design rests
   on. **But** "no path silently swaps in the installed sheet while claiming the pin" does
   NOT hold in general — see MED-1/MED-2.
4. **`.meta.json` provenance — correct in all three modes**, and the shots run prints
   exactly ONE provenance line and ONE drift line:
   `obsidian app.css ready (pinned-cache): Obsidian 1.13.7, sha256 f612f1e8…` and
   `OBSIDIAN APP.CSS PIN DRIFT — installed Obsidian is 1.14.0 (app.css sha256 013ed841…)
   but the harness gate runs against the pinned 1.13.7 …`. `grep pinNote|R1_APP_CSS_SHA256|"does
   not match the round"` in `shoot.mjs` → **0 hits**. Fallback meta carries
   `source: installed-fallback` + `version`/`sha256` (installed) **and**
   `pinnedVersion`/`pinnedSha256`.
5. **The sweeps read the sheet that is on disk — PROVED, and the result is sheet-independent.**
   With the pinned 1.13.7 sheet: all six gate lines OK (154 / 278 / 340 / 1126 / 46
   comparisons + `link token-override probe OK (157 links …)`). With the installed 1.14.0
   extract in the same path (reached honestly via the offline fallback): the six gate lines
   are **byte-identical**, provenance line changed to `installed-fallback … 1.14.0 … 013ed841…`.
   So no family's result depends on which sheet is present — nothing to fix, but note the
   corollary: **the OK lines carry no sheet identity at all any more** (LOW-4 below), so the
   single provenance line ~550 lines earlier is the only record of what was gated.
6. **SC-205's pin still can-fails.** Perturbing the `[SC205-HOST-RULES]` fence's selector
   text (`button:not(.clickable-icon)` → `…icons`) → `IN-REPO HOST-MODEL CHECK FAILED …
   sheet lists: … model has: …`, exit 1. (INFO-3: perturbing only the `(0,1,1)` specificity
   column passes — `checkSheetHostRuleListing` strips that prefix by design; those
   annotations are unverified prose. Pre-existing SC-205 behaviour, not this round's.)
7. **Tests — pass, no network, load-bearing for the gz leg only.** 8 tests green;
   `strace` on the isolated suite counts **0 AF_INET `connect()`**. Neutering `assertHash`
   reddens 2 tests. But deleting the `app.css` hash check leaves the suite **8 passed** →
   LOW-1. The `PINNED_OBSIDIAN` relationship is documented and codified
   (`cmp(1.13.7, 1.14.0) = -1 ≤ 0`); the divergence itself is legitimate (a version FLOOR
   for a hand-copied model vs. an exact CONTENT pin) — but it is not consequence-free, see
   MED-3.
8. **Docs + recipe — accurate and working.** `visual-harness/README.md` §"Obsidian app.css
   pin" matches observed behaviour; `just dse-host-css` from the worktree superproject root
   under devbox → exit 0, `pinned-cache` (INFO-1 on one README sentence).
9. **Battery on `a4123ae`** — see §3. Every number matches the implementer's report.
10. **LOW-4 fold — load-bearing.** Skipping the first `removeSyntheticTaskList()` call →
    `CHECKBOX HOST-LEAK VIOLATED … dark|tasklist-cleanup: 1 synthetic task-list node(s)
    still in the DOM after removeSyntheticTaskList (LOW-4)` (+ the `light` twin), exit 1.

---

## 2. Findings

### MED-1 — the sweeps inject `dist/obsidian-app.css` **without verifying it**; a wrong sheet is a full green

`visual-harness/shoot.mjs:1663-1677` (`loadLocalObsidianAppCss`)

```js
	try {
		css = fs.readFileSync(outFile, 'utf8');
		meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
	} catch { return null; }
	if (!css || !meta?.sha256) return null;
	return { css, version: meta.version, sha256: meta.sha256, source: meta.source };
```

The bytes are never hashed; `sha256`/`version`/`source` are copied out of the sidecar JSON
verbatim (and, since the five `pinNote` blocks were retired, have **no consumer at all** —
`grep 'host\.\(sha256\|version\|source\)' shoot.mjs` → 0). Before this commit the same
function extracted `app.css` from the installed asar itself, so the injected bytes could not
be a lie; the verification now lives entirely in a different process.

**Failure scenario, executed.** `printf '/* not the pinned sheet at all */\n' >
dist/obsidian-app.css` (34 bytes) with the genuine `pinned-cache / 1.13.7 / f612f1e8…` meta
left beside it, then `node visual-harness/shoot.mjs`:

```
input host-leak OK (13 input kinds × 6 states … = 154 comparisons against the real Obsidian app.css: …)
table host-leak OK (…)   list host-leak OK (…)   inline host-leak OK (…)
link token-override probe OK (157 links …)       checkbox host-leak OK (…)
```

exit 0 (`sc202-r6arev-probe-fakesheet.log`). Six gates report a clean sweep "against the
real Obsidian app.css" having swept 34 bytes of comment.

**Second leg, reachable through the documented command.** `fetch-obsidian-app-css.mjs:151-155`
(outcome 3) returns `{ resolved: false }` **without removing** a pre-existing
`dist/obsidian-app.css` + `.meta.json`, while `main()` prints
`obsidian app.css NOT available this run … host-leak sweeps will print their existing
SKIPPED (no local asar) line`. Executed (`sc202-r6arev-probe-outcome3-stale.log`): the stale
34-byte sheet and its `pinned-cache 1.13.7` meta survived untouched. Combined with the fake
sheet run, a single `npm run shots` can therefore announce a SKIP and then gate green against
an arbitrary leftover sheet. (Precondition: no cache, no network, no *usable* installed asar
— which MED-3 makes far more likely than it sounds.)

**Fix.** In `loadLocalObsidianAppCss`, recompute `crypto.createHash('sha256').update(css)`
and `process.exit(1)` (the loud shape every other gate in this file uses) when it differs
from `meta.sha256`; additionally compare against `OBSIDIAN_APP_CSS_PIN.appCssSha256` when
`meta.source` starts with `pinned-`. In outcome 3, unlink `obsidian-app.css` +
`obsidian-app.css.meta.json` before returning `{resolved:false}` so the printed SKIP promise
is true. (Same one-place fix serves MED-4.)

### MED-2 — a 4xx/5xx from the pinned URL (i.e. a **wrong pin**) is treated as "offline"

`visual-harness/fetch-obsidian-app-css.mjs:115-156`

```js
const res = await fetchImpl(url);
if (!res.ok) throw new Error(`HTTP ${res.status}`);   // thrown INSIDE the offline-fallback try
```

A completed HTTP response with a non-OK status is indistinguishable from a dead network, so
the recipe falls back to the installed sheet and exits 0.

**Failure scenario, executed** (`sc202-r6arev-canfail-404pin.log`): pin temporarily set to a
nonexistent `9.9.9` →

```
OBSIDIAN APP.CSS FETCH UNAVAILABLE (HTTP 404), no cached copy — falling back to the INSTALLED
Obsidian's app.css: Obsidian 1.14.0, sha256 013ed841… This is NOT the pinned 9.9.9 sheet …
obsidian app.css ready (installed-fallback): Obsidian 1.14.0, sha256 013ed841…
```

exit 0, meta `installed-fallback`. This is precisely the failure this round already hit once
(1.14.0 has no public asset): a mistyped, retired or yanked pin quietly becomes "gate against
whatever this dev happens to have installed". It is labelled, not silent — but the label is a
warning on a run that still exits 0 and still prints six `… OK` lines.

**Fix.** Only a connection-level failure should fall back. Re-throw a non-OK HTTP status out
of the try (or catch only `TypeError`/`ECONNREFUSED`/`ENOTFOUND`/`ETIMEDOUT`), so a broken pin
takes the same loud `process.exit(1)` path as a hash mismatch.

### MED-3 — the offline fallback and the drift line are gated by SC-205's version **floor**, so a machine running exactly the pin gets neither

`fetch-obsidian-app-css.mjs:123-125` and `:190-196` both branch on `findObsidianAsar()`'s
`usable` flag, which is `installed >= PINNED_OBSIDIAN` (`obsidian-host-pin.mjs:88-91`,
`PINNED_OBSIDIAN = '1.14.0'`). That flag answers "is this new enough to validate SC-205's
hand-copied button model" — a different question from "may I use this sheet as an offline
stand-in for the pinned one".

**Failure scenario, executed** (`sc202-r6arev-probe-fallback-1137.log`): `HOME` pointed at a
scratch home containing `.config/obsidian/obsidian-1.13.7.asar` (the pinned asar itself,
`a52a7daf…`), unreachable URL, no cache →

```
OBSIDIAN APP.CSS FETCH UNAVAILABLE (fetch failed), no cached copy, and no usable installed
Obsidian asar either — host-leak sweeps will SKIP this run.
```

An offline dev whose Obsidian **is** the pin loses all six gates, and is told there is no
usable asar while the byte-identical pinned sheet sits on disk. Same flag makes
`checkDriftAgainstInstalled` return `null` for any install below 1.14.0, so drift is never
reported on those machines either.

**Fix.** Use the located asar regardless of SC-205's floor for both the fallback and the
drift comparison (naming the version in the warning either way). Better: when the installed
version equals the pin, verify its extracted `app.css` against `appCssSha256` and record it
as a *valid pinned* sheet (`source: "installed-pinned"`), not a fallback — offline devs then
keep a real gate.

### MED-4 — six gates now depend on an npm lifecycle hook; any invocation that skips it SKIPs them silently

`package.json` (`"preshots": "npm run host-css"`) is the only thing that populates
`dist/obsidian-app.css`. `node visual-harness/shoot.mjs`, `npm run shots --ignore-scripts`,
or any environment with `ignore-scripts=true` (a common CI/security default) now yields
(`sc202-r6arev-shots-nosheet.log`):

```
input host-leak SKIPPED (no local asar)      table host-leak SKIPPED (no local asar)
list host-leak SKIPPED (no local asar)       inline host-leak SKIPPED (no local asar)
link token-override probe SKIPPED (no local asar)   checkbox host-leak SKIPPED (no local asar)
```

exit 0, 524 PNGs still written. Before this commit those same invocations swept, because the
loader read the installed asar itself. The SKIP wording is also now false: the condition is
"no resolved sheet in `visual-harness/dist/`", not "no local asar" — a reader with Obsidian
installed will chase the wrong thing.

**Fix.** Have `loadLocalObsidianAppCss` call `resolvePinnedObsidianAppCss()` itself when the
file is absent (the module is importable, idempotent, 0.39 s and no network on a cache hit),
or hard-fail with `run 'npm run host-css' first` when an Obsidian asar exists but no sheet was
resolved. Reword the SKIP line to name the real condition.

### LOW-1 — the jest can-fail covers only the `.asar.gz` leg; the `app.css` check is untested

`test/unit/build/obsidianAppCssPin.test.ts:135-166` builds a pin whose `asarGzSha256` is
deliberately wrong, so `verifyAndExtract` throws at `fetch-obsidian-app-css.mjs:74` and never
reaches `:80` — `assertHash(sha256(css), pin.appCssSha256, 'app.css')`, the check this entire
round exists for. **Executed:** replacing line 80 with a comment leaves the suite **8 passed**
(`sc202-r6arev-jest-appcss-check-removed.log`). (Neutering `assertHash` itself does redden 2
tests, so the existing cases are not vacuous.)
**Fix.** Add a case with a *correct* `asarGzSha256` (hash the synthetic gz in-test) and a wrong
`appCssSha256`, asserting `/HASH MISMATCH \(app\.css\)/` — it needs a tiny hand-built asar
carrying an `app.css` entry, or export `verifyAndExtract` and drive it directly.

### LOW-2 — the loud failure names the mismatch but prescribes no remedy, and a corrupt cache never self-heals

`fetch-obsidian-app-css.mjs:224-227` prints `OBSIDIAN APP.CSS PIN VERIFICATION FAILED: HASH
MISMATCH (asar.gz): got …, expected …` and exits 1 — correct, but every other gate in this
repo prints a remedy (`See styles-source.css → …`, `follow the printed remedy`). A truncated
download leaves the dev to read the source to learn "delete
`visual-harness/dist/obsidian-<ver>.asar.gz` and re-run". Append that sentence + the README
pointer to the catch block.

### LOW-3 — fragile CLI entry guard

`fetch-obsidian-app-css.mjs:223`: `if (import.meta.url === \`file://${process.argv[1]}\`)`.
Any path needing percent-encoding (a space, a non-ASCII character) makes this false, and the
script then does nothing when run directly — `npm run shots` would proceed against a stale or
absent sheet (MED-1/MED-4 territory) with no error. Use
`pathToFileURL(process.argv[1]).href`.

### LOW-4 — dead provenance fields; the sweep lines no longer say which sheet they swept

`loadLocalObsidianAppCss`'s returned `version`/`sha256`/`source` have no reader; the six OK
lines still claim "against the real Obsidian app.css" without identifying it, and I proved
those lines are byte-identical for the pinned 1.13.7 and the installed 1.14.0 sheets. The
values are already in hand — print one line in the sweep section (`host sheet: pinned-cache,
Obsidian 1.13.7, sha256 f612f1e8…`) so the gate block is self-describing and MED-1's failure
becomes visible in the same screenful as the OK lines.

### INFO

1. `visual-harness/README.md` bump step 2 says the mismatch error "names the real extracted
   hash" — with the `.asar.gz` check first, a candidate version's first failure names the
   *gz* hash; getting the `app.css` hash needs a second pass. Reword to say so.
2. `npm run lint` covers `src` + `main.ts` only, so neither new `.mjs` is linted
   (pre-existing repo config, not this round's doing).
3. SC-205's `checkSheetHostRuleListing` strips the `(a,b,c)` specificity prefix before
   comparing, so those annotations in `[SC205-HOST-RULES]` are unverified prose — my first
   can-fail attempt (perturbing `(0,1,1)`→`(0,1,2)`) passed, a selector perturbation failed
   loudly as required. Out of r6a's scope; flagged so the next SC-205 touch knows.
4. `meta.sha256` records `pin.appCssSha256` (what was asserted) rather than the hash of the
   bytes just written. Equivalent today because `assertHash` precedes the write; recording
   the computed hash is strictly more honest and costs nothing.

---

## 3. Battery on `a4123ae` (independent, foreground, gate last)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 (only the pre-existing `.eslintignore` deprecation notice) |
| `npx jest` (after `rm -f main.js styles.css`) | `Test Suites: 1 skipped, 199 passed, 199 of 200 total` / `Tests: 1 skipped, 3821 passed, 3822 total` / `Snapshots: 3 passed` |
| `npm run shots` | 524 `ok` captures, **0 FAIL**, 378.17 s; one provenance line + one drift line |
| `check-freeze.sh` | `freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 |
| 8 widening hashes | r3 six + r4 two → all `OK` via `sha256sum -c` |
| full-tree sha256 vs `sc202-r5rerev-allshots.sha256` | **0 of 524 moved** (and still 0 after all six probe runs) |
| `npm run parity` (LAST) | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, exit 0 |

Gate lines, verbatim (pinned 1.13.7 sheet):

```
host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.14.0; 21 further rules whose subject is a plain button were excluded by documented ancestor scope, 0 unclassifiable — see EXCLUDED_ANCESTOR_SCOPES)
button host-leak OK (113 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 678 comparisons: …)
input host-leak OK (13 input kinds × 6 states (rest/hover/disabled/focus-visible/placeholder/spinner) × dark/light = 154 comparisons against the real Obsidian app.css: … ; -webkit-app-region and unicode-bidi are excluded by design)
table host-leak OK (4 table kinds × dark/light = 278 comparisons … except 2 declared, deferred exceptions (box-sizing/overflow-wrap …))
list host-leak OK (8 ul/ol [24] + 67 li box [150] + 67 li::marker [150] + 2 blockquote box [4] + 4 blockquote-child-margin (first+last) [8] + 1 hr [2] + 1 li>p synthetic probe [2] × dark/light = 340 comparisons …)
inline host-leak OK (… = 1126 comparisons …)
link token-override probe OK (157 links [1 .internal-link + 1 .external-link + 155 generic] × 7 properties = 1099 samples: 0 diffs …)
checkbox host-leak OK (2 plugin-authored checkbox kinds × 7 states [28] + 1 synthetic task-list checkbox × 7 states [14] + 2 synthetic task-list <li> decoration [4] × dark/light = 46 comparisons …)
print-twin parity OK (130 capture ids byte-identical: preview twin === real print)
```

`diff` of my shots log against the implementer's `sc202-r6a-shots.log`: only the devbox
banner, `⚡ Done in 181ms → 173ms`, and my own `SHOTS ELAPSED` line. `diff` of the gate lines
against `sc202-r5rerev-shots.log`: **exactly five lines**, each losing only its trailing
`; Obsidian 1.14.0, sha256 013ed841… does not match the round's pin f612f1e8… — sweeping
against it anyway, a version drift, not a defect` clause; all comparison counts unchanged
(154 / 278 / 340 / 1126 / 46). Report claims verified.

---

## 4. Report accuracy

The implementer's `sc202-r6a-report.md` is accurate on every checkable claim — the three
hashes, the timings (I measured 2.03 s / 0.39 s vs. their ~1.8–2.0 / 0.29), the battery
numbers, the five changed gate lines, the `.meta.json` schema, the pin-naming rationale, the
decision not to merge the two pins, and the CI note. Two nuances worth carrying into the
ticket note:

- "Every rounds 1–5 family re-proven against the PINNED 1.13.7 sheet" is true but weakly
  discriminating: I ran the same battery against the installed **1.14.0** sheet and the six
  gate lines came back byte-identical. The families are invariant to the 1.13.7↔1.14.0 delta,
  which is the expected (good) answer — it just isn't evidence that a *different* pin would
  have been caught.
- "no path silently swaps in the installed sheet while claiming the pin" is true of the
  three modes the recipe itself writes; it is not true of the consumer (MED-1) or of a
  wrong pin (MED-2).

## 5. Recommendation

Fix MED-1 through MED-4 (one commit; MED-1 and MED-4 share a single ~10-line change in
`loadLocalObsidianAppCss`, MED-2 is a two-line rethrow, MED-3 is a `usable`-flag decoupling),
fold LOW-1 through LOW-4, then a scoped re-review: re-run the fake-sheet, outcome-3-stale,
404-pin, installed-1.13.7-fallback and no-preshots probes (all scripted above) plus the full
battery. Nothing here touches a pixel — all four MEDs are gate-integrity, and the round moved
0 of 524 shot bytes across seven independent shots runs.

---

## Scoped re-review of `742bcd9`

**VERDICT: APPROVE** (1 residual non-blocking LOW). All four MEDs and all four LOWs are
closed by execution; the architectural asymmetry the round was sent back for is gone —
`shoot.mjs` now awaits `ensurePinnedObsidianAppCss()` itself before launching a browser and
re-hashes the sheet at injection time, so the 34-byte fake sheet that made six gates print
"OK against the real Obsidian app.css" is now (a) overwritten by the in-process ensure before
any sweep and (b) caught by `readVerifiedSheet` against BOTH the meta's hash and the
committed pin. **MED-1 CLOSED · MED-2 CLOSED · MED-3 CLOSED (better than asked:
`installed-pinned`) · MED-4 CLOSED · LOW-1 CLOSED · LOW-2 CLOSED · LOW-4 CLOSED ·
INFO-1 CLOSED · LOW-3 PARTIALLY CLOSED** — the percent-encoding half is fixed, but the
brief's own acceptance test ("invoke via a symlinked path") still produces a **silent
no-op**: `import.meta.url` is realpath-resolved while `process.argv[1]` is not. Non-blocking
(the CLI is no longer load-bearing for the gate — `shoot.mjs` ensures in-process), one-line
fix given below. Battery on `742bcd9`: tsc/lint clean; jest **3825 passed / 1 skipped / 199
of 200 suites**; shots **524/0** with ONE provenance + ONE drift line and six sweeps OK;
`freeze OK (252/252 …)`; 8/8 widenings; **0 of 524 moved** vs `sc202-r6arev-allshots.sha256`
(and 0 across two runs); parity **0 gap(s) / 0 undeclared / 16 declared**, exit 0.

### Per-finding verdicts (each re-run as its own probe)

**MED-1 — CLOSED, three ways.**
- *Unit* (`sc202-r6arerev-med1-unit.log`, `readVerifiedSheet` against a scratch dist):
  fake bytes + the genuine pinned meta → `OBSIDIAN APP.CSS MISMATCH — …/obsidian-app.css does
  not match its own …meta.json (sha256 bc7370d2… on disk, meta says f612f1e8…)`. Fake bytes +
  a *self-consistent* meta still claiming `pinned-cache` → `…claims source "pinned-cache" (a
  verified-against-the-pin sheet) but its sha256 (bc7370d2…) does not match the committed pin
  (f612f1e8…)` — the defense-in-depth leg, so rewriting the sidecar to match a tampered file
  does not buy a pass. `installed-fallback` + self-consistent meta resolves (correct: that
  source is explicitly uncertain). Nothing resolved → `null`, no throw.
- *End-to-end* (`sc202-r6arerev-med1-e2e.log`): the 34-byte fake planted in the real
  `dist/` before `node visual-harness/shoot.mjs` is **overwritten by the startup ensure**
  (`f612f1e8…` after; meta `sha256` = the written bytes' hash, INFO-4) and the run proceeds
  honestly. The original exploit is now structurally unreachable — every resolve path writes
  `obsidian-app.css`, so no fake can survive to injection; `readVerifiedSheet` remains as
  defense against out-of-band tampering between ensure and the sweeps.
- *Second leg* (`sc202-r6arerev-med1-outcome4.log`): stale sheet + meta present, no cache,
  unreachable URL, empty `HOME` → `no eligible installed Obsidian asar either — host-leak
  sweeps will SKIP this run` and **both files are deleted** (`ls dist/` after: only
  `harness.*` + the asar). A printed SKIP no longer lies next to a sheet a later run could
  pick up.
- *Guarded*: neutering both comparisons in `readVerifiedSheet` reddens the suite
  (`Tests: 1 failed, 11 passed`) — `sc202-r6arerev-med1-jest-mutated.log`.

**MED-2 — CLOSED.** Temp `9.9.9` pin (`sc202-r6arerev-med2-404.log`): exit 1,
`OBSIDIAN APP.CSS PIN VERIFICATION FAILED: HTTP 404 fetching the pinned Obsidian release
asset (…/v9.9.9/obsidian-9.9.9.asar.gz) — the pin likely names a version with no public
asset; check https://github.com/obsidianmd/obsidian-releases/releases …` + the shared remedy
line; **no fallback, nothing written to `dist/`**. The genuine-network-error path still falls
back (`sc202-r6arerev-med2b-offline.log`): unreachable override + no cache → WARNING naming
`Obsidian 1.14.0, sha256 013ed841…`, exit 0, meta `installed-fallback` with
`pinnedVersion`/`pinnedSha256`. Classification is done in `fetchFresh()` by whether
`fetchImpl` threw vs. returned a non-OK response — the right seam.

**MED-3 — CLOSED, and improved beyond the ask.** Scratch `HOME` holding exactly
`.config/obsidian/obsidian-1.13.7.asar` + unreachable URL + no cache
(`sc202-r6arerev-med3-installed1137.log`): `…but the installed Obsidian IS the pinned version
and its app.css verifies against the pin: Obsidian 1.13.7, sha256 f612f1e8…. Using it as a
verified pinned sheet (not a fallback).` → `host sheet: installed-pinned, Obsidian 1.13.7,
sha256 f612f1e8…`, `dist/obsidian-app.css` == the pin, no drift line (correctly). Eligibility
is now `isEligibleInstalledAsar` (any parseable `x.y.z`, excluding the unversioned
`/opt/.../obsidian.asar`), decoupled from SC-205's `PINNED_OBSIDIAN` floor, and both the
fallback and `checkDriftAgainstInstalled` use it. The two pins' relationship is documented in
`isEligibleInstalledAsar`'s comment, the pin file's header, and the README.

**MED-4 — CLOSED.** `preshots` is gone from `package.json`; `shoot.mjs` imports
`ensurePinnedObsidianAppCss` and awaits it at top level before `chromium.launch()`. Full
`node visual-harness/shoot.mjs` with no npm at all
(`sc202-r6arerev-med4-directshoot.log`): drift line, `host sheet: pinned-cache, Obsidian
1.13.7, sha256 f612f1e8…`, **524 ok / 0 FAIL / 0 SKIPPED**, and its gate lines `diff` clean
against the `npm run shots` battery run. `npm run shots --ignore-scripts`
(`sc202-r6arerev-med4-ignorescripts.log`) likewise resolves the sheet. SKIP wording is now
true: `SKIPPED (no resolved Obsidian app.css sheet)`, printed only when nothing resolved.

**LOW-1 — CLOSED.** Deleting the `app.css` `assertHash` (`fetch-obsidian-app-css.mjs:168`)
now reddens jest — `Tests: 1 failed, 11 passed, 12 total`
(`sc202-r6arerev-low1-jest-mutated.log`); before the fix round the same deletion left all 8
green. Runtime confirmation (`sc202-r6arerev-low1-appcss-runtime.log`): a wrong
`appCssSha256` in the pin → cache self-heal message, one re-fetch, then
`PIN VERIFICATION FAILED: HASH MISMATCH (app.css): got f612f1e8…, expected deadbeef…` +
remedy, exit 1 — i.e. exactly one retry, never a loop, and never a fallback.

**LOW-2 — CLOSED.** Corrupted cached `.asar.gz` (`sc202-r6arerev-low2-selfheal.log`):
`OBSIDIAN APP.CSS cached copy failed verification (HASH MISMATCH (asar.gz): got 7b061f5a…,
expected 69253e39…) — deleting the cache and re-fetching once before giving up.` → `host
sheet: pinned-fetch, …f612f1e8…`, exit 0, cache back to `69253e39…`. Every failure print now
carries `HASH_FAILURE_REMEDY`.

**LOW-3 — PARTIALLY CLOSED (residual, non-blocking).** The guard is now
`import.meta.url === pathToFileURL(process.argv[1] ?? '').href`, which fixes the
percent-encoding case, but Node resolves `import.meta.url` through symlinks while
`process.argv[1]` keeps the path as typed. Executed: `node "<scratch>/sym dir/host css
link.mjs"` and `node <scratch>/plainlink.mjs` (both symlinks to the real module) produce
**empty output, exit 0** — the whole CLI body is silently skipped
(`sc202-r6arerev-low3-symlink.log`); a relative real path (`node
./visual-harness/fetch-obsidian-app-css.mjs`) works. Impact is now small — MED-4's fix means
the gate never depends on this CLI — but the brief's own acceptance test names it.
**Fix:** compare realpaths, e.g.
`const entry = process.argv[1] && fs.realpathSync(path.resolve(process.argv[1]));
if (entry && entry === fs.realpathSync(fileURLToPath(import.meta.url))) { … }`.

**LOW-4 — CLOSED.** The provenance line now names the sheet in use:
`host sheet: pinned-cache, Obsidian 1.13.7, sha256 f612f1e8…` (and
`host sheet: none resolved (…)` when nothing resolved), and the meta's `sha256`/`source`
fields are load-bearing inputs to `readVerifiedSheet` rather than decoration. Nit only:
`readVerifiedSheet`'s returned `version`/`source` are still unread by `shoot.mjs` (the six
sweeps use `host.css` alone) — cosmetic, no longer a gate risk.

**INFO-1 — CLOSED** (README bump step 2 now says the first failure names the gz hash and a
second pass is needed for the `app.css` hash). **INFO-2 / INFO-3 — dropped per ruling**, and
still true: `npm run lint` covers `src` + `main.ts` only, and SC-205's fence check ignores the
`(a,b,c)` specificity column.

### Battery on `742bcd9` (independent, foreground, parity last)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 (`sc202-r6arerev-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc202-r6arerev-lint.log`) |
| `npx jest` (after `rm -f main.js styles.css`) | `Test Suites: 1 skipped, 199 passed, 199 of 200 total` / `Tests: 1 skipped, 3825 passed, 3826 total` / `Snapshots: 3 passed` (+4 vs `a4123ae`, exactly the new can-fail cases) |
| `npm run shots` | 524 ok, **0 FAIL**, 378.97 s; `provenance=1 drift=1`; six sweeps OK (154 / 278 / 340 / 1126 / 46 + `link token-override probe OK (157 links …)`), comparison counts unchanged from `a4123ae` |
| `check-freeze.sh` | `freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 |
| 8 widening hashes | all `OK` |
| sha256 all PNGs vs `sc202-r6arev-allshots.sha256` | **0 of 524 moved**; also 0 across the two full runs of this pass |
| `npm run parity` (LAST) | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, exit 0 |

Tree left as found: plugin clean at `742bcd9`, superproject `d85fc4e` with its pre-existing
` M draw-steel-elements`; `visual-harness/dist/` restored to the pinned state
(`obsidian-1.13.7.asar.gz` `69253e39…`, `.asar` `a52a7daf…`, `obsidian-app.css` `f612f1e8…`,
meta `pinned-cache`); no processes left running.

**Recommendation: APPROVE and land.** Fold the LOW-3 realpath one-liner opportunistically
(round 6b's commit is fine) — it does not warrant a round of its own now that the CLI is not
on the gate path.
