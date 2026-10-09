# SC-379 round 2 — two-axis variants of A (DESIGN ROUND, no production code)

Same worker rules as round 1 (`sc379-r1-design-brief.md` §1, §5, §6 apply unchanged: worktree
`/home/scott/code/steelCompendium/worktrees/sc379-negotiation`, only `visual-harness/sc379/`
is edited in the repo, deliverables to the ledger dir, devbox + `git -C` + no pkill-by-pattern,
you never call the tracker, you cannot message me — `STATUS: NEEDS_CONTEXT` if stuck).

## Scott's ruling on round 1 (verbatim, 2026-10-02)

> I think having patience and interest on different axis is too strong to ignore.  Because of
> that, im leaning towards Option A.  If there are better ways to represent that, id love to
> see them.
>
> Go ahead and keep the negotiation band that you added

Owner's reading: **C is out** — both values on one scale is the thing he rejects. The
direction is A's two-axis idea: Patience horizontal, Interest vertical, visibly different
axes. He is leaning A but invites better two-axis treatments. The "negotiation over" band is
approved and stays in every variant.

## Task

Produce **three variants of A** that keep Patience and Interest on different axes and make
that difference *stronger and more legible*, not weaker. Each variant must differ in how the
two axes are drawn and placed; the argument section and the ended band carry over from A
unchanged unless a variant's standing region forces a change. Suggested directions (replace
any with a better one, but keep three):

- **A1 — A, tightened.** A as shown, with the two motivation lists reduced to one (bring C's
  dossier-row Appeal / Mark spent buttons into A's bottom cards and drop the in-tab checkbox
  list, keeping the tabs), and the Patience meter and Interest ladder given one shared seal /
  pip vocabulary so they read as siblings on different axes rather than two unrelated widgets.
- **A2 — one framed "standing" board with two axes.** Patience runs across the top edge of the
  Interest ladder's frame as a horizontal meter (the x-axis), the Interest rungs run down the
  side (the y-axis); one frame, two axes, the current values marked on each. Crossed-axis
  reading must not imply a grid cell — it is two independent gauges sharing one frame.
- **A3 — Patience as a horizontal "argument clock" strip** sitting directly above the argument
  tabs (where it is spent), with the Interest ladder alone at the top under the head — i.e.
  each value sits next to the thing that changes it. Patience's remaining arguments are
  pips; the tier rows show nothing new.

Hard constraints, all variants:
- Patience horizontal, Interest vertical. Never the same scale/column.
- Keep the tabs (Learn stays a tab). Keep the ended band (gold rule + flag + "Final offer").
- Everything from round 1's shared vocabulary stands: no hue-only states, `--dse-fs-*` sizes,
  kit parts, YAML unchanged, radio semantics.
- Holds at 300px.

## Captures (ledger dir, `sc379-r2-<A1|A2|A3>-<default|ended>-<dark|light>[-narrow].png`)

Per variant: default-dark wide; ended-dark wide; default-light wide; default-dark 300px.
Twelve PNGs. Eyeball every one; fix clipping/overflow before reporting. In particular check
the Patience label and readout at 300px — r1's C had its "PATIENCE" header tight against the
column edge.

## Report

`sc379-r2-design-report.md`, opening with a ≤10-line executive summary (one line per
variant + your recommendation + why). Per variant: what changed from A, what the Director
reads at a glance, kit parts, size delta vs A, 300px behaviour, weakness. Name colors in
prose. Commit the mocks on the branch (no push, no attribution trailers); report the sha and
the `git diff --stat origin/develop..HEAD` line (still only `visual-harness/sc379/`).

Return contract as round 1: STATUS, sha, diff-stat, report path, absolute PNG paths, one-line
recommendation, `Follow-ups:`.
