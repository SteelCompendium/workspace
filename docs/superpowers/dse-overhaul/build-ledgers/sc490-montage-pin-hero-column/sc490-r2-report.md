# SC-490 r2 report — rebase + LOW-1 option A + light-theme gate + long-brief crops

## Executive summary

- **DONE.** dse head **`e4f394fa`** on base **`09ece2eb`** (SC-545; the brief said `ea78ebf8`, develop moved twice during the round and I rebased twice, re-running the whole battery on the final base). Superproject head **`a01d8001`** on base **`ca0cbd1b`** (origin/main; the brief said `64fcd141`).
- `git range-diff` of the dse r1 commits across the rebase: **6 of 6 `=`** (no content change); 2 new commits (`214f17e4` LOW-1, `e4f394fa` INFO-4). Superproject: 1 commit, CHANGELOG conflict resolved by keeping both bullets, pointer re-pointed at `e4f394fa`.
- Gates (all on the final base): tsc + lint clean · jest **6425 / 1 skipped / 254 of 255** (6415 + 9 + 1 new guard) · lifecycle **50/50** (21 + 16 + 8 + 4 + 1) · e2e **128/128 ok, 0 failed, 0 known-bug, coverage 89/89 pairs** · shots **592**, 0 FAIL, host-leak 161/966, `montage board scroll OK` now names fine/dark, coarse/dark, fine/light, coarse/light · freeze **280/280, no rebaseline** · parity **0 / 0 / 24**.
- LOW-1 (option A): reverse-pointer comments at both `--dse-card-bg` definitions and at the literals, plus a jest guard (per-channel inside the theme's two stops). Can-fail shown for dark and light. No new token.
- INFO-4: the board-scroll gate runs all four contexts (fine/coarse x dark/light). Can-fail shown: a translucent light fill fails only the light contexts. Cost: gate 14 s -> 27 s standalone (+13 s); full `npm run shots` took 646 s wall this run (r1's was also over the 595 s tool limit, so the increase is small against load noise).
- Long-brief crops (5 heroes, 2,500-char brief, card 2,113px tall, board 1,217px into the card): the pinned column is lighter than the round-1 cells beside it by up to **7 levels per channel in dark and 9 in light** (before: 1). See below; this is the drift Scott is to judge.
- Load: loadavg 26 at the start of lifecycle part 4 (passed anyway), then 1.2-3.7 for part 5, e2e, freeze and parity; about 7 at the start of shots.

## Task 1 — rebase

- dse: `git fetch`; `origin/develop` = `09ece2eb`. `git rebase origin/develop`, no conflicts. package.json unchanged (no `npm ci`). `git range-diff 0698550f..sc490-r1-orig origin/develop..HEAD`: commits 1-6 `=` (`98fdf251`, `643b7f3c`, `0c3bc665`, `a104148d`, `05360ca7`, `0910779f`), 7 and 8 new.
- Superproject: rebased onto `ca0cbd1b`; `CHANGELOG.md` conflict at the top of `## Unreleased` (SC-547 first time, then SC-545's neighbours): kept both bullets, ours second; `draw-steel-elements` gitlink = `e4f394fa`. `git range-diff` shows only the CHANGELOG context and the pointer differing.

## Task 2 — LOW-1, option A (`214f17e4`)

- `styles-source.css`: a pointer comment above each `--dse-card-bg` definition (dark ~:6994, light ~:14306) naming the montage pinned column and the guard; the pin block's comment (~:4692) now states the coupling, the drift on tall cards, and "no new token (DESIGN.md rule 3)".
- `test/dom/elements/montage.test.ts`: `CSS contract: each pinned-column fill literal stays inside its theme's --dse-card-bg gradient stops (fails if the token is retuned without them)`. It reads the two `linear-gradient(160deg, #…, #…)` definitions and the four literals (name dark/light, corner dark/light) and checks each RGB channel lies between the stops' channels.
- Can-fail (logs `evidence/canfail-guard-dark.log`, `evidence/canfail-guard-light.log`): dark stops retuned to `#1c2226, #101417` -> red with `{cell: "name", ch: 0, theme: "dark", ok: false}`; light stops retuned to `#f4f6f6, #e0e4e4` -> red with `{cell: "name", ch: 0, theme: "light", ok: false}`. Both restored (`git diff` showed only the comment edits); full montage test file then 119/119.

## Task 3 — INFO-4, light theme in the gate (`e4f394fa`)

- `visual-harness/shoot.mjs` `assertMontageBoardScroll`: the loop is over `[fine, coarse] x [dark, light]` (the `bg` goes into the harness query; labels and the summary line carry `pointer/theme`); header doc updated. Every pinned/opaque/hit-test/Tab/Shift+Tab/fits-board check now runs in light too.
- Summary line (shots log): `montage board scroll OK (14 rounds x 900px pane, genuine probe-rounds-14 source — fine/dark: 1359px grid in a 690px frame, 96 cells reachable, 6 pinned cells … 85 Tab + 85 Shift+Tab stops (5 + 6 in pinned cells, …); coarse/dark: 2255px grid … ; fine/light: 1359px grid … ; coarse/light: 2255px grid … ; … fine AND coarse pointer, dark AND light theme)`.
- Can-fail (`evidence/canfail-light-translucent.log`): light name fill reverted to `rgba(0, 0, 0, 0.012)` -> `MONTAGE BOARD CLIPS INSTEAD OF SCROLLING — fine pointer, light theme …` with `PINNED CELL NOT OPAQUE — at rest: name cell Kira background-color rgba(0, 0, 0, 0.01) (rounds would show through it)` for every hero at rest, mid-scroll, full scroll and after the resize; the dark contexts did not fire. Restored.
- Runtime: standalone gate (extracted runner) 14.2 s before (HEAD~1 shoot.mjs, two runs 14.3/14.1) -> 27.4 s after (two runs 27.4/27.6); +13 s. Full shots wall: 646 s this run (loadavg about 7 at start; the gate itself is ~13 s of that).

## Task 4 — long-brief crops

Probe: the gate's genuine 12-round source (5 heroes: Kira, Bram, Osric, Yenna, Talin; the card's own names truncate "Kira", "Br…", "Os…", "Ye…", "Tal…" in the pinned column), 490px pane, fine pointer, real Chromium 2x, scrolled to mid-scroll. A brief of exactly **2,500 characters** is injected into the card as a `.dse-mt__brief` / `.dse-mt__brief-text` paragraph before the board (same markup the view builds; identical in both renders). BEFORE = develop base (`origin/develop`) src+css built into its own harness copy; AFTER = this branch. Card 2,113px tall, board top 1,217px into the card. Files (composite, BEFORE left, AFTER right, white label bars, 1896x4302 — the whole card; the board is the band about 2,430-3,300px down):
- `evidence/sc490-r2-dark-longbrief-mid-before-after.png`
- `evidence/sc490-r2-light-longbrief-mid-before-after.png`
- numbers: `evidence/longbrief.log`

Prose.
- **Dark.** Both sides are a very dark blue-grey card (near black with a slight green-blue cast) with a long italic grey brief on top. BEFORE: at mid-scroll the board shows rounds 4-8 only (green check rings, red cross rings, dashed grey plus rings); no hero names anywhere, so rows cannot be told apart. AFTER: a solid column at the left holds "Hero +" in the corner and the names Kira, Br…, Os…, Ye…, Tal… in off-white serif; a thin lighter-grey vertical line runs down its right edge; rounds 6-8 slide under it and are cut cleanly at the line. At rest/mid-scroll the pinned column reads as a very slightly **lighter** blue-grey strip than the round cells beside it (the card has darkened with depth, the fill has not). Measured at scrollLeft 0 (layout identical), per-channel level difference between the pinned name fill and the round-1 cell right beside it, top and bottom of each row: Kira 5/5, Bram 5/5, Osric 5/6, Yenna 6/6, Talin 6/7 levels (BEFORE the change: 0-1 everywhere). Pinned fills `#2a3034` (row top, sheen included) / `#23292d`-`#242a2e` (row bottom); round-1 cells `#262c2f` down to `#1e2326`. Max drift of the pinned fill from the old translucent look: 7 levels (row 5 bottom).
- **Light.** Both sides are a near-white card with grey serif text and a long grey italic brief. BEFORE: names gone at mid-scroll, rounds 4-8 shown. AFTER: the pinned column is a solid near-white (`#f8f9f9`) with black serif names and a "Hero +" corner on a light-grey gradient band like the round headers, plus the same thin mid-grey vertical line. Down the card the real background fades to a slightly greyer white (`#f2f4f4` at the first row to `#eff2f2` at the last), so the pinned column reads as a **brighter white strip** next to the greyer round cells, most at the bottom rows. Measured pinned-vs-round-1 level difference per channel: Kira 6/7, Bram 7/7, Osric 7/7, Yenna 7/8, Talin 8/9 (BEFORE: 0-1). Max drift from the old look: 8 levels.
- Summary: dark 5-7 levels at the seam (max 7), light 6-9 (max 9), against 0-1 before the change; this matches the reviewer's 5-6 / 7-8 on the shorter brief. It is visible as a faint lighter band in both themes at 2x; no hue carries it (lighter vs darker only).

## Gates (final base `09ece2eb`; private scratch `…/scratchpad/sc490-r2-impl/`)

- tsc `gate-tsc.log` 0; lint `gate-lint.log` 0.
- jest `gate-jest.log`: `Tests: 1 skipped, 6425 passed, 6426 total`; `Test Suites: 1 skipped, 254 passed, 254 of 255 total`.
- lifecycle: `gate-fl1.log` 21/21, `gate-fl2.log` 16/16, `gate-fl3.log` 8/8 (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63`), `gate-fl4.log` 4/4 (loadavg 26.5 at start, 2.8 at end), `gate-fl5.log` 1/1 -> **50/50**.
- e2e `gate-fe2e.log`: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- shots `gate-fshots.log` (private `DSE_CAMERA_TMP`): 592 PNGs, 0 FAIL, `button host-leak OK (161 button kinds × 3 states … = 966 comparisons`, extended `montage board scroll OK` line as quoted above.
- freeze `gate-ffreeze.log`: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.
- parity `gate-fparity.log`: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`
- The first r2 pass (jest 6393, lifecycle 21+16+7+4 on `ea78ebf8`) is superseded; lifecycle part 5 and e2e of that pass were never run because develop moved.
- Loadavg: part 1 not sampled (about 7), part 4 start 26.5, part 5 start 2.6, e2e start 1.2, shots start about 7, freeze 1.9, parity 2.4.

## Docs

`sc490-dse-verify-proposal.md` updated with the new CURRENT block (6425 / 254 of 255, lifecycle 50/50 with part 3 = 8, light-theme gate wording, both new can-fail proofs). SKILL.md untouched. The superproject CHANGELOG bullet is unchanged.

## Drive-by fixes:

None.

## Follow-ups:

1. The drift on a tall card is now numerically 7 (dark) / 9 (light) levels per channel at the seam; Scott judges it from the two crops. If he wants it gone, option C (the exact gradient via JS-measured geometry) is the only way; nothing less than that can follow a diagonal gradient with a solid.
2. Shots wall time (646 s here) leaves little margin under the 600 s tool limit when the machine is loaded; runs need the poll-the-rc-file pattern (already in the dse-verify note).
