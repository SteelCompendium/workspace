# SC-644 r3 implementer brief — fix round + rebase

Final text goes to the SC-644 ticket-owner, not a human. Raw facts only.

## 0. Context

- Ledger (rulings, current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/decisions.md`
  — read the "r2 result" entry: every finding is ruled FOLD (or drop) there.
- Review report with the findings verbatim, file:line, probes and prescribed fixes:
  `…/sc644-settings-reach-open-blocks/sc644-r2-review-report.md`. Implement each FOLD finding as the report prescribes,
  unless you find the prescription wrong — then say why in your report and do the right thing.
- Reviewer's probes (useful to port into real tests): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r2-rev/dse-copy/test/dom/framework/zz-r2-probes.test.ts`,
  `…/dse-copy/test/dom/elements/zz-r2-hero-probe.test.ts`, `…/dse-copy/e2e/specs/settings/zz-r2-probe.e2e.ts`. Read them; do not
  copy `zz-` filenames into the repo.
- Your r1 brief (`sc644-brief-r1-implementer.md`) still governs everything not changed here: worktree rules, git -C,
  devbox shapes, gate battery mechanics, safety footguns (no `rm` in /tmp or the scratchpad, no pkill by pattern, poll your
  own pid, `--only=` with an equals sign, no tracker), commit rules (no AI attribution), report contract.
- Use a fresh scratch subfolder: `…/scratchpad/sc644-r3-impl/`.

## 1. Rebase FIRST

Two efforts landed since r1. Before any fix:
- dse: `git -C <plugin> fetch origin`; rebase your branch onto `origin/develop` = **`afd1436c`** (SC-627). Run `npm ci`
  through devbox if package.json / lock changed.
- superproject: fetch, rebase onto `origin/main` = **`fcac51ba`** (or newer if it moved — report the sha). At the end the
  superproject branch must be: your CHANGELOG commit, then exactly ONE pointer bump to your final dse head. Drop/recreate the
  old pointer commit; no interim pointer commits.

## 2. Fixes to make (rulings quoted from the ledger)

> - MEDIUM-1 hero sheet's own "Edit definition" button (`src/elements/hero/view.ts:226`) ignores the authoringControls flip
>   → FOLD: `watchPrefs` in HeroSheetView adding/removing just that button, jsdom test both ways.
> - LOW-1 nested block's chrome stripped by the root-wide querySelectorAll (`pipeline.ts:629`) → FOLD with the
>   `closest('[data-dse-element]') === root` filter (as `focusHandoff.ts:261`).
> - LOW-2 a throwing rebuild skips `ensureCollapseInvariant` (`pipeline.ts:823-828`) → FOLD: call it in the catch; replace
>   the vacuous `toBeDefined()` test with a real assertion.
> - LOW-3 O1 writes `false` into the session (`pipeline.ts:663`), overriding Start collapsed / author `collapsed: true` on a
>   later reopen → FOLD: write `undefined`. (Consistent with O1: the LIVE block stays expanded on ON; a later draw follows
>   the ladder.)
> - LOW-4 test gap, mutant M11 survives (`chromeLivePrefs.test.ts:263`) → FOLD: multi-flip + rolling remount test.
> - LOW-5 = F2 focus falls to BODY on rebuild — measured reachable in real Obsidian (R2P-01) → FOLD the reviewer's fix
>   (restore focus to the same chrome item / pencil, else the collapse control, else first focusable in the block, only if
>   nothing else holds focus).
> - LOW-6 = F1 e2e setPrefs race, real 3/3 → FOLD the reviewer's version (flush then wait until data.json on disk equals the
>   in-memory settings, as `diskData()` does; drop `shippedPrefs` in live-behavioural.e2e.ts). NOT a bare flush (unordered
>   double write).

Out of scope (do not touch): SC-645, SC-646, SC-647, SC-651 and their markers.

LOW-6 changes the e2e driver every spec uses: after it, run the FULL e2e twice and report both lines.

Each new test must be mutation-checked (break the product line → red → restore). List mutants and results.
Update the CHANGELOG bullet if the hero sheet's button now belongs in it (it should: the setting now reaches open hero sheets).

## 3. Gates — full battery on the final rebased head

Baselines at `afd1436c`: jest **12922 passed / 2 skipped fresh (12923 / 1 with the shots cache)** · lifecycle **64/64** ·
e2e **`570/593 ok, 0 failed, 23 known-bug, coverage: 416/416 pairs`** · shots **592**, host-leak **163/978**, modal
host-leak **40/240**, capture clip **147** · freeze **280/280** · parity **0 / 0 / 24**.

Expected: e2e known-bug **21** (23 − 2), ok/total = 570+4 / 593+2 plus any new e2e tests, 0 failed, coverage 416/416 (explain
any change); jest = 12923 + 21 (r1) + your new tests (cache); lifecycle 64/64; shots/freeze/parity unchanged (run them — the
LOW-1/LOW-5 changes touch chrome DOM code).

Known flakes and the SC-622 appearance.json restore are listed in the r1 brief §5 — same rules.

## 4. Report

`…/sc644-settings-reach-open-blocks/sc644-r3-impl-report.md`, opening with a ≤10-line executive summary (verdict, dse head +
base, superproject head + base, every gate vs baseline). Then per-finding: what changed (file:line), test(s), mutant result.
`Drive-by fixes:` / `Follow-ups:` sections. Final text: the summary plus absolute paths of every evidence artifact. If the
report write is blocked, return it inline. If you need input, end with `STATUS: NEEDS_CONTEXT`.
