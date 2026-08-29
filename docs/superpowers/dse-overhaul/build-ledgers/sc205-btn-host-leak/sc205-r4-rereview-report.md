# SC-205 — round 4 scoped delta re-review (`b2a92f5..c32bc35`)

**Verdict: FURTHER FIXES NEEDED — 2 MEDIUM, 3 LOW, 1 INFO, all new and all local.**

All 11 R2 findings are closed against their written failure scenarios, and every number the
fix report claims reproduced exactly on my own runs. Two of the fixes, however, introduced or
left standing a hole of the same class they were closing:

- the new **sheet-listing pin (HIGH-1) never runs on a machine without a local Obsidian ≥
  1.13.7** — I proved it silent with a deliberately broken fence;
- the new **subject-based partition (MEDIUM-3) is not exhaustive** — a comma inside `:is()` /
  `:not()` makes a rule invisible to it, including one that ships in 1.13.7 today and
  including the exact `:is(.markdown-rendered, .markdown-preview-view) button` case the
  module's own docstring names as its reason to exist.

Neither changes the committed result on this machine. Both are small, local fixes.

Scope: delta only. I did not re-audit the R1 machinery I already cleared in R2.

---

## Gate numbers I re-ran myself, at `c32bc35`

| Gate | Result |
|---|---|
| `npm run shots` (full) | **474 PNGs, 0 FAIL** |
| `host-copy pin` | `OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing … 20 further rules … excluded by documented ancestor scope)` |
| `button host-leak` | `OK (111 button kinds × 3 states × dark/light = 666 comparisons)`, **12 exemptions**: 8× `focus-visible: disabled`, 2× `hover: no point … hit-tests`, 2× `focus-visible: visibility: hidden` — **exactly the residual I predicted in R2** |
| `check-freeze.sh` ×2 (before and after all probes) | **`freeze OK (210/210 …)`, exit 0**, 0 mismatches |
| `npx jest` (after `rm -f main.js styles.css`) | **3257 passed / 1 skipped / 3258 · 184 passed + 1 skipped = 185 suites · 3 snapshots**, load 1.16 |
| `npm run tsc` | clean |
| print-twin parity | `OK (118 capture ids byte-identical)` |

**The fixer's "no test surface touched" claim: verified, and then checked anyway.** The delta
touches three files, none of them `.ts` (`styles-source.css`, `visual-harness/shoot.mjs`,
`visual-harness/obsidian-host-pin.mjs`). But 20+ jest suites *do* read `styles-source.css`, so
"no test surface" is not free — I ran the full suite rather than accept it, and the count is
unchanged.

**Sheet change is comment-only — independently proven.** Stripping every `/* … */` from
`git show b2a92f5:styles-source.css` and `git show c32bc35:styles-source.css` yields
**byte-identical** output, 322,690 chars both sides. Freeze 210/210 is the second witness.

**Arithmetic cross-check on the headline movement.** 80 → 111 kinds is +31. In R2 I measured
30 keys with instances in more than one structural context, one of which (`hero`) spanned
three. 29 × (+1) + 1 × (+2) = **+31**. The number is not just plausible, it is the number my
own R2 measurement predicts.

---

## Per-finding disposition

