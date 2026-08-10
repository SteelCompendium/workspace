# SC-132 stamina-cluster redesign — candidate round (agent report, transcribed by orchestrator)

Agent's report-file write was harness-blocked; this transcribes its final return (2026-08-08).
Full narrative + 12 labeled boards: SC-132 Linear comment `bfdbf172`. Boards on disk:
`evidence/` (16 boards).

**Status:** 4 candidates built, screenshotted, gated, posted. Nothing shipped.
**Commit:** dse `f53bf44` on `sc132-stamina` (base `e0c93ae` — NOTE: pre-SC-128 landing;
rebase onto ≥77d55f3 at implementation round).

**Candidates** (each a complete cluster treatment — bar, temp, recoveries, states, Catch
Breath — both schemes, standalone + hero):
- **A "Forged Gauge"** — machined instrument set into the plate; dying changes the channel's
  *material* (danger frame + fracture) so state reads at zero fill.
- **B "Tiered Segments"** — countable forged cells; dying zone is real reserve cells left of
  a bulkhead, danger-outlined before spent.
- **C "Banner & Crest"** — number-first: big embossed serif numerals in the site's stat-tile
  grammar, crest carries state, gauge demoted to ◆-seeded underline.
- **D "Sheet Rail"** — whole cluster on one 28px row that survives a sidebar leaf (layout
  thesis, not a bar skin).

**Agent recommendation:** C's banner with A's channel as its gauge; D kept as the
compact/sidebar variant.

**SC-133 RC-1/RC-2 rider (approved fold): handled structurally** — all four candidates
re-anchor the gauge at the zero bulkhead and give temp the pour's origin/scale (positive
region scaled to `max + temp`), making the three bug ranges impossible by construction.
Dedicated fixtures: temp-at-full, temp>max, temp-while-dying on every board. The MODAL half
of RC-1 is untouched — next-round work with the winning candidate.

**Battery:** tsc clean · jest 2291/155 (zero existing tests broken; base was pre-SC-128
2289+2 fixtures?) · shots 199/0 FAIL (pre-SC-128 baseline) · freeze 119/119 · parity
0/0/16 exit 0.

**Repo-wide CSS lesson (measured, not eyeballed):** the candidate attr sits on `<html>`, so
the conventional `body.theme-light [data-dse-theme='steel'] …` twin shape matched NOTHING
(every light rule silently no-op'd while boards still looked plausible); and
`body.theme-light` adds a class level, so a light base twin can out-specify a more
semantically specific dark rule (filled recovery studs + B's temp plates lost treatment on
light). Carry into the implementation round: probe computed styles per scheme; watch
specificity when `body.theme-light` twins exist.
