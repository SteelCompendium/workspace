**Two asks: (1) does the Skills card look right without its "Skill List" header, and (2) will you sanction re-baselining the 20 Skills print screenshots this moves?** Reply "sanctioned" to approve both, or tell me what to change.

`ds-skills` no longer has its own "Skill List" collapse header. The element menu's collapse is now the only whole-card collapse, the same as every other card and the same change `ds-stamina` got in SC-169. This follows your SC-169 ruling: "Remove the old. Replace with the consistent option that all card elements use."

### What you'll see

On screen, the skill groups start right at the top of the card. The group headers (Crafting, Exploration and so on) and their own collapse arrows are unchanged. The left half is before and the right half is after.

{{IMG:sc255-skills-steel-dark-before-after-labeled.png}}

In print, the dark "Skill List" band above "Crafting" is gone, and everything below moves up 30 px.

{{IMG:sc255-skills-steel-print-before-after-labeled.png}}

### What behaves differently

- **A block that starts collapsed now opens in one click.** Before, with `collapse_default: true` (or the global "start collapsed" preference), expanding from the element menu still left the list hidden behind the closed "Skill List" header, so it took a second click.
- **`collapsed: false` together with `collapse_default: true` now shows the list.** Before, the card opened but the inner header stayed closed.
- **Unchanged:** `collapsible: false`, the "collapsible by default" preference, the per-session memory of collapse state, per-group collapse, and note contents. Skills never writes to the note.

### The freeze sanction

The 20 lines are the 10 Skills print captures, each as a print twin and a realprint: `skills`, `skills-narrow`, `skills-chips`, `skills-chips-narrow`, `skills-chips-hidden`, `skills-ledger`, `skills-ledger-narrow`, `skills-ledger-hidden`, `skills-hero-picks` and `chrome-skills-menu`. No other frozen screenshot moved (240 of 260 are byte-identical).

Every moved image shows the same change: the header band removed and the content shifted up. The new hashes matched across two independent runs by different agents. The replacement lines are ready in `.superpowers/sdd/sc255-skills-collapse/rebaseline.txt`. The dispatcher applies them at landing only after your sanction.

A side effect on SC-349: the Skills print captures still stop at 2400 px, so 30 px more of the skill list now fits inside them.

---

Mechanics:
- draw-steel-elements branch `sc255-skills-collapse` @ `4ff0b88`, based on `develop` `6c4f6aa`.
- Gates: tsc clean, lint clean, jest 3998 passed / 1 skipped (206 of 207 suites), obsidian-lifecycle 6/6, shots 524 with 0 FAIL, freeze 240/260 with exactly the 20 Skills lines moved, parity 0 GAPs / 0 undeclared / 16 DECLARED.
- Independent Opus review: approved with fixes. Every in-scope finding is fixed, and a scoped re-review of the fixes approved. One finding was deferred to SC-364: `resolveCollapsePrefs` is now dead code.
