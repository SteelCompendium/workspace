# SC-372 — round 2 brief (independent reviewer): adversarial review of the text-scale fix

## 1. Context loading

- Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/decisions.md (binding owner decisions O1–O5)
- r1 brief (what the implementer was asked): sc372-brief-r1-implement.md; r1 report: sc372-r1-implement-report.md — same dir.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc372-textscale/draw-steel-elements, branch `sc372-textscale` @ fcbcd09 (superproject branch has docs commit 1980c46), base origin/develop a337460 (SC-406 + SC-407 landed; verify the branch contains it). Do NOT commit to the branch; probes go in a scratch dir under the ledger dir (`sc372-r2-review/`). If you must build, build in the worktree but leave `git status` as you found it.
- **You never call the tracker (Linear).**
- Read the `dse-verify` skill before running gates: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md

## 2. The task — execute and probe, do not just read

Review `git -C <dse> diff origin/develop...HEAD` against the ticket text (verbatim in the ledger) and O1–O5. In particular, probe in a real browser:

1. All three knobs (small / large / control) at 0.8 and 1.2 actually change the computed font-size of their consumers by exactly that factor — on element roots, in modals, in sidebar views, and any other surface `reflectCss` stamps. Find a stamped root the implementer missed, if one exists.
2. Two roots with DIFFERENT scale values on one page don't cross-talk (if per-root prefs are possible); an unstamped context keeps defaults.
3. Nested roots (an element rendered inside another element's root, e.g. a ds-counter inside a tracker, or an embed) — does the inner root resolve its own scale, the outer's, or double-apply (1.2 × 1.2)?
4. Print/export: small+large apply, control does not (catalog help text). Check print emulation.
5. Every direct consumer of the scale vars (e.g. the `/ var(--dse-fs-large-scale)` compensation rule ~styles-source.css:17396) is correct after the fix — no double-scaling, no now-wrong compensation.
6. The new `text scale OK` in-run gate is not vacuous: break the fix in a scratch copy and confirm the gate fails; confirm it covers what it claims.
7. Default prefs: zero frozen bytes moved — re-run shots + freeze yourself; re-run parity.
8. Single source of truth: if declarations were duplicated, the divergence test actually fails on divergence.

Expected gate numbers (dse-verify current): tsc/lint clean · jest 4432 base (a337460, per dispatcher) (+ 6 new on the branch → 4438 passed / 1 skipped / 220 of 221 suites) · shots 568, 0 FAIL, new in-run line `text scale OK (1104 comparisons …)` · freeze `freeze OK (274/274 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED (LAST). Lifecycle not required unless the diff touches TS lifecycle code.

## 2b. Design task — F1 (and F2), owner ruling in the ledger: FOLD into SC-372

Owner ruling (ledger, verbatim): "The knob working means every text scales by the knob exactly once. Default look must not move (O5 still binds)."

F1 as reported by r1 (report "Follow-ups" F1): roles are em ratios, so a consumer nested inside another consumer of the SAME knob compounds the multiplier (value squared) — e.g. `.dse-pr__badge-text` inside `.dse-pr__badge` 12.96 -> 18.66px at small 120%; the "12-16" tier badge wraps (`evidence/sc372-small-120.png`). r1's presence-based scan (`probe/nest2.mjs`, `probe/sc372-prompt-and-nesting.txt`) likely over-counts (the negotiation pair's parent is NOT a consumer).

Do:
1. Enumerate precisely every element where a same-knob consumer has a same-knob consumer ancestor (within the same stamped root), across all fixtures — and the measured compounding factor for each at 1.2.
2. Weigh mechanisms (at minimum: per-rule cancel `/ var(--dse-fs-*-scale)` like the existing Untitled-encounter rule; a generic CSS mechanism that applies each knob once regardless of nesting, e.g. resetting the effective multiplier for descendants of a consumer; rewriting nested consumers as parent-relative `1em`-based ratios). Criteria: exactly-once scaling for every case in (1), zero default-pref byte movement, robustness for future CSS authors (a new nested consumer must not silently compound — ideally the `text scale OK` gate catches it), and diff size.
3. PROTOTYPE the recommended mechanism in a scratch copy (not committed to the branch) and measure it on the cases from (1) plus defaults.
4. Recommend an exact implementation spec the implementer can execute without judgment calls, including how the gate is extended to detect compounding.
5. F2: `.dse-sidebar__panel-header` sits outside any stamped root so it ignores Small text size (pre-existing). Say whether a local fix exists (and spec it) or it should become its own ticket (say why).

## 3. Report

/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r2-review-report.md — opens with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED; counts by severity; recommended F1 mechanism in one line; F2 fold-or-ticket). Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, a concrete failure scenario, and a prescribed fix. Then probe results per item 1–8 with measured numbers. Then the F1/F2 design section: enumeration table, options weighed, prototype measurements, and the implementation spec.

## 4. Return contract

Final text goes to the ticket-owner, not a human: verdict, finding count by severity, the gate numbers you measured, and absolute paths of every artifact (report, probe scripts, logs, screenshots). No prose.

## 5. Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file; run gates in the FOREGROUND (timeout ≤ 600000 ms). Never end your turn waiting on a background job you started.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd > /abs/log 2>&1'`; it eats `$?`/`$PIPESTATUS`; read each tool's own summary line.
- Every git command as `git -C <absolute path>`; never `cd X; git …`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc372-textscale/`.
- Never touch the shared freeze baseline; never `rm -rf` anything in `.superpowers/` outside `sc372-textscale/`.
- You cannot SendMessage me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you do send must start with `SC-372:`.
