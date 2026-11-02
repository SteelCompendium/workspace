# SC-511 decisions ledger — Keyboard "Unpin from sidebar" drops focus to the page

Ticket: https://linear.app/tski-home/issue/SC-511
Worktree: /home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus (every submodule on branch `sc511-sidebar-unpin-focus`), cut at dse develop `423e798d`, superproject `c20ab3f3`.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Precedent: docs/superpowers/dse-overhaul/build-ledgers/sc505-collapse-pin-focus-ledger.md (SC-505 added `src/framework/chrome/focusHandoff.ts`); SC-518 (edit-form focus return) reuses it.

## Spec (ticket description, verbatim, 2026-11-02)

> Found during SC-505.
>
> **Problem:** in the sidebar, Tab to a pinned block's "Unpin from sidebar" button and press Enter. The pinned panel and its button are removed, and keyboard focus lands on the page body.
>
> **Needs a decision:** where focus should go after the panel is gone, for example the next pinned panel's first control, or the sidebar's header.
>
> **Where:** sidebar mode `requestRemoval` in the shared chrome code. SC-505 added `src/framework/chrome/focusHandoff.ts` for keyboard Collapse, Expand and Pin. The same keyboard-only rule should apply here: a mouse press keeps today's behaviour.

## Scott rulings (verbatim, dated)

None yet. Thread had 0 comments at start (2026-11-02).

## Dispatcher constraints (2026-11-02, not Scott rulings)

- Base dse develop `423e798d` (SC-546 landed). jest baseline 6272 / 1 / 250 of 251.
- Build the default if it is a sensible keyboard-only default following SC-505's pattern; park on Scott only if the choice is genuinely his.
- Overlap: SC-540 (src/framework/pipeline.ts, LP callouts), SC-544 (LP callout twins), SC-472 (scroll pin timer) running; parked SC-520 touches mountChrome.ts; parked SC-471 is the sidebar hotkey fence (reserved G-S16). Stay inside the sidebar/chrome focus path.
- Lifecycle scenario id if needed: **G-S63**, in part 3 just before G-S56 ("G-S56 must stay last").
- Do not edit .claude/skills/dse-verify/SKILL.md in the branch; proposed text goes to `sc511-dse-verify-proposal.md` in this dir.
- Owner reports land-ready to the dispatcher and stops; the dispatcher lands.

## Owner rulings

