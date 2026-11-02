# SC-539 decisions ledger — e2e CHR-F02 flake

Effort: `sc539-e2e-chrf02-flake`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake`
(every submodule on branch `sc539-e2e-chrf02-flake`). dse base: `develop` @ `fb24f8a2`.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Dispatcher task (2026-11-02, quoted)

> Find whether it is a test-timing flake or a real product race before changing anything; a product race is
> fixed in src, a test flake in e2e/ without weakening what the test proves. Overlap: SC-520 (parked) touches
> chrome click handling; SC-537 and SC-522 (running) are in Live Preview twin-reuse / scroll-hold code. At
> land-ready put any proposed dse-verify text in a proposal file (don't edit SKILL.md in the branch).
> Related, not yours: SC-529 (e2e CHR-L01 times out under heavy load) — note in your ledger whether the same
> cause applies, and tell the dispatcher.

## Scott rulings

(none yet)

## Owner findings (2026-11-02, from the preserved evidence)

- The failing line is `chrome-focus.e2e.ts:69` = `await dse.click(root.control('chrome.collapse'))` right after
  `await dse.hover(root.root)`. That is the MOUSE Collapse in CHR-F02's setup — **before** any keyboard Expand.
  The ticket title ("Expand → Collapse focus") misreads it: the Expand half never ran.
- The failure screenshot (sc525-r4) shows the bar expanded, the hover-revealed chrome panel NOT showing (no
  buttons visible over the bar). So: the mouse hover did not leave the panel revealed (WebDriver "displayed"
  treats opacity 0 as not displayed).
- SC-529 / SC-534 (CHR-L01, Live Preview) fail with the same message shape — "chrome panel not displayed
  after 8000ms" waiting on a hover reveal under load. Working hypothesis: same family (hover-reveal of the
  chrome panel vs. a re-render or a lost :hover under load). To be confirmed by r1 diagnosis.

## Rounds

| Round | Role | Agent | Status | Report |
|---|---|---|---|---|
| r1 diagnose | reviewer (Opus) | a3360303193e5c4ae | done (2026-11-02) | sc539-r1-diag-report.md |
| r2 implement | implementer (Sonnet) | a135a697b91366073 | done 2026-11-02, head ec576f5b | sc539-r2-impl-report.md |
| r3 review | reviewer (Opus, fresh identity) | ab047c5be998a380b | done 2026-11-02: FIX-FIRST (doc-only), M1 + 6 INFO | sc539-r3-review-report.md |
| r4 fix + rebase ad018cd | implementer (Sonnet, r2 identity) | a135a697b91366073 | done 2026-11-02, head 88cb7db9 on ad018cda; all gates at baseline | sc539-r4-fix-report.md |
| r5 scoped re-review | reviewer (r3 identity) | ab047c5be998a380b | done 2026-11-02: LAND, 0 findings | sc539-r5-rereview-report.md |

## r1 verdict (2026-11-02, reviewer a3360303193e5c4ae — report sc539-r1-diag-report.md)

- **Test-environment flake, not a product race.** The chrome panel reveal is pure CSS (`:hover`/`:focus-within`,
  no JS, no transition). All e2e shards' Obsidian windows share ONE private Xvfb (1600x1200, no WM), all at
  +288+200 1440x1100; the real X pointer rests at screen centre (800,600) = inside every window. Another shard's
  window map/unmap over that point sends a real Leave/Enter; Chromium moves hover to the real pointer and drops
  the synthetic CDP pointer `dse.hover` placed → `:hover` lost → opacity 0 → `waitForDisplayed` 8 s timeout.
  Real users unaffected (their pointer IS the X pointer).
- Repro: 150 ms foreign-window churn → hover tests 8/8 fail (field-identical); no churn 15/15 pass; CPU x20 6/6 pass.
- **SC-529 / SC-534 (CHR-L01): same cause** (150 ms churn reproduces both CHR-L01 messages, 2/2).
- Fix location: `e2e/run.mjs` headless branch — park the real X pointer at (0,0) on the private display after
  Xvfb starts. Temp-tested: churn 150 ms + parked → 10/10 pass, 0 foreign leaves. Driver-only re-hover rejected
  (still 6/6 fail under churn).

## Owner rulings on r1 (2026-11-02)

- Fix = reviewer's plan: `xdotool mousemove 0 0` on the private display in `e2e/run.mjs` (headless only; never
  on a real display), `xdotool@latest` added to `draw-steel-elements/devbox.json` (precedent: `xvfb@latest` is
  already there), resolved like `resolveXvfb()`, EnvError exit 2 if missing. Zero spec changes.
  Considered and rejected: enlarging the Xvfb screen — Chromium centres the initial window, so the screen centre
  stays inside the window at any size; not worth the window-position plumbing.
- Follow-up "revisit CHR-L01 re-hover loop (`chrome-live-preview.e2e.ts:43-48`)": **out of scope this round**
  (SC-520 overlap on chrome click handling; SC-529/534 are separate tickets). Mention in the land-ready note so
  SC-529/534's owner can simplify after this lands.
- Follow-up "e2e README + dse-verify e2e row": **fold** the README edit into r2 (plugin doc, in-branch); dse-verify
  text goes in a proposal file `sc539-dse-verify-proposal.md` (dispatcher rule: don't edit SKILL.md in branch).
- Follow-up "lifecycle/obsidian-shots exposure": **drop** — one window per display there, no foreign windows.
- Follow-up "ugrep -I treats run.mjs as binary": **fold** as a one-line note in the dse-verify proposal file.

## Dispatcher course-correction (2026-11-02, quoted)

> One check on the r2 approach: adding xdotool to the plugin's devbox.json is a dev-environment dependency change.
> Please (1) make e2e/run.mjs degrade loudly but safely if xdotool is missing (other worktrees and Scott's main
> checkout won't have it until they rebase and devbox installs it), (2) check the plugin's CI workflow (.github/)
> doesn't run e2e in a way that now needs xdotool, and (3) if a no-new-dependency alternative exists (e.g. parking
> the pointer via Xlib/CDP from node, or the Xvfb's own options), prefer it and say why in the ledger. Note the
> dependency in the land-ready report and the CHANGELOG only if user-facing (it isn't).

## Owner ruling on the course-correction (2026-11-02) — supersedes the r1 "xdotool + EnvError exit 2" ruling

- ~~Fix = reviewer's plan: `xdotool mousemove 0 0` … `xdotool@latest` added to `draw-steel-elements/devbox.json` …
  EnvError exit 2 if missing.~~ superseded by:
- **Park the pointer from node with no new dependency: a tiny raw X11 client over the private display's unix socket
  (`/tmp/.X11-unix/X<n>`, Node `net`)** — connection setup (no auth: Xvfb is started without `-auth`, `-nolisten tcp`),
  read the root window id from the setup reply, send core `WarpPointer` (opcode 41) to root (0,0), then
  `QueryPointer` (opcode 38) to read back. X11 core protocol is frozen; ~60–100 lines in its own module
  (e.g. `e2e/x11-pointer.mjs`) with a jest/unit-free self-check at run time (the readback).
  Why not the alternatives: CDP cannot move the X pointer (it only synthesises in-renderer input — that is exactly
  what gets dropped); Xvfb has no option for the initial pointer position; an Xlib binding or python ctypes is itself
  a new dependency; widening the screen + `setWindowRect(0,0)` relies on every window (popouts, centred modals)
  staying clear of the centre — fragile.
- **Degrade loudly but safely:** if the park fails (socket missing, setup refused, readback ≠ 0,0) print a loud
  `OBSIDIAN-E2E WARN pointer NOT parked: <reason> — hover tests may flake (SC-539)` line and CONTINUE (pre-fix
  behaviour), never exit 2. The same warning must appear in the final summary block so a red run is diagnosable.
- **Fallback only if the raw-X11 route proves infeasible** (state the concrete blocker in the report): xdotool via
  devbox, with the same warn-and-continue behaviour when missing.
- CI: owner checked `.github/workflows/{ci,plugin-ci}.yml` — neither references e2e, Xvfb or devbox; reviewer to
  re-confirm. Dependency note: none if raw X11 lands; CHANGELOG: no entry (not user-facing).

## Dispatcher FYI — develop moved (2026-11-02, quoted)

> FYI develop moved: SC-522 landed, dse develop is now ad018cd (was fb24f8a2). Live Preview scroll-hold src +
> lifecycle G-S52; no e2e harness change. Lifecycle is now 45/45 and must run in THREE --only parts:
> `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S56` (8). Baselines at
> ad018cd: jest 6245 passed / 1 skipped / 249 of 250 · e2e 124/124, 87/87 · shots 592, 0 FAIL, 157/942 · freeze
> 280/280 · parity 0/0/24. Rebase target is now ad018cd.

Owner plan: let r3 finish its review of `ec576f5b` on `fb24f8a2` (the delta is e2e-only and SC-522 touched no e2e
harness, so the review stays valid). The r4 implementer round then (a) applies any r3 fixes, (b) rebases onto
`ad018cd`, (c) re-gates at the ad018cd baselines above — lifecycle in the three parts, e2e full ×2 —
and (d) proves `main.js`/`styles.css` byte-identical to `ad018cd`'s build (so shots/freeze/parity carry).
The proposal file's CURRENT line must then cite ad018cd numbers.

## Owner rulings on r3 findings (2026-11-02)

r3 verdict: code correct and fixes the flake (HEAD churn 8/8 pass, park-disabled 0/4; full e2e 124/124; `:1`
untouched under `DISPLAY=:1`; pointer 0,0 in 130/130 samples; 20 failure-mode cases warn within 2 s).

- **M1 (keeper mechanism mis-described) — FOLD into r4.** Truth (r3 measured): Xvfb resets and re-centres the pointer
  when its LAST CLIENT DISCONNECTS; the keeper works because its connection stays open, not because its window is
  mapped. Rewrite `e2e/x11-pointer.mjs:18-24` and the proposal §1 bullet to say so.
- **Optional `-noreset` on the Xvfb args (`run.mjs:352`) — FOLD** as a backstop (private, torn-down display; no cost).
  Keep the keeper connection too (it is the primary mechanism and the readback depends on it).
- **INFO 1 (auth-status reason length read from unused byte) and INFO 2 (short setup reply → cryptic offset error) —
  FOLD**: small, same file; read the reason length correctly per status, and add a "setup reply too short" check.
- **INFO 3 (no retry on connection refused at start) — DROP**: 15/15 succeeded in 4–6 ms and failure is the loud WARN.
- **INFO 4 (pre-existing startXvfb "socket exists = mine" race) — FILED SC-546** (Backlog, related to SC-539).
  Out of scope for r4.
- **INFO 5 (park handle discarded) — DROP**: socket does not keep the process alive; closes with Xvfb at teardown.
- **INFO 6 (Obsidian windows open at 1024x800 then resize to 1440x1100) — FOLD** one clause into the proposal §1.
- CHR-L01 re-hover loop: still out of scope (SC-529/534 owner, after this lands).

## LAND-READY (2026-11-02)

Plugin branch `sc539-e2e-chrf02-flake` @ `88cb7db9` (commits `c34f6904`, `88cb7db9`) on dse develop `ad018cda`. r5 verdict LAND.
Gates at 88cb7db9: tsc+lint clean; jest 6244/2 (fresh shape of 6245/1); lifecycle 45/45 (21+16+8); e2e 124/124, 87/87 x2; main.js/styles.css byte-identical to ad018cda (shots/freeze/parity carry).
No new dependency; CHANGELOG: none (not user-facing). dse-verify text: sc539-dse-verify-proposal.md (not applied). Filed: SC-546.
