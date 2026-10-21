# SC-366 independent review brief, round 1

## 1. Context loading
- Read: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/decisions.md (ledger), sc366-brief-impl-r1.md (what the implementer was asked), sc366-report-impl-r1.md (what it claims) — all in that dir.
- Read: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link (dse at draw-steel-elements/, branch sc366-notinstalled-link, base develop 188755b). Verify `pwd` before any write. Every git command uses `git -C <absolute path>`.
- You NEVER call the tracker. You do not edit the branch — review only. The main checkout's dse dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault — ignore it.

## 2. The task — execute and probe, not just read
Review `git -C <dse> diff 188755b..HEAD` (or the implementer's rebased base). Probe at runtime:
- Computed `color` of `a.dse-ref-web-card__link` in light and dark, steel theme, AFTER = the `--dse-accent` value the `.dse-card a` family yields; :hover matches the family's hover.
- The SC-317 external-link arrow takes the same colour.
- Print mode (`data-dse-print="on"`) and any non-steel theme: unchanged from base.
- The notice card's other text (`__msg`, `__hint`, `__cta`) unchanged.
- No other selector or shot moved: re-run shots + freeze yourself, and confirm any moved frozen shot is exactly this card, matching the implementer's rebaseline.txt lines. Re-run parity (last).
- Specificity: does any host or plugin rule beat the new selector (e.g. Obsidian's `.external-link` or `a` rules in the real app CSS `visual-harness/dist/obsidian-app.css`)? If an obsidian-shots / real-Obsidian check is possible headless, do it.
- Eyeball the implementer's before/after crops: is the link legible, arrow visible, both schemes.
Findings by severity (HIGH/MED/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 3. Gates — re-run per dse-verify, expected (CURRENT @ 188755b, adjusted only by what this change legitimately moves):
tsc + lint clean; jest 5257/1 skipped/229 of 230 (after shots); lifecycle 27/27 ok (DSE_LIFECYCLE_PORT=9367); e2e 83/87 ok, 0 failed, 4 known-bug, coverage 57/57; shots 572, 0 FAIL; freeze 276/276 except sanctioned card shots; parity 0 GAPs / 0 undeclared / 24 DECLARED.

## 4. Footguns
- Devbox: `devbox run -c <dse> -- bash -c 'cd <dse> && <cmd>'`; it eats exit codes; never pipe a gate into tail; wrapper script FILE records exit code, output to a log.
- Private scratch subfolder ONLY: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-review-r1-<random suffix>/, unique script/log names.
- Run gates in the FOREGROUND; never background and wait. Redirect long output to a file (600 s stream watchdog).
- Never key a wait-loop on a scratch filename or contents.
- Never pkill/killall by pattern — PID only, command line containing worktrees/sc366-notinstalled-link/.
- Never rm -rf a shared glob or .superpowers/.

## 5. Report & return
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/sc366-report-review-r1.md, opening with a ≤10-line executive summary (verdict APPROVE / FIX-REQUIRED, finding counts by severity, gate numbers you measured).
- If the report-file write is blocked, return it inline.
- Final text to the ticket-owner: raw facts, no prose, plus absolute paths of every artifact you produced.
- You cannot SendMessage me; on needing input end with STATUS: NEEDS_CONTEXT and the question. Any message you do send starts with `SC-366:`.
