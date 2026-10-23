# SC-489 r2 — fix round (implementer A)

Same contract as `sc489-brief-r1-impl.md` (§3 run rules, §5 return contract) — re-read it. Workers never call the tracker.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-decisions.md` — read the "Review rulings (owner, 2026-10-23)" entry; the fixes below are quoted from it.
- Review report: `.../sc489-form-transform-rewrite/sc489-r1-review-report.md` (LOW-1, LOW-2, INFO-1).
- State: dse `sc489-form-transform-rewrite` @ `6cfc338` on origin/develop `9f08f06`; superproject @ `220c0a7` on `6a176e6`. `git -C <plugin> fetch origin`: if origin/develop moved past `9f08f06`, rebase onto it and report. Rebase the superproject onto the current origin/main (at least `3c7f392`).

## Fixes (verbatim from the ledger)
1. LOW-1 (CHANGELOG, superproject): "reword to say what changed, e.g. "Save no longer lowercases or trims values you did not edit (`Climb` stays `Climb`, `style: Chips` stays `Chips`)". Keep the dropdown sentence."
2. LOW-2 (test): "add one `describe('SC-489')` test with a derived def: Schema: `style` with `transform: [trim, toLowerCase]` and enum `[alpha, beta]`, plus an optional `mode` enum `[x, y]`. Parse: `{ mode: d.mode ?? (d.style === 'alpha' ? 'x' : 'y') }`. Assert: source `style: Alpha` shows `Default (x)` on the Mode select." Prove it is red against the mutant `const absent = { ...this.working };` at FormModal.ts:337 (apply the mutant temporarily, run the test, record red, revert, confirm `git diff` shows no mutant left). No red commit is needed for this one (the code already passes); record the mutant run in the report.
3. INFO-1 (comment only, FormModal.ts:210-213): reword to "…all see the same keys (validation and the preview see the normalised copy)".

Nothing else. Out of scope: SC-493, SC-494, SC-404, SC-504, SC-506.

## Gates — full battery once on the final tip
Expected: tsc (incl. `-p e2e`) / lint clean · jest **5859 (5858 + 1) / 1 skipped / 241 of 242** (after shots; if `initiative-default-keys.test.ts:459` times out, that is known flake SC-506 — re-run jest once and report both) · lifecycle **34/34** · e2e **108/108 ok, 0 failed, 0 known-bug, 69/69** · shots **592** rc 0 with all in-run lines as in r1 · freeze **280/280** · parity **0/0/24**.

**Run rule reminder (you hung 30 min on this in r1):** never `rm` anything built from a variable or glob — not even your own rc/log files. Use fresh unique filenames per run instead (e.g. suffix `-r2a`). One blocking foreground gate per Bash call; no background jobs; no compound `cd`.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-r2-fix-report.md` (≤10-line executive summary first: shas + bases, gate numbers, LOW-2 mutant result). Final text: STATUS line, shas, gate numbers, artifact paths.
