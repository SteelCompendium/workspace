# SC-231 decisions ledger — keyword chips (one chip per keyword)

Worktree: /home/scott/code/steelCompendium/worktrees/sc231-keyword-chips (dse branch `sc231-keyword-chips`, cut at origin/develop 6c4f6aa)
Owner: fable ticket-owner, session a56f19e1-5165-4bc8-92ee-d6eeff34f029

## Spec (ticket description, 2026-08-28 — no Scott comments on the thread as of 2026-09-24)

> The site renders each keyword as its own `.sc-ability__chip` (`steel-ability-cards.css`); the plugin renders the whole Keywords value as ONE chip, since `renderFeature.ts` produces it as a single markdown-rendered, comma-joined text node rather than a list of discrete keyword strings.

> Would need the keywords value split into a list before render, theme-agnostically, without touching the Legacy text-run path.

## Session operating constraints (dispatcher, 2026-09-24 — not Scott rulings)

- Do not land; report LAND-READY or PARKED-NEEDS-REVIEW.
- No tags/releases on DSE; never touch DSE `main`; no deploy.
- No freeze-baseline change without Scott's written sanction; never edit the shared baseline. If frozen print bytes move, ship rebaseline.txt + before/after crops.
- Kill processes only by PID whose cmdline contains our worktree path.
- Concurrent/parked branches touching chips/cards: SC-338 (`.dse-optchip` focus ring), SC-236 (ds-feature example), SC-255 running. Keep our diff local.

## Scott rulings

(none yet)

## Owner rulings

- 2026-09-24: Visual change to steel-screen keyword band → needs Scott's eye before landing (one consolidated Needs Review ask with before/after + site comparison).
- 2026-09-25 (owner, after r1 @ 6578ea6): REJECT the duplicated-DOM design (442c439 + 6578ea6: original `.dse-feature__meta-value` kept visually-hidden-but-focusable beside a second `.dse-feature__meta-kwlist` copy). Reasons: a focusable 1x1 clipped link is an invisible Tab stop (no visible focus = WCAG 2.4.7 failure); keywords announced twice to screen readers; two copies of each link. Required shape: render the Keywords markdown ONCE, then post-process the rendered DOM — split its top-level inline content at commas into per-keyword wrapper spans with the ", " separators kept as their own text/span nodes, so every link exists exactly once and legacy/print render the same inline run (freeze 260/260 proves it). Steel screen CSS turns the wrappers into chips and hides only the separator spans (which contain no links). The host-leak probe must not be weakened.
- 2026-09-25 (owner, r1 review @ 05e26ea, verdict FIX-ROUND): rulings on findings —
  - HIGH-1 (grid/ledger/text kwUsage modes lose small-caps + light-mode surface): FOLD. Acceptance: statblock-kwusage-{text,grid,ledger}--steel-{dark,light}.png byte-identical to origin/develop.
  - MEDIUM-1 (jest vacuous vs real renderer <p> shape): FOLD.
  - LOW-1 (separator display:none drops commas from copy-paste / screen readers): FOLD — use the visually-hidden recipe for .dse-feature__kw-sep (it never contains a link or focusable), so SR reads "attack, weapon" and copy keeps commas.
  - LOW-2 (malformed "Trailing," entry now prints "Trailing, Magic" not "Trailing,, Magic"): DROP — normalization of malformed input is an improvement; no fixture covers it; note in report.
  - LOW-3 (stale "~4442" comment pointer): FOLD.
  - Chip metrics vs site (vertical padding / font / radius differ): DROP — inherited from the existing Type chip (SC-121 design), not introduced by SC-231.
  - Implementer follow-up: `feature.keywords` arriving as a raw string at runtime: FOLD if the touched code path throws on it — accept a string by splitting on top-level commas, one test. Keep it tiny.
  - Implementer follow-up: sub-pixel kerning note → owner routes it into the rebaseline record at landing (dse-verify dated record), no worker action.
