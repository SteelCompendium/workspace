# SC-338 round 1 — independent review brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/decisions.md` (read first).
- The implementer's brief: `…/sc338-chip-focus/sc338-brief-r1-impl.md`; its report: `…/sc338-chip-focus/sc338-r1-impl-report.md`
  (read the executive summary, then verify its claims — do not trust them).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus`, `draw-steel-elements/` branch `sc338-chip-focus`,
  plus the superproject worktree branch `sc338-chip-focus` (dse-verify SKILL.md + CHANGELOG.md edits).
  Base: origin/develop `6c4f6aa`; branch head `7177033 (dse), superproject 74a71c7`. Review `git diff 6c4f6aa..sc338-chip-focus` in both.
- You do NOT edit the branch. Probe in scratch copies or revert byte-clean (`git diff` empty) before you finish.
  Never write under `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir.
- You never call Linear.

## 2. The task — execute and probe, don't just read

The owner rulings under review (quoted from the ledger):

> - R1 scope: minimal fix — chips join the shared kit focus ring (`outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`).
>   The ring must be visible on BOTH pressed and unpressed chips, and Obsidian's host `button:focus-visible`
>   box-shadow ring must not stack underneath it (mirror however the other plugin buttons already neutralize it).
> - R2 the SC-334 camera skip for `modal-montage-edit` ("focused control draws no outline") must stop skipping —
>   the check must actually run on the montage form's focused chip.

Probe at minimum:
1. Real Obsidian (private Xvfb + port, never `:1`): keyboard-focus a pressed and an unpressed chip in BOTH the montage
   "Log an action…" form and the Conditions modal, dark and light. Read computed `outline`, `outline-offset`, `box-shadow`.
   Is the token `--dse-focus-ring` valid (not guaranteed-invalid) at the chip in each place? Is the host grey box-shadow ring gone?
   Is the pressed bevel still drawn? Mouse-click a chip: no ring should appear (`:focus-visible` false).
2. Every other `.dse-optchip` consumer (grep the TS for the class) — does any live in a scope where the token or the
   host-neutralization does not reach (outside `[data-dse-element]` / `.dse-modal`)? Print mode (`data-dse-print="on"`)?
3. Does the new guard test fail when the fix is reverted (vacuity check — revert the CSS line, run the test, restore)?
4. Does the button host-leak sweep now cover the chip, and would it fail if the host neutralization were removed?
5. The camera: does `modal-montage-edit` now run the focus-ring-inside-the-body check (ok line), and would it FAIL if the
   ring were clipped (e.g. temporarily zero the modal body's `padding: 4px; margin: -4px`)?
6. Re-run the battery yourself (dse-verify skill, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`):
   tsc, lint, jest, obsidian-lifecycle, shots, freeze (expected `freeze OK (260/260 …)` — no frozen bytes should move), parity
   (0 GAPs / 0 undeclared / 16 DECLARED). Report exact lines.
7. Specificity/cascade: does the pressed Steel rule or any hover rule override the outline? Does the change regress
   any other control sharing the rule?

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r1-review-report.md`, opening with a
≤10-line executive summary (verdict: APPROVE / APPROVE-WITH-NITS / CHANGES-REQUIRED). Findings by severity
(HIGH/MEDIUM/LOW/INFO) with file:line, the failure scenario, and a prescribed fix.

## 4. Return contract

Final text goes to the ticket-owner, not a human: verdict, finding list (severity + one line each), gate numbers,
absolute paths of the report and any evidence.

Footguns:
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — use per-run unique paths or the process's own output.
- Redirect long-running output to a file; run gates in the FOREGROUND — a job you background will not wake you.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT.
  Any message you send anyway must start with `SC-338:`.
- Never `rm -rf` anything in `.superpowers/` outside `sc338-chip-focus/`.

## 5. Also noted (owner, before dispatch)

- Implementer-reported: `.dse-optchip` is NOT mounted by `assertBtnHostLeak`'s gallery sweep (chips render only inside a
  real Obsidian Modal). Extending the sweep is OUT OF SCOPE (Backlog ticket being filed) — confirm the diagnosis only.
- Moving chips onto `kit/iconButton` is OUT OF SCOPE — don't raise it as a finding.
- The shared build host runs other agents' batteries. NEVER `pkill -f` by pattern — kill only PIDs you started.
