# SC-116 — independent review round 1 (brief)

You are an independent reviewer (Opus) dispatched by the SC-116 ticket-owner. **Workers never
call the tracker (Linear)** — not to read history, not to post. Your final text goes to the
ticket-owner, not a human.

## Context loading (read these first, in order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/decisions.md`
2. Prior-round implementation report (exec summary + the SC-116 section; skim SC-119/SC-115):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc11x/sc11x-report.md`
3. Ticket intent (verbatim from SC-116's description): "Promote the derived kind into the ETL's
   kit frontmatter per the card⇄data parity checklist (`steel-etl/docs/card-data-parity.md`:
   parser emit → both schema copies → validation allowlist → card reads the field with body
   fallback), then consume it in `kitCard`/`renderKitPlate`."
4. `steel-etl/CLAUDE.md` and `steel-etl/docs/card-data-parity.md` in the worktree.

## Where the code is

Worktree: `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio` — verify `pwd` is under
it before ANY write. Never write under `/home/scott/code/steelCompendium/workspace/` (shared
main checkout) except the report file named below.

- `steel-etl` submodule, branch `sc11x-kit-trio`, HEAD `6415f04`; tracked `origin/main` is
  `c7d6940` (branch is 5 commits behind; upstream touched no file this branch touches). The
  branch's three commits, oldest first: `c31e701` (SC-116, the one under review),
  `d0e8c67` (SC-119), `6415f04` (SC-115). Diff to review: `git diff origin/main...HEAD`
  (9 files, +465/-69).
- `v2` submodule, branch `sc11x-kit-trio`, HEAD `7e56d40e63` (SC-115 CSS; 3 behind origin/main).
- Do NOT rebase, commit, or amend anything. Review the branch as it stands. A fix round follows.

## Task

Independent adversarial review — **execute and probe, don't just read.** Primary target is
SC-116 (`c31e701`: `internal/content/kit.go` `deriveKitType` + `KitParser.Parse` emitting
`kit_type`; `internal/site/kit_page.go` + `cards.go` sharing one frontmatter-first `kitKind`).
Secondary: the SC-119 / SC-115 commits land in the same push, so cover them too, at lower depth.

Probes the owner wants run (add your own):

1. **Blast radius of the data change.** Build `gen --all` at the branch and at `origin/main`
   (a `git stash`/`git worktree` of steel-etl at `c7d6940`, or check out a temp clone under
   the worktree — never the main checkout) and `diff -r` the two `data/` outputs. Expected:
   the ONLY difference in `data-unified` is one new `kit_type:` frontmatter line per kit
   (yaml/md/json variants of the same fact) plus the Browse kit index/detail markup. Anything
   else is a finding.
2. **Correctness of the derived kind against the source book.** Read each kit's signature
   ability keywords in `steel-etl/input/heroes/Draw Steel Heroes.md` and confirm the
   21 Martial / 3 Magic / 1 Psionic split and each kit's assignment. Substring matching on
   "Magic"/"Psionic" — find a false-positive/negative case if one exists in the corpus or
   is plausible in future input (e.g. "Magic" inside another word/ability name).
3. **Precedence and fallbacks.** `@kit-type:` annotation wins; frontmatter `kit_type` read
   first by both renderers; body-sniff fallback still works when frontmatter is absent
   (embedded / by-SCC consumers). Confirm the regression test
   `TestKitKind_MisBucketRegression` asserts what its name claims and would fail if the
   fallback were re-broken.
4. **Parity checklist.** The report claims no schema / SDK / `schema_validation_test.go`
   allowlist change was needed because `kit_type` was already declared. Verify in
   `steel-etl/schemas/kit.schema.json`, `data-sdk-npm/src/schema/kit.schema.json` (the
   worktree's copy), and the validation test that a populated `kit_type` value passes
   validation — actually run the schema validation test against generated output.
5. **`internal/site/build.go` change (15 lines)** — what does it do and is it safe?
6. Gates: `go build ./... && go vet ./... && go test ./...` in steel-etl — expected all `ok`,
   zero vet findings. Then `site` build; confirm `v2/docs/Browse/kit/index.md` shows
   21/3/1 `sc-card__type` values.

## Footguns

- Devbox: Go/Node/just are not on PATH. Always
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/steel-etl && <cmd>'`.
  Devbox's `sh` wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate through `| tail`. Redirect
  output to a per-run unique file under the ledger dir or your scratchpad and read the file.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Never background a gate and wait on it; run it in the foreground.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches.
- `gen --all` / `site` dirty `v2/docs/*`, `data/`, and `steelCompendium.github.io/docs/api/`.
  Clean-up form for v2 (ONLY this form — `git checkout -- .` in v2 destroys hand-authored
  CSS/JS): `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`.
  Leave the worktree with `git status --short` showing only `M steel-etl` / `M v2` at the
  superproject root and clean submodules.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner — a depth-2 agent cannot address its parent, and
  `to: 'main'` routes to the TOP-LEVEL dispatcher, not to the owner. If you need input, end
  your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever send a
  message anyway, its FIRST WORD must be `SC-116:`.

## Report

Write to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-review-r1.md`.
**Open with a ≤10-line executive summary**: verdict (LAND-READY / FIX-FIRST), counts of
findings by severity, and the one-line reason. Then findings by severity (CRITICAL/HIGH/MED/
LOW/INFO), each with `file:line`, the failure scenario, and the prescribed fix. Then probe
results with the commands run and measured numbers. Then a "Follow-ups" list (things you
would not fix in this round).

## Return contract

Your final text: raw facts only — verdict, finding counts by severity, shas reviewed, measured
numbers (data diff line counts, kit split), and the absolute path of every artifact you
produced (report, diff dumps, logs). No prose.
