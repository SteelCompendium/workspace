# SC-488 r2 scoped re-review (reviewer B): dse e9996f4 on d152ea4, superproject 3f55abe on 00e2f37

## Executive summary
- **Verdict: LAND-READY** on the code. Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO (no action). Separately, the owner holds the land until shots runs to completion once the host-copy pin is fixed; that hold is outside this review.
- **Range-diff:** every r1 commit is `=`.
  - dse: 868ac51 = eb49e42, 459ce81 = ac1f6f2.
  - superproject: a2716cb = aba1189.
- **The three rulings are met:**
  - LOW-1: keys from the source keep their source order; keys new to the block go after them.
  - LOW-2: the CHANGELOG sentence is gone and nothing else changed (one-line diff).
  - INFO-1: only comments and titles changed, no assertions.
- **LOW-1 mutation:** undoing the fix turns A's test and my probe red (2 failed / 40 passed).
- **Real Obsidian (pinned 1.14.4):** 10 scenarios. The r1 8/8 pass again, the LOW-1 scenario passes, and the SC-477 scenario's assertions pass; its one FAIL is the harness's fence-skeleton invariant (INFO-1). The SC-279 roll strip leaves the labels and the caption unchanged.
- **Gates I ran at e9996f4:** tsc (incl. `-p e2e`) clean, lint clean, `formModal.test.ts` 41/41.
- **A's logs** (written after the 08:17:52 rebase): jest 5784/1/238 of 239 · lifecycle 32/32 · e2e 104/104, 0 failed, 0 known-bug, 69/69 · freeze 280/280 · parity 0/0/24. Shots exits 1 with HOST COPY DRIFTED after writing 592 PNGs. This is the known machine-wide Obsidian 1.15.0 drift; I did not run shots.
- **Screenshots** are cropped to the modal at native resolution, so they are legible at 100% zoom:
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r2-shot-skills.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r2-shot-roll.png`

All scratch paths below are under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-review-b-q8v2mz/`.

## 1. Range-diff
- `git range-diff e4c5cf6..459ce81 d152ea4..ac1f6f2` gives `1: 868ac51 = 1: eb49e42` and `2: 459ce81 = 2: ac1f6f2`.
- Superproject: `git range-diff 6bf71ca..a2716cb 00e2f37..aba1189` gives `1: a2716cb = 1: aba1189`.

## 2. The fold delta against the rulings

**LOW-1** (`2e80077` red test, `e9996f4` fix):
- **What changed:** `FormModal.ts` records the source key order at open, after `prefs:` is popped. A new helper, `setKeyInSourceOrder` (`src/authoring/FormModal.ts:214-235`), sets a key only on a non-Default pick of an optional select:
  - a key already in `working` keeps its place;
  - a source key coming back is put before the first key that came after it in the source;
  - a key the source never had goes last.
- **Unchanged:** the required-select seed and the serializers (stamina).
- **Jest probe with the real `skillsElement`** (scratch test, since deleted). All 8 cases are byte-exact:

| Case | Written |
|---|---|
| ruling example: `style: chips\nskills:` -> Default -> chips | unchanged |
| same, -> Default -> list | `style: list\nskills: …` |
| style in the middle of three keys | stays in the middle |
| absent `style` picked explicitly | appended after `only_show_selected` |
| absent key: pick, Default, pick again | still appended |
| unusual order, untouched Save | round-trips unchanged |
| with a `prefs:` map, Default -> chips | `prefs:` still leads, style back in place |
| ds-roll `difficulty, roll, mode`: both selects to Default, then picked back | `difficulty: easy\nroll: Might test\nmode: test`, source order kept |

