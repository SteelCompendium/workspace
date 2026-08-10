# SC-132 — candidate A/C threshold-marker re-cut (round 2, 2026-08-08)

Response to Scott's review of the candidate round: the gauge diamonds in A and C
"appear to be offset or out of place."

**Commit:** dse `878c272` on `sc132-stamina` (parent `f53bf44`). One file changed
(`styles-source.css`, +95/−25). NOT pushed; superproject pointer bump left unstaged.

**Linear:** new self-contained ask posted as comment `59ba7a3c` on SC-132 — all 12 boards
re-uploaded (A/C corrected, B/D unchanged but re-inlined), "What you're approving" restates
the C-banner + A-channel hybrid with D as the compact variant. Status (In Progress) and
labels (`Needs Review`) untouched.

## Diagnosis

The x math was correct; the defect was vertical. Both candidates pinned a 0.3rem brand ◆ to
`top: 0` of `.dse-stamina__gauge` — the site's **rule-notch** grammar (a ◆ straddling a 1px
`<hr>`) transplanted onto a **track**. Measured against the track each mark indexes:

| | before | after |
|---|---|---|
| A — mark centre vs channel centre (18.39px interior) | **−13.23px** (outside the bar) | **≤0.29px** |
| C — mark centre vs rule centre (4.80px interior) | **+4.02 … +4.77px** (entirely below) | **≤0.71px** |

## Treatment chosen, per candidate

- **A "Forged Gauge" — the thresholds are MILLED.** Each mark is a notch pair cut into the
  two rails: the top and bottom halves of the brand ◆ with the channel cut straight through
  it (each half is exactly half the notch's width tall, so it reads as one diamond the slot
  passes through). The zero bulkhead — the one place a real edge exists in the material —
  additionally keeps a full-depth two-tone seam (shadow face on the reserve side,
  catch-light face on the pour side). Winded and base-max get notches only, so no line is
  drawn across a pour that isn't actually divided there; the winded pair is tied by the
  channel's existing faint `__gwinded` hairline. Serves the "machined instrument set into the
  plate" thesis: the motif becomes a feature *of* the plate rather than an ornament over it,
  and it still reads at zero fill and in the dying/temp rows.
- **C "Banner & Crest" — the rule grammar done properly.** The zero bulkhead is the ◆ **seed**,
  threaded *on* the line: centred on the rule's vertical midline (`top: calc(pad + 1px +
  ch-h/2)` + `translateY(-50%)`) and 0.3rem across, so it overhangs a 4.8px rule symmetrically
  by ~1px — deliberate, not a speck. The winded and base-max marks lose the diamond entirely
  and become 1px **colour seams cut across the rule** (amber / steel), which is all a 5px rule
  can carry.

Both share a new base: marks are sized to the channel's **interior** (`top: calc(var(--g-pad)
+ 1px); height: var(--ch-h)`), hue travels as `color` so A's pseudo-element notches inherit it,
and a `filter: drop-shadow(0 0 1px rgba(0,0,0,.55))` (not `box-shadow` — only a filter reaches
the pseudos) keeps them legible over any fill.

**Enabling change:** `--ch-h` and the gauge's top padding (`--g-pad`) moved from
`.dse-stamina__gchannel` to `.dse-stamina__gauge`. The marks sit outside the channel (it clips
its own fills, and C's seed must overhang) so they could not previously measure the box they
index — which is exactly how they ended up perched on its top edge.

**Not touched:** candidates B and D (D hides its marks; B has no gauge), and no other A/C
geometry — fills, scales, the bulkhead re-anchor and the SC-133 temp origin/scale are the
approved structure from round 1.

## Bug the measurement caught (eyeballing would not have)

`--g-pad: 0` — a **unitless** zero — makes `calc(var(--g-pad) + 1px)` invalid at
computed-value time, so C's marks silently fell back to `top: auto` and landed at their
**static** position under the rule (measured: 5.8px low). Fixed to `0px`, with the reason in
an inline comment on both C and D. This is the same family as round 1's `<html>`-attr lesson:
probe computed geometry per scheme, never trust a rule that "looks applied."

## Verification

- **Computed-style + geometry probe** (headless Playwright, both schemes, both candidates,
  all 8 board rows incl. temp-at-full / temp>max / temp-while-dying / read-only): every mark
  `|centre_y − track_centre_y| ≤ 0.01px`, every seam's height == the channel interior exactly,
  every mark `|x − threshold_x| ≤ 0.01px`. Light-scheme rules confirmed *matching* (no
  `body.theme-light` twin was needed — the marks key off `--dse-metal*` / `--dse-stamina-winded`
  tokens, which the scheme already redefines: metal-bright resolves `#d9dee1` dark / `#2c3338`
  light).
- **Pixel measurement in the re-shot PNGs** (marker ink centroid vs track centre, 64 rows):
  worst |Δ| **0.71 CSS px**; the same script against the old boards reports worst **13.30 px**.
- **Boards re-shot** (`node visual-harness/candidates.mjs --cand=a|c`, 0 errors) and copied
  over `evidence/{a,c}--{stamina-bar,hero}--{dark,light}.png`. B/D board files untouched.

## Battery (verbatim, real exit codes, nothing piped)

```
npm run tsc      exit 0  (no output)
npx jest         exit 0  Test Suites: 155 passed, 155 total
                         Tests:       2291 passed, 2291 total
                         Snapshots:   3 passed, 3 total
npm run shots    exit 0  199 ok, 0 FAIL
check-freeze.sh  exit 0  freeze OK (119/119 legacy+print PNGs byte-identical)
npm run parity   exit 0  **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
```

No delta from round 1 on any gate — the change is CSS-only inside the harness-gated
`[data-dse-stamina-cand]` region, so production/jest/the frozen sweep still emit the
pre-SC-132 DOM byte for byte.

`obsidian-shots` was NOT run: `pgrep -af obsidian` shows Scott's live vault owning the display.
