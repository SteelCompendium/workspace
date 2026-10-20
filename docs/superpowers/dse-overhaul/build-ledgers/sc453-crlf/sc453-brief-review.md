# SC-453 reviewer brief — independent adversarial review of R1

## 1. Context loading
- Ledger (spec + rulings, authoritative): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/decisions.md`
- Implementer brief: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/sc453-brief-impl.md` (sections 2-4 apply to you too: devbox shapes, gate footguns, git -C, no pkill by pattern, never touch the freeze baseline, never push/tag/deploy).
- Implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/sc453-impl-report.md` — read the summary; treat its claims as claims to verify.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc453-crlf/draw-steel-elements`, branch `sc453-crlf`, head `b3631f8`, base dse `develop` @ `f818002`. Review `git -C … diff f818002..b3631f8`. Do not commit to the branch; put scratch probes in your scratchpad or an uncommitted file you delete afterwards.
- Workers never call the tracker (Linear).

## 2. The task — execute and probe, not just read
Ruling under test (verbatim): "a note that is all-CRLF stays all-CRLF after any DSE write; an all-LF note stays byte-identical to today's output. Mixed-ending notes: pick the dominant / first-line ending (implementer proposes, reviewer probes); must not crash or lose content."

Probe at minimum:
1. Independent survey of EVERY site that writes into a note (`vault.process`, `vault.modify`, `vault.append`, `editor.replaceRange`/`setLine`/`transaction`, `fileManager.processFrontMatter`, anchor stamping). Did the implementer miss one? For each, does a CRLF note stay all-CRLF?
2. Integrity probes (jest and, for at least the sidebar + reading-mode paths, real Obsidian via the e2e/lifecycle harness): content above/below the written block byte-identical; two same-kind blocks in one CRLF note don't cross-talk; hand-edited content survives a re-trigger; user-deleted block regenerates/handles cleanly; CRLF note without a trailing newline; a lone `\r` in content; a body that legitimately contains `\r`; a CRLF note with an unterminated fence at EOF; nested (callout `> `) fences unchanged vs base.
3. LF regression: is every LF-note write byte-identical to f818002's output? Prove it by diffing outputs of the same probe on base vs head.
4. ReadingModeBlockHost's line-index invariant (SC-343 comment at ~:143-150) — still sound?
5. Did the FAIL-on-base claims hold (new tests actually fail on base src)? Are any new tests vacuous?
6. Re-run the full dse-verify battery yourself. Expected at base: tsc/lint clean · jest 4810 / 1 skipped / 227 of 228 suites (+ new) · lifecycle 25/25 (+ new) · e2e `63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` (+ new; must end 0 failed, Y/Y pairs) · shots 572, 0 FAIL · freeze `freeze OK (276/276 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/sc453-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED, counts by severity, measured gate numbers). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, measured probe evidence, prescribed fix.

Footguns: if the report-file write is blocked, return the report inline. Never key a wait-loop on a scratch filename or its contents (stale logs from other branches match); use per-run unique paths. Redirect long output to files; run gates in the foreground — never end your turn waiting on a job you started. You cannot SendMessage me; `to: 'main'` reaches the dispatcher, not me — end with STATUS: NEEDS_CONTEXT instead; if you send a message anyway its first word must be `SC-453:`.

## 4. Return contract
Final text goes to the ticket-owner, not a human: verdict, head sha reviewed, findings list (severity + file:line + one line each), measured gate numbers, and the absolute path of every evidence artifact. No prose.

## 5. Extra footgun (from R1)
R1's implementer ran `rm -rf /tmp/dse-obsidian-lifecycle-*`, a glob that matches OTHER efforts' lifecycle scratch dirs. Never delete by glob outside your own per-run unique path. Also check: does the lifecycle/e2e harness itself clean up with a shared glob? If so, report it as a finding.
Also note the implementer chose a LIFECYCLE scenario (G-S10) instead of e2e because e2e is "scoped to the stamina and initiative pilot surfaces" — judge whether that is right per dse-verify's e2e/coverage-pair rules (SC-408: e2e required to land) and whether G-S10 actually asserts on-disk bytes.
