# SC-442 r5 — chore brief: superproject on workspace main + ONE pointer bump

Mechanical git work in the SC-442 worktree superproject. Your final text goes to the SC-442
ticket-owner, not a human. **Never call the tracker. Never push anything.**

Worktree superproject: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup`
(branch `sc442-e2e-counter-topup`, currently at `f7185e87` with NO commits of its own).
dse submodule: `<wt>/draw-steel-elements`, branch `sc442-e2e-counter-topup`, final head
`<DSE_HEAD>` (given in the dispatch message).
Target workspace main: `<WS_MAIN>` (given in the dispatch message).

Rules: every git command as `git -C <absolute path> …` — never `cd`. Never touch
`/home/scott/code/steelCompendium/workspace/` (the shared main checkout). No `rm` of anything.
No `git push`. No `--force` anything.

Steps:

1. `git -C <wt> fetch origin`; confirm `git -C <wt> rev-parse origin/main` equals `<WS_MAIN>`. If
   not, STOP and report both shas.
2. Confirm the branch has no commits of its own: `git -C <wt> log --oneline origin/main..HEAD`
   should be empty (f7185e87 is an ancestor of origin/main). If it is not empty, STOP and report.
3. Confirm the superproject is clean apart from the dse gitlink: `git -C <wt> status --porcelain`.
   Report it verbatim.
4. Move the branch: `git -C <wt> reset --keep <WS_MAIN>` (keeps the working-tree gitlinks; fails
   loudly rather than discarding anything). If it refuses, STOP and report the message.
5. For each submodule OTHER than `draw-steel-elements` (`git -C <wt> submodule status` lists them):
   if its checked-out commit differs from the new pin (`git -C <wt> ls-tree HEAD <sub>`), first
   `git -C <wt>/<sub> fetch origin` if the pin's commit is missing (`cat-file -t <pin>`), then
   `git -C <wt>/<sub> checkout -B sc442-e2e-counter-topup <pin>` — but ONLY if that submodule's
   current branch has no commits beyond its old pin (check `git -C <wt>/<sub> status` is clean and
   `git -C <wt>/<sub> log --oneline <old pin>..HEAD` is empty; otherwise STOP and report).
6. Confirm `git -C <wt>/draw-steel-elements rev-parse HEAD` equals `<DSE_HEAD>` and the dse tree is
   clean (`status --porcelain` empty). Confirm `<WS_MAIN>`'s dse pin is an ancestor of `<DSE_HEAD>`
   (`git -C <wt>/draw-steel-elements merge-base --is-ancestor <pin> <DSE_HEAD>`).
7. `git -C <wt> add draw-steel-elements` and commit with exactly this message (no trailers, no AI
   attribution):
   `chore: bump draw-steel-elements to <short DSE_HEAD> (SC-442: ds-counter e2e top-up)`
8. Verify and report verbatim:
   - `git -C <wt> log --oneline origin/main..HEAD` → exactly ONE commit
   - `git -C <wt> diff origin/main --stat` → only `draw-steel-elements`
   - `git -C <wt> status --porcelain` → empty
   - `git -C <wt> submodule status` → every line with a leading space (no `+` / `-`)

Return contract: raw facts — STATUS DONE / BLOCKED, the superproject head sha, the outputs of
step 8, and anything you stopped on. If the report-file write is blocked, return inline; there is
no report file for this chore. You cannot `SendMessage` the ticket-owner; if you need input, end
with `STATUS: NEEDS_CONTEXT` and the question.
