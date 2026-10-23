# SC-488 r2 — rebase onto c0e761b (+ any folded review fixes) — implementer A

Same rules, scratch-dir conventions, gate script shape and return contract as your r1 brief (`sc488-brief-r1-impl.md` §3–§5); reuse your private scratch dir. **Workers never call the tracker.**

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-decisions.md` — read the round log from "r1 DONE (A)" down, and any "Review rulings" section.
- Review report (if a fix is folded): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r1-review-report.md`.
- dse origin/develop is now **c0e761b** (SC-279: roll strip UX; no roll model/schema/parser change; it does not touch your 5 files). Superproject origin/main moved too.

## Task
1. `git -C /home/scott/code/steelCompendium/worktrees/sc488-form-real-default/draw-steel-elements fetch origin`; rebase `sc488-form-real-default` onto `c0e761b`. Report any conflict (none expected). `npm ci` only if package.json/lockfile changed.
2. `git -C /home/scott/code/steelCompendium/worktrees/sc488-form-real-default fetch origin`; rebase the superproject branch (CHANGELOG commit) onto its `origin/main`. On a CHANGELOG conflict keep both bullets, upstream first then yours. Do not bump the submodule pointer; do not push.
3. Fold these review rulings (quoted from the ledger "Review rulings" — read them there; commit red test first, then fix):
   - LOW-1: "Keys present in the source keep their source order on Save; keys new to the block are appended after them. Jest case for exactly the example." (example: `style: chips\nskills:` -> Default -> chips must save with `style: chips` still first.) Applies to the stringify (no-serializer) path in `src/authoring/FormModal.ts` ~:195-196; do not change element serializers.
   - LOW-2: "drop that sentence; keep the D5 code (defensive)" — the CHANGELOG sentence "A dropdown line left empty (`style:`) counts as left out".
   - INFO-1: "reword comments/titles only" — stale SC-483 wording in `test/dom/authoring/formModal.test.ts` near :150, :340, :390. No assertion changes.
4. Full dse-verify battery ONCE on the final tip, one blocking foreground gate per call. Expected: tsc (incl. `-p e2e`) and lint clean · jest **5751 + your LOW-1 test(s)** (5737 + your 14 + LOW-1) **/ 1 skipped / 238 of 239 suites** (after shots) · lifecycle **31/31** (`DSE_LIFECYCLE_PORT=9311`) · e2e **`101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`** · shots **592**, 0 FAIL, with the host-leak / modal host-leak / pipette / pressed-toggle / both text-scale lines · freeze **`freeze OK (280/280 …)`** (any delta = STOP and report) · parity **0 / 0 / 24 DECLARED**.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r2-report.md`, ≤10-line executive summary first: new shas (plugin tip + base, superproject + base), conflicts (none / list), fixes folded, gate numbers, log paths. If blocked, return inline.

Final text: STATUS, shas, gate numbers, report path, log paths. No prose. You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` if you need input.
