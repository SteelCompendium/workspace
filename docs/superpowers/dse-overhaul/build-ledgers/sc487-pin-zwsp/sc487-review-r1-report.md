# SC-487 independent review, round 1

**Executive summary**
- **Verdict: FIX-FIRST.** Reviewed dse `sc487-pin-zwsp` @ `2bf8541` (base `d152ea4`, which is still `origin/develop`'s merge-base), superproject worktree @ `382f595`.
- **Findings: 0 HIGH · 1 MEDIUM · 1 LOW · 5 INFO.**
- **MEDIUM-1:** the new name rule lists four zero-width characters, but Live Preview's real rule is wider. Obsidian's own fence regex (the same in 1.14.4 and 1.15.0) is `/^\s*(~~~+|```+)[ \t]*([\w\/+#-]*)[^\n`]*$/`, so Live Preview ends the name at ANY character outside `[A-Za-z0-9_/+#-]`. I measured 17 more openers that Live Preview renders as `ds-counter` and that DSE still reads as an unregistered type: U+200E, U+200F, U+00AD, U+180E, U+FE0F, U+2061, U+2064, U+034F, U+3164, U+2800, `.x`, `:x`, `,`, `{`, `(x)`, `é`, `!`. For each one, "Pin to sidebar" refuses with the Notice and the note is not changed. The O1 guard makes this safe, but the O2 rule is not met. This also disproves F3's premise ("no report of Obsidian rendering them").
- **Everything else holds.** The implementer's measurement table reproduces row for row on 1.14.4. All SC-457 rows are unchanged. The O1 guard covers every stamping entry point, with exactly one Notice and the note byte-identical (checked in real Obsidian). Twins don't cross-talk. CRLF is kept. G-S33 fails on base and on the parse mutant and passes on HEAD. The guard mutant fails 9 jest tests; the parse mutant fails 8.
- **Gates (my runs, scratch clone at 2bf8541):** tsc + lint rc 0 · jest 5786 passed / 3 skipped / 238 of 239 suites (= 5788 / 1 plus 2 doc-sync tests that skip outside the workspace, INFO-3) · lifecycle `33/33 ok, 0 failed` (Obsidian 1.15.0) · e2e `104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` (pinned 1.14.4). Shots / freeze / parity come from the implementer's logs; HEAD has only src/test/driver changes: shots rc 1 HOST COPY DRIFTED (known), freeze 280/280, parity 0 / 0 / 24.
- **Land-ready is also blocked by** the rebase onto develop `907f55c` (SC-497 pin bump) and a shots re-run, as the ledger already says.

## Method

All probes and gates ran in a private `git clone` of the branch, plus a `d152ea4` clone for the base bundle, under `sc487-rev-r1/`. Neither the reviewed worktree nor the superproject was touched: `git status --porcelain --ignored` is identical before and after (`status-before-*.txt` / `status-after-*.txt`). Both clones were deleted afterwards.

Real-Obsidian probes are my own fixtures and scenarios (`rv-fixtures.mjs`, `rv-scenarios.mjs`), injected into a copy of the committed lifecycle driver with an asar override (`rv-inject.mjs`). Every probe ran on **Obsidian 1.14.4** (the version line in each log). Every invisible character in the fixtures is built with `String.fromCharCode`. On-disk bytes were checked with `xxd`:

```
z-trail : 6060 6064 732d 636f 756e 7465 72e2 808b 0a   ```ds-counter<E2 80 8B>\n
z-inside: 6060 6064 732d 636f e280 8b75 6e74 6572 0a   ```ds-co<E2 80 8B>unter\n
f-trail : 6060 6064 732d 636f 756e 7465 72ef bbbf 0a   ```ds-counter<EF BB BF>\n
```

## 1. Measurement check (Obsidian 1.14.4, HEAD bundle)

| Opener after the backticks | Reading view | Live Preview | DSE language (LP host) | LP pin on HEAD |
|---|---|---|---|---|
| `ds-counter`+U+200B | plain code | **renders** | `ds-counter` | anchored, panel mounted, write `[11]`, prefix/suffix kept |
| `ds-counter`+U+200B+`x` | plain | **renders** | `ds-counter` | ok |
| `ds-co`+U+200B+`unter` | plain | plain | (not mounted) | n/a |
| U+200B+`ds-counter` | plain | plain | (not mounted) | n/a |
| `ds-counter`+U+FEFF | **renders** | **renders** | `ds-counter` | ok (see INFO-1 for what a write does to the U+FEFF) |
| `ds-counter`+U+FEFF+`x` | plain | **renders** | `ds-counter` | ok |
| inside / leading U+FEFF | plain / plain | plain / plain | — | n/a |
| U+200C / U+200D / U+2060: trailing, trailing+`x` | plain | **renders** | `ds-counter` | ok |
| U+200C / U+200D / U+2060: inside, leading | plain | plain | — | n/a |
| `~~~ds-counter`+U+200B | plain | renders | `ds-counter` | ok |
| `> ```ds-counter`+U+200B (in a quote) | plain | plain | — | n/a |

Every row agrees with the implementer's table. For every core row, `fenceLanguage` agrees with Live Preview, and DSE claims nothing that neither mode renders. Evidence: `meas-core-head/meas-core-head.json`, `meas-core-head/bytes/`.

The extended measurement is where the rule breaks: see MEDIUM-1.

## 2. No regression of SC-457's table

`git diff d152ea4..HEAD -- test/unit/e2eIntegrity.test.ts` only adds rows (+8 lines: one `flatMap` producing 65 rows); no existing row changed. I also traced each SC-457 row through the new regex: all still return their old value (` ds-x` and the like stay unclaimed; `ds-x\r` and `ds-x x` give `ds-x`).

I looked for an opener that worked on `d152ea4` and breaks on HEAD. The rule only shortens names at U+200B–D / U+2060. A name that previously contained one of these was never registered, so nothing that worked before can now resolve differently. A lone `` ```<U+200B> `` now reads as `''` instead of `<U+200B>`; neither value is a registered type. In Reading view, a ZW-suffixed fence that is plain code next to a real `ds-counter` twin does not take its writes (twins probe below). **No regression found.**

## 3. O1 guard

- **One shared check.** `bindBlockToSidebar` (registration.ts:234-236) checks `isMountableAlias` (registration.ts:219) before `getAbstractFileByPath` and before any `vault.process`.
- **Every stamping caller goes through it.** The only `ensureAnchor` caller is registration.ts:271. The callers of `bindBlockToSidebar` are:
  - `requestPinToSidebar` (chrome item, pipeline.ts:744);
  - `sendToSidebar`, which is called by the `send-block-to-sidebar` command (registration.ts:113), the initiative command (main.ts:559, registered aliases only) and the encounter hand-off (main.ts:531 → encounter/view.ts:583, `'ds-initiative'`).
- **Element ids do not count.** `def.aliases.includes(alias)` excludes them (SC-471 MEDIUM-1). Real Obsidian refuses `statblock` and `counter`.
- **No silent no-op was added.** `requestPinToSidebar` maps `unregistered` to its own Notice. `sendToSidebar` shows one. The encounter hand-off shows nothing extra on `false`.

Real Obsidian (`integ-head/unreg.json`), "Send block to sidebar" in Live Preview with the cursor in the block:

| Fence | Note bytes | Notices | Sidebar | Anchor |
|---|---|---|---|---|
| ```` ```js ```` | identical (Buffer.equals) | exactly 1 | no leaf | none |
| ```` ```statblock ```` | identical | exactly 1 | no leaf | none |
| ```` ```counter ```` | identical | exactly 1 | no leaf | none |
| ```` ```ds-nonesuch ```` | identical | exactly 1 | no leaf | none |
| ```` ```ds-co<U+200B>unter ```` | identical | exactly 1 | no leaf | none |
| ```` ```ds-counter<U+200E> ```` | identical | exactly 1 | no leaf | none |

For ```` ```ds-counter<U+200E> ```` I also used the chrome "Pin to sidebar" item: the note stayed identical and exactly one Notice showed. Positive control: ```` ```ds-counter<U+200B> ```` through the command binds, with the anchor stamped and the panel mounted.

## 4. Integrity probes (O4), real Obsidian 1.14.4

- **Trailing-U+200B pin in Live Preview.** The anchor is stamped, the panel is mounted (`unavailable` false) and the panel write lands (`[11]`). The opening line keeps E2 80 8B after both the pin and the write (`feff-head/after/RM/z-trail.md.*`). The text above and below is unchanged; no Notice.
- **Twins**, a U+200B block and a plain block with the same body, in both orders (`integ-head/twins.json`):
  - In Live Preview both render. An in-note click on block *i* changes only block *i*: `[6,5]` / `[5,6]`.
  - Pinning block *i* stamps exactly one anchor, in block *i*, and the panel write lands in block *i*. Opening lines are kept, with no Notices.
  - In Reading view only the plain block renders. A click lands in the plain block in both orders, and so does the durable path (8 lines shifted above, click, navigate away 30 ms later): `[5,6]` for the U+200B-first order, `[6,5]` for U+200B-second, with no Notice.
  - Caveat: my "bytes outside the bodies" assertion on that durable step is confounded by the counter serializer reordering keys, so for that step only the values were verified.
- **CRLF** (`integ-head/crlf.json`). Pinning the trailing-U+200B block in a CRLF note stamps `_dse_anchor: …\r\n`, the panel write lands (`[11]`), there is no bare LF, and prefix and suffix are kept.

## 5. G-S33 is non-vacuous (1.14.4, `--only=G-S33` with `DSE_LIFECYCLE_BUNDLE`)

| Bundle | Result |
|---|---|
| HEAD `2bf8541` | `G-S33 ok` |
| base `d152ea4` | `FAIL: timed out waiting for the counter mounted in the sidebar panel` (anchor stamped, panel never mounts: the original bug) |
| parse mutant (blockPrefix.ts reverted to d152ea4) | `FAIL: timed out waiting for the anchor stamp` (the guard refuses `ds-counter<U+200B>`) |
| guard mutant (the `isMountableAlias` line deleted) | `G-S33 ok` (expected: G-S33 is a pin-success scenario; see INFO-2) |

Jest against the mutants:
- **Guard mutant:** 9 failed (`mut-guard-jest.log`). These are all 4 × `requestPinToSidebar`, all 4 × `sendToSidebar` and the ```` ```js ```` command test.
- **Parse mutant:** 8 failed (`mut-parse-jest.log`). These are 3 pin-path table rows, the e2eIntegrity open-line test, and 4 of the 5 `blockPrefix` zero-width tests. The U+FEFF one already passes on the old code.

## 6. Battery at the reviewed head

| Gate | My result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | rc 0 | `rv-gate-tsc.log` |
| lint | rc 0 | `rv-gate-lint.log` |
| jest | 5786 passed / 3 skipped / 238 of 239 suites, rc 0 (INFO-3) | `rv-gate-jest.log` |
| lifecycle | `33/33 ok, 0 failed` on obsidian 1.15.0 | `rv-gate-lifecycle.log` |
| e2e | `104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, pinned 1.14.4 | `rv-gate-e2e.log` |
| shots / freeze / parity | **from the implementer's logs:** shots `GATE-RC shots rc=1` HOST COPY DRIFTED (known); freeze `280/280`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | `sc487-impl-r1/gate-{shots,freeze,parity}.log` |

## Findings

### MEDIUM-1: the name rule does not match Live Preview's; 17 more openers render in Live Preview but cannot be pinned

**Where.** `src/framework/host/blockPrefix.ts:64` (the regex `/^[\s​-‍⁠]*[^\s​-‍⁠]*/`). The rule is stated again in the doc comment at :46-60, encoded in the test tables (`test/unit/e2eIntegrity.test.ts:181`, `test/unit/framework/blockPrefix.test.ts:156`), and described in the CHANGELOG bullet.

**Evidence: what Live Preview actually does.** Obsidian 1.14.4's app bundle (asar offset ~3786834) defines `B5=/^\s*(~~~+|```+)[ \t]*([\w\/+#-]*)[^\n`]*$/`. The Live Preview code-block decorator takes `j = match[2]` and renders a widget iff `o8.canRenderLang(j)`, meaning a registered `codeBlockPostProcessors[j]`. Obsidian 1.15.0 has the same regex (`oAe=…`, same pattern). So Live Preview's language is the longest run of `[A-Za-z0-9_/+#-]` after spaces and tabs (`\w` without the `u` flag is ASCII only).

**Evidence: what I measured** (1.14.4, HEAD bundle). Every opener below renders in Live Preview as the counter, and in-note writes land. DSE's language is the whole token, so "Pin to sidebar" shows `this block's type ("…") is not one the sidebar can show`, the note stays unchanged and no anchor is stamped:

| Group | Characters after `ds-counter` | DSE language |
|---|---|---|
| Invisible (`meas-extra-head/meas-extra-head.json`) | U+200E, U+200F, U+00AD, U+180E, U+FE0F, U+2061, U+2064, U+034F, U+3164, U+2800 | `ds-counter<char>` |
| Visible (`meas-punct-head/meas-punct-head.json`) | `.x`, `:x`, `,`, `{`, `(x)`, `é`, `!` | `ds-counter.x`, `ds-counter:x`, … |
| Controls (all stay plain code in Live Preview, matching the regex) | `x`, `_x`, `/x`, `#`, `+` | — |

Reading view renders none of them.

**Failure scenario.** A user types ```` ```ds-counter: ```` or ```` ```ds-counter. ````, or pastes a fence with a stray U+00AD or U+200E. Live Preview draws the counter and its chrome menu offers "Pin to sidebar". Clicking it says the type ("ds-counter:") can't be shown. That is the ticket's symptom ("renders, pin fails") in its safe form.
- Before this branch, each of these stamped a dead anchor and lost panel writes.
- After it, O1 turns that into a refusal with a Notice, so there is no data damage.
- O2's rule ("if Live Preview renders the opener as a DSE block, `fenceLanguage` must return that block's registered name") is not met.
- F3 was dropped on the premise that nothing showed Obsidian rendering these characters. That premise is now disproved.

**Prescribed fix.** Mirror Obsidian's rule instead of listing characters, and keep the SC-457 leading-character behaviour:

```ts
export function fenceLanguage(info: string): string {
	const token = /^[ \t]*([^ \t]*)/.exec(info)![1];
	// Live Preview (Obsidian 1.14.4 / 1.15.0 fence regex `[ \t]*([\w\/+#-]*)`): the name is the run of [A-Za-z0-9_/+#-]
	const lp = /^[\w/+#-]+/.exec(token);
	if (lp) return lp[0];
	// first character outside that set (NBSP, U+3000, FF, VT, a zero-width character, ...): no block in either mode - keep the
	// whole token so it is never a registered name (SC-457 LOW-1); whitespace-only is a bare fence
	const name = /^\s*\S*/.exec(token)![0];
	return name.trim() === '' ? '' : name;
}
```

Checks for the fix:
- **Existing rows.** I checked this function against 84 table rows with node: all SC-457 rows plus the SC-487 rows. 76 match, including ` ds-x` → ` ds-x`, `​ds-x` → `​ds-x`, `ds-x\r` → `ds-x` and `ds-​x` → `ds-`. The 8 that differ are the zero-width-only rows: `` ```<z> `` and `` ``` <z> `` for U+200B/C/D/2060. They give `<z>` (the pre-branch value) instead of `''`. Neither value is a registered type. If those `''` rows should stay, also return `''` when the token is only `\s` or zero-width characters (the branch's current final test).
- **New rows** for e2eIntegrity, blockPrefix and the pin-path table:
  - claimed as `ds-x`: `.x`, `:x`, `,`, `{`, `(x)`, `é`, `!`, U+200E, U+00AD, U+3164;
  - kept as part of the name: `x`, `_x`, `/x`, `#`, `+`.
- **Docs.** Cite Obsidian's regex in the doc comment, and reword the CHANGELOG bullet ("the type ends at the first character other than a letter, digit, `-`, `_`, `/`, `+` or `#`, as Live Preview reads it").
- **Lifecycle.** G-S33 stays as it is. Optionally, add a ```` ```ds-counter: ```` case to it.

If the owner prefers to land as is, the fallback is a follow-up ticket. Either way, the ledger's F3 should be re-ruled.

### LOW-1: the "can't pin" Notice prints the alias raw, so an invisible character makes it read as "ds-counter is not one the sidebar can show"

**Where.** `src/framework/sidebar/registration.ts:214-215` (`unregisteredNotice`).

**Scenario.** A ```` ```ds-counter<U+200E> ```` block renders in Live Preview (still reachable after MEDIUM-1 for leading or inside-name characters through the command, or wherever the two rules differ). Pin shows `this block's type ("ds-counter‎") is not one the sidebar can show`, which on screen reads as "ds-counter". That contradicts the block the user can see.

**Fix.** Make non-printing characters visible in the Notice. For example, map `/[^\x21-\x7e]/g` to `` `U+${cp.toString(16).toUpperCase().padStart(4, '0')}` `` and say "contains an invisible character (U+200E)". Then pin that wording in the registration test.

### INFO

1. **A write to a ```` ```ds-counter<U+FEFF> ```` block drops the U+FEFF from the opening line** (pin keeps it; any element write removes it). This happens in both Reading view and Live Preview, and is byte-identical on `d152ea4` and HEAD (`feff-{head,base}/after/RM/f-trail.md.*`). The cause is the documented trailing-whitespace drop `info: match.rest.trimEnd()` at `src/framework/host/fenceLine.ts:44`; U+FEFF is whitespace to JS, just as a trailing NBSP or U+3000 is. This is pre-existing and intentional, not a regression. U+200B is kept (it is not `\s`). It is only worth a ledger line if the owner wants a strict byte-for-byte opening line for U+FEFF as well.
2. **G-S33 does not discriminate the guard.** The guard mutant passes G-S33. This is by design: O5 asks for a pin-success scenario. The guard is held by 9 jest tests, and by my real-Obsidian probe (section 3). The suite has no real-Obsidian scenario for the refusal; that is acceptable under O5.
3. **Jest 5786 / 3 skipped is environmental.** `test/dom/framework/token-coverage.test.ts`'s doc-sync block (2 tests) skips when no workspace root is beside the repo, as in my `/tmp` clone. 5786 + 2 = 5788 passed / 1 skipped, which is the implementer's number. `visual-harness/dist/obsidian-app.css` was copied in, so `printTwinDeltaAllowedSet` ran.
4. **e2e `typeOf` now imports `fenceLanguage`** (`e2e/driver/noteFences.ts:43`), so e2e and product agree by construction. The e2eIntegrity table still asserts literal expected values, so the check is not vacuous. This is fine under O3.
5. **Landing logistics** (already in the ledger):
   - rebase onto develop `907f55c` (SC-497) and re-run shots;
   - SC-471's second lander maps `'unregistered'` in `sendFromCommand` and updates the ```` ```js ```` command test (F2);
   - the dse-verify CURRENT block is still to be updated at landing.

## Evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r1/`:

- **Gates:** `rv-gate-tsc.log`, `rv-gate-lint.log`, `rv-gate-jest.log`, `rv-gate-lifecycle.log`, `rv-gate-e2e.log`.
- **Measurement:**
  - core: `meas-core-head/meas-core-head.json` and `meas-core-head/bytes/`;
  - invisible extras: `meas-extra-head/meas-extra-head.json`;
  - visible punctuation: `meas-punct-head/meas-punct-head.json`;
  - U+FEFF write behaviour, HEAD vs base: `feff-head/`, `feff-base/` (`after/` snapshots).
- **Integrity:** `integ-head/{twins,crlf,unreg}.json` and `integ-head/crlf-after.md`.
- **G-S33 and mutants:**
  - lifecycle runs: `gs33-{head,base,mut-guard,mut-parse}/lifecycle.log`;
  - bundles: `bundle-{head,base,mut-guard,mut-parse}/`;
  - jest: `mut-guard-jest.log`, `mut-parse-jest.log`;
  - mutant diffs: `mut-guard.log`, `mut-parse.log`.
- **Probe sources:** `rv-fixtures.mjs`, `rv-scenarios.mjs`, `rv-inject.mjs`, `rv-probe-run.sh`, `rv-mutant.sh`, `rv-build-bundle.sh`, `rv-gs33-four.sh`.
- **Tree state:** `status-before-dse.txt` / `status-after-dse.txt` and `status-before-super.txt` / `status-after-super.txt` (identical).
