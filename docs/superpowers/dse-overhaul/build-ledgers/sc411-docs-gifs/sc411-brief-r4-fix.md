# SC-411 round 4 — fix round brief (implementer, resumed)

Context: the ledger (`decisions.md`, round log → "Owner rulings on findings") and the
independent review `sc411-r3-review.md` (§ LOW, § INFO) in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/`. Branch:
plugin `sc411-docs-gifs` @ `8bb21fa` (base `origin/develop` `0ecb90e` — `git -C … fetch
origin`; rebase if it moved and report). **Workers never call Linear.**

## Fix these — the reviewer's findings, verbatim, with the owner's ruling

**LOW-1 → FOLD:** "`frame: 'leaf'` passes validation but nothing reads it; the output was
byte-identical with and without it. Other keys (`pref`, `bg` for Obsidian GIFs) are also
accepted and ignored (`docs-gif.mjs:94-97`, `:177`)." → Validation refuses every key that the
entry's camera does not read (remove `frame` entirely if nothing implements it).

**LOW-2 → FOLD (timeout half only):** "selector syntax isn't checked at load, and the browser
driver waits Playwright's 30 s default on a selector that matches nothing (`:457`, `:476`);
the Obsidian driver waits 5 s." → browser driver uses the same 5 s per-step wait as the CDP
driver. Load-time selector-syntax parsing is DROPPED (owner ruling).

**LOW-3 → FOLD:** "these mutations still pass jest: the 'covered by' check (`:612`), selectors
matching exactly one node (`:602`), waiting for the write only after the last typed chunk
(`:239`), and installing the dice seed (`docs-shots.mjs:193`). The `--disable-partial-raster`
launch flag isn't pinned by a test either." → add tests so each of those mutations fails jest,
and pin the launch flag. Prove it: re-apply each mutation, show jest red, revert.

**LOW-4 → FOLD (wording):** "the claim that a full run leaves `git status` clean is too strong
because of the pre-existing tutorial PNG noise (`visual-harness/README.md:439-441`)." → word
it accurately and cite SC-424 (filed: `tutorial-source-mode.png` is not byte-stable, pre-existing).
Do NOT fix SC-424 here.

**INFO-1 → FOLD:** guard message `docs-deferred-guard.cjs:63` worded per source (Obsidian:
the switch-OFF placeholder would be animated).

**INFO-2 → FOLD:** "`fs.rmSync(\`${framesDir}.run2\`, …)` at the top of `runGifEntry`" (stale
`.run2` frames after a later success).

**INFO-3 → FOLD:** "in `waitWrite`, after the first change, also wait for quiescence (no
further change for ~PERSIST_DEBOUNCE_MS)." Both drivers.

**INFO-4 → FOLD:** "`unionCrop` (`:279-289`) … A negative x0/y0 is clamped silently … add an
`x0 < 0 || y0 < 0` throw."

**INFO-5 → FOLD:** "`obsidian-camera.mjs:1715` overrides `Math.random` app-wide and never
restores it." → restore it in the entry's `finally`.

**INFO-7 → FOLD:** "In `counter.gif`'s final 2.0 s frame, the white arrow sits on the '17' in
the teal-ringed box … an offset for `type` / `press` frames would help." → on `type`/`press`
frames the synthetic cursor must not cover the field's text (e.g. park it just below/right of
the field). Both cameras. Regenerate every affected GIF.

**Out of scope (do not touch):** SC-423 (the acted-portrait frame product bug — product code
stays untouched; the initiative GIF keeps showing current behaviour), SC-424, SC-414, INFO-6.

## Gates (expected = r3's measured numbers)

tsc/lint clean · jest 4458 + your new tests, 1 skipped, 0 fail (`rm -f main.js styles.css`
first) · shots 568 / 0 FAIL · freeze 274/274 · parity 0 / 0 / 24 · `--check-stable` on all 7 ·
full `npm run docs-shots`: only the GIFs you intentionally regenerated change (and possibly the
known SC-424 `tutorial-source-mode.png` noise — restore it, never commit it); nothing new under
`visual-harness/shots/`. Every GIF < 1,000,000 B.

Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc411-docs-gifs -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/draw-steel-elements && <cmd>'`
— gate command LAST, foreground, long output to a per-run unique log. Commit per coherent fix
(`fix(SC-411): …` / `test(SC-411): …`), no AI trailers. All footguns from
`sc411-brief-r2a-impl.md` apply (git -C absolute paths; kill only own-worktree PIDs; never
`rm -rf` in `.superpowers/` outside this effort's dir; no backgrounded gates; NEEDS_CONTEXT
instead of messaging).

## Report

`…/sc411-docs-gifs/sc411-r4-report.md` — ≤10-line summary first; per finding: commit sha +
one line; mutation-proof table for LOW-3; gate table; updated per-GIF size table; contact
sheets for regenerated GIFs in `…/sc411-docs-gifs/r4-evidence/` (look at the counter and
initiative ones yourself — cursor placement on typed frames). Return raw facts + every artifact path.
