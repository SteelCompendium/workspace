# SC-488 r2 — scoped re-review (reviewer B)

Same run rules, scratch conventions and return contract as your r1 brief (`sc488-brief-r1-review.md` §3–§5); reuse your private scratch dir and your probe spec/fixtures. **Workers never call the tracker.** You edit no source.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-decisions.md` — "Review rulings (owner, 2026-10-22)" (LOW-1, LOW-2, INFO-1 folded).
- A's r2 report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r2-report.md`.
- Rebased tip: dse **e9996f4** on **d152ea4**; superproject **3f55abe** on **00e2f37**. r1 reviewed commits: `868ac51`, `459ce81` on `e4c5cf6`.

## Task (scoped — delta only)
1. Range-diff `e4c5cf6..459ce81` vs `d152ea4..<the rebased r1 commits>`: report `=` or explain each `!`.
2. Review the fold delta (the commits after the rebased r1 commits: LOW-1 red `2e80077`, fix `e9996f4`; superproject LOW-2 in `3f55abe`) against the three rulings, quoted from the ledger. LOW-1: source keys keep source order, new keys appended; probe the example `style: chips\nskills:` -> Default -> chips in jest AND real Obsidian; also check a key-absent select picked explicitly is appended, and a block whose source order is unusual round-trips unchanged when untouched. LOW-2: the CHANGELOG sentence is gone and nothing else in the bullet changed. INFO-1: comments/titles only, no assertion changed.
3. Mutation: undo the LOW-1 fix -> its test goes red.
4. Re-run your real-Obsidian probe spec on the rebased tip (expect 8/8 plus the LOW-1 probe); the ds-roll preview now shows SC-279's roll strip — confirm the labels and caption are unaffected.
5. Re-read A's r2 battery logs (do not re-run unless a log is missing its summary line or the numbers disagree). Expected: tsc/lint clean · jest 5784 (5769 + 14 + 1) / 1 / 238 of 239 · lifecycle 32/32 · e2e 104/104 ok, 0 failed, 0 known-bug, 69/69 · shots 592, 0 FAIL, with the usual OK lines · freeze `freeze OK (280/280 …)` · parity 0/0/24. tsc + lint + `formModal.test.ts` yourself. KNOWN: A's shots run exits 1 with `HOST COPY DRIFTED` (Obsidian self-updated to 1.15.0 on this machine; the shoot.mjs host copy is pinned to 1.14.0) — machine-wide, escalated, not a finding against this branch; do NOT run shots and do NOT edit shoot.mjs. Your probes use the e2e harness's pinned 1.14.4 cache, which is unaffected.
5b. SC-477 (landed on develop between e4c5cf6 and d152ea4) changed the host write-back for unterminated trailing fences. Read its `src/` diff (`git -C <plugin> log --oneline e4c5cf6..d152ea4` to find it) and say whether it changes how FormModal's Save reaches the file; if it does, probe a form Save on an unterminated trailing ds-skills fence in real Obsidian.
6. **Screenshots for Scott, on the rebased tip**, same two as r1, overwriting `sc488-r1-shot-skills.png` / `sc488-r1-shot-roll.png` → save instead as `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r2-shot-skills.png` and `.../sc488-r2-shot-roll.png`. Look at each and describe it in one line. Make sure the dropdown text ("Default (ledger)"; "Default (test)" and "Default (none)") is legible at normal zoom.

Findings by severity with file:line and prescribed fix. Verdict: LAND-READY or NOT.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r2-rereview-report.md`, ≤10-line executive summary first. Final text: verdict, counts, numbers, report + screenshot + log paths. You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` if you need input.
