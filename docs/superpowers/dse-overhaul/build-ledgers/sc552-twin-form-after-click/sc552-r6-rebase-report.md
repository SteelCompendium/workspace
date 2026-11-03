# SC-552 r6 report (dse 31d8f779 on 09ece2eb; superproject b166e60b, unchanged)

## Executive summary
- Rebased onto 09ece2eb (= origin/develop). Conflicts only in obsidian-lifecycle.mjs (header + SCENARIOS list: G-S63 kept first, G-S64 after it) and architecture.md (both paragraphs kept); no source conflict. viewRegistry.onunload / replugRemount untouched.
- Semantic overlap proven: (i) G-S64 (l) now asserts the note is byte-identical across the disable of a kept-open form (form closes, nothing written); (ii) new G-S64 (u): Live Preview, kept-open form, plugin disabled then enabled: form closes, note unchanged, both LP cards drawn again (SC-545), a real click on the lower card gives [6,6]. G-S63 green in part 3.
- Folds: proposal LOW-1 (timings from 09ece2eb; holder claim now (a)-(i),(k),(t)); INFO-1 comment (400-line limit applies when lines changed on BOTH sides of the block) in lineMap.ts and pinnedTarget.
- Gates: tsc/lint clean · jest 6460 passed / 1 skipped / 256 of 257 (+45 tests, +2 suites over 6415/1/254 of 255) · lifecycle 51/51 in five parts (189/324/341/294/166 s; G-S57, G-S61, G-S63, G-S64 green) · e2e 128/128 89/89 · styles.css byte-identical to 09ece2eb (shots/freeze/parity not re-run).
- G-S64 on a 09ece2eb bundle (main.js sha256 fe88efc5...): red on (a)-(i),(k),(l),(n),(o),(p),(q),(u); (m),(r),(s),(t) pass. G-S64 now has 20 phases (a)-(i),(k)-(u).

Old -> new: 3bf46a87->9a0f8f33 · e2822e5a->b290ef5b · 3c9f86af->15e3ad21 · 1eba9814->ceb83fa7 (wide pin, own commit) · a12e4dc8->07704fe8 · 90feb96e->39a0e7e3 · 91308c50->37af16cf · 58e11047->295b6769 · c2d92f56->12b95c95 · 26d5f5eb->2ca3792f · f110be1b->ef595f19 · 3871e673->ebc5e7b0 · new 290eab61 (comment wording) · new 31d8f779 (G-S64 (l) assertion, (u), header 51).
Evidence: sc552-r6-gate-*.log, sc552-r6-lc-G-S64-head.log, sc552-dse-verify-proposal.md.
