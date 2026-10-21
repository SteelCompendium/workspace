# SC-457 independent review, round 1

**Executive summary**
- Verdict: **FIX-FIRST (mechanical only).** No code defect found in the fix. The fix is correct, has one definition and is not vacuous. But dse `origin/develop` moved from `c03db7a` to `e31e1a0` (SC-474) during this review, so the branch needs a rebase and a fresh battery run. Two LOW doc fixes can ride along.
- Reviewed: dse `bf3a3b479918bef0b1ab06c9ec8c587181c94d62` (5 commits on `c03db7a`). The superproject was not reviewed beyond the CHANGELOG bullet (`dd6715f`, on `3d18dd5`; `origin/main` is now `2d4ece3`).
- Findings: HIGH 0 · MEDIUM 1 (stale base) · LOW 3 · INFO 5 (4 of them pre-existing or Obsidian behaviour).
- Gates at `bf3a3b4`, all green: tsc (incl. `-p e2e`) and lint clean, rc 0. jest **5411 passed / 1 skipped / 232 of 233 suites**. Lifecycle **29/29**. e2e **`85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs`**. Shots **572 PNGs**, 0 FAIL. Freeze **`freeze OK (276/276 …)`**. Parity **0 gaps / 0 undeclared / 24 declared**.
- G-S14 fails on base `src/` and passes on HEAD. 23 of the new and changed jest tests fail on base `src/`.
- Real-Obsidian probes (7 + 3 scenarios, HEAD and base): O2, O4, O5 and O6 hold.

## Findings

### MEDIUM-1 (process): the branch base is stale
`git fetch` in the dse submodule shows `origin/develop` = `e31e1a0`, 5 commits past `c03db7a` (SC-474: `src/views/ConditionsModal.ts`, e2e specs and manifest, `CHANGELOG.md`, conditions jest).
- A dry-run `patch` of `c03db7a..bf3a3b4` onto `e31e1a0` applies cleanly. CHANGELOG hunk #1 lands at offset +4.
- Per superproject `7a70b00`, the new e2e baseline is 88/92.
- **Fix:** rebase the dse branch onto `e31e1a0` and rerun the full battery against the new CURRENT baselines.
- The superproject branch (`dd6715f` on `3d18dd5`) is also behind `origin/main` `2d4ece3`. The chore round is rewriting it, so I did not touch it.

### LOW-1: `fenceLanguage` claims fences that Obsidian does not render as the block (O2 wording)
Location: `src/framework/host/blockPrefix.ts:54-56` (`info.trim()` plus `\S`), and `src/framework/sidebar/anchor.ts:249` (`matchFenceLine` `rest.trim()`).

Measured in real Obsidian 1.14.4 (R-RENDER, Reading view and Live Preview):
- Not rendered as the block in either mode: ```` ``` ds-counter ```` (NBSP), ```` ```　ds-counter ````, ```` ```\fds-counter ```` and ```` ```\vds-counter ````.
- JS `trim()` and `\s` strip all four, so DSE's single definition reads them as `ds-counter`.

Concrete scenario (R-RACE `claim-nbsp.md`):
1. A plain NBSP fence has the same body as a real `ds-counter` block below it.
2. The user clicks the real block.
3. An edit inserts lines between the two blocks, then the user leaves the note.
4. The write lands in the NBSP code block (`values=[6,5]`). The real block keeps 5 and no notice is shown.

This is **pre-existing**: base gives the same `[6,5]`, because `listFences` → `iterateFences` → `matchFenceLine` already trimmed. The only new claim surface is `locateUnterminatedTrailingFence`, where an unterminated trailing NBSP fence now matches. Even so, it contradicts O2's "a variant Obsidian does not render as the block must not be claimed by DSE either", and the new doc comment presents `\s` as Obsidian's rule.

**Fix (prescribed as a follow-up ticket, not this round):**
- Skip only `[ \t]` before the token: `/^\S*/.exec(info.replace(/^[ \t]+/, ''))![0]`.
- Make `matchFenceLine` strip only `[ \t]` at the start.
- The e2e scanner `typeOf` (`e2e/driver/noteFences.ts:42`, `rest.trim().split(/\s+/)`) must move with it. O8 forbids that edit this round, which is why this belongs in a follow-up.
- Add a jest pin for the NBSP and U+3000 cases.

At minimum, correct the doc comment at `blockPrefix.ts:45-53` so it says the whitespace class is wider than Obsidian's.