- Freeze: 55-line movement (28 capture ids) confirmed unavoidable by reviewer variant sweep (any split of the Keywords text into >1 text node moves them). Needs Scott's sanction.
- 2026-09-25 10:10 (owner): post-outage state — impl r2 at f229986 (2f67c34 HIGH-1/LOW-1/LOW-3, f229986 raw-string fold + MEDIUM-1 test); r2fix gates on disk: jest 4005/1/206of207, lifecycle 6/6, shots 524/0 FAIL x2, freeze same 55 names, rebaseline.txt hashes match HEAD bytes (owner verified sha256sum -c rc=0), parity 0/0/16. Implementer died before r2 report section. Scoped re-review + evidence (c)(d)(e) sent to the r1 reviewer (resume). Stray worktree sc231-keyword-chips-baseline5 (detached 6c4f6aa) to be removed by the reviewer.
- 2026-09-25 (owner, r2 re-review @ f229986: LAND-READY pending freeze sanction). Minor notes ruled: copy-in-chips-mode gives one-per-line text — DROP (inherent to flex chip row; SR + print + other modes keep commas); approximate line pointers in styles-source.css:8416-8421 comment — DROP (cosmetic, labelled approximate); site-vs-plugin differences (Type chip placement, underlined link chips, ~4px taller chips) — DROP from SC-231 (pre-existing, not introduced here), surfaced to Scott in the Needs Review comment as optional ticket.
- Owner eyeballed: evidence-r2/rev-feature-card-steel-dark-light-before-after.png (two chips, both schemes, correct) and rev-freeze-feature-print-before-after-diff.png (print movement = sub-pixel shift of the one glyph after the comma; text reads identically).
- PARKED Needs Review: ask = (1) approve look, (2) sanction 55-line rebaseline (rebaseline.txt, 28 capture ids).
- 2026-09-25 ~10:25 (owner): Needs Review comment posted (look approval + 55-line rebaseline sanction); SC-231 set In Progress + Needs Review. Then found origin/develop moved 6c4f6aa → 619c4bd (SC-340, 20 commits; overlap CHANGELOG.md only). r3 rebase + full battery dispatched to the implementer. Expected: jest ~4046/1/208of209, lifecycle 19/19, shots 524/0, freeze same 55 (rebaseline.txt), parity 0/0/16.
- 2026-09-25 (owner): r3 rebase done — HEAD a6fce4a on origin/develop 619c4bd (11 commits, clean rebase, no conflicts). Owner-verified logs: jest 4046/1/208of209; lifecycle 19/19; shots 524/0; freeze 55 mismatches = rebaseline.txt (55/55 sha256 OK, unchanged); parity 0/0/16. Ticket comment cites f229986 (pre-rebase sha of the same content). PARKED on Scott: look approval + rebaseline sanction. At landing, the dispatcher's dse-verify dated record should note the mechanism: splitting a rendered text run into >1 text node shifts Chromium sub-pixel glyph AA at the split points (reviewer variant sweep, sc231-r1-review-report.md).

## Scott rulings
- 2026-09-25T18:31:44Z, comment fb3a9458-441e-4458-9c29-b3da34ceea99, verbatim: "this looks good."
  Context: reply to the owner's two-part ask (look approval + 55-line rebaseline sanction; ask said 'Replying "sanctioned, looks good" covers both'). Scott then set Ready for Agent. He did NOT literally write "sanctioned". Owner reading: approves the look; treated as sanction of the shown movement class (sub-pixel keyword-glyph AA in print), flagged explicitly to the dispatcher. If the recomputed rebaseline after rebasing onto develop (SC-236 changed 8 overlapping feature lines) contains movement beyond that class, re-ask.
- 2026-09-27 (owner): resumed on Ready for Agent; labels -> DSE Plugin, Bug (Ready for Agent removed), state Awaiting. r4 dispatched (fresh implementer, brief sc231-brief-r4-rebase.md): rebase onto develop b029baa (SC-255 applied 20 skills lines — no overlap with our 55 names; SC-236 changed 8 feature lines — overlap: feature, feature-collapsed, feature-spend, chrome-collapsed-rollout twin+realprint), full battery, recompute rebaseline.txt (old kept as rebaseline-r3.txt), STOP on any name outside the r3 55-name set. Owner model this session per dispatcher: post with `--model opus-5.5`.
- 2026-09-27 (owner): r4 verified by owner — HEAD 272c444 on develop b029baa (11 commits, tree clean); jest 4109/1/211of212; lifecycle 19/19; shots 524/0; freeze 55 mismatches = new rebaseline.txt (55/55 sha OK, deterministic x2); parity 0/0/16. Name set identical to r3; 8 hashes changed (SC-236 overlap: feature, feature-collapsed, feature-spend, chrome-collapsed-rollout twin+realprint), each diff a ~33x22px keyword-glyph bbox, 324/328 px — same movement class Scott was shown. Ruling: within the sanctioned class, no re-ask. LAND-READY reported to dispatcher with explicit note that Scott's words were "this looks good." (not literally "sanctioned").
