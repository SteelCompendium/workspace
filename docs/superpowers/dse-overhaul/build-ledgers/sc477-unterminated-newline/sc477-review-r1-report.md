# SC-477 independent review, round 1

**Executive summary**
- Verdict: **FIX**. Reviewed dse `sc477-unterminated-newline` @ 53b11ac (base `develop` 424f47b; `origin/develop` has not moved past it on fetch), superproject @ 2070c88.
- Findings: HIGH 1 · MEDIUM 2 · LOW 2 · INFO 6.
- HIGH-1: in real Obsidian 1.14.4, `getSectionInfo` reports an unterminated fence's `lineEnd` as the note's **last line**, blank/whitespace tail included. So the **in-place** path still deletes the trailing newline(s), and the ruled rule "durable == in-place, byte for byte" is broken on head: 1 of 9 shapes identical on head vs 9 of 9 on base (where both paths dropped the tail). The jest parity table passes only because it makes up a section that ends at the last body line.
- A one-block clamp in `resolveWriteTarget` (prescribed below) makes 9 of 9 shapes identical, with the tail kept, in real Obsidian. I validated it in a scratch copy only. It changes in-place behaviour, which the implementer brief reserved for an owner ruling.
- The durable leg itself is correct. Its new tests fail on base (18 failed, 88 passed). Every integrity and SC-343-trap probe passed, and the fix cannot widen the SC-343 trap (proof in INFO-2).
- Gates I re-ran on 53b11ac: jest `5721 passed / 1 skipped / 238 of 239 suites` (rc 0) · lifecycle `31/31 ok, 0 failed` (rc 0, G-S6u ok "trailing newline kept"). Not re-run: e2e (reason in INFO-5), shots, freeze, parity.
- Tree clean before and after (`git status --porcelain` empty in the superproject and dse). Scratch worktrees removed.

## HIGH-1: the in-place path still drops the trailing newline in real Obsidian, and head breaks the parity rule there
- **Where:** `draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts:684-689`. `unterminatedAtEof` is accepted and the code returns `{ lineStart, lineEnd }` with Obsidian's `lineEnd` unclamped. The splice then replaces the trailing blank lines, and the close fence takes the EOF line's empty terminator.
- **Measured.** I added a probe scenario `G-P477` to a **scratch** copy of `obsidian-lifecycle.mjs`. It wraps `resolveWriteTarget` to log the section it receives and the target it returns. Fixture: `# p477\n\nABOVE\n\n```ds-counter\n…min_value: 0` + tail. Results on head (Obsidian 1.14.4):

  | tail | section at mount/write (in-place) | in-place output ends | durable output ends | equal? |
  |---|---|---|---|---|
  | (none) | 4..8 (lines 9) | ```` ``` ```` | ```` ``` ```` | yes |
  | `\n` | **4..9** (lines 10) | ```` ``` ```` (newline lost) | ```` ```\n ```` | **no** |
  | `\n\n\n` | **4..11** | ```` ``` ```` | ```` ```\n\n\n ```` | **no** |
  | `\n  \n` | 4..10 | ```` ``` ```` | ```` ```\n  \n ```` | **no** |
  | `\n\t` | 4..9 | ```` ``` ```` | ```` ```\n\t ```` | **no** |
  | `\n\n  \n\t\n` | 4..12 | ```` ``` ```` | kept | **no** |
  | `\r\n` | 4..9 | ```` \r\n``` ```` | ```` ```\r\n ```` | **no** |
  | `\r\n\r\n` | 4..10 | ```` ``` ```` | kept | **no** |
  | `\r\n  \r\n` | 4..10 | ```` ``` ```` | kept | **no** |

  On base 424f47b the same probe gives in-place == durable for all 9 shapes, because both drop the tail. Durable-flow calls log `section: null`, so G-S6u's navigate-away flow really is the durable path.