### LOW-2: both CHANGELOG bullets misstate the failure trigger
Location: dse `CHANGELOG.md:37-42` and the superproject `CHANGELOG.md` bullet in `dd6715f`. Both say the block lost its name "once the note changed around it: a click made just before leaving the note, or after editing the lines above it".

Measured on base `src/` (R-TRIGGERS, `spaced-one.md`):

| case | base result |
|---|---|
| (a) click, then leave the note 30 ms later, **no edit** | dropped (`[10]`, 1 notice) |
| (b) click, then lines inserted above within the write delay, staying on the note | lands (`[11]`, 0 notices) |
| (c) lines inserted above, re-render, then click | lands (`[11]`, 0 notices) |

The trigger was leaving the note (section gone), not editing around the block.

**Fix:** reword along the lines of "a click made just before leaving the note (switching notes or closing the tab) was not saved, with a 'not saved' notice", and drop "after editing the lines above it". The ticket premise ("when the section snapshot goes stale") was also only half right. The implementer's O2 section already says so ("The failure is the section-gone relocate").

### LOW-3: fixed total in the scenario header
Location: `visual-harness/obsidian-lifecycle.mjs:42`, which says "SC-457 appends G-S14 (29 total)".

`origin/main` `2d4ece3` (dispatcher, scenario-id reservation) now says "Owners must not put a fixed total in a scenario header". SC-326's G-S13 landing first would make 29 wrong.

**Fix:** drop "(29 total)" during the rebase.

### INFO-1 (pre-existing, not SC-457): a same-body twin vanishes from Reading view after a write to the other twin
- In R-TWINSEQ2, after a click on #0, the DOM shows 1 counter and #1 has no Increase button. Disk stays correct (`[6,5]`).
- Reopening the note brings both back.
- The result is identical on base and HEAD, and identical for `twin-plain.md` (two unspaced blocks) and `twin-sp.md`.
- Twins with different bodies keep 2/2.
- Screenshot: `…/probe-head/R-TWINSEQ-FAIL-twin-vanished.png`.
- G-S7a never checks the DOM count. **Owner: file a follow-up.**

### INFO-2 (pre-existing): a fast edit can send the write to the wrong same-body twin, silently
- Sequence: click a block, an edit moves it (lines inserted between twins), the user leaves the note within ms. The durable locate picks the nearest twin to the stale line, which is the wrong one.
- `twin-plain` gives `[6,5]` for a click on #1, on both base and HEAD.
- SC-457 brings spaced/unspaced same-body pairs under the same heuristic. On base, clicking the spaced one dropped with a notice; on HEAD it lands correctly (`twin-sp#0` base `[5,5]` with 1 notice → HEAD `[6,5]` with 0).
- G-S7b covers only the shift-before-click shape.

### INFO-3 (inherited SC-343 design): deleting a block before the flush when a same-body twin exists
- `del-twin.md`: the spaced block is deleted before the flush.
  - HEAD writes into the surviving same-body twin silently (`[11]`, 0 notices).
  - Base gave the notice, but only because it could not find the spaced block at all.
  - `del-plain-twin.md` behaves the same as HEAD on base.
- `del.md` (the neighbour has a different body): exactly one "not saved" notice and the disk equals the edited note byte for byte, on HEAD (O5 ✓).

### INFO-4 (Obsidian behaviour): Reading view and Live Preview disagree on ```` ```ds-counter x ````
Reading view shows plain code; Live Preview renders the block. DSE's language for it is `ds-counter` on both base and HEAD, so nothing changed here.

### INFO-5 (already filed as SC-477)
A spaced unterminated fence at EOF written on the durable path lands (`current_value: 11`), but the note's trailing newline is dropped when the fence is closed. Base does the same.

## What was verified
- **O1/O3.** `fenceLanguage` is the one definition.
  - `parseOpenFenceLine` (`fenceLine.ts:43`) and `fenceAlias` (`anchor.ts:270-271`) delegate to it. Every host site (`readSection`/`findOwnFence`, `getBlockInfo`, `blockKey`, `locateByBody` via `listFences`, `locateUnterminatedTrailingFence`, `locateInSection`, the durable `resolveWriteTarget`) reads `parseOpenFenceLine().language` or `fenceAlias`.
  - `registration.ts` `aliasAtLine` uses `fenceAlias(matchFenceLine().rest)`.
  - No `\S*` on an untrimmed rest remains in `src/`.
  - Remaining sites are not language identity, or were already ruled:
    - `authoring/fenceScan.ts` `scanFenceState`: whole info string, SC-476.
    - `ReferenceResolver.ts:26` and `typeAdapters.ts:26`: F2, dropped.
    - `CLOSE_FENCE`: close fences only.
    - `layouts.ts:213` and `scc/definition.ts:115`: not fence-language comparisons.
    - Encounter `view.ts:499`: emits a fence, does not parse one.
