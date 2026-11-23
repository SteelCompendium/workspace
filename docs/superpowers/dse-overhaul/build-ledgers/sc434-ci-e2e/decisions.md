# SC-434 decisions ledger — CI: run the real-Obsidian e2e tests on GitHub for every DSE push

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc434-ci-e2e (branch `sc434-ci-e2e` in
every submodule). DSE base: develop `fcc7278e`. Superproject base: origin/main `f66b58ce`.

## Scott's rulings (verbatim, dated)

- 2026-10-18 (SC-408, quoted in the SC-434 description): "I would like to add CI.  Will the
  need for a UI be a problem in github? Make a separate ticket and put it in the 7.0.0 project"
- 2026-10-18 (SC-408, dse-verify): e2e is "make it required to land future changes"; and the
  SC-408 rule "No retries, ever: a flake is a bug in the test or the product."

## Ticket scope (from the description, not a Scott ruling)

- New job in `draw-steel-elements/.github/workflows/plugin-ci.yml`; ubuntu-latest; xvfb +
  Electron libs; `npm ci`; Node matches the devbox pin; cache `~/.cache/dse-e2e-obsidian`
  keyed on Obsidian 1.14.4; `npm run e2e -- --shards=N`; upload `e2e/.out/` on failure;
  no retries.
- Lifecycle gate on CI is OUT of scope (SC-449).
- Done means: job green on `develop`; a deliberately broken test makes it fail and the
  failure artifact contains the screenshot.

## Standing constraints (dispatcher brief, 2026-11-15)

- Never push anything to origin (feature branch, workflow, PR) without Scott's explicit
  go-ahead on the ticket. Never tag / release draw-steel-elements. The dispatcher lands.
- Known e2e flakes under load: INIT-W10 (SC-654), SET-X03/SET-X04 (SC-657). The CI design
  has to live with these.

## Owner facts (2026-11-15)

- draw-steel-elements is a PUBLIC repo -> standard GitHub-hosted runner minutes are free.
- `Plugin CI` triggers on push to main/develop and on pull_request. A feature-branch push
  alone does NOT run it; trying it pre-land needs a PR (or a trigger change).
- No docker/act on this host: pre-push verification is a local CI simulation only.
- Existing Plugin CI on develop is green (~4.5-5.5 min).

## Rounds

