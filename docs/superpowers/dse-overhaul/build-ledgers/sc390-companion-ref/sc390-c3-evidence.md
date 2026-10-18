**Ask: sanction the 2-line print rebaseline below (the dangling "EV" chip goes away on statblocks that have no EV). Reply "sanctioned" and everything lands. Nothing else needs a decision.**

**The Panther now renders.** A `ds-scc` block with the panther's code draws the full companion statblock: the Companion eyebrow, Level 1 chip, the stat row with Stamina `= yours` and Free Strike `1 + M` exactly as the book prints them, a new Skills cell (Sneak), the characteristics, Pounce as the signature ability with its Ferocity spend, and Mighty Spring as a trait. All 14 beastheart companions render the same way.

{{IMG:sc390-panther-head-light.png}}

*Above: the top of the panther card in the plugin's light theme. The Level 3/6/10 advancement features stay their own entity (SC-392 will show them under the card).*

**The EV change you are sanctioning.** Statblocks with no EV (companions, and the four summoner champions today) used to print a small empty "EV" chip under the role chip. It is gone now. Below, before on the left and after on the right, from the frozen print capture of the roleless corpus (Demon Lord's Aspect, a champion): the "EV" box under "Champion" disappears and the header tightens by a few pixels. Nothing else moves.

{{IMG:sc390-r1b-ev-before.png}}
{{IMG:sc390-r1b-ev-after.png}}

Two frozen print lines move (`statblock-roleless-corpus`, print and realprint). The hashes are in `.superpowers/sdd/sc390-companion-ref/rebaseline.txt`, identical across two clean runs and reproduced byte-for-byte by the independent reviewer. The new companion-corpus capture adds two lines (274 → 276, a widening, no sanction needed).

**One thing to notice, not a blocker:** the panther's right-hand role chip reads "COMPANION" and the small eyebrow at top-left also reads "Companion", because the organization fills the role slot the same way "Champion" does for summoner champions. Say the word if you want the chip suppressed when it duplicates the eyebrow; otherwise it ships as is.

**What changed under the hood (approved 2026-10-17):**
- steel-etl: the 14 companions are `type: statblock` in every format with structured stats and their Level 1 abilities embedded; the site renders byte-identically (verified at the built-HTML level across 6,819 files). The SCC API's `types.json` loses its `feature-group` bucket; those 14 entries now sit under `statblock`.
- data-sdk-npm 3.1.0 (prepared, not published): `free_strike` may be text, optional `skills`, Skills in the sc-md format. You already shipped 3.0.1 this morning, and 3.0.1 is enough for the plugin to run companions, so 3.1.0 no longer blocks anything.
- Plugin: Skills cell, no empty EV chip, companion rendering through the existing statblock card, and every doc page that promised `ds-scc` "renders any entry" now says plainly which types do not draw yet (skills, saints, gods, chapters, projects, movement, negotiation, skill groups, monster-group lore — SC-391).

**After it lands, in order:**
1. The site and data deploy on your usual `just deploy`; the Panther appears in Obsidian after a compendium re-sync and the next plugin release.
2. SDK 3.1.0 is one command from `data-sdk-npm` on `v3` when you want it: ``just release 3.1.0` (it checks npm auth, commits the version, publishes, then pushes; no tags)`. I will then bump the plugin's pin and re-run the battery as the last step of this ticket.

**Land-ready state (for the dispatcher):** steel-etl `b42b901` (on main 0c74f4f), data-sdk-npm `c63cda2` (on v3 544b3f0), v2 `2af78d0` (site.yaml only), draw-steel-elements `39cf35a` (on develop 0ecb90e; a final rebase onto be4f002, the SC-417 tip, is running now and will be reported as a one-line follow-up), superproject `65700aa` (docs). Gates: go test 847/0; SDK 426/426; registry 3,096 unchanged; `--scc-stable` clean; jest 4440 / 1 skipped; shots 572, 0 FAIL; freeze = exactly the 2 sanctioned lines; parity 0 gap / 0 undeclared / 24 declared.

Follow-ups filed from this work: SC-391, SC-392, SC-393, SC-394, SC-412, SC-413, SC-415.