- **Failure scenario.** Note bytes `…\n```ds-counter\nname: Health\ncurrent_value: 10\nmax_value: 20\nmin_value: 0\n`. The user clicks + and stays on the note. Disk becomes `…min_value: 0\nname: Health\n```` with no final newline. This is the SC-477 symptom, on the common path. The ledger's premise that "the in-place path ALREADY keeps them" holds only for the jest-invented section (MEDIUM-1). The implementer brief's STOP condition ("you find the in-place path ALSO drops bytes in some shape") is met.
- **Regression vs 424f47b?** No new byte loss: the durable leg improved and in-place is unchanged. Against the ruled parity rule, however, head is a regression in real Obsidian (9/9 → 1/9).
- **Prescribed fix (needs an owner ruling, because it changes in-place output).** Clamp the in-place range exactly as `locateUnterminatedTrailingFence` now does, ideally through one shared `lastNonBlankLine(lines, from, to)` helper:
  ```ts
  if (openOk && (closeOk || unterminatedAtEof) && bodyOk) {
      if (!unterminatedAtEof) return { lineStart, lineEnd };
      let end = lineEnd;
      while (end > lineStart && lines[end].trim() === '') end--;
      return { lineStart, lineEnd: end };
  }
  ```
  I validated this in a scratch worktree only. Real Obsidian: 9/9 shapes in-place == durable, tail kept byte-for-byte, 0 Notices, G-S6u ok. jest `test/dom/framework`: 41 suites passed. In the jest probe table it changes only the in-place output for an unterminated fence with a tail; no other row moves. It cannot widen the SC-343 trap: the clamp runs only when `!closeOk && !hasCloseInRange` and everything after `lineEnd` is blank, and it only drops whitespace-only lines from the replaced range.

## MEDIUM-1: the jest in-place and parity pins use a section shape Obsidian never reports
- **Where:** `test/dom/framework/reading-mode-host-durable.test.ts:243, 257` (the in-place tests the ruling cites as the target), `:310` (`writeOnce` in the SC-477 table, `lineEnd: 4` for every tail).
- **Failure scenario.** Measured real `lineEnd` = `splitLines(note).length - 1` whenever there is a tail (table above). With `lineEnd: 4` the in-place leg already "keeps" the tail, so `durable.out === inPlace.out` holds by construction and cannot catch HIGH-1. My jest probe confirms it: the in-place leg with `lineEnd` = last line drops the tail for all 14 tail shapes on head (`parityEof: false`).
- **Regression?** No. The fabricated shape predates SC-477 (SC-343). SC-477 made it the basis of the parity claim.
- **Fix.** In the SC-477 table, take the in-place leg's section from the measured shape: `lineEnd = splitLines(live).length - 1`. Keep one `lineEnd: 4` row as the tolerance case. Re-pin `:243` and `:257` to the measured shape too. These tests fail on head and become the failing-first tests for HIGH-1.

## MEDIUM-2: the lifecycle gate proves only the durable leg
- **Where:** `visual-harness/obsidian-lifecycle.mjs:712-714` (G-S6u).
- **Failure scenario.** G-S6u passes on head (I re-ran it: 31/31), yet the same fixture written in place (click, stay on the note) ends ```` ``` ```` with no newline. The real-Obsidian proof the ledger asked for ("real Obsidian proves the trailing newline survives") covers half the write paths.
- **Fix.** Add `G-S28`: the same `Lifecycle/unterminated.md` fixture, click, no navigation, wait 1500 ms, then assert `endsWith('```\n') && !endsWith('```\n\n')`, no Notice, and integrity. Add a CRLF and a `\n\n\n` fixture to both G-S6u and G-S28 (the probe shows both work in real Obsidian, so the implementer's "jest-only" follow-up can close). G-S28 fails on head and passes with the clamp. Expect lifecycle 32/32.

## LOW-1: both CHANGELOG bullets state something false
- **Where:** `CHANGELOG.md:11-14` (superproject) and `draw-steel-elements/CHANGELOG.md:25-29`: "exactly as a save that happens while the note is still on screen already did".
- **Failure scenario.** On 1.14.4 a save while the note is on screen deletes the newline (HIGH-1). As shipped, the bullet tells users a still-buggy path is the correct one.
- **Fix.** After HIGH-1, reword to "…no longer deletes the note's final newline (or the blank lines at its end) when it saves, whether the note is still on screen or you have switched away." Placement is fine: superproject under `## Unreleased`; dse under `## 7.0.0 (unreleased; previously numbered 6.0.0)`, which is that file's unreleased heading (it has no `## Unreleased`; the SC-361 bullet sits in the same place).
- **Regression?** New text in this branch.

