# SC-487 scoped re-review r2 (the r2 delta at dse `97a8bfe`, superproject `4b91ced`)

**Executive summary**
- **Verdict: FIX-FIRST, on one LOW.** It is a one-line fold that fits in the rebase round already needed onto develop `53e1e48`. Everything the brief asked about is correct.
- **Rebase:** clean.
  - dse: `range-diff d152ea4..2bf8541 2c61511..97a8bfe` shows commits 1 and 2 as `=`. Commit 3 (G-S33) differs only by context: SC-478's G-S18 header and the end of the scenario list. The src/e2e/test diff is byte-identical to r1, and so are G-S33's added lines.
  - superproject: `2ba04a6..4b91ced` touches only `CHANGELOG.md` (+11) and the dse-verify lifecycle row (34/34, with G-S18 and G-S33 both kept).
- **MEDIUM-1 fixed.**
  - My scratch jest test ran 198 openers (the 17, the 5 controls, the core forms, leading, inside and `~~~` forms) against Obsidian's regex: 0 disagreements. All 41 registered aliases are `[\w/+#-]` names, and no element id is also an alias.
  - Real Obsidian: all 17 openers (U+200E…`!`, 7 of them on 1.15.0 and 10 on 1.14.4) pin. The anchor is stamped, the panel mounts and a panel write lands (`[11]`) with no Notice. The opener bytes are kept (`xxd`: E2 80 8E, C3 A9, `(x)`, `.x`). The 5 controls stay unrendered.
