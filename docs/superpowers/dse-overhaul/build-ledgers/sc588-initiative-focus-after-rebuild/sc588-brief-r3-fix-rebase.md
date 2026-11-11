# SC-588 r3 — fix round + rebase onto e5b6f9f2 (implementer, resumed)

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc588-initiative-focus-after-rebuild/decisions.md` (read the entries after "r1 DONE").
- Review report: `.../sc588-r2-review-report.md` (findings quoted below are what you fix — nothing else).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild`, dse HEAD `d62803db` on `79da77f8`.
- You never call the tracker. Same footguns as r1 (`sc588-brief-r1-implement.md` §4) — re-read them. In particular: never `rm -rf` a glob or a /tmp glob; no `rm` with a variable target; foreground gates only; `git -C <abs path>`; private scratch `.../scratchpad/sc588-r3-impl/`.

## 2. Task

### 2a. Rebase
`git -C <plugin> fetch origin`, rebase onto `origin/develop` = `e5b6f9f2` (SC-597 landed: Enter/Space on the stamina bar and on a montage cell activate with el.click(), montage cell keydown guards, comment in `managedModal.ts`, new lifecycle scenario G-S87). Resolve any conflict keeping SC-597's behavior. `npm ci` if package.json changed.

### 2b. Review findings to fix (verbatim from the r2 report)

### MEDIUM-1 — Live Preview: focus is restored, then lost ~0.4 s later when the tracker's own write redraws the widget
- **Where:** the fix is `src/elements/initiative/view.ts:201-204` (capture, update, restore, then `persist()`). The loss happens later, on the host's Live Preview write path, not in this diff.
- **Scenario (real Obsidian 1.14.4, probe ZZ-Q01, `probe2-head.jsonl`):** open `Initiative/rich.md` in Live Preview, focus Advance round, press Enter.
  - The rebuild blurs the old button at 52 ms. The restore focuses the new one at 83 ms, and focus is still there at 256 ms.
  - At 515 ms the debounced write lands, and the widget is redrawn with a **new** root (`sameRoot:false`, old root disconnected). Focus falls to `<body>` and stays there (checked again at settle + 1 s).
  - Quick-add Enter in Live Preview ends on `<body>` too (ZZ-P04).
  - Base for comparison (`probe2-base.jsonl`): `<body>` at 65 ms. So the branch improves the first ~0.4 s, and the end state is unchanged.
- **Pre-existing and generic (ZZ-Q03):** a `ds-counter` + pressed by Enter in Live Preview has focus at 150 ms and `<body>` after its write (focusout at 449 ms). Reading view does not have this problem: `adoptView` captures focus and restores it across the section move. ZZ-P15 shows that focus is still on the rebuilt Advance round at +0.3 s, +1.5 s and +3 s, with one extra focusout and focusin at write time.
- **Why it matters for SC-588:** the spec is not limited to Reading view. Both changelog entries say focus "stays in the initiative tracker" with no limit. Every new e2e test (INIT-F01..F06) opens the note in Reading view, so nothing catches this.
- **Prescribed fix (choose one):**
  - (a) Qualify both changelog entries: add "in Reading view; in Live Preview focus is still lost when the note saves a moment later (SC-nnn)". Then file a Backlog ticket: "keyboard focus is lost when an element's own write redraws its Live Preview widget (counter +, initiative actions, …)". Its fix is to carry `adoptView`-style focus capture across the Live Preview redraw, or to arm a block-keyed claim like `armChromeFocus`/`claimChromeFocus` (`src/framework/chrome/focusHandoff.ts`) from `rebuildAndPersist`.
  - (b) Widen SC-588 to cover it. I do not recommend this: the cause is in the host's Live Preview write path, and it affects every persisted element.

### LOW-1 — the changelog's "a mouse click moves no focus" is not quite true when focus is in a quick-add box
- **Scenario (ZZ-P02 / ZZ-Q02, Reading view):** Tab into the Malice quick-add amount box, then mouse-click Advance round. Focus ends on `<body>`.
- **Cause:** the pipeline's click shield (`src/framework/pipeline.ts:229-241`) explicitly `blur()`s a focused DSE text field on a mousedown over a non-editable target. Focus is therefore already `<body>` when `captureControlFocus` runs, and it captures nothing.
- This is the same at base (`probe2-base.jsonl`, Q02), so it is not a regression. But the changelog sentence "A mouse click moves no focus" reads as if focus stays where it was.
- **Prescribed fix:** none in code. Optionally reword the changelog to "A mouse click never pulls focus into the tracker".

### LOW-2 — dse CHANGELOG entry line-wrapping
- **Where:** `CHANGELOG.md:25-29` (dse). The first line is about 210 characters and the fourth about 170, while the neighbouring entries wrap at about 125.
- The wording is user-facing and in the SC-578 shape. The workspace entry (`9dd7cbf8`) follows the SC-592/SC-595 shape: a bold "DSE plugin: …" headline, then prose.
- **Prescribed fix:** re-wrap the lines when the MEDIUM-1 wording is applied.

**Owner rulings on these (verbatim from the ledger):**
> - MEDIUM-1 ... → option (a): qualify both changelog entries to Reading view and cite the new ticket; FILED **SC-602** (Backlog, related SC-588). Not widened into SC-588: the cause is the host's Live Preview write path and affects every element.
> - LOW-1 ... → FOLD: reword to "A mouse click never pulls focus into the tracker".
> - LOW-2 ... → FOLD: re-wrap.

So: changelog wording only, in BOTH entries — the dse `CHANGELOG.md` (in the plugin) and the workspace `CHANGELOG.md` in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild/CHANGELOG.md` (never under `/home/scott/code/steelCompendium/workspace/`). Cite SC-602 for the Live Preview limit. Amend or add a commit in each repo; no code change. Plain, short sentences.

### 2c. Out of scope
- Live Preview focus loss (SC-602) — no code change for it here.
- Minion pool modal / roster cell edit focus loss (SC-603).
- Half-typed Malice quick-add lost on rebuild (SC-589).
- No changes to src/ beyond what the rebase needs.

## 3. Gates at the rebased HEAD (full battery)

Expected at `e5b6f9f2`: tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7283 passed / 2 skipped** fresh worktree, plus SC-588's new tests · lifecycle **56/56** in five `--only` parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4, G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6; ~347 s) — read exact part lists from dse-verify · e2e base `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`; with SC-588 expect 0 failed, **4 known-bug**, coverage up by SC-588's new pairs · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24 — these three carry only if `styles.css` sha256 is identical to a clean `e5b6f9f2` build; otherwise run them.

## 4. Report

`.../sc588-r3-impl-report.md`, opening with a ≤10-line executive summary (verdict, rebased shas, gate numbers). Per finding: what changed, file:line, test that proves it. Final text to the ticket-owner: raw facts + absolute artifact paths. If blocked, `STATUS: NEEDS_CONTEXT`.