- **O2.** Re-probed in real Obsidian 1.14.4, Reading view and Live Preview (R-RENDER).
  - Rendered as the block, with HEAD language `ds-counter` (base `''`): 1 space, 3 spaces, tab, space+tab+space, `~~~ ds-counter`, ```` ```` ds-counter ````, a spaced fence inside a callout.
  - Not rendered: NBSP, U+3000, FF and VT before the language (LOW-1).
  - Chrome "Pin to sidebar" language (R-TRIGGERS d): base `''` → HEAD `ds-counter`.
- **O4.** Measured key `Probe/v-one.md::ds-counter::4` (base `Probe/v-one.md::::4`). Consumers:
  - `SessionStore`, in memory only (`main.ts:202` `createSessionStore`, `framework/session.ts`).
  - tabs, collapsible, chrome collapse, roll, skills, montage, negotiation.
  - `DseSidebarView.getState` persists `filePath`/`alias`/`anchorId`/`body`, never `blockKey`.
  - Prefs are keyed by pref name.
  - Nothing persists the key, so the user sees nothing. Claim confirmed.
- **O5/O6** (real Obsidian, HEAD): text above and below unchanged; opening line byte for byte; CRLF note all-CRLF; lone CRs survive.
  - R-STALE `crlf-tab`: 30 CRLF, 0 bare LF.
  - R-STALE `cr-three`: 3 lone CRs kept.
  - R-STALE `v-sptab` and `v-callout`.
  - All land with 0 notices and every byte outside the block body is unchanged; on base all four drop with 1 notice.
  - Twins written in sequence, plus G-S14's twin cases: no cross-talk while the position is fresh.
  - A hand-edited body (name, then max) survives a section write and a later durable write (R-HANDEDIT: `name: Mana`, `max_value: 30`, `current_value: 12`, opening ```` ```  ds-counter ```` kept; base drops the durable one with 1 notice).
  - A sidebar pin from Live Preview of ```` ``` ds-counter  extra ```` stamps the anchor, keeps the opening line and writes from the panel (`[11]`).
  - A deleted block gives one notice (INFO-3 has the twin caveat).
- **G-S14.** Base `src/` (`c03db7a`) with the HEAD harness: `G-S14 FAIL: Lifecycle/spaced-one.md (one space): block #0 did not get the edit` (`base/gs14-base.log`, `base/gs14-base-FAIL.png`). HEAD: ok inside the full 29/29 run.
- **Jest on base `src/`.** 23 failures across 4 of the 5 touched suites (`base/jest-new.log`), including the now-unconditional `e2eIntegrity` assertion. Not vacuous.
- **Scope.**
  - The diff touches `CHANGELOG.md`, `e2e/driver/noteFences.ts` (comment only, lines 15-17), three `src/` files, five test files and `visual-harness/obsidian-lifecycle.mjs`.
  - No other `e2e/` file, no freeze or baseline file.
  - `test/unit/e2eIntegrity.test.ts:185` is unconditional, and the line list includes spaced cases.
- **Worktree.** `git status --porcelain` was empty before and after, and the ignored set is unchanged. I never touched the superproject.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r1-be71a0a9/`)
- Battery logs: `head/{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log` with `.rc` files, and `head/shots-freeze-console.txt`.
- G-S14 on base: `base/gs14-base.log`, `base/gs14-base-FAIL.png`.
- Jest on base `src/`: `base/jest-new.log`.
- Probes on HEAD: `probe-head/` (render, stale, race, del, handedit and pin JSON, the lifecycle log, the twin-vanish screenshot), `probe-head2/` (twinseq2, del2), `probe-head3/` (triggers).
- Probes on base: `probe-base/`, `probe-base3/`.
- Probe sources: `scripts/sc457-r1-probe-*.mjs`, `scripts/sc457-r1-probe-harness-injected.mjs`.
- Rebase dry-run patch: `rebase-trial.patch`.
- Status snapshots: `status-before*.txt`, `status-after*.txt`.