| R2 finding | Disposition | How I verified it (not how it was claimed) |
|---|---|---|
| **HIGH-1** sheet's stale two-rule transcription | **CLOSED** (see new R4-M1) | Diff shows the declarations deleted and replaced with a fenced 6-rule index. Can-fail re-run by me: deleted `(0,1,1)  button:focus-visible` from the fence → `npm run shots` **exit 1**, sheet list and model list printed side by side, sweep did not run. |
| **MEDIUM-1** exemptions scoped to the mount, not the product | **CLOSED** | `CHROME_REVEAL_CSS` is added by `page.addStyleTag` after `goto` and **before** `page.evaluate(tagButtons)` (`shoot.mjs:1378`), inside the per-scheme loop, and nothing removes it — so one DOM serves all three states in both passes. Exemptions 104 → 12 reproduced; residual is exactly my predicted set. Harness-only: the gate runs after every capture on its own navigations, the tag dies with the next `goto`, and 474 PNGs / 0 FAIL + freeze 210/210 + print-twin 118 confirm nothing reached a shot. |
| **MEDIUM-2** kind key collapsed different surfaces | **CLOSED** | Own playwright probe against the built gallery with the R3 key: 225 nodes → **111 distinct keys** (matches the gate), 60 keys carry a chrome surface (30 `\|in:chrome` + 30 `\|in:chrome-summary`), and **0 keys still span more than one structural context**. Spot-check `hero`, the family I found sampling *neither* chrome instance: it now has three separate records — body (`hero\|dse-btn.dse-btn--ghost.dse-btn--icon`), `\|in:chrome-summary` (23.8×23.8), `\|in:chrome` (25.5×24.16), all with `pointer-events: auto`. `feature` and `kit` likewise carry both surfaces. |
| **MEDIUM-3** pin's prefix filter presented as the whole reaching set | **CLOSED as bounded by ruling 6, but the partition is not exhaustive — see R4-M2** | Ran `partitionButtonRules` against the real 1.13.7 app.css: **6 reaching + 20 excluded**, each exclusion carrying a scope and a `why`, and the count is printed on every run. That satisfies ruling 6's "explicit, documented, deliberate". The exhaustiveness claim does not hold (R4-M2). |
| **MEDIUM-4** stale `/opt` asar → drift + a remedy that downgrades the model | **CLOSED** | Six worlds through the real module (`sc205r4-worlds.log`): only-1.9.0 → `usable:false` naming the staleness; only-1.13.6 → `usable:false`; 1.9.0+1.13.7 → newest wins, `usable:true`; 1.13.6+1.13.8 → 1.13.8, `usable:true` (a newer asar correctly stays a hard drift); no config asar → `/opt`, `usable:false`; malformed filenames only → `/opt`, `usable:false`. End-to-end: the world that was `exit 1 / HOST COPY DRIFTED / re-extract` in R1 is now **exit 0**, a loud SKIP that explicitly says *do NOT re-extract from an older asar*, and the sweep still runs and prints OK. |
| **LOW-1** `corner-shape` neither compared nor excluded; `app-region` misnamed | **CLOSED** | `cornerShape` is in `BTN_PROPS`; verified live that it is a real comparison and not a vacuous `undefined === undefined`: HeadlessChrome/149.0.7827.55, `CSS.supports('corner-shape','round')` → true, `getComputedStyle(button).cornerShape` → `'round'` (typeof string). `BTN_PROPS_EXCLUDED` now reads `-webkit-app-region` and the OK line prints it. |
| **LOW-2** cross-pass state agreement unasserted | **CLOSED** | The compare loop now pushes a problem and `continue`s when `b.blocked !== h.blocked` (`shoot.mjs:1416–1428`), so a disagreeing pair is loud *and* uncounted. Live proof that it is not accidentally rejecting pairs: `comparisons` = 666 = 111 × 3 × 2, i.e. every pair passed the new guard. |
| **LOW-3** forced-colors called unmeasurable | **CLOSED** | Comment now states Playwright *can* emulate it and gives three reasons for not doing so — ruling 6 discharged verbatim. |
| **LOW-4** `readAsarFile` unguarded | **CLOSED** | 64-byte zeros → `null`; 8-byte zeros → `null`; nonexistent path → `null`; `/dev/null` → `null`; a real asar truncated to half its bytes → still returns the app.css string, which is correct (app.css lies in the surviving half). Null now routes to the loud SKIP naming "a partial download, or a format change". |
| **LOW-5** off-viewport exemption mis-attributed | **CLOSED** | `onScreen` counter added; the new branch reports the viewport reason separately. The 2 real records still report the ancestor-clip reason, so the existing diagnosis did not regress. |
| **LOW-6** comment arithmetic | **CLOSED with a residual — R4-L2** | "Two smaller drifts" → three; "three of the five rules" → "SIX rules … carried two … four that were missing"; pin header "two of the five" → "two of the six". One count was not re-examined (R4-L2). |
| INFO-1 / INFO-2 | out of the fixer's remit per rulings 9/10 — not assessed | — |

