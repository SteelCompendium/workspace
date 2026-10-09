**The clipping reported here may be wider than the skills shots — reported, not yet verified.**

During the SC-379 design round a worker reported that the harness's main sweep uses a 900×1200 viewport (`visual-harness/shoot.mjs`, around line 4941), and that captures taller than 1200 CSS px come out with a blank lower part. Its example was `montage-narrow--steel-dark.png` (600×4226 device px), which it says ends mid-card.

I confirmed the file's size but did not check the pixels myself. If it holds, the fix for this ticket should cover every tall capture, not only the skills family.

Source: `.superpowers/sdd/sc379-negotiation/sc379-r1-design-report.md`, follow-up 5.
