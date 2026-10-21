# SC-456 independent reviewer brief (round 1)

## 1. Context loading
- Read FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc456-e2e-fence-integrity/decisions.md (rulings O1–O5 binding), then the implementer brief `sc456-brief-impl.md` and report `sc456-impl-report.md` in the same dir.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc456-e2e-fence-integrity (plugin in `draw-steel-elements/`, branch `sc456-e2e-fence-integrity`). Head sha: 9e1b93d (verify `git -C <abs> log -1`). Base: dse develop 188755b. Do not commit to the branch; probes go in your private scratch dir or are reverted (confirm `git -C … status` clean at the end).
- Workers never call the tracker (Linear).
- dse-verify skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md.

## 2. Task — execute and probe, don't just read
Adversarially review `git -C <plugin> diff 188755b..HEAD`. In particular:
1. Does the after-every-test invariant now catch a rewritten opening line AND closing line of a TARGET block (O3)? Re-run the implementer's mutation probe yourself (revert SC-290's `emitOpenFenceLine` to `${open.prefix}${open.fence}${open.language}`, run the relevant e2e test with `--only=`; the INVARIANT must fail) and restore.
2. False positives: correct writes on `~~~`, 4-backtick (with an inner ``` line), ```` ``` ds-x ```` (space before language, O2 type = `ds-x`), quote-prefixed (SC-455), CRLF (SC-453) fences — no problems reported. False negatives: sibling-block change, outside-text change, fence count change, unterminated fence still reported.
3. Closing-fence grammar matches the product (`src/framework/host/blockPrefix.ts` `matchFenceMarker`): same char, length >= opener, only whitespace after; a shorter or other-char run inside a block is body, not a close.
4. `exempt` mode semantics unchanged except where O3 requires; `declareTarget`/`expectNoteBlock` find the same blocks as before for every existing spec.
5. `makeFakeContext` (jest fake) change: no existing jest test silently weakened; new tests not vacuous (mutate the helper and confirm they fail).
6. Scope: O4 (only `e2e/` and `test/` changed; built `main.js`/`styles.css` sha256 identical to base) and O5 (spec files untouched or minimally touched).
7. Re-run the gates yourself: tsc (incl. -p e2e), lint, jest, lifecycle (own `DSE_LIFECYCLE_PORT`, e.g. 9311), full e2e. Expected: jest 5257 passed / 1 skipped / 229 of 230 suites at base plus the branch's new tests (fresh-worktree note: one fewer passed and 2 skipped until `npm run shots` has cached `visual-harness/dist/obsidian-app.css`); lifecycle `27/27 ok, 0 failed`; e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` unless the branch added e2e tests.

Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Out of scope: the PRODUCT space-before-language gap (SC-457).

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc456-e2e-fence-integrity/sc456-review-report.md — opens with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED, head sha, gate lines). If the write is blocked, return it inline.

## 4. Footguns
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc456-review-<your agentId>/`, uniquely named scripts/logs. Never key a wait-loop on a scratch filename or its contents.
- Redirect long output to files; run gates in the FOREGROUND (timeout up to 600000 ms) — never background a gate and wait for a notification.
- Devbox eats `$?`: gate via a script file that captures rc itself, or make the gate the last command; never pipe to tail. `rm -f main.js styles.css` in the plugin root before jest.
- `git -C <absolute path>` for every git command. Never pkill/killall by pattern (PID with your worktree path only). Never `rm -rf` a shared `/tmp` glob or the shared `.superpowers/` dir. Never `--headed` on DISPLAY=:1.
- The main checkout's dse dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault — expected.
- You cannot SendMessage me; `to: 'main'` reaches the dispatcher, not me. Need input → end with STATUS: NEEDS_CONTEXT and the question. Any message you do send must start with `SC-456:`.

## 5. Return contract
Final text to the ticket-owner: raw facts — verdict, head sha, findings list (severity, file:line, one line each), measured gate lines, absolute paths of every artifact.
