SC-127 is rescoped: it is no longer a harness capture change, it is a plugin bug — **Print preview in a dark-theme vault draws dark ink on a dark card.** The title and description now say that; the original 2026-08-08 filing is kept at the bottom of the description as "Originally filed as".

**Why.** The original fix was to re-shoot the harness's `*--steel-print.png` twin over the light scheme so the print shots become readable review evidence. Two things changed since: SC-170/SC-202 added the `*--steel-realprint.png` capture (real print media, light theme forced, the way Obsidian's PDF export works), which already gives clean black-on-white review evidence. And since SC-202 the twin is a real reading-view capture under Obsidian's own sheet with the dark theme on and the plugin's `data-dse-print="on"` attribute set — which is exactly what a user gets from Settings → Appearance → Print preview in a dark vault. The twin's black-labels-on-charcoal look is therefore very likely what that user sees. Switching the capture to light would hide that.

**Scott's ruling, 2026-09-23, given in the terminal session (recorded here because it did not happen on Linear).** The recommendation put to him was:

> "**My recommendation:** don't do the rebaseline as written. Switching the twin to `bg: 'light'` would hide what may be a real bug. Instead, rescope SC-127 to: confirm in Obsidian what dark theme plus `printPreview` looks like, then fix the plugin, most likely by making the preview draw its own light page. The freeze baseline would then move as a side effect of that fix. If the answer is "print preview in dark mode doesn't matter," close SC-127 as superseded by SC-170."

His reply:

> "I moved the ticket. Go ahead with your recommendation"

**One earlier thread touched this.** SC-202's final sanction ask (2026-09-14) asked, as item 7, whether the in-app print preview should force the light palette the way the export does. The reply ("Lets land this thing") did not answer item 7, and that ticket's owner read the silence as "keep as is". Today's explicit ruling supersedes that reading.

**What happens next.** Step 1 is verification in real Obsidian, on a private display: dark theme with Print preview ON, and light theme with Print preview ON as the control. If real Obsidian does not show the problem, this comes back to you before any code is touched. If it does, the fix is: the preview draws its own light paper regardless of theme, the harness twin stays captured over the dark scheme as the regression gate, and every `*--steel-print.png` freeze line moves once (sanction ask to follow, with before/after crops). Status stays Awaiting while that runs.
