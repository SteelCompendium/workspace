# SC-284 decisions ledger — `.dse-head` narrow form

Owner: Fable ticket-owner, session a56f19e1-5165-4bc8-92ee-d6eeff34f029
Worktree: /home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow (branch sc284-cardhead-narrow)
DSE tracked branch: develop (origin/develop 6c4f6aa at start, 2026-09-25). Freeze baseline 260 lines.

## Ticket spec (description, verbatim, 2026-08-29)

> Found during SC-191 round 3 (montage design): the plugin's `.dse-head` has no narrow-width form.
> At ~300px (sidebar leaf) the head's deck wraps one word per line. The v2 site stacks its header
> columns at <=30em; the plugin port never adopted that stacking. The SC-191 mocks had to hide the
> crest and both count chips by hand to compensate.
>
> This will bite every element that adopts `cardHead` in a sidebar, not just the montage element.

## Scott rulings

(none yet — ticket had 0 comments at pickup, 2026-09-25)

## Session operating constraints (from dispatcher, 2026-09-25 — not Scott rulings)

- Do NOT land; report LAND-READY or PARKED-NEEDS-REVIEW. No tags/releases/RCs on DSE. Never touch DSE `main`. No `just deploy*`.
- No freeze-baseline change without Scott's written sanction; never edit the shared baseline. If frozen print bytes move: ship `rebaseline.txt` + before/after crops here.
- Kill processes only by PID whose command line contains this worktree path.
- Overlap to avoid: SC-231 (renderFeature.ts + `.dse-feature__kw*` / `__meta-cell--keywords` / `__meta-value`), SC-236 (ds-feature example), SC-255 (ds-skills), SC-338 (`.dse-optchip`), SC-272 (by-SCC rule eyebrow), SC-230 (modal text scale).

## Owner rulings on follow-ups

(none yet)

### 2026-09-25 — owner rulings on r1 implementer follow-ups
- "check-freeze.sh exits 0 on FREEZE VIOLATED": DROP — script `exit 1`s on mismatch (check-freeze.sh ~line 74); the measurement went through devbox's sh wrapper, which eats exit codes (adapter §8.1).
- No narrow fixtures for roll/party/negotiation/project/standalone feature: DROP — the first four have no right rail in their fixtures (project: rightEyebrow only, one slot); feature is covered via nested feature cards in `statblock-sticky-narrow`; the jest test pins the shared rule.

### 2026-09-25 ~10:10 — base moved
- origin/develop 6c4f6aa → 619c4bd (SC-340 view adoption, ~20 commits: framework, harness, lifecycle gate, CHANGELOG). Freeze baseline reported still 260. Plan: let the r1 review finish on 97aa19a, then rebase onto 619c4bd (+ `npm ci` if package.json changed; expect a CHANGELOG conflict) and re-run the full battery + regenerate rebaseline.txt from the rebased bytes before the Scott ask.

### 2026-09-25 — owner rulings on r1 review (APPROVE_WITH_FIXES, reviewer = Opus identity ac9e804; implementer = Sonnet identity aefd8d7)
- MEDIUM-1 (Steel `.dse-fb .dse-feature > .dse-head > …--right` grid-area rules at styles-source.css:7889/:7901 outrank the new @container arms; featureblock option heads don't stack): FOLD into r2 — add the higher-specificity arms, jest assertion, regenerate featureblock evidence.
- LOW-1 (containment claim wrong for Obsidian's Electron 21 / Chromium 106 — layout containment IS applied there; nothing relies on it): FOLD — correct the comment + report. No code change. Sub-visible AA/dither diff at wide width in real Obsidian noted for the Scott comment's mechanics section.
- LOW-2 (symptom described backwards in CHANGELOG + CSS comment — it's the NAME column that gets squeezed): FOLD.
- LOW-3 (statblock-sticky-narrow crop doesn't show the result): FOLD — recrop y≈0–500.
- Rebase onto origin/develop 619c4bd in the same round; re-run full battery; regenerate rebaseline.txt from rebased bytes.

### 2026-09-25 — owner rulings on r2 re-review (APPROVE, reviewer ac9e804)
- LOW-1 (heads composite labels / statblock-sticky row too short): FIXED by owner (evidence-only; rebuilt sc284-rebaseline-heads-compare.png with label bars + 600px statblock crop; after-bytes verified = rebaseline.txt twin hashes).
- INFO (MEDIUM-1 CSS comment credits "renderFeature.ts" for a CSS remap; CHANGELOG phrase "not the other way around"): DROP — comment/wording nits with no runtime effect; not worth a round. Can be touched if Scott asks for a change round anyway.
- Branch state for the ask: DSE sc284-cardhead-narrow @ 33b58c3 on develop 619c4bd. Pending Scott: (1) look at 300px, (2) 6-line freeze sanction (rebaseline.txt).
- 2026-09-25: posted consolidated Needs Review ask (look at 300px + 6-line freeze sanction); ticket In Progress + Needs Review. Parked.

## Scott ruling — 2026-09-25T18:30:15Z, comment 4bf8299f-7ad5-481b-8a32-e7c3345743fe (verbatim)

> 1. thats fine
> 2. sanctioned

Reading: (1) the stacked narrow header look is approved as shown; the "LEADER" indent stays as it renders. (2) The 6-line freeze rebaseline (encounter-narrow, montage-narrow, statblock-sticky-narrow × twin+realprint) is SANCTIONED — literal word "sanctioned".

### 2026-09-27 — post-ruling plan
- origin/develop now b029baa (SC-243, SC-230, SC-272, SC-236, SC-255 landed; baseline still 260, 28 lines changed by SC-236/SC-255, none of ours). Rebase, full battery, recompute rebaseline.txt from rebased bytes, then LAND-READY. SC-232 (parked) also declares `container-name: dse-head`; SC-284 lands first.
- 2026-09-27: develop moved again → 272c444 (SC-231 landed; baseline changed 55 lines incl. statblock-sticky, still 260). Round 3 retargeted to 272c444.
- 2026-09-27: round 3 done — DSE 825ea51 on 272c444; range-diff code commits '=' (CHANGELOG context only); battery green; rebaseline.txt 6 lines, hashes identical to sanctioned set. LAND-READY reported.
