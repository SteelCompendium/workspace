# SC-230 round 3 — fix round (implementer, resuming r1)

Read the ledger's "Owner rulings on r2 findings" first:
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/decisions.md
You never call the tracker. Verify `pwd` / branch before any write (worktree
/home/scott/code/steelCompendium/worktrees/sc230-modal-text-size/draw-steel-elements, branch sc230-modal-text-size).

## 0. Rebase first
origin/develop is now **c524fd2** (SC-328: JSZip->fflate, 6.0.2 hotfix merged forward, 3 new skills). Fetch and rebase
onto the current origin/develop tip (c524fd2 or later; report which). If package.json / package-lock.json changed,
run `npm ci` (via devbox). The shared freeze baseline was updated for c524fd2 (16 Skills print lines replaced, still 260
lines): after rebasing, expect `freeze OK (260/260 …)`.

## 1. Review findings to fix (verbatim from the r2 review, sc230-r2-review-report.md — read the full sections there)

> **MEDIUM-1** `styles-source.css:7692`: the `.dse-modal` arm scales, then the body/footer arms scale again. The result
> is only correct because Obsidian's `.modal-content` font-size reset sits in between. Without that reset the scale
> applies twice: 16 → 31.36px (1.96x), measured in the harness with Obsidian's app.css off. A theme or snippet that sets
> `.modal-content` to inherit, or a future Obsidian that drops the rule, would hit this. No test covers it.
> Fix: `[data-dse-element]:not([data-dse-print="on"]), .dse-modal:not([data-dse-print="on"]) :is(.dse-modal__body, .dse-modal__footer) { font-size: calc(1em * var(--dse-text-scale)) }`.
> Keep `.dse-modal` in the nested reset only, and add a runtime pin that measures x1.4 with app.css both on and off.

> **MEDIUM-2** `styles-source.css:7692`, pinned by `test/dom/theme/scaleRules.test.ts:82-84` and
> `test/unit/build/fontSizeContract.test.ts:199`: the print guard on the body/footer arms is attached to nodes that are
> never stamped. Proven: `.dse-modal[data-dse-print=on]` → modal 15px, but body and footer 21px. This is the FOLLOWUPS
> #43 shape the owner ruling forbids. The MEDIUM-1 selector fixes this too; update the pins. Add a DOM-level assertion:
> a stamped `.dse-modal` does not scale its body.

> **LOW-1** `styles-source.css:7688-7691`: the modal title stays unscaled. Installed Obsidian 1.14.2 sets `.modal-title`
> to 15px; the 1.13.7 pin used 20px. So at 140% an uppercase 15px title sits over 21px bold body text.

> **LOW-2**: the r1 report overclaims … no crop contains [the Done button], and the gear icons are clipped. The harness
> mock also has no real dialog box. Use real-Obsidian captures for the Scott ask.

> **LOW-3**: no `CHANGELOG.md` `[FIX]` entry. Optionally update the help text at `src/prefs/catalog.ts:292` and the
> wording in `docs/settings.md:41-42` to cover dialogs.

Owner rulings (quoted from ledger):
> - MEDIUM-1 + MEDIUM-2: FOLD into r3 fix round, using the reviewer's prescribed selector shape.
> - LOW-1 …: owner default = SCALE THE TITLE too (consistent with "exactly as notes do"; note headings scale). 100% must
>   stay identical to base. Scott confirms from a side-by-side (title scaled vs unscaled) in the Needs Review ask.
> - LOW-2 …: FOLD — r3 produces real-Obsidian captures for the Scott ask.
> - LOW-3 …: FOLD.

Notes on LOW-1: Obsidian sets `.modal-title` to an absolute size (`var(--font-ui-large)`), so `calc(1em * scale)` on the
title would take 1em from its parent and lose Obsidian's size. Scale the title relative to its OWN 100% rendered size
(e.g. multiply the same var Obsidian uses), anchored the same way (`.dse-modal:not([data-dse-print="on"]) …`), and pin it.
At 100% the title must compute identically to base in real Obsidian.
CHANGELOG: follow the DSE repo's own CHANGELOG.md convention for unreleased entries (read the file's head first).

## 2. Evidence for Scott — REAL Obsidian captures (not the harness)
The reviewer's real-Obsidian probe is a good starting point: `sc230-r2-obsidian-probe.mjs` in the ledger dir (it failed
to close modals between steps — fix that: one modal open per capture). Capture the **conditions modal** (the one from
r1) in real Obsidian 1.14.2, each PNG cropped to the WHOLE dialog box (title through Done button, nothing clipped),
at the same pixel scale so sizes compare directly:
  - `sc230-r3-evidence-base-140.png` — base (origin/develop tip) at 140% text size
  - `sc230-r3-evidence-head-140.png` — your head at 140% (title scaled)
  - `sc230-r3-evidence-head-140-title-unscaled.png` — your head at 140% with ONLY the title arm disabled (probe-time CSS
    override, NOT committed)
  - `sc230-r3-evidence-head-100.png` — your head at 100%, plus a byte/pixel comparison against base at 100% (report
    whether identical)
  - `sc230-r3-evidence-note-140.png` — the same conditions block rendered in a note at 140%, for reference
Also report measured px for body text and title at 100% and 140%, base vs head, and body text with app.css's
`.modal-content` reset neutralized (the MEDIUM-1 scenario) — must be x1.4, not x1.96.
Needs a display (`DISPLAY=:1` default, see dse-verify obsidian-shots notes). If real Obsidian is unavailable, STOP and
report NEEDS_CONTEXT rather than falling back to the harness.

## 3. Gates — full dse-verify battery, in order, foreground, output to `sc230-r3-<gate>.log`
`rm -f main.js styles.css` before jest and shots. Expected on the rebased base: tsc/lint clean; jest = base count at the
new tip + your net new tests, 0 failed (measure/derive and report both); shots 524 PNGs (or the new base's count — report
it) 0 FAIL; freeze `260/260` exit 0; parity 0 GAPs / 0 undeclared / 16 DECLARED exit 0.

## 4. Report
`sc230-r3-fix-report.md` in the ledger dir, opening with a ≤10-line executive summary (per-finding status, head sha,
base sha, gate numbers, px measurements). Commit after each coherent step (`fix(typography): SC-230 …`); no co-author
trailers, no push, no tags, never touch DSE main. Delete nothing in `.superpowers/` outside `sc230-*` files.

## 5. Return contract
Final text to the ticket-owner: STATUS, base + head sha, per-finding status, gate numbers, px table, absolute path of
every artifact. No prose.

Footguns: if the report write is blocked, return it inline. Never key a wait-loop on a scratch filename or contents.
Redirect long output to files; never background a gate and wait for a notification. You cannot SendMessage me; to ask,
end with STATUS: NEEDS_CONTEXT. If you ever message anyway, first word `SC-230:`.
