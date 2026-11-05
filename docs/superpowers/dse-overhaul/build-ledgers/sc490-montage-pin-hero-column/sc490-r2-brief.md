# SC-490 r2 brief — fix round: rebase + LOW-1 option A + light-theme gate + long-brief crops

You are the SC-490 r2 implementer (same rules as `sc490-r1-brief.md` §1 and §5 — re-read both; they still apply in full). Your final text goes to the ticket-owner. Workers never call the tracker.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/decisions.md` — read "Base moves" and "Review 1 rulings" (the rulings below are quoted from there).
- Review: `sc490-review1-report.md` in the same dir (LOW-1 and INFO-4 sections; the reviewer's tone probes are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-review1-a7e5ad5d9f152a0e1/probe-tone*.mjs`, reusable).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column`; dse head `b3378747`, superproject head `6567425a`.

## Tasks, in order (commit after each)

1. **Rebase.** `git -C <dse path> fetch origin`; rebase dse onto `origin/develop` (`09ece2eb` or newer — say which; SC-545 base move). `git -C <superproject worktree path> fetch origin`; rebase the superproject branch onto `origin/main` (`64fcd141` or newer). Expect a one-hunk conflict at the top of `## Unreleased` in the superproject `CHANGELOG.md` (SC-547's bullet): keep both bullets. Re-point the superproject's `draw-steel-elements` pointer at the rebased dse head. If `package.json`'s obsidian version changed, `npm ci`.
2. **LOW-1, ruling verbatim:** "**FOLD, option A** — cross-reference comments at both `--dse-card-bg` definitions (`styles-source.css` ~:6994, ~:14306) and at the literals (~:4716–4729), plus a jest guard that each literal stays inside its theme's `--dse-card-bg` gradient stops (fails if the token is retuned without the literals). No new token (DESIGN.md rule 3; "not one new colour" ~:11338)." Show the guard can fail (retune a stop in a scratch edit → red, then restore) and record the output.
3. **INFO-4, ruling verbatim:** "**FOLD** — run the gate's pinned/opaque/hit-test checks in light theme too (the fills are per-theme literals)." Keep the runtime increase small; report the shots wall time before/after. Can-fail: a translucent light fill must fail the light check.
4. **Evidence for Scott:** before/after composites (same style as r1) of a LONG card — 5 heroes, a ~2,500-character brief — at mid-scroll, fine pointer, dark AND light: `evidence/sc490-r2-<theme>-longbrief-mid-before-after.png`. "Before" = develop base render. Describe each in prose naming colours plainly, and state the measured level difference between the pinned column and round 1's cells in each.

## Gates (full battery, dse-verify order, rules from r1 brief §5)
Expected at `09ece2eb`: tsc + lint clean · jest **6415 + 9 (r1) + your new guard tests** / 1 skipped / 254 of 255 (fresh ≈6414 / 2 until shots has run) · lifecycle **50/50** in five `--only` parts (21 + 16 + 8 [part 3 ends G-S63] + 4 + 1) · e2e **`128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, 161/966, `montage board scroll OK` now naming both themes · freeze **280/280**, no rebaseline · parity **0 / 0 / 24**. Update `sc490-dse-verify-proposal.md` with the new numbers. Never edit `.claude/skills/dse-verify/SKILL.md`. Scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-r2-impl/` (new, unique names).

Out of scope (ruled DROP — do not do): INFO-1 corner bleed, INFO-2 harness observer pile-up, INFO-3 width-only re-pin, INFO-5 stored overflow shot.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/sc490-r2-report.md`, opening with a ≤10-line executive summary. Return contract: STATUS, dse head + base sha, superproject head + base sha, every gate summary line, `git range-diff` summary of your r1 commits across the rebase, absolute paths of every artifact. If the report write is blocked, return it inline. If you need input, end with STATUS: NEEDS_CONTEXT and the question — you cannot message me; if you ever do message anyway, its first word must be `SC-490:`.
