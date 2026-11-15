# SC-631 r2 — independent reviewer brief: the montage skill-reuse warning ignores casing and spaces

Your final text goes to the ticket-owner, not a human: raw facts (verdict, findings by severity with
file:line, measured numbers, shas), no prose, plus the absolute path of every evidence artifact. You never call
the tracker (Linear). You review someone else's work; you do not fix it unless a finding is a one-line
obviously-correct nit, and then say so.

## 1. Context loading

- Ledger (current state, read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc631-montage-skill-casing/decisions.md`
- Implementer brief and report (same dir): `sc631-r1-implementer-brief.md`, `sc631-r1-implementer-report.md`
  (read the report's executive summary; read the body only where you need it).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc631-montage-skill-casing`, branch
  `sc631-montage-skill-casing`. Plugin head under review: dse `ea9749ab` on `3e88b3f5`; superproject head
  `9c022c93` on workspace main `7cea83eb`. Diff: `git -C <worktree>/draw-steel-elements diff 3e88b3f5..HEAD`
  and `git -C <worktree> log --oneline 7cea83eb..HEAD`.
- First: `git -C <worktree>/draw-steel-elements fetch origin`; report if `origin/develop` moved off `3e88b3f5`.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~370 KB;
  read by line range: "The battery, in order", "Devbox wrapping", "Stale main.js", "Jest timeouts under load",
  "Lifecycle and e2e notes", "THE exit-code footgun").

## 2. What to review — execute and probe, do not just read

Check the change against rulings 1–7 in the ledger (quote any you find violated). In particular probe:

- the typed skill and each stored `skills_used` item compared trimmed + case-insensitive, both ways;
- the warning text names the STORED spelling (ruling 2), including when the stored value itself has spaces;
- the edit sheet: an entry logged "Nature", reopened and typed "NATURE"/" nature " does not warn against
  itself; the same hero with "Nature" twice (one in the edited entry) still warns; editing an entry of hero A
  never subtracts from hero B;
- odd YAML: `skills_used` with a number, null, blank string, a map; `skills_used:` absent / null; a skill
  typed as only spaces — no crash, no false warning;
- no write-path change (ruling 3): logging " nature " records exactly what the existing code recorded before
  (compare against `3e88b3f5` behaviour: does the modal trim before saving? it must be unchanged);
- other callers of any changed/renamed helper; anything else in `src/elements/montage/` still comparing skills
  exactly that a user would hit in the same flow (report, do not fix — ruling 7);
- the tests: are they non-vacuous? Temporarily revert the `src/` fix (in a scratch copy or by `git stash` of
  only src — restore it exactly afterwards and confirm `git status` clean) and confirm the new unit, jsdom and
  e2e MONT-L12 tests fail without it. Test titles hold no bracketed ticket id; MONT-L12 id unused elsewhere.
- CHANGELOG bullet: under `## Unreleased`, plain words, one bullet; ONE pointer-bump commit, no interim ones.

Re-run: tsc (incl. `tsc -p e2e`), lint, jest (full), and the montage e2e specs at least
(`e2e/specs/montage/`) — the full e2e if time allows (expected
`593/609 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`). Lifecycle is not required from you unless the
diff touches files outside `src/elements/montage/`, tests and CHANGELOG — say which you ran.

## 3. Footguns

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc631-montage-skill-casing/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command; never trust an echoed `$?` in `bash -c`; no `| tail` on a gate.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (literal absolute paths only).
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, never `rm` with a variable
  or glob: it hangs on a permission prompt. Leave throwaway files in place.
- Your scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc631-r2-rev/`
  (already created), uniquely named files, created with the Write tool.
- `git -C <absolute path>` for every git command. Do not commit (except a declared one-line nit), push or tag.
- Kill only by PID inside your worktree (`readlink /proc/<pid>/cwd`); never `pkill`/`killall` by pattern.
- Calls over 180 s get backgrounded: start with output to a unique log, wait with
  `timeout 175 tail --pid=<pid> -f /dev/null` in repeated calls, read the log. Never wait on a completion notice
  or key a wait-loop on a scratch filename. Redirect long output to files.
- Known flakes: INIT-W10 (SC-654), SET-X03/SET-X04 (SC-657) e2e — re-run once and report both. SC-622:
  `git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json` if the camera dirtied it.
- The main checkout's dse dirt is Scott's live vault — not yours.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you
  ever send a message anyway, its first word must be `SC-631:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc631-montage-skill-casing/sc631-r2-reviewer-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / FIX, finding counts by severity, measured numbers).
Then findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario and prescribed fix; the
non-vacuity results; what you ran. If the write is blocked, return the report inline.
