**All seven montage items are fixed on a branch and pass every check — please look at the pictures below and approve. Two of them involved a judgment call you should confirm.** Nothing is merged or released yet.

## What you're approving

**1. The log/edit form is now just Result, Skill and Note.** The hero and round come from whatever you clicked, and the title names them ("Kira · Round 1"). The "success starts at" row and the Roll row are gone. The right edges of the Skill and Note boxes are no longer cut off, and the sideways scrollbar is gone.

*Judgment call:* this applies to the form in **both** of its uses — correcting a logged cell, and logging a new action — because it is one form. The "Log an action…" button at the bottom still opens it for the next hero who hasn't acted this round. To log for someone else, click that hero's cell (or the **+** beside their name). Once every hero has acted in the round, "Log an action…" is greyed out. Before, it quietly logged a second, invisible action for the first hero, and that action still counted toward the result.

Correcting a logged cell, before:
{{IMG:sc334-edit-sheet-before.png}}

Correcting a logged cell, after:
{{IMG:sc334-edit-sheet-after.png}}

Logging a new action, after:
{{IMG:sc334-log-sheet-after.png}}

**2. Rolling is gone from montages entirely.** It only ever lived in that form. The difficulty table is still one click away in the card's "Test tiers" strip.

**3. New "Back to round N" button**, in the bar just before "End round N".

- It only changes which round is in play. Nothing you logged is removed. So your flow is: Undo (or Remove) the round's results, then press Back.
- It also appears on a montage that finished by running out of rounds, so an accidental "End round" on the last round can be taken back. Before, the only option there was "Reopen", which adds an extra round.
- It never appears once a success or failure limit has been reached. That result stays final, as it is today.

*Judgment call:* Undo still only removes the last logged action. I did not make Undo also un-end rounds, because Undo would then have to guess which happened last. The separate button always says exactly what it will do.

{{IMG:sc334-bar-after.png}}

**4. Progress tracks.** Filled failure slots are now solid red, the same filled-chip look as the filled success slots (metal chips with a green outline: silver in the dark theme, dark grey in the light theme). The last slot of each track no longer has the bright white outline; it looks like every other empty slot. Printed montages are unchanged.

Dark theme, before:
{{IMG:sc334-tracks-dark-before.png}}

Dark theme, after:
{{IMG:sc334-tracks-dark-after.png}}

Light theme, after:
{{IMG:sc334-tracks-light-after.png}}

**5. "Set limits…" no longer clips the first box.** Its teal focus outline now shows on all four sides. The fix gives every plugin pop-up a little inner room for that outline without moving anything else.

Before:
{{IMG:sc334-set-limits-before.png}}

After:
{{IMG:sc334-set-limits-after.png}}

**Approve** = I mark it ready to merge into the plugin's develop branch. No release, no tag.
**Push back** on any numbered item and I'll change only that part.

---

**For the record (mechanics)**

- Right-edge clip, cause: a host-styling rule from SC-202 forced the form's text boxes to `box-sizing: content-box`, overriding their own `width: 100%` sizing. Padding plus border made them 14.8px wider than the form body. Measured in real Obsidian.
- Set-limits clip, cause: the pop-up body is a scroll box with no padding, which cuts off anything painted outside it. The focus outline sits 4px outside the box.
- New regression check: the real-Obsidian camera now fails any plugin pop-up whose body scrolls sideways (it caught this bug on the old code). Two new pop-up captures: this form in edit mode, and "Set limits…".
- Also fixed while in there: "hero actions left" no longer over-counts after Back, and a montage that ran out of rounds no longer says "4 rounds used" on a 3-round montage.
- Docs updated: GM Trackers → Montage Test tracker (with regenerated screenshots), the 7.0 migration guide, both changelogs.
- Filed SC-338 (Backlog): the option chips in this form and in the Conditions pop-up have no usable keyboard focus outline. That problem is older than this ticket.
- Branch `sc334-montage-cleanup`: draw-steel-elements `22aaae7` · `99b1532` · `e6c551c` · `4a3399f` · `49309c6` on develop `d124cc3`; workspace pointer bump `dfad252`. Both are fast-forwards of their upstream.
- Checks: type-check and lint clean; unit tests 3919 passed; screenshot suite 524 captures, 0 failures; print freeze 260/260 unchanged; parity 0 gaps / 16 declared (unchanged); 6/6 pop-up captures in real Obsidian, including the new sideways-scroll and focus-outline checks.
- Independent review: approved after one fix round. It found 2 medium issues (the invisible duplicate action above, and stale docs screenshots) and 3 low ones, all fixed and re-verified.