## LOW-2: two code comments state Obsidian behaviour the measurement contradicts
- **Where:** `ReadingModeBlockHost.ts:107-109` ("This is the same range the in-place path writes (Obsidian's section ends at the last block line…)") and the comment at ~`:680-683` ("Obsidian's own section range can land short of the note's true last line when the note ends in blank lines").
- **Measured.** On 1.14.4, for an unterminated fence, `lineEnd` is the note's true last line for LF, CRLF, blank and whitespace-only tails. SC-343's ledger shows this was assumed, never measured ("⚠️ Obsidian's real lineEnd for an unterminated fence with trailing newline" was never gated).
- **Fix.** State the measured fact ("Obsidian 1.14.4 reports lineEnd = the note's last line, blank tail included; measured SC-477 review") at both sites, alongside the HIGH-1 clamp.
- **Regression?** The first is new text in this branch; the second predates it.

## INFO
1. **Tests are not vacuous.** I ran head's `reading-mode-host-durable.test.ts` against base `src/` (scratch worktree at 424f47b): 18 failed / 88 passed. The failures are the 16 new SC-477 tests (the two "no trailing newline" rows pass on base, as intended) plus the 2 re-pinned SC-343 tests. On head, `reading-mode-host-durable` + `reading-mode-host-spaced-fence`: 139/139.
2. **SC-343 data-loss traps are unchanged, and the fix cannot widen them.** The candidate-body comparison is unchanged: the excluded lines are all `trim() === ''`, and `normalizeBody`'s `\s+$` strips the same character set (ES `WhiteSpace` + `LineTerminator`), so the set of matched blocks is identical. The replaced range only shrinks, and only by whitespace-only lines at EOF. Probes, base vs head byte-identical: terminated block + `After` + blank lines (durable and stale-range in-place) keeps `After`; a body followed by ```` ``` ```` then text keeps the text; an indented `  ```` closer + text → Notice and no write; a `````` 4-tick opener whose body holds ```` ``` ```` → correct close.
3. **Integrity probes on the durable leg** (head; jest probe `probe-head.json`): text above survives. These tails survive byte-for-byte: `\n`, `\n\n\n`, `\n  \n`, `\n  ` (no EOL), `\n\t`, mixed, NBSP-only line, U+2028-only line, lone-CR EOF, CRLF `\r\n` / `\r\n\r\n` / `\r\n  \r\n` (all-CRLF). An LF-dominant note with a CRLF tail gets `\n` (unchanged SC-453 policy). A note with no trailing newline gets none. Twins (closed earlier + unterminated last, identical bodies) each land in their own block, no cross-talk. A hand edit to the body between mount and write → 1 Notice and no write. Whitespace lines appended by hand are now kept (base deleted them). Empty unterminated body: lineEnd floors at the open line and the tail is kept.
4. **Nested / callout / indented unterminated fences are still not recovered (SC-455), same as base.** In my probe these return `false` with no Notice, because the host never forms a durable identity there (`canPersist` false). Same as base.
5. **e2e not re-run.** The src change is confined to `locateUnterminatedTrailingFence`, which only an unterminated trailing fence on the durable path reaches. No e2e fixture or spec writes one: the only `unterminated` hit under `e2e/` is the test-side scanner `e2e/driver/noteFences.ts`. The implementer's run (`96/99 ok, 0 failed, 3 known-bug, 66/66`) stands. The HIGH-1 fix also touches only that unterminated branch, but the e2e gate is mandatory for landing, so re-run it on the fix round.
6. **Semantics note (no action).** Whitespace-only lines that sat inside an unterminated block at EOF end up after the new close fence, outside the block. The bytes survive. For a YAML body this is inert, and the in-place path does the same once clamped.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc477-review-r1x9/`)
- Gates on 53b11ac: `gate-jest.log` (+`gate-jest-rc.txt`), `gate-lc.log` (+`gate-lc-rc.txt`).
- Real-Obsidian probe: `p477-head.json` / `p477-head.log`, `p477-base.json` / `p477-base.log`, prescribed-fix validation `p477-fixval.json` / `p477-fixval.log`. Probe source: `p477-fixtures.snippet.mjs`, `p477-patch.cjs`, `obsidian-lifecycle.patched-head.mjs`.
- jest probe: `zz-sc477-probe.test.ts`, `probe-head.json`, `probe-base.json`, `probe-fixval.json`. Failing-on-base proof: `head-tests-on-base.log`, `head-tests-on-head.log`. Fix validation jest: `fixval-jest.log`. Patch: `fix-patch.cjs`.
