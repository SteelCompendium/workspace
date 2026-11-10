# SC-558 r3 — independent adversarial review of the r2 stripe removal

You are an independent Opus reviewer for SC-558. Your final text goes to the ticket-owner (an
agent), not a human. **You never call Linear/the tracker.** You did not write this code; review it
cold. Execute and probe — do not just read.

## 1. Context loading

- Ledger (Scott's rulings verbatim): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/decisions.md`.
- r1 design report §2a/§3/§7 (`sc558-r1-design-report.md`) and the picked candidate CSS in
  `sc558-r1-crops/` (errorcard-C, role-fbadv-C, tier-A, act-A, role-sb-A).
- r2 report `sc558-r2-impl-report.md` (read its summary first), `rebaseline.txt`, `sc558-r2-crops/`.
- dse-verify skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery, Steel scoping rule, freeze semantics, parity semantics, CURRENT).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes` — dse branch
  `sc558-left-stripes` on top of `origin/develop` `6270e84a`; superproject on `origin/main`
  `e1d3d1e0`. Diff: `git -C <wt>/draw-steel-elements diff 6270e84a..HEAD` and
  `git -C <wt> diff e1d3d1e0..HEAD -- DESIGN.md CHANGELOG.md`. Do not commit; if you need to try
  a fix, do it in a scratch copy, never in the worktree.

## 2. What to probe (findings by severity, file:line, failure scenario, prescribed fix)

1. **Every ruling implemented exactly** (ledger "Mapping to the r1 ask"): error card C (1px all
   around, stage hue mixed 60% toward hairline, title ink follows stage, `@supports` fallback),
   advancement C screen-only (print = rail removed), tier A (wash + badge kept, stripe gone incl.
   `button.dse-pr__row` and montage `--head`), action spine A screen + print (crest still tinted
   from `--dse-act`), dead `.dse-sb[data-dse-role]` rule gone, Obsidian's violet quote edge removed
   in print **for plugin blockquotes only**.
2. **No left stripe survives anywhere**: re-run a computed-style probe across every harness
   element × fixture × PREF_SHOTS variant in steel-dark, steel-light and print (r1's method:
   border-left ≥1px differing from the other sides, left inset box-shadow, narrow absolute
   `::before/::after`, 90° gradients). Report survivors; the sticky-chars 1px divider and the
   montage hero column rule are expected.
3. **Nothing else moved**: layout regressions from removing the spine's lane/padding (framed
   cards, standalone SC-168 arm, flat mode, kit unframed, narrow width), the advancement well's
   margins, error card in Live Preview / reading view / callouts (SC-520 territory), print
   blockquote change not leaking to non-plugin quotes.
4. **Colourblind check**: greyscale the final screen crops; tiers, action types, error stages
   and the advancement grouping must remain distinguishable without hue.
5. **Freeze**: re-run shots + `check-freeze.sh` yourself; the moved set must equal the r2 report's
   list and be limited to printed action-spine ids + ids with a plugin blockquote. Verify every
   `rebaseline.txt` "after" hash against your own regenerated PNGs and every "before" against
   the live baseline `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`
   (read only — never edit it).
6. **Tests**: are the new guards meaningful (mutation-probe: re-add a stripe, confirm a test goes
   red)? Was the lightContrast crit entry retargeted, not deleted?
7. **Docs**: DESIGN.md / CHANGELOG / plugin docs accurate, current-state, in the worktree (not the
   main checkout).

## 3. Gates — re-run the battery yourself

Expected (base `6270e84a`): tsc/lint clean · jest 6492/1/257 of 258 + r2's new tests · lifecycle
52/52 in the FIVE `--only` parts of dse-verify row 4 (21+16+9+4+2, fifth `G-S59 G-S49`; G-S56 last)
· e2e 128/128 ok, 89/89 · shots 592, 0 FAIL, host-leak 163/978, `capture clip OK (147 …)` ·
freeze = r2's moved list only · parity 0/0/24 (LAST).

Footguns: `devbox run -c <abs dse path> -- …`; no compound `cd`; `git -C`; exit codes via a script
file run through devbox; one gate per foreground call, output to a unique log; shots is the only
gate you may background — then poll its own log/rc, never wait for a notice; never key a wait-loop
on a scratch filename or its contents (stale logs from other branches match); private
`DSE_CAMERA_TMP`; private scratch subfolder
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc558-r3-review-<agent id>/`;
Write tool for scratch files; never `rm` with a variable target or a glob (never under `/tmp`);
never `pkill`/`killall` by pattern — kill only a literal PID whose `readlink /proc/<pid>/cwd` is
in this worktree; never edit the freeze baseline or any SKILL.md.

## 4. Report & return

Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/sc558-r3-review-report.md`
opening with a ≤10-line executive summary (verdict APPROVE / FIX-REQUIRED, finding counts by
severity, your gate numbers). Evidence in `sc558-r3-crops/` with `sc558-r3-` names. If the
report-file write is blocked, return it inline.

Final text: raw facts — verdict, findings (severity, file:line, one-line fix), gate lines, absolute
paths of every artifact. You cannot `SendMessage` me; for input, end with `STATUS: NEEDS_CONTEXT`.
If you ever message anyway, first word `SC-558:`.

## Addendum (owner, after r2)

- r2 heads: dse `eb8b7949` (CSS+tests `ea046ae2`, docs `eb8b7949`) on `6270e84a`; superproject
  `e8a55ef3` on `e1d3d1e0` (submodule pointer intentionally uncommitted — leave it).
- r2 freeze move: 39 ids / 78 lines = 35 action-spine ids + 4 plugin-blockquote ids (`class`,
  `perk`, `perk-headings`, `perk-narrow`). Verify exactly this set.
- **Lifecycle G-S59** failed for r2 4/4 on the branch AND 2/2 on a clean `6270e84a` archive
  (`Emulation.setCPUThrottlingRate` / `Runtime.evaluate: timed out after 30000 ms`). Check
  `uptime` before each lifecycle part; if G-S59 fails for you, re-run it alone on a clean
  `6270e84a` (`git archive` into your scratch) to classify it as host/pre-existing vs branch. A
  CSS-only branch should not be able to affect it — say if you find otherwise.
- r2 jest had load-only timeout reds in unrelated suites (dse-verify "Load-sensitive jest suites");
  re-run any red suite alone before reporting it.
- Probe specifically r2 follow-up 3: removing the 3px edge shifts content 3px left in tier rows,
  framed ability cards and kit's signature ability. Does anything now mis-align (badge column vs
  section header, crest vs title, card padding asymmetric left vs right)?
- **G-S59 context (dispatcher, 2026-11-10):** SC-561 is fixing exactly this. Its r1 diagnosis
  (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/sc561-r1-diagnosis-report.md`,
  summary only) found a harness-only cause: G-S59's CDP 8x CPU throttle stretches per-write work
  past the 30 s cap under load. SC-561's fix lives only in `visual-harness/obsidian-lifecycle.mjs`
  (sc561 branch head `d344e1e1`, worktree `/home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout`).
  So: run the four other lifecycle parts normally; for part 5, run `G-S59 G-S49` as-is once, then
  run it on a **scratch copy** of the sc558 branch with SC-561's `obsidian-lifecycle.mjs`
  substituted (copy that one file from the sc561 worktree into your scratch copy — never into
  either worktree). Report both. Do not touch the sc561 worktree beyond reading that file.
