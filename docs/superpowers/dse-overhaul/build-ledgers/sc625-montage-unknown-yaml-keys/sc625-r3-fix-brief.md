# SC-625 r3 — fix round brief (r1 implementer resumed, or a fresh replacement)

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/decisions.md`
  (read it again: the placement ruling was SUPERSEDED after r2; r2 rulings and the baseline move are recorded there).
- r1 brief + report and r2 review report in the same dir: `sc625-r1-implementer-brief.md`,
  `sc625-r1-implementer-report.md`, `sc625-r2-review-report.md` (findings L-1, L-2, L-3, I-3, I-5, I-6).
- All footguns of the r1 brief §4 still apply, word for word (devbox script files, no `rm` in /tmp or scratchpad, no
  pattern kills, `git -C <abs>`, no `cd` in compound commands, private scratch dir — use
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r3-fix/`,
  never wait on a notification, no tracker). Lifecycle flag is `--only=A,B,…` (with `=`): `--only A,B` runs the whole
  suite — run the seven parts properly this time.
- **You never call the tracker.**

## 2. Tasks, in order

### A. Rebase the dse branch onto the new base

`git -C /home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys/draw-steel-elements fetch origin`;
`origin/develop` should be **`8a81c5a7`** (SC-439 landed: negotiation e2e + jsdom tests, `data-dse-control` ids in kit
`tabs.ts`, `track.ts` and the negotiation; no montage code). Rebase `sc625-montage-unknown-yaml-keys` onto it. Expect
conflicts in the shared e2e manifest; resolve by keeping BOTH sides' rows. After the rebase, re-check scenario ids are
globally unique (`MONT-*` and anything SC-439 added) and that no test title carries a bracketed ticket id. If
`package.json`'s obsidian version changed, run `npm ci`.

### B. Fold the r2 findings (rulings verbatim from the ledger)

> **L-1 FOLD** (doc comment at `model.ts:132-140` + a unit test pinning the integer-key order; no `Map` restructure).
> **L-2 FOLD** (CHANGELOG bullet: say the keys are kept with the same values; do not claim "as you typed them").
> **L-3 FOLD** (jsdom rows for Undo, sheet edit, sheet Remove, Back to round, Clear all, Reopen; hostile-key test adds
> `constructor`, `toString`, `hasOwnProperty` at both levels).
> **I-3 FOLD** (promote r2's R2P-01 / R2P-02 real-Obsidian probes into `integrity.e2e.ts` with new, free MONT ids).
> **I-4 FILED** as SC-652 (framework drops an unusable `prefs:` map and a non-boolean `collapsed:`) — out of scope here.
> **I-5 FOLD** (one-line warning in the `model.ts` comment: never put a non-schema own property on the model,
> `serialize` writes it).

Placement ruling now in force (verbatim): "Actions follow the top-level rule (known keys in §B.5 order, then unknown
keys in original order). `participants:` items keep SC-610's as-typed contract. The difference is deliberate." —
so r1's ordering stays; put that sentence (in your own words) in the `model.ts` comment.

Sources to copy from (r2's probes): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r2-review/zz-sc625r2-probe.test.ts`
(jsdom P1-P6) and `.../sc625-r2-review/zz-r2-probe.e2e.ts` (R2P-01/02). Do not use their file names or test titles
as-is: give them proper ids/titles in the existing files.

**Out of scope (do not touch):** SC-652 (framework `prefs:` / `collapsed:` loss), SC-599 (comments, quotes, flow
lists), SC-637 (negotiation), the `[K] filed bugs (test.failing)` header wording.

Commit inside `draw-steel-elements` after each coherent step.

### C. SKILL.md proposal (do not edit SKILL.md)

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/sc625-skill-proposal.md`:
exact replacement text for the `dse-verify` lines that change — the montage `test.failing` marker list (SC-625 x2
gone), the e2e CURRENT text with your measured numbers, the jest numbers, and the `--only=` footgun note. Mark each with
the current line it replaces.

### D. Superproject: rebase + ONE pointer bump (last step, after all gates are green)

Superproject worktree: `/home/scott/code/steelCompendium/worktrees/sc625-montage-unknown-yaml-keys` (branch
`sc625-montage-unknown-yaml-keys`, currently your CHANGELOG commit `36dae9e2` on `b45a5f24`).

1. `git -C <wt> fetch origin`; `origin/main` should be **`8dd3c4a4`**. Amend the CHANGELOG bullet per L-2 (amend
   `36dae9e2`, or a fixup squashed into it — the branch must end with exactly one CHANGELOG commit). Rebase onto
   `origin/main`; a CHANGELOG `## Unreleased` conflict is resolved by keeping both sides' bullets.
2. Stage ONLY the `draw-steel-elements` pointer: `git -C <wt> add draw-steel-elements`, then confirm
   `git -C <wt> diff --cached --name-only` prints exactly `draw-steel-elements` and the gitlink is your final dse sha.
   Do not stage any other submodule even if `git status` shows it moved.
3. Commit: `chore: bump draw-steel-elements to <short sha> (SC-625: montage writes keep keys the montage does not use)`.
   **No `Co-Authored-By` trailer and no AI attribution in any commit message** (Scott's standing rule).
4. Verify `git -C <wt> log --oneline origin/main..HEAD` shows exactly two commits: the CHANGELOG commit and the bump.
   Also check r1's earlier dse commits carry no `Co-Authored-By` trailer; if one does, report it (don't rewrite dse
   history without saying so).
5. Do NOT push anything. Landing is not yours.

## 3. Gates — expected numbers (CURRENT @ `8a81c5a7`, from the dispatcher)

At `8a81c5a7`: jest 12552 passed / 1 skipped with the shots cache (fresh worktree: expect 12551 / 2) · lifecycle 64/64 ·
e2e `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs` · shots 592, host-leak 163/978, modal host-leak
40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

After your branch expect: jest fresh = 12551 + 18 (r1) + your new tests, 2 skipped; e2e **20 known-bug**, ok =
480 + 2 (r1 MONT-X11/X12) + your new e2e tests, total = 500 + 4 if you add two, `0 failed`, coverage Y/Y (state Y);
lifecycle **64/64** as seven `--only=` parts:
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a`
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40`
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`
4. `G-S57,G-S62,G-S61,G-S56` (G-S56 last)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`
6. `G-S92,G-S96,G-S97,G-S99`
7. `G-S108,G-S112,G-S115` (~200 s)

Flake rules (unchanged): G-S91 FAIL real unless "host too slow" after two re-runs; G-S115 cell (g) with the "changed on
disk first" Notice on a loaded host gets ONE re-run of part 7, anything else real; G-S97 red → restore
`demo-vault/.obsidian/appearance.json` first. Jest "Exceeded timeout" = real hang until proven otherwise.
`styles.css`: compare sha256 against a clean `8a81c5a7` build; if identical, shots/freeze/parity carry (state both
hashes); if not, run them.

Order: A, B, then the full battery on the final dse head, then C, then D.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/sc625-r3-fix-report.md`,
≤10-line executive summary first (verdict, final dse sha, superproject CHANGELOG sha + bump sha, gate numbers). Then:
rebase conflicts and how resolved, each fold with the commit that did it, new tests (id, file, fails on base yes/no),
gate log paths, styles.css hashes, Drive-by fixes:, Follow-ups:.

## 5. Return contract

Final text to the ticket-owner: raw facts (verdict, shas, measured numbers) plus absolute paths of every artifact. If
blocked, end with `STATUS: NEEDS_CONTEXT` and the question. If a report write is blocked, return it inline.