- **LOW-1 fixed:** `<U+XXXX>` in the Notice; plain names like `js` and `ds-nonesuch` are unchanged (real Obsidian).
- **New LOW-1 (r2):**
  - **What happens:** "Send block to sidebar" now stamps an anchor into ```` ```ds-counter`x ```` and ```` ~~~ds-counter`x ````. Neither mode renders these, because Obsidian's regex requires `[^\n`]*$`. r1 refused them as unregistered.
  - **Measured:** 1.14.4, `bt-head-114/`.
- **Gates at 97a8bfe:** tsc + lint rc 0 · jest 5844 / 3 skipped / 239 of 240 (= 5846 / 1 plus the 2 doc-sync skips) · lifecycle `34/34 ok, 0 failed` (1.15.0; G-S18 and G-S33 ok) · e2e `104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`.
- **From the implementer's r2 logs:** shots `GATE-RC shots rc=0`, run to the end. It includes host-copy pin OK (1.15.0), both host-leak lines (678 and 228) and both text-scale lines; no ALLOWLISTED line; `grep -c FAIL` 0; 592 PNGs. Freeze `280/280`; parity `0 gap(s), 0 undeclared, 24 declared`.

## 1. Rebase integrity

- **dse range-diff:**
  - `def98b2 = 3469fed` and `26a86d1 = b559be9`.
  - `2bf8541 ! 57efd05`: the hunk context now carries SC-478's header line and `return out.join('; ')`, the tail of G-S18.
  - `diff <(git diff d152ea4..2bf8541 -- src e2e test) <(git diff 2c61511..57efd05 -- src e2e test)` is empty. G-S33's added lines are identical.
  - `97a8bfe` is new.
- **Nothing from SC-497 or SC-478 is touched:** `git diff --stat 2c61511..97a8bfe` lists only the 7 SC-487 files.
- **Superproject:** `merge-base 4b91ced origin/main` = `2ba04a6`. The range-diff of commit 1 shows only the lifecycle row merged with SC-478's text. Commit 2 is the CHANGELOG reword.
- **Since then:** origin/main has moved to `78ab8c2`, and develop to `53e1e48` (per the owner). A rebase is due; it is not part of this review.

## 2. MEDIUM-1 fix (`src/framework/host/blockPrefix.ts:63`)

The new rule:
1. `lp = /^[\w/+#-]+/` on the first token; if it matches, that run is the name.
2. Otherwise, fall back to the whole token (`/^\s*\S*/`).
3. That fallback becomes `''` if it is only whitespace or U+200B–D / U+2060.

Checks:
- **Scratch jest test** (`zz-rv-aliases.test.ts`, run in the clone only). It builds the real registry with `registerFrameworkElementDefinitions` and runs `fenceLanguage` on 198 openers. Results (`rv-aliases.json`):
  - The openers are `ds-counter` and `ds-co`, each followed by 31 tails: 18 code points incl. U+FEFF, NBSP, U+3000 and é; `.x :x , { (x) !`; the controls `x _x /x # +`; and ` extra`, `\r`, `\t`, ``. They are tested in leading, ` `-leading and `~~~` forms, plus the inside-the-name form.
  - It compares each one with `/^\s*(~~~+|```+)[ \t]*([\w\/+#-]*)[^\n`]*$/`. Where Live Preview renders (its capture is registered), DSE returns that name; where it does not, DSE returns no registered name. **0 disagreements.**
  - All 41 aliases match `^[\w/+#-]+$`, so the run rule can never cut a registered alias short or merge it. No element id is also an alias.
- **The committed tables are additive only:** `git diff 57efd05..97a8bfe -- test` is 53 lines added and 0 removed, so every SC-457 row and every r1 row keeps its value.
- **Real Obsidian, HEAD bundle (`bundle-head/`, Live Preview pin probe):**
  - **Obsidian 1.15.0** (`meas-rp-115/meas-rp-115.json`): `.x :x , { (x) é !` and trailing U+200B render in Live Preview only. Each pins with `anchored`, `panel` true and `unavailable` false. The panel write gives `[11]`, with 0 Notices and the prefix and suffix kept. `x _x /x # +`, inside-U+200B and leading-U+200B render in neither mode, and DSE does not claim them.
  - **Obsidian 1.14.4** (`meas-rx-114/meas-rx-114.json`): U+200E, U+200F, U+00AD, U+180E, U+FE0F, U+2061, U+034F, U+3164, U+2800 and U+2064 all give the same result as above.
  - **Opener bytes after pin and panel write** (`xxd` of `after/*.pinwrite.LP`): `72 e2 80 8e 0a` (U+200E), `72 c3 a9 0a` (é), `72 28 78 29 0a` (`(x)`), `72 2e 78 0a` (`.x`). Exactly one anchor line in each.

## 3. LOW-1 fix (`src/framework/sidebar/registration.ts:215`)

`visibleAlias` maps each code point outside `\x21-\x7e` to `<U+XXXX>`. It uses `Array.from`, so astral code points come out whole. Real Obsidian (`bt-head-114/unreg.json`) shows `("js")`, `("statblock")`, `("counter")`, `("ds-nonesuch")` and `("ds-co")` unchanged. The jest test pins `("ds-counter<U+200B>")` and `("ds-caf<U+00E9><U+0020>x")`. Each command shows exactly one Notice and leaves the note byte-identical.

## 4. Gates

| Gate | Result | Source |
|---|---|---|
| tsc (incl. e2e) | rc 0 | `rv-gate-tsc.log` |
| lint | rc 0 | `rv-gate-lint.log` |
| jest | 5844 passed / 3 skipped / 239 of 240 suites, rc 0. Same as 5846 / 1: `token-coverage` skips 2 doc-sync tests outside the workspace | `rv-gate-jest.log` |
| lifecycle | `34/34 ok, 0 failed`, obsidian 1.15.0, port 9289 | `rv-gate-lifecycle.log` |
| e2e | `104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` (pinned 1.14.4) | `rv-gate-e2e.log` |
| shots | rc 0, ran to the end: `host-copy pin OK (… verbatim Obsidian 1.15.0; 18 further rules …)`, `button host-leak OK (… 678 …)`, `modal button host-leak OK (… 228 …)`, `text scale OK (1626 …)`, `text scale once OK (107256 … 214 loads …)`. The expected `OBSIDIAN APP.CSS PIN DRIFT` warning is present; no ALLOWLISTED line; 0 `FAIL`; 592 PNGs in the worktree's `visual-harness/shots` | implementer `sc487-impl-r2/gate-shots.log` |
| freeze | `freeze OK (280/280 …)` rc 0 | implementer `gate-freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` rc 0 | implementer `gate-parity.log` |

## Findings

### LOW-1 (new in r2): DSE now claims a fence whose info string holds a backtick, which neither Obsidian mode renders

**Where:** `src/framework/host/blockPrefix.ts:63-68` (`fenceLanguage`), working with `FENCE_MARKER` at :28, which accepts any `rest`.

**Evidence** (Obsidian 1.14.4, `bt-head-114/`):
- **What Obsidian renders:**
  - ```` ```ds-counter`x ```` and ```` ```ds-counter `x ````: Reading view 0, Live Preview 0. CommonMark forbids a backtick in a backtick fence's info string, and Live Preview's regex ends in `[^\n`]*$`.
  - ```` ~~~ds-counter`x ````: Reading view shows plain code with `language-ds-counter`x`; Live Preview 0.
- **What DSE does:** on all three, "Send block to sidebar" with the cursor in the "block" stamps `_dse_anchor` into the note, mounts a working counter panel and shows no Notice (`identical:false, anchor:true, panelCounter:true`).
- **Before r2:**
  - r1's rule read the no-space and tilde forms as `ds-counter`x`, which is unregistered, so the O1 guard refused them. This is derived from the r1 regex, not re-measured.
  - The ```` ```ds-counter `x ```` form was already claimed on `d152ea4` (the space ends the name), so that one is pre-existing.

**Scenario:** a user writes inline code that starts a line, such as ```` ```ds-counter`x ````, or a tilde fence with a backtick. With the cursor there they run the command. DSE stamps an anchor into text Obsidian shows as a paragraph or as plain code, and the panel then writes into it. This does not happen on any rendered block and does not damage other blocks, but it fails check 2's "never claims an opener neither mode renders".

**Fix:** mirror the rest of Obsidian's regex. If `info` contains a backtick, Live Preview renders nothing, so return a never-registered value. For example, at the top of `fenceLanguage`:
```ts
if (info.includes('`')) return info.replace(/^[ \t]+/, '').replace(/\s+$/, ''); // Live Preview's fence regex ends in [^\n`]*$: no block
```
- Add table rows ```` ```ds-x`y ````, ```` ```ds-x `y ```` and ```` ~~~ds-x`y ```` → the unregistered text.
- No existing row has a backtick in `rest`, so all current rows keep their values.
- The structural side is separate and pre-existing: `FENCE_MARKER` accepts a backtick fence whose info holds a backtick, which CommonMark does not, so fence pairing can differ from Obsidian's. That is backlog material, not this ticket.

### INFO

1. **Rebase due.** develop is now `53e1e48` and origin/main `78ab8c2`. Run the rebase round planned after this review, and re-run the gates there.
2. **No real-Obsidian scenario for the punctuation and invisible terminators.** Jest plus this round's probes cover them; the owner already DROPPED the follow-up.
3. **Scratch `dse-head/` clone removed.** The reviewed worktree and superproject `git status` are identical before and after (`status-{before,after}-{dse,super}.txt`). Port 9289 is free, and no lifecycle temp dirs were kept (all runs passed). One process matched `sc487-rev-r2`: PID 161238, a `sleep 2700` stall-check that is not mine. I left it alone.

## Evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r2/`:

- **Gates:** `rv-gate-tsc.log`, `rv-gate-lint.log`, `rv-gate-jest.log`, `rv-gate-lifecycle.log`, `rv-gate-e2e.log`.
- **Parse agreement:** `zz-rv-aliases.test.ts`, `rv-aliases.json`, `rv-aliases-jest.log`.
- **Live Preview pin probes:** `meas-rp-115/` (1.15.0) and `meas-rx-114/` (1.14.4), each with its JSON, `bytes/` and `after/`.
- **Backtick probe and Notice text:** `bt-head-114/{meas-bt-head.json,unreg.json}`.
- **Bundle:** `bundle-head/`.
- **Probe sources:** `rv-fixtures.mjs`, `rv-scenarios.mjs`, `rv-inject.mjs`, `rv-probe-run.sh`, `rv-meas-pair.sh`, `rv-bt-head.sh`.
- **Tree state:** `status-{before,after}-{dse,super}.txt`.
