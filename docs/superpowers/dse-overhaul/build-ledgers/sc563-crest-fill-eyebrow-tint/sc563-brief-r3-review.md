# SC-563 round 3 — independent adversarial review of the I1 implementation

You are the independent reviewer for SC-563. You did not write this code. Your final text goes to
the ticket-owner, not a human. **Workers never call the tracker** (Linear). You change NO tracked
source and make NO commits — findings only.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/decisions.md`
  (Scott's ruling "I1 - use the glyphs" / "E-B", and "Owner rulings, implementation" — the spec).
- Implementer's report: `.../sc563-crest-fill-eyebrow-tint/sc563-r2-implement-report.md` (exec summary,
  then dive only where you need to). Survey context: `sc563-r1-survey-report.md` §1a, §1c, §5, §6.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint`, branch
  `sc563-crest-fill-eyebrow-tint`. Diff: `git -C <worktree>/draw-steel-elements diff origin/develop...HEAD`
  and `git -C <worktree> diff origin/main...HEAD` for the superproject docs.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, freeze
  semantics, Steel scoping rule).

## 2. What to probe — execute, don't just read

1. **Spec conformance:** six codepoints exactly as the site's `steel-etl/internal/site/ability_cards.go:88-110`
   (main `l`, maneuver `f`, triggered `)`, move `o`, none `*`, trait `*`); villain keeps the Lucide skull;
   unmapped `data-dse-act` values keep their svg (no blank crest — probe one); no other crest icon changes
   (stamina, kit head, project, class, statblock head); screen-only and Steel-only (render a non-Steel
   theme and print/realprint and confirm nothing changes).
2. **Font:** the embedded OTF is byte-identical to the site's (`sha256`), unsubsetted; `@font-face` loads
   in the harness (glyph ink is not the fallback letter — measure ink like the r1 survey); check what
   happens in real Obsidian if `obsidian-shots` is available; size cost of styles.css; does the font name
   collide with anything (e.g. a user-installed font) — is the family name namespaced enough?
3. **Accessibility:** `content: … / ""` alt text present; the hidden svg was aria-hidden or the crest has
   an accessible name either way; nothing new is announced.
4. **Licence:** attribution file present and correct; credited alongside Source Serif 4; anything in
   the dse release/build that would drop the attribution file from the shipped plugin.
5. **Nested heads:** statblock/featureblock sub-feature crests — what do they render now; is that
   consistent with the site and with SC-367's pending W6 (bare glyph)? Flag, don't fix.
6. **Tests:** are the new tests able to fail (mutate the rule and re-run them)? Any vacuous assertion?
7. **Gates:** re-run at least jest, shots + freeze, and parity yourself (dse-verify shapes) and compare
   to the implementer's numbers. Expected at `63e00d7e`: jest 11648 passed / 2 skipped plus the new
   tests; shots 592, 0 FAIL, host-leak 163/978, modal host-leak 39/234, capture clip 147; freeze 280/280;
   parity 0/0/24. If you have time, e2e (`315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`).
8. **Evidence:** open the implementer's composite; check it is same-scale and that the After row
   matches the Site row glyph-for-glyph.
9. **Docs:** DESIGN.md Iconography line and CHANGELOG bullet are in the WORKTREE superproject, accurate.

Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, and the
prescribed fix.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/sc563-r3-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND / FIX-THEN-LAND / REWORK; counts by severity;
gate numbers you measured). Evidence under `.../r3-review/`. Final text: raw facts — verdict, findings
list (one line each), gate numbers, and the absolute path of every artifact.

## 4. Footguns

- No compound `cd`; `git -C <abs>`; `devbox run -c /home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/draw-steel-elements -- <cmd>`.
- Devbox eats exit codes; never pipe a gate into `tail`; record exit codes from a script FILE; redirect
  long output to a file (the 600s stream watchdog kills silent agents).
- One gate per Bash call, foreground. No background jobs except shots — then poll its own log.
- Lifecycle, if you run it: SIX `--only` parts, comma-separated, per the ledger's "Worktree re-cut"
  entry; G-S56 last; G-S91 known flake (SC-616). Never set `DSE_LIFECYCLE_PORT`. Private
  `DSE_CAMERA_TMP` per shots run.
- Never `rm` with a variable target; never a glob `rm`; never `rm -rf` a `/tmp` glob. Kill only by
  literal PID after checking `readlink /proc/<pid>/cwd` is in this worktree; never `pkill` by pattern.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc563-r3-review-<random suffix>/`;
  Write tool for scratch files. Never key a wait-loop on a scratch filename or its contents — use a
  per-run unique path.
- Leave the worktree exactly as you found it (`git status` clean; restore any built artefact you
  modify). Never edit SKILL.md, the freeze baseline, tags, `just deploy*`, push.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with
  `STATUS: NEEDS_CONTEXT`. Any message you do send starts with `SC-563:`.
