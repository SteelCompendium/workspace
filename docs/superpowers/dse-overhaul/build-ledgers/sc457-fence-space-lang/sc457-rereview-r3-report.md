# SC-457 scoped re-review r3 (after fix round 2)

**Executive summary**
- **Verdict: FIX-FIRST (a one-line fix).** HIGH-1 is fixed and verified in real Obsidian, and so are INFO-1 and the rebase. One narrower case still breaks something that works on develop (MEDIUM-1): ```` ```ds-counter  extra ````, i.e. a no-break space or U+3000 right after the name and then more info. Obsidian renders that as the block. On HEAD, "Pin to sidebar" on it stamps `_dse_anchor` into the note but the panel shows the "unavailable" card. Writes still land. If the owner would rather file it than fix it now, the rest is land-ready.
- **Heads:** dse `690c7839c4a0fc8aeec9d9845212738ece9a2a33` (10 commits on `0ce76dd`); superproject `d4b10f8` (1 commit, CHANGELOG only, on `ca333c6`). Both are still on the current `origin/develop` and `origin/main` (re-fetched at the end).
- **Findings:** HIGH 0 · MEDIUM 1 · LOW 0 · INFO 0.
- **Gates I ran at `690c783`:**
  - tsc (incl. `-p e2e`) and lint: rc 0.
  - jest: **5467 passed / 1 skipped / 232 of 233 suites**.
  - lifecycle: **30/30**, first attempt; G-S13 and G-S14 both ok.
  - e2e: **`88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`**.
- **From the implementer's run7** (run6 has no shots/freeze/parity logs; the branch changes no rendering code): shots 572 / 0 FAIL, `freeze OK (276/276 …)`, parity 0/0/24.

## MEDIUM-1: ```` ```ds-counter  extra ```` gets the language `ds-counter `, and Pin to sidebar breaks
**Location:** `src/framework/host/blockPrefix.ts:58`, `fenceLanguage = /^[ \t]*([^ \t]*)/.exec(info.trimEnd())![1]`. `trimEnd()` only removes a no-break space when it is at the END of the info string. When a space or tab and more text follow it, the token keeps it.

Measured in real Obsidian 1.14.4 (R3-RENDER, R3-WRITE2, R3-PIN2), HEAD against develop `0ce76dd`:

| opener | Obsidian renders it (RV / LP) | HEAD language | develop language | HEAD Pin to sidebar | develop Pin to sidebar |
|---|---|---|---|---|---|
| ```` ```ds-counter  x ```` | yes / yes | `ds-counter ` | `ds-counter` | anchor stamped, panel shows `data-dse-sidebar-unavailable`, panel write `[10]` | anchored, panel mounted, write `[11]` |
| ```` ```ds-counter　 extra ```` | yes / yes | `ds-counter　` | `ds-counter` | same failure | works |

Writes land on HEAD in all 4 modes: RV, RV + leave the note, LP, LP + leave. The host and the anchor parse agree with each other, so the durable path finds the block. The defect is only that the language disagrees with Obsidian.

The impact is the pin path above: an `_dse_anchor` line is written into the user's note for a panel that cannot render. By the same rule, `blockKey` and `scanFenceState` autocomplete give the type `ds-counter `; I inferred that from the code and did not probe it.

The three-way pin cannot catch this. `test/unit/e2eIntegrity.test.ts:167` includes ```` '```ds-x  extra' ````, but it only checks that the three parses agree with each other, and all three return `ds-x `.

Every case measured so far, and how a rule that trims the end of the TOKEN (not the info string) treats it:
- ```` ``` ds-counter ````: not rendered; stays ` ds-counter` ✓
- ```` ```ds-counter  ````, ```` ```ds-counter　 ````, ```` ```ds-counter\f ````, ```` ``` ds-counter  ````: rendered; give `ds-counter` ✓
- ```` ```ds-counter  x ````: rendered; gives `ds-counter` ✓
- ```` ```ds-counter x ```` and ```` ```ds-counter  x ````: Reading view does not render them, Live Preview does (Obsidian is inconsistent); the token is unchanged, as on HEAD now ✓