- 2026-11-02: The focus target is NOT genuinely Scott's call: it follows the standard list-removal pattern (next item, else previous, else the container) and SC-505's rule. Build it; tell Scott the default on the ticket (no Needs Review ask); he can overrule.
- 2026-11-02: FOCUS RULE (SC-505's rule, applied to removal):
  - Applies only to a KEYBOARD activation (`isKeyboardClick(evt)`, i.e. the click has `MouseEvent.detail === 0`). A pointer click keeps today's behaviour (move nothing).
  - After a keyboard **Unpin from sidebar**, focus goes to the **panel that now sits in the removed panel's place** (the next panel below it); if the removed panel was the last one, to the **panel above it**; if no panel is left, to the sidebar's **"No pinned blocks" empty-state message** (made focusable with `tabindex="-1"` only, so it is not a Tab stop).
  - Inside the chosen panel, focus its **header note link** (`.dse-sidebar__panel-note`, the panel's first, always-visible control). If that link is missing, the panel's first focusable control; never a hover-hidden control that cannot show a ring.
  - Every move uses `HANDOFF_FOCUS` (`{ preventScroll: true, focusVisible: true }`). Never `<body>`, never a control outside the sidebar leaf the press came from.
  - Only move focus when it was inside the removed panel at the press (or has fallen to body/null) — never steal focus the user has already moved elsewhere.
  - FOLDED in: the degrade card's **"Remove panel"** button uses the same removal path (`onRemoveRequested`) and gets the same keyboard rule.
- 2026-11-02: Pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready. Focus-only behaviour; no Scott evidence round (no new visible style).

## Round log

- 2026-11-02: worktree created (rc 0). dse 423e798d, superproject c20ab3f3. Ticket Backlog -> Awaiting.
- 2026-11-02 r1: implementer A (orchestration:implementer, agent a9fe7b5e2cc2e0c82) dispatched on `sc511-brief-r1-impl.md`. A never reviews; review goes to reviewer B (orchestration:reviewer).
- 2026-11-02 r1: A cut off by a session-limit 429; the dispatcher resumed A itself (same agent) and will relay its completion. Owner work was not interrupted (start comment posted, state Awaiting).
- 2026-11-02 r1 NEEDS_CONTEXT (A, dse 13507efa on 423e798d): placement correct in real Obsidian (SBR-F01..F04 e2e), but the focused note link and empty-state message show NO ring (`outline-style: none`, `box-shadow: none` under `:focus-visible`). A asks whether a CSS ring is allowed.
  Owner ruling: YES, a ring is required — focus a keyboard user cannot see is not a fix. It must NOT be a new visual style: `.dse-sidebar__panel-note:focus-visible` and `.dse-sidebar__empty:focus-visible` JOIN the kit's one shared `:focus-visible` rule (styles-source.css, "the one rule", ~:5689) as extra arms, the same way the checkbox did (see the comment near styles-source.css:11801). No new tokens, no new colours, no ring rule of their own. Keep the ring assertions in SBR-F01..F03. Expected: no shot, freeze or parity change (nothing in the gate screenshots holds keyboard focus on these elements); if any gate number moves, stop with NEEDS_CONTEXT and the delta. Then finish the brief: CHANGELOG bullet, full battery. Scott sees one crop of the ring in the land-ready comment (FYI, not an ask).
- 2026-11-02 r1 DONE (A): dse c37d9b49 (13507efa hand-off + e2e SBR-F01..F04 + `chrome.unpin` id; c37d9b49 ring arms on the shared kit rule, `--dse-focus-ring` re-declared on both elements as the undo toast does) on 423e798d; superproject 1420432e (CHANGELOG) on c20ab3f3. Gates on c37d9b49: tsc/lint clean; jest 6287/1/251 of 252 (+15); lifecycle 46/46 (21+16+9, on DSE_LIFECYCLE_PORT=9291 after a CDP port 9262 collision with sc472's Obsidian); e2e 128/128 0 failed 0 known-bug 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24. No G-S63. Crops: scratchpad/sc511-r1-impl-a1/sc511-ring-crop-{dark,light}-keyboard-unpin-middle.png.
  Owner eyeballed the dark crop: the ring is drawn around the lower panel's "three-counters" note link (the panel that moved up), the upper panel's link has none. OK.
  Follow-up ruling: the CDP port 9262 collision (first run mass-FAILed without exit 2; a later probe did exit 2, so it is a check-then-use race like SC-546) -> filed **SC-551** (Backlog, related SC-511, SC-546). OUT OF SCOPE here.
- 2026-11-02 r1 review: reviewer B (orchestration:reviewer, agent a803a0a6ae6c2443b) dispatched on `sc511-brief-r1-review.md` against dse c37d9b49 / superproject 1420432e.
- 2026-11-02 r1 review DONE (B): LAND-READY, 0 CRIT/HIGH/MED, 1 LOW, 6 INFO. B re-measured every gate on c37d9b49, all match A (lifecycle on port 9293; 9262 held by sc472). 10 real-Obsidian probes pass; 6 mutations each turn the new suites red.
  Owner rulings:
  - LOW-1 (CHANGELOG says "the same focus ring as the other controls"; the new ring is Obsidian's accent purple, in-card controls use the steel teal ring) -> FOLD: reword the bullet only. Colour stays Obsidian accent: the sidebar header is Obsidian-styled (its note link text is already accent purple), and the undo toast sets the precedent outside element roots. Tell Scott in the land-ready comment (purple ring, teal would be a one-line change if he prefers it); not an ask that blocks landing.
  - INFO focusHandoff.ts:15 header no longer covers the sidebar hand-off -> FOLD (comment only).
  - INFO dse-verify CURRENT + e2e row need the new numbers -> FOLD: A writes `sc511-dse-verify-proposal.md` in this dir (jest 6287/1/251 of 252; e2e 128/128, 89/89 pairs; the rest unchanged).
  - INFO superproject 1420432e needs a rebase onto origin/main baab5315 -> FOLD.
  - INFO `focusEntry` fallback in SidebarPanel.ts:90-96 unreachable in the app -> DROP: it is the fallback the focus rule asks for ("If that link is missing, the panel's first focusable control"), covered by jest.
  - INFO accent-purple ring visible in the crop -> covered by LOW-1 ruling.
  - INFO vault delete with focus inside the removed panel drops to body -> DROP: not a user press; the rule's keyboard-only scope, base behaviour.
  - INFO RVW-P04 harness undeclared-write fail -> DROP: probe-only artifact, not on the branch.
- 2026-11-02 r2 fix round: A (resumed, agent a9fe7b5e2cc2e0c82) on the FOLDs above; scoped re-review by B (author-independent).
- 2026-11-02 r2 DONE (A): dse eafe76e1 (comment-only on c37d9b49; develop still 423e798d); superproject 93326c34 on origin/main baab5315 (CHANGELOG reworded: "accent colour"). Proposal file written. Delta gates: tsc/lint clean; sidebarUnpinFocus + kit-index jest 96/96. Scoped re-review -> B.
- 2026-11-02 r2 re-review DONE (B): LAND-READY, LOW-1 closed, 0 CRIT/HIGH/MED/LOW, 2 INFO. tsc rc 0, lint rc 0 on eafe76e1. INFO-r2-1 (proposal uses -- for em dash) -> FOLDED by owner in the ledger proposal file (ledger bookkeeping). INFO-r2-2 (optional port footgun line contradicts skill; provenance) -> owner dropped §3 (SC-551 owns it) and added reviewer re-measurement to the provenance. LAND-READY: dse eafe76e1 on develop 423e798d; superproject 93326c34 on main baab5315 (pointer NOT bumped).
- 2026-11-02: LAND-READY comment posted (`sc511-comment-landready.md`, 2 crops, model opus-5.5). Ticket stays Awaiting (no blocking Scott ask; purple-vs-teal ring offered as optional). Reported LAND-READY to the dispatcher. At landing: apply `sc511-dse-verify-proposal.md`; preserve this ledger to build-ledgers/.
