# SC-240 independent review brief (round 1)

You are the independent adversarial reviewer for Linear ticket SC-240. **You never call the
tracker (Linear)** — not to read, not to post. You did not write this code.

## 1. Context loading

- Ledger (authoritative rulings): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/decisions.md`
- Implementation brief: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-brief-impl.md`
- Implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-impl-report.md`
  (read its executive summary; verify its claims — do not trust them)
- Repo: `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements`,
  branch `sc240-scc-ref-error`, under review at sha `225b02e`, base `origin/develop` = `46c0c4c`.
  Review `git diff 46c0c4c..225b02e`. Do not commit to this branch; if you need scratch edits for
  a probe (sabotage/can-fail), do them and restore byte-clean (`git diff` empty, `git status`
  clean) before you finish.

## 2. The task — execute and probe, not just read

Check the diff against the ledger's owner rulings 1–3 exactly. Specifically probe:

1. **Bare-path contract**: legacy bare-path failures still produce the byte-identical legacy
   message (with the "multiple instances" hint), hero and creature loops. Existing pinned
   assertions unchanged (`git diff 46c0c4c..225b02e -- test/unit/model/initiative-resolve-refs.test.ts`
   must show only additions + header comment).
2. **SCC shape**: every SCC-shaped failure path (hero + creature; `scc:` and `scc.v1:`; trimmed
   /leading-whitespace variants; a ref that is SCC-shaped but whose provider throws a non-"not
   available" error, e.g. malformed code) produces a sensible message with no filename hint and
   no double-wrapping. Is there any path where an SCC ref still falls through to
   `resolveBarePath` and gets the file hint?
3. **Portrait warn**: no `image` key → no warn and the fallback glyph still mounts; `image`
   specified but unresolvable → warn still fires; `image: ""` / whitespace — what happens, is it
   sensible? The `defaultImagePath` setting case (no image but a default configured) —
   unchanged behavior? Every call site of the warn covered (hero row, enemy detail row,
   instance grid cell)?
4. **Tests are not vacuous**: sabotage each fix (revert it locally) and confirm the new tests go
   red; restore.
5. Re-run the battery yourself per `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`:
   tsc, lint, jest, shots, freeze (`check-freeze.sh`), parity last. Expected: tsc/lint clean;
   jest = implementer's reported number, 0 failed; shots 524 PNGs 0 FAIL; freeze `260/260`
   exit 0; parity 0 GAPs / 0 undeclared / 16 DECLARED exit 0. Run each gate in the FOREGROUND
   via a wrapper script file capturing the exit code, output redirected to
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-review-<gate>.log`.
   Shape: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements && npx jest'`.
6. Comment/doc accuracy (refs.ts comment, test header, CHANGELOG bullet under `## Unreleased`).

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / APPROVE-WITH-FIXES / REJECT, count
of findings by severity, gate numbers). Then findings by severity (BLOCKER / HIGH / MEDIUM / LOW /
INFO) each with file:line, failure scenario, and prescribed fix. Then probe log.

## 4. Return contract

Final text goes to the ticket-owner: raw facts (verdict, findings list one line each with
severity + file:line, gate numbers) plus absolute paths of every artifact. No prose.

Footguns:
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches
  exist in the shared scratch dir. Read the process's own output or a per-run unique path.
- Redirect long output to files; the 600s stream watchdog kills silent agents. Never background a
  gate and wait for a notification.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input,
  end with STATUS: NEEDS_CONTEXT. Any message you send anyway must start with `SC-240:`.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never delete anything under
  `.superpowers/` except your own `sc240-review-*` files. No push, no tag, no deploy.