**Prescribed fix:**
- `fenceLanguage = (info) => /^[ \t]*([^ \t]*)/.exec(info)![1].trimEnd()`, and the same rule in `e2e/driver/noteFences.ts` `typeOf`.
- Add a jest pin that ```` ```ds-x  extra ```` and ```` ```ds-x　 extra ```` give `ds-x` through host, anchor and e2e.
- Add a `bindBlockToSidebar` / chrome-pin pin for ```` ```ds-counter  extra ````.
- No change is needed in `matchFenceLine`.

## What was verified
1. **Rebase.**
   - `git range-diff aaa88b7..24b2703 0ce76dd..690c783`:
     - Commits 2, 4, 7 and 8 are `=`.
     - Commits 1, 3, 5 and 6 are `!`. Their only changes are the G-S13/G-S14 merge in `visual-harness/obsidian-lifecycle.mjs`: the ids and the header line, which SC-326 now leads, plus the earlier rename and LOW-3 hunks moved into commit 1.
     - New: `a601e94` (HIGH-1) and `690c783` (INFO-1 wording).
   - `git diff 0ce76dd 690c783 -- visual-harness/obsidian-lifecycle.mjs` is +80/-0, all SC-457. SC-326's G-S13 is untouched: there are no deleted lines, and `id: 'G-S13'` sits at :1754 and `id: 'G-S14'` at :1807.
   - Superproject: one commit (`d4b10f8`) on `ca333c6`, CHANGELOG only.
2. **HIGH-1 is fixed.** Real Obsidian, HEAD (R3-RENDER, R3-WRITE, R3-RACE, R3-PIN):
   - Each of ```` ```ds-counter  ````, ```` ```ds-counter　 ````, ```` ``` ds-counter  ````, ```` ```ds-counter\f ```` and CRLF ```` ``` ds-counter　 ```` gets the language `ds-counter`, and saves in RV, RV + leave, LP and LP + leave. All give `[11]` with 0 notices. On develop, the leading-space forms drop on RV + leave.
   - A leading NBSP, U+3000, FF or VT is still not rendered by Obsidian and not claimed by DSE.
   - The NBSP-twin and U+3000-twin races write the real block: `[5,6]` (develop `[6,5]`).
   - One space, a tab and a callout save in all 12 cases, and the opening line is kept.
   - Pin to sidebar on ```` ```ds-counter  ````, ```` ``` ds-counter  ```` and ```` ```ds-counter　 ````: anchored, the panel mounts, the panel write gives `[11]`, no notice. On develop, `one.md` and `sp-trail-nbsp.md` gave "couldn't find that block".
   - The three-way pin is in `test/unit/e2eIntegrity.test.ts` (the `open-line recognition` test) and covers my r2 trailing cases. The `scanFenceState` pins are at `test/dom/authoring/schemaSuggest.test.ts:203-206`.
3. **INFO-1.**
   - dse `CHANGELOG.md` and superproject `d4b10f8` both now say "The space before the block name is kept", with no claim that the opening line is untouched.
   - `info` behaviour is unchanged: a section write still strips the trailing NBSP or U+3000, as on develop.
4. **Battery.** Numbers are in the summary. The lifecycle MutationObserver start-up error was not seen in my gate run or in my 4 probe runs.
5. **Worktree.** `git status --porcelain` (with `--ignored`) is identical before and after. The superproject was read only.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r3-be71a0a9/`)
- Range-diff: `range-diff.txt`.
- Gates: `head/{tsc,lint,jest,lifecycle,e2e}.log` with `.rc` files.
- HEAD probes:
  - `probe-head/`: `render.json`, `write.json`, `race.json`, `pin.json`, `lifecycle.log`.
  - `probe-head2/`: `write2.json`, the NBSP-then-space variants.
  - `probe-head3/`: `pin2.json`, the MEDIUM-1 pin failure.
- develop probes:
  - `probe-base/`: the same set plus `write2.json`.
  - `probe-base3/`: `pin2.json`, where pin works on develop.
- Probe sources: `scripts/sc457-r3-*.mjs`, `scripts/sc457-r3-probe-harness-injected.mjs`.
- Status snapshots: `status-before*.txt`, `status-after*.txt`.
- Implementer logs used: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run7/{shots,freeze,parity}.log`.
