# SC-406 round 1 — independent adversarial review brief

## 1. Context loading
- Ledger (the spec, Scott's rulings verbatim): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/decisions.md
- Implementer brief: .../sc406-gating/sc406-brief-r1-impl.md
- Implementer report: .../sc406-gating/sc406-r1-impl-report.md (read the exec summary + design findings; do not trust its claims — verify them)
- Gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md
- Worktree: /home/scott/code/steelCompendium/worktrees/sc406-gating/draw-steel-elements, branch `sc406-gating`, review the diff `origin/develop..sc406-gating` (base `f8693b5`; head sha: 3fddf49).
- Workers NEVER call the tracker. Use `git -C <absolute path>` for every git command. You are a reviewer: do not commit to the branch. Scratch probes go in a scratch dir under the ledger dir (`.../sc406-gating/review-r1-scratch/`), or a throwaway git worktree at an absolute path you create and remove.

## 2. The task — execute and probe, don't just read
Verify every bullet of Scott's ruling (ledger, "the ticket description") holds in BOTH states, and that the "Explicitly NOT gated" list is untouched. Probes to run at minimum:
1. Off state (no `experimental` key, and `experimental: false`, and a non-boolean like `"true"` string — what happens?): each of the 9 deferred blocks renders the inert card; none appear in `/ds`, Insert commands, or build-time docs; no sidebar view type, ribbon, the three sidebar commands, or Pin/Unpin chrome items on ANY shipping block (initiative especially); no Authoring page; no Print preview row; per-block `prefs: { authoringControls / printPreview }` rejected with the console warning; `download-data-md-dse` gone in both states.
2. On state: everything as on develop — diff behaviour, not just tests.
3. Integrity: opening a deferred block with the switch off leaves the note bytes unchanged (no write-back, no anchor mint). A settings save with the switch off and on round-trips the `experimental` key untouched (not stripped, not added). Toggling on→off→on loses no data in blocks.
4. NOT gated: `ds-scc`, `ds-montage`, ability-card rolling (`rollingEnabled` / `rollerEngine` / `rollClickToRoll`), text-scale prefs, `@media print` layout, all 6.0.2 elements, and the Conditions manager modal reached from the initiative tracker. Probe that the off state does not break any of them (e.g. `ds-scc` rendering an embedded deferred type? montage referencing hidden things?).
5. Read-once semantics: is the flag captured at load, and are there code paths that read it before it is loaded (ordering bugs: commands registered before settings load, catalog built at module import time)?
6. Tests: are the off-state tests real (would they fail if the gate were removed)? Mutate the gate locally in a scratch copy and confirm a test goes red, then restore.
7. Re-run the battery yourself at least through jest + freeze (full battery if time allows): expected tsc/lint clean, jest = the implementer's reported totals, lifecycle 25/25, shots 568 0 FAIL, freeze `freeze OK (274/274 …)`, parity 0 GAPs / 0 undeclared / 24 DECLARED.
8. Look at the evidence screenshots in .../sc406-gating/evidence-r1/ — does the card read as intentional, inert, and legible in both themes?

## 3. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/sc406-r1-review.md, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED, finding counts by severity, gate numbers you measured). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and prescribed fix. If the report-file write is blocked, return it inline.

## 4. Return contract
Final text goes to the ticket-owner: raw facts — verdict, sha reviewed, counts by severity, measured gate numbers, absolute paths of every artifact. No prose.

Footguns:
- Devbox eats `$?`/PIPESTATUS; never pipe a gate. `devbox run -- bash -c 'cd <abs> && <cmd> > <unique log> 2>&1; echo rc=$? >> <unique log>'`.
- Never key a wait-loop on a scratch filename or its contents; per-run unique log paths. Run gates in the FOREGROUND; never end your turn waiting for a notification.
- Redirect long output to files — the 600s stream watchdog kills silent agents.
- Never pkill/killall by pattern; kill only by PID whose command line contains `worktrees/sc406-gating/`.
- Never rm -rf under `.superpowers/` outside `sc406-gating/`. Never touch freeze-baseline.sha256.
- You cannot SendMessage me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send starts with `SC-406:`.

## Addendum (owner)
- The implementer touched `obsidian-camera.mjs` seeding and only syntax-checked it — run `npm run docs-shots` (or whatever dse-verify/package.json names) once and report the result, or why it can't run headless.
- Two implementer follow-ups are already ruled FOLD into the next fix round (schemaSuggest inside deferred fences; gated pref values dropped on prefs save while off). Confirm/size them and include them in your findings with prescribed fixes, but don't spend long on them.
- Already ruled DROP (don't re-raise unless you find a worse variant): stale sidebar leaf stock tab; docs prose (SC-407).