- **Mutation:** with `setKeyInSourceOrder` replaced by a plain assignment, A's LOW-1 test and my probe go red (2 failed / 40 passed); unmutated, 42/42 pass. Logs: `mutants-r2-summary.txt`, `mutant-r2-undo-low1.keep.log`. A's own red at `2e80077` was 1 failed / 40 passed (`jest-form-r2red.log` in A's folder).
- **Real Obsidian (probe LO1, fixture `fixtures/SC488B/order.md`, three ds-skills blocks):**
  - block 0, Default -> chips: byte-identical, no write;
  - block 1, absent style -> list: appended last (`…only_show_selected: true\nstyle: list`);
  - block 2 (unusual order), untouched Save: byte-identical;
  - block 2, Default -> chips: middle key back in place;
  - the text around the blocks and the other blocks: byte-identical.

**LOW-2** (`3f55abe`): `git diff aba1189 3f55abe` removes only "A dropdown line left empty (`style:`) counts as left out." The rest of the bullet is identical; the line was rejoined with no word changes.

**INFO-1** (`e9996f4`): `formModal.test.ts` changes are one comment at :150, the title at :340 and a title + comment at :390. The only other test change is the added LOW-1 test; no existing assertion changed.

## 3. Real-Obsidian probe on the rebased tip
- Spec: `spec/form-default.e2e.ts` (r1 copy: `spec/form-default-r1.e2e.ts.bak`).
- Log: `probe-e2e-r2tip.log`; observations: `obs-r2-tip.jsonl`; run folder `e2e/.out/20261023-124112-ce2e`.
- The probe files were removed from the worktree by exact path afterwards, and `git status --porcelain` is empty.

| Scenario | Result |
|---|---|
| r1 set (SK1, RL1, RL2, ST1, SK2, SK3, NL1, CS1) | 8/8 ok, same observations as r1. SK1: `Default (ledger)`, ledger preview, no write. RL1: `Default (test)` / `Default (none)`, caption "Might test", live relabel to `Default (power-roll)` with caption "Power Roll + Might", back to `Default (test)` |
| LO1 (LOW-1) | ok (§2) |
| UT1 (SC-477) | All assertions pass; the run line reads FAIL only because the harness flags the added close fence (INFO-1). Note `…climb\n\n\n` (unterminated, two blank lines). The form shows `Default (ledger)`; pick chips and Save gives `…climb\nstyle: chips\n` + closing fence + `\n\n\n`, keeping the trailing newlines. Reopen shows `chips`; an untouched re-Save is byte-identical |

**SC-279 strip:** the ds-roll preview now shows the Roll button and a collapsed "Modifiers Might 0" strip under the caption "Might test". The Default labels and caption values match r1 exactly.

## 4. SC-477 and FormModal Save (item 5b)
- **What d152ea4 changes:** SC-477 (`115556f`, `d152ea4`) changes `src/framework/host/ReadingModeBlockHost.ts` only. For an unterminated fence at the end of a note, both the in-place path and the durable path now end the replaced range at the last non-blank line (`lastNonBlankLine`). Blank lines after the block survive the splice.
- **Effect on FormModal:** Save calls `cx.host.replaceSource(currentBody())`, which in Reading view is this host. So SC-477 does change how Save reaches the file, but only for that unterminated-trailing-fence case. FormModal itself is untouched.
- **Probed in real Obsidian (UT1):** correct. The trailing newlines are kept and the close fence is added after the body.

## 5. Findings
- **INFO-1:** UT1 trips the e2e harness's fence-skeleton invariant. Even with `externalEdit` marking the note exempt, the check reports "content outside the block bodies changed". The reason: Save on an unterminated fence adds a closing fence. That is long-standing host behaviour (SC-343/SC-477), not SC-488. Probe-only, no action.
- **INFO-2:** `setKeyInSourceOrder` tests membership with `key in this.working`, which also sees inherited names. A schema property named `constructor` or `toString` would be treated as present and written last. No schema has such a key. No action.

## 6. Logs
- **My gates:** `gate-r2-tsc.log` / `.rc` (0), `gate-r2-lint.log` / `.rc` (0), `gate-r2-formmodal.log` / `.rc` (0, 41/41).
- **A's logs**, in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-impl-a-x7k3qz/`: `{tsc,lint,jest,life,e2e,shots,freeze,parity}.log`. Each has its summary line, and they were written 08:17:59–08:38:19 after `e9996f4` (08:17:52).
- **Shots:** before the abort, the log shows pressed toggle 96, pipette, chrome host-leak and the montage / title / turn-mark lines OK. The abort comes before the button host-leak, modal button host-leak, ALLOWLISTED and text-scale lines. That matches the known escalation and is not a finding against this branch.

## 7. Screenshots (rebased tip e9996f4)
- **sc488-r2-shot-skills.png** (560x865): the EDIT SKILLS modal. Style reads "Default (ledger)", the Skills textarea holds "- climb", and below it the ledger preview (Crafting 0/10, Exploration 1/10 with Climb bold) carries the Read-only badge.
- **sc488-r2-shot-roll.png** (560x1389): the EDIT ROLL modal. Roll reads "Might test", Mode reads "Default (test)" and Difficulty "Default (none)". At the bottom, the preview shows the caption "Might test", the SC-279 strip (Roll button, collapsed "Modifiers Might 0") and the Read-only badge.
- Full-window copies: `full-sc488-r2-shot-skills.png`, `full-sc488-r2-shot-roll.png` in the scratch dir.