- r1 (implementer): survey + write the job + local CI simulation + broken-test proof.
- r1 DONE (implementer a6d03df4…): branch head `029d012a` (4e7a0506 job, e907ecae README+timeout, 029d012a comment). 5 local 4-core sims all `613/622 ok, 0 failed, 9 known-bug, 417/417`; e2e step 342-677 s at shards=4. Broken-test proof: exit 1, screenshot in `e2e/.out/<run>/NEGO-C01/`.
- Owner ruling 2026-11-15: keep `runs-on: ubuntu-24.04` (pinned) rather than `ubuntu-latest` — ubuntu-latest migrates to 26.04 from Nov 2026, and the no-apt-step library analysis is for 24.04. Tell Scott in the ask; not a question for him.
- r2 (reviewer): independent review of 029d012a, brief sc434-r2-review-brief.md.
- r2 DONE (reviewer afa46f7f…): APPROVE WITH FIXES at 029d012a; 0 blocker/high, 2 MEDIUM, 4 LOW, 11 INFO. Own sim 613/622 ok, 0 failed, 417/417, e2e step 440 s. Report sc434-r2-review.md.
- Owner rulings on r2 findings (2026-11-15): FOLD MEDIUM-1 (save cache only when complete), MEDIUM-2 (step timeout 25 + upload on failure() || cancelled()), LOW-1 (permissions contents: read), LOW-3 (launcher version in cache key), LOW-4 (concurrency, cancel-in-progress for PRs only), INFO artifact-name clash on re-run (add run_attempt), INFO README dated timings (if trivial). DROP LOW-2 (strict sed fails loudly, which is the right failure). DROP r1 follow-up 3 (actions majors stay v4, consistent with the file). r1 follow-ups 2 and 4 are informational; drop.
- r3 (implementer a6d03df4…, resumed): fix round. Then scoped re-review of the delta by a fresh reviewer (not afa46f7f's author... reviewer may re-review since it did not author).
- 2026-11-15 dispatcher baseline update: SC-650 landed. dse develop now `42c26272`, workspace main `f3ab849c`. Rebase onto 42c26272; superproject branch on current workspace main with ONE pointer bump (no CHANGELOG: CI is not user-facing). New numbers at 42c26272: jest 13448 passed / 1 skipped with the shots cache; lifecycle 64/64; e2e `622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`; shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity 0/0/24. NEGO-R05 is a new suspected load flake (failed once full-run, passed alone and on re-run).
- r3 DONE (implementer, resumed): head `e2cf866e` rebased on 42c26272. All folded items in; compgen->find (nix bash lacks compgen). Sim 622/631 ok, 0 failed, 417/417, e2e 347 s. jest 13447/2 skipped fresh. Report sc434-r3-report.md.
- r4 (reviewer afa46f7f, resumed — not an author): scoped re-review of the r3 delta.
- Owner default (2026-11-15, stated to Scott as overrulable): do NOT make `e2e` a required branch-protection check (landings push straight to develop).
- Ask 1 drafted: sc434-comment-ask1.md (push go-ahead: draft PR trial, broken-test commit, close unmerged, then normal landing).
- r4 DONE: APPROVE at e2cf866e, 3 INFO. Owner rulings: DROP INFO-1 (misleading "incomplete" warning only after an earlier step already failed — harmless), DROP INFO-2 (partial artifact on superseded PR runs — noise), DROP INFO-3 for now (revisit 35-min job timeout only if real-run setup proves slow; the PR trial measures it).
- 2026-11-15 ~09:45: Ask 1 POSTED on SC-434 (In Progress + Needs Review, verified). PARKED on Scott. Next on "yes": a worker pushes branch sc434-ci-e2e (dse) to origin, opens a DRAFT PR against develop, watches the run (gh run watch), then pushes a breaking commit to NEGO-C01, confirms red + e2e-out-<attempt> artifact holds NEGO-C01/screenshot.png (download it, owner eyeballs it), drops that commit (force-push the branch back to the green head — needs Scott's yes to cover it; the ask's step 3 says "drop that commit"), confirms green, closes the PR unmerged. Then: superproject branch rebased onto current workspace main (was f3ab849c) with ONE pointer bump to the final dse head; no CHANGELOG (CI not user-facing); report land-ready + the dse-verify proposal file sc434-r1-skill-proposal.md for the dispatcher.

## 2026-11-22 — session e255a3cd-5cdb-4dc4-83be-b58e80eb1057 (new owner: Fable 5.2 ticket-owner)

- **Scott ruling 2026-11-22T18:50Z (SC-434 comment, verbatim, in reply to Ask 1): "yes"**
  - Ask 1's first line, which this answers: "may I push the `sc434-ci-e2e` branch of draw-steel-elements to GitHub and open a draft pull request against `develop`, so the new e2e job runs once on GitHub before it lands?"
  - Ask 1's three steps, covered by the yes: (1) "Push the branch and open a **draft** pull request against `develop`." (2) "Push one extra commit that breaks one check in one test (NEGO-C01). The job must go red, and its `e2e-out` download must contain that test's screenshot. ... I will post the run link and the screenshot here." (3) "Drop that commit, confirm the job is green again, and close the pull request **without merging**. The branch then lands through the normal landing flow."
  - Owner reading: "Drop that commit" is a `--force-with-lease` push of the feature branch `sc434-ci-e2e` ONLY, back to the green head. No other ref on origin is touched. No tag, no release, no merge of the PR.
  - Scott did not overrule the default "do NOT make `e2e` a required branch-protection check" -> stands.
- Scott set `Ready for Agent`; owner removes it and flips to Awaiting on resume.
- 2026-11-22 owner: tracker flipped to Awaiting, `Ready for Agent` removed (verified: labels DSE Plugin, Feature).
- 2026-11-22 baselines at resume: dse origin/develop `3b47e55b` (SC-675), workspace origin/main `1c877748`. Expected at 3b47e55b (HANDOFF): jest 13855 / 2 skipped fresh, e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`, lifecycle 63/64 (G-S61 torn-read = SC-668, red on base). Branch `sc434-ci-e2e` not on origin yet. Latest develop Plugin CI run 44819577392 green.
- r5 (implementer, fresh — prior a6d03df4 was another session): brief sc434-r5-brief.md. Rebase onto 3b47e55b, local tsc/lint/jest/lifecycle/e2e, push branch, draft PR, green run, NEGO-C01 broken commit -> red run + `e2e-out-1` artifact download, force-with-lease back to green, green run 2, close PR unmerged, superproject pointer-bump commit (unpushed). Worker may push at most 2 fix commits confined to the `e2e` job if the runner environment fails; those go to a scoped re-review (reviewer, not the author).
- Owner ruling: the remote branch `sc434-ci-e2e` is NOT deleted after the PR closes (not covered by the yes); tell Scott/dispatcher it remains.
- Owner note: sc434-r1-skill-proposal.md cache-key text is stale (r3 added arch + launcher version to the key) — owner refreshes it from the final workflow before land-ready.
- r5 DONE (implementer a55bf65c…, 2026-11-22/23): STATUS DONE, no GitHub fixes, no drive-bys. Owner re-verified by `git ls-remote`, `gh pr view`, `gh run view` and by viewing the screenshot.
  - dse GREEN head `f42546b89ea71c2e465fdb075332cef0405ddeac` on develop `3b47e55b` (clean rebase; diff = plugin-ci.yml +164, e2e/README.md +23). BROKEN `a6bda3ff` (dropped by the one force-with-lease push). Superproject commit `88b60982` on origin/main `1c877748` (unpushed; gitlink scope = draw-steel-elements only; both trees clean).
  - Local gates at GREEN: tsc 0, lint 0, jest 13855 / 2 skipped, lifecycle 64/64, e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`. actionlint skipped (binary gone; workflow content unchanged since r4 approval and proven by 3 real runs).
  - PR #82 (draft) CLOSED unmerged. Runs: green1 45104797704 (cache miss+save, e2e job 494 s, step 405 s); red 45108995763 (NEGO-C01 only failure, `657/667 ok, 1 failed`, artifact `e2e-out-1` 3,150,088 B with NEGO-C01/screenshot.png 64,354 B); green2 45109824506 (cache hit, job 359 s, step 290 s). origin: branch at GREEN, develop unchanged, tags 47 -> 47.
  - No re-review: zero content change since the r4 APPROVE (rebase only, no fix commits).
- Owner rulings on r5 follow-ups: DROP "PR cache not visible to develop" (expected GitHub scoping; first develop run is a cold ~8 min run; told Scott). DROP "Node 20 deprecation annotation" (pre-existing on every job; GitHub already forces those v4 actions onto Node 24 and they pass). INFO-3 closed: peak e2e step 405 s of 1500 s, job 494 s of 1800 s — timeouts stay.
- LAND-READY reported to dispatcher. After landing: owner checks the first `develop` push run of Plugin CI (job `e2e` green = second half of "Done means"), posts the closing comment, then Done. Dispatcher applies sc434-r1-skill-proposal.md (refreshed 2026-11-22) to dse-verify and adds CURRENT for the new develop head (numbers carry from 3b47e55b: no TS/CSS change).
