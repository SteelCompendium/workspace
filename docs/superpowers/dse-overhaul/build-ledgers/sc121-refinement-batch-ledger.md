# SC-121 batch execution ledger
Batch 1 (control density) IMPL: dse 095476e (SC-106 test-drift fix — main is RED since sc106
landing: my battery piped jest through tail, exit code masked; dse-verify skill warns exactly
this), b0d4901 (compact density: .dse-btn--icon structural modifier + --dse-control-min
1.75em fine / touch-min coarse via :where()), c9f918e (checkboxes + ladder), 9f4d289 (badge
hidden guard, Steel-scoped — LEGACY STILL SHOWS EMPTY PILL, freeze-widening candidate ->
FOLLOWUPS at wrap), 54a2840 (changelog). jest 2167/152 (+26) · freeze 101/101 · parity 0/10 ·
obsidian before/after 68 PNGs. Batch-1 comment inline on SC-121. Review dispatched (Opus).
LANDING PLAN: land after clean review (fixes red main); Scott reviews rounds async on ticket.
Batch 2 (ability-card anatomy) IMPL: dse f667c94 (B-1 meta recomposed to the site's chip
row + even 1fr/1fr rail; DOM change — two band wrappers, `display: contents` in the Legacy
base, so freeze stayed 101/101 byte-identical), d9f67ff (SEED2 badge padding: max-height cap
released, 0.8em->0.9em, 38.4x11.5 -> 51.3x22.1px; row height unchanged; catalog's ~100px/21px
figures were 2x-shot px, the ROW was already at site parity), 7036f9d (B-3 ::first-letter ->
mono slot; root cause = SS4 subset lacks U+2264 + the reader's own decorative text font
(Bookinsanity) draws it as superscript-2. FIRST CUT FAILED IN-APP: --dse-font-mono is
declared at :root off a --font-monospace Obsidian declares on body -> guaranteed-invalid
everywhere -> workspace FOLLOWUPS #45; fixed via var(<token>, <literal stack>)), 948899c
(B-5 section body regutter 13/18px), 19aa2c4 (changelog). Workspace 801b705 (FOLLOWUPS #45).
tsc clean · jest 2172/152 (+5, all can-fail proven) · shots 169 · freeze 101/101 · parity
0/10 exit 0 (unmoved) · obsidian-shots 132 exit 0 (B-3 verified in real Obsidian).
Batch-2 comment posted on SC-121. Evidence in batch2-evidence/ (raw-before/raw-after + 8 pairs).
NOT DONE: per-keyword chips (site splits keywords into N chips; deliberately deferred —
legacy text-run reflow risk against the frozen PNGs, flagged to Scott in the comment).

Batch 2 (card anatomy) IMPL: dse f667c94 (B-1 meta re-band: two bands, display:contents in
Legacy base -> legacy+print byte-identical, contract test), d9f67ff (SEED2 tier rows/badges
to site proportions), 7036f9d (B-3: SS4 subset lacks U+2264 -> ::first-letter onto mono slot
w/ literal fallback stack), 948899c (B-5 shared 18px gutter), 19aa2c4 (changelog); workspace
801b705 (FOLLOWUPS #45: --dse-font-mono IACVT-dead at :root — kills SC-100 kit mono tile too).
REVIEW (Opus): all 4 ✅, APPROVED w/ 2M/6L/1 obs. M-1 disclosure (²11 survives Legacy+PDF),
M-2 rem-as-em chip undersize (14.08px vs site 17.6px). Fix round dispatched (Sonnet).
BATCH 3 SCOPE ADDITIONS (beyond catalog C-2/C-3/C-6/C-5/B-4):
  (a) FOLLOWUPS #45 fix: declare --dse-font-mono chain in scoped theme blocks (same disease
      + same fix shape as SC-112 plan-23); un-workaround B-3's literal fallback after.
  (b) color-mix() floor violation: 8 declarations (incl. tier-row wash) — Chrome 111+, floor
      is 106; same failure shape as SC-122 (silently dropped declaration on old Electron).
      Fix = static fallback value declared BEFORE each color-mix line (progressive
      enhancement), or precomputed constants. Also post note on SC-122 (Done) for the record.

Batch 3 (cross-family + content + floor) IMPL: dse 5df83f4 (FOLLOWUPS #45 — --dse-font-mono
re-homed from :root to the element roots `:is([data-dse-element], .dse-modal)`; deliberately
NOT per-theme, since mono is STEEL_INVARIANT in the token map and .dse-rollcard__breakdown is
theme-agnostic; probe: token '' -> full stack, kit tile serif -> mono, rollcard -> mono both
themes, t1 ::first-letter now on the real slot; B-3's literal fallback KEPT as belt-and-braces),
e4807cd (color-mix: 7 REAL declarations, not 8 — the 8th is inside a comment quoting the site;
static same-property fallback before each; tier wash precomputed EXACTLY per tier per scheme via
a local --tw, role bands can't be (--dse-role is inline-at-runtime) so they keep structure +
a full-strength role hairline and lose only the hue gradient; guard
test/unit/build/cssSupportFloor.test.ts, limits documented in its header), 154d95e (C-5
markdown:true), 16cefb1 (C-2 kit equip: root cause was the markdown <p>'s 1em margins INSIDE
the panel, not the padding; 72.6 -> 44.9px), d2a6131 (C-6 markdown-table baseline ported from
the site's tables.css, `table:not([class])` so .dse-enc__table is untouched; `tbody` in the
last-row selector is load-bearing), 3f0b445 (changelog). Workspace df6412b (#45 done, #47 filed,
pointer bump). tsc clean · jest 2177/153 (+5/+1) · shots 169 · parity 0/10 exit 0 unmoved ·
obsidian-shots 132 exit 0. FREEZE 96/101 — C-5 alone moves treasure--legacy-{dark,light},
treasure--steel-print, gallery--legacy-{dark,light}; verified 101/101 with 154d95e backed out.
NEEDS SCOTT: 5-line sanctioned rebaseline for C-5, or `git revert 154d95e`.
C-3 NOT REPRODUCIBLE: crest measures 48x54.39px vs the site's .sc-crest.lg 50x56 (96%); glyph
24px = exact. The catalog's "~84px" is the clip-path's own 88% of 48px at 2x. Real gap is the
card NAME at 20px vs the site's 24px (83%) — cross-family Steel type-scale, filed FOLLOWUPS #47,
routed to SC-120's card-head work.
B-4 BLOCKED-for-routing -> SC-101/102/103. NOT a separate render path: villain actions go
through the same renderFeatureList/renderFeature and emit identical wrapper DOM. Root cause is
one value — actionTypeOf() (renderFeature.ts:79) returns undefined because villain actions carry
`usage: "-"`, a truthy string that shadows the ability_type fallback; that value gates BOTH the
[data-dse-act] spine and crestIconFor(act). A ~4-line normalization (the file already has a
function-local isEmptyValue for lone dashes) would light both up as 'main'. Deliberately not
done: (1) the site models villain as its OWN action type — data-action="villain" -> --act:#e0584b
plus a dedicated .sb__band--villain with its own head/glyph/wash (steel-statblock.css:244,401-440)
— so 'main' is semantically wrong against our own reference, and doing it right needs a new
ActionType member + --dse-act-villain across 5 token blocks + a crestIconFor case + a band-vs-
inline design call; (2) it moves statblock--steel-print.png (the spine is not print-excluded and
the lane padding-left shifts text), needing its own rebaseline.
Batch-3 comment posted on SC-121; floor-class note posted on SC-122. Evidence in
batch3-evidence/ (raw-before/raw-after 301 PNGs each + 15 pairs).