---

## New findings

### R4-M1 (MEDIUM) — the sheet-listing pin only runs where a local Obsidian ≥ 1.13.7 exists, so HIGH-1's second copy is unpinned everywhere else

`visual-harness/shoot.mjs:608` (`skip()`), `:622`, `:629`, `:635` (the three early returns)
vs `:673–690` (the fence check).

`assertHostCopyPinnedToObsidian` returns from `skip()` **before** it reaches the
`[SC205-HOST-RULES]` check. But that check needs no Obsidian at all — both operands are in the
repo (`styles-source.css`'s fence and `OBSIDIAN_HOST_BUTTON_CSS`). Coupling it to the asar gate
means the sheet listing is pinned on exactly one class of machine: one running Obsidian
1.13.7-or-newer. On CI, on a headless build box, on a fresh dev machine, or on one with an
older Obsidian — the environments ruling #1 wrote the SKIP path *for* — the second copy of the
model is unchecked again, which is the precise condition HIGH-1 was raised about.

**Proved, not reasoned.** I pointed `findObsidianAsar`'s config dir at a fake home containing
only `obsidian-1.9.0.asar` **and** deleted `(0,1,1)  button:focus-visible` from the fence, then
ran `npm run shots -- --bg=dark`:

```
host-copy pin SKIPPED — the newest Obsidian installed here is 1.9.0, OLDER than the 1.13.7 …
button host-leak OK (111 button kinds × 3 states … = 666 comparisons …)
```

**exit 0.** The sheet's index of the host rules was missing a rule and nothing said so.
(Restoring only the pin module, with the fence still broken, gives `exit 1` and the correct
drift — so the check works; it is only unreachable.)

**Fix.** Evaluate the fence check before the asar gate — either as its own function with its own
`sheet-listing pin OK / DRIFTED` line and its own exit, or by computing it into `drift` and
testing `drift.length` ahead of the three `skip()` returns. It costs one file read.

---

### R4-M2 (MEDIUM) — `partitionButtonRules` is not exhaustive: a comma inside `:is()`/`:not()` makes a rule invisible to both halves of the partition

`visual-harness/obsidian-host-pin.mjs:313` (`for (const one of r.sel.split(','))`), and
`:214` (`subjectIsPlainButton`'s `/:[a-z-]+(\([^()]*\))?/g`). `normalizeSelector` at `:276`
splits the same way.

The selector list is split on **every** comma, not on top-level commas — even though
`splitSubject` right above it already carries the depth counter that would do it correctly. A
rule using a functional pseudo-class with a comma list is therefore shredded into fragments,
none of which classifies as a plain-button subject, and the rule lands in **neither** `reaching`
nor `excluded`: it is not compared, not counted, and not mentioned in the printed "20 further
rules … excluded by documented ancestor scope". A second, independent gap: the pseudo-stripping
regex cannot span nested parens, so `button:not(:is(.x))` also classifies as not-a-plain-button.

Measured (`sc205r4-commasplit.log`), each run through the real exported functions:

| selector | verdict |
|---|---|
| `.markdown-rendered button` | REACHING (correct — pin would demand it be modelled) |
| `.view-content button` | REACHING (correct) |
| `:is(.markdown-rendered) button` | REACHING (correct) |
| **`:is(.markdown-rendered, .markdown-preview-view) button`** | **INVISIBLE** |
| **`button:not(.clickable-icon, .mod-cta)`** | **INVISIBLE** |
| **`button:not(:is(.mod-cta))`** | **INVISIBLE** |
| **`@container (max-width: 400px) .setting-item:not(:is(.mod-toggle, .mod-navigable, .mod-action, .setting-item-heading)) .setting-item-control button:not(.clickable-icon)`** | **INVISIBLE — and this one ships in 1.13.7 today** |

The first invisible row is the exact hypothetical the module's own docstring gives as its reason
for existing: *"a future `.markdown-rendered button { … }` or `.view-content button { … }`
reaches every plugin button in every note, and a prefix filter would never have mentioned it."*
Written the idiomatic way — one `:is()` with a comma — the new filter does not mention it
either. Rows 5 and 6 are worse in kind: a *subject-level* miss means a rule reaching **every**
plugin button drops silently out of the model comparison.

**No live leak.** The one real invisible rule is a settings-tab surface, out of scope per ruling
6, and it is out-of-scope-by-accident rather than by the documented exclusion list. But the fix
report's "nothing unaccounted" and my own earlier `unaccounted: 0` both used the same broken
split, so they agreed with the bug — a self-consistent audit is not an independent one, which is
worth recording alongside the finding.

**Fix.** Three parts, the third being the durable one:
1. add a depth-aware `splitSelectorList()` (the `splitSubject` counter, applied to commas) and
   use it in `partitionButtonRules` and `normalizeSelector`;
2. make `subjectIsPlainButton` strip **balanced** parens (loop the replace until stable);
3. add a loudness guard — any selector fragment containing `button` as a type that classifies as
   neither reaching nor excluded gets reported, so a future parser blind spot fails the gate
   instead of shrinking the printed boundary.

---

### R4-L1 (LOW) — the drift message prescribes the wrong remedy for a sheet-listing drift

`visual-harness/shoot.mjs:684–697`. The header says the model "no longer matches the app.css of
the Obsidian installed here" and the first instruction is "re-extract from THIS asar … bump
`PINNED_OBSIDIAN` and the provenance comment". For a `[SC205-HOST-RULES]` drift none of that is
true — Obsidian is fine, the model is fine, only the sheet's index is out of step — and
following the instruction would re-extract and re-pin for no reason. Observed verbatim in my
can-fail output. The body does add "keep the styles-source.css listing in step", which softens
it, but the headline and the first action misdirect.

**Fix.** Branch the remedy text on which drift class fired (rule/token drift vs sheet-listing
drift).

### R4-L2 (LOW) — the one count in the LOW-6 sweep that was not re-examined

`visual-harness/shoot.mjs:1089–1091`: *"three of the six rules Obsidian aims at a plugin button
only ever fire in the other two"*. Two do — `button:hover` and `button:focus-visible`. The
`button[disabled]` group fires **at rest** (R1's own can-fail A reported its `cursor` and
`opacity` diffs under `rest`), and `@media (forced-colors: active)` fires in no state this
harness renders. The `5 → 6` half of the correction was applied; the `three` was carried over.

### R4-L3 (LOW) — the mounted DOM is a superposition the product never shows, and nothing records why that is sound

`visual-harness/shoot.mjs:1096–1113` (`CHROME_REVEAL_CSS`). The reveal shows the panel **and**
the collapsed summary bar at once. In the product they are mutually exclusive:
`styles-source.css:12856` is `[data-dse-collapsed='on'] .dse-chrome { display: none !important }`
and `:12825` only shows the summary under the same attribute. The comment justifies the reveal
as "none of the three declarations sets a property this sweep compares on a button", which is
true, but the load-bearing fact is a different one: **no `[data-dse-collapsed]`-keyed rule
reaches a `.dse-btn`** — I grepped, and the four collapsed-keyed rules target the root
(`:12821`, `:12843`) and the panel container (`:12856`), never a button — so each button's
cascade in the superposition is the one it has in its real state. The day someone writes
`[data-dse-collapsed='on'] .dse-chrome-summary .dse-btn { … }`, the sweep will silently test the
summary button in the wrong cascade.

**Fix.** Record that dependency in the `CHROME_REVEAL_CSS` comment (one sentence), so the
constraint is visible to whoever adds such a rule.

### R4-INFO — two small robustness gaps in the fence check

`visual-harness/shoot.mjs:673–675`. `fs.readFileSync(sheetPath)` is unguarded (throws into
`FAIL sweep (exception)` if the sheet is ever unreadable — the same class LOW-4 just fixed one
directory over), and the fence regex is non-greedy, so a second `[SC205-HOST-RULES]` block
anywhere in the sheet would be silently ignored rather than flagged.

---

## No other new holes found

Things I specifically went looking for in the delta and did **not** find:

- **The reveal masking a genuine unreachability.** The 12 survivors are all static
  (`disabled` × 8, ancestor-clip × 2, `visibility: hidden` × 2) and none is chrome. The reveal
  only gives container nodes a box and lets the pointer through; it sets no property the sweep
  compares on a button.
- **Key-context explosion causing duplicate tags or collisions.** 111 keys with the reveal and
  111 without it (tagging uses `querySelectorAll`, which finds `display:none` nodes either way),
  0 keys spanning more than one context, and the gate's own count agrees.
- **The fence parser fooled by comment formatting.** The specificity prefix strip
  (`/^\s*\(\d,\d,\d\)\s*/`) is exact, blank lines are filtered, and the comparison is an
  order-sensitive join — a re-wrapped or re-ordered line produces a loud, readable drift rather
  than a false pass. (Its one real weakness is R4-M1: it is unreachable, not wrong.)
- **`corner-shape` being a vacuous comparison** — it is not; verified live.
- **The LOW-2 guard rejecting real pairs** — 666 comparisons is the full cross product.

---

## Tree state

`git status --porcelain` empty, `git diff` empty, `git diff --cached` empty,
`HEAD = c32bc35dddf10e9bc4f69b5e7b945cb5a5ee75c9`.

Every perturbation was reverted **from a file backup, never `git checkout <path>`** (per the
fixer's own process note). Post-restore sha256, diffed against the pre-probe capture and
identical:

```
95f2e4ba4f3a95a58d517f79744b6ddca36e89d573ba94a02bcecbd06ab18caa  visual-harness/obsidian-host-pin.mjs
608807cb1c3b254cad38845eb8a7e40303556e3103c4366342214e14bac3a023  styles-source.css
9614e0c35079a14e02973c9bd2dfbe7b529615df5ccdf02f39506252deed44cb  visual-harness/shoot.mjs
```

No `SC205-R4-PROBE` marker survives anywhere in the tree; `check-freeze.sh` re-run **after** all
probes → `freeze OK (210/210 …)`, exit 0.

## Evidence artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/`:

- `sc205r4-shots.log` — full `npm run shots` at `c32bc35` (474 PNGs, 0 FAIL, the two gate blocks)
- `sc205r4-jest.log` — 3257 passed / 1 skipped / 185 suites
- `sc205r4-partition.mjs`, `sc205r4-partition.log` — 6 reaching + 20 excluded with scopes and reasons, per-selector scope audit, `compareVersions` table, `readAsarFile` guard matrix
- `sc205r4-worlds.mjs`, `sc205r4-worlds.log` — the six ruling-7 version worlds
- `sc205r4-tag-probe.mjs`, `sc205r4-tag.log` — 111 keys, 0 mixed-context keys, the `hero` spot-check
- `sc205r4-commasplit.mjs`, `sc205r4-commasplit.log` — **R4-M2**: the seven classifier cases and the four real `setting-item-control button` rules
- `sc205r4-probe-skip-plus-brokenfence.log` — **R4-M1**: unusable asar + broken fence → exit 0, silent
- `sc205r4-canfail-fence.log` — HIGH-1 can-fail with a usable asar → exit 1, both lists printed
- `sc205r4-cornershape.mjs`, `sc205r4-cornershape.log` — Chromium 149 `corner-shape` support
- `r4-pin.GREEN`, `r4-sheet.GREEN`, `r4-green-shas.txt` — the sha-verified restore points
- R2 artifacts (`sc205rev-*`) are unchanged in the same directory.
