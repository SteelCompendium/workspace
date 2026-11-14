# Steel Compendium Releases

This workspace has no version tags — a "release" here is a deploy of the live site
(steelcompendium.io/v2) and/or the SCC API, so entries are headed by **deploy date**
instead of a tag. New work lands under `## Unreleased` and is promoted to a dated
header when it goes live. One bullet per user-facing change; internal/process changes
go under an *Internal* sub-heading.

## Unreleased

- **DSE plugin: writing to a Montage no longer deletes the keys it does not use (SC-625).**
  Any click that saves a `ds-montage` block (a quick Success / Failure / Assist, Log an action, End round, Add a hero, Set limits)
  used to remove every line the montage does not know: your own notes at the top of the block (`table_notes: keep me`) and
  any extra field on a logged action (`dc: 12` next to its `skill`). They are now kept, with the same values (the block's layout
  may still change on a write: your extra keys follow the montage's own keys, at the top of the block and on each logged action,
  and a comment in the block is still removed, and a flow list `[a, b]` is rewritten one item per line). A hero's extra keys were already kept.

- **DSE plugin: in a Montage, the keyboard stays where you were after you press a button (SC-626).**
  Tab to a montage button (End round, a quick Success, the round strip's header, Log an action) and press Enter: the card
  was redrawn and keyboard focus went back to the top of the note, so you had to tab all the way back. Focus now stays on
  the same button in the redrawn card, in Reading view and Live Preview, and also after you save Log an action, Add a hero
  or Set limits (focus returns to the button that opened the window). When the button is gone after the press, focus goes
  to the closest one: End round on the last round lands on "Back to round N", and removing an entry from the round in play
  lands on that cell's Success button. A click while you are typing somewhere else never pulls focus into the montage.

- **DSE plugin: the minion pool window names the squad you opened when a group holds several (SC-569).**
  A group with two squads used to give both windows the same title ("Wolves - Minion Stamina Pool"). They now read "Wolves - Wolf - Minion Stamina Pool" and "Wolves - Dire Wolf - Minion Stamina Pool",
  and two squads of the same creature are numbered in the order the tracker lists them: "River - Flow of the River (squad 1) - Minion Stamina Pool", then "(squad 2)". A group with one squad keeps "Goblin Squad - Minion Stamina Pool".

- **DSE plugin: a + / - or a form Save in a hover preview or an embed of part of a note no longer writes the other of two identical counters when an outside change removed the one it shows (SC-621).**
  A hover preview or an embed shows part of a note (`[[Note#Heading]]`, `[[Note#^id]]`) that has two identical counters, separated only by blank lines or by two sections of the same
  look. An outside change (Sync, another app) removes the counter the preview shows and, in the same change, edits a line just above or below the pair. A + / - or a form Save in that
  preview could then be written into the other counter, with no message. It is now refused, nothing is written, and the "changed on disk first" Notice shows. The same holds when, in the
  same outside change, an identical counter next to yours was added or removed (the note then reads the same either way). Because such a preview or embed is often not redrawn by Obsidian,
  it keeps refusing on every click until you reopen it (move the pointer away and hover again, or reopen the note); the reopened preview saves as usual. Three cases are still written, as
  before: an identical counter moved to another place among the identical ones, and the shown section deleted while a neighbouring section is renamed to its name (the note's text cannot tell
  these apart); and, in a note with identical counters, an outside change of more than about 400 lines in the same write (too large for the plugin to compare). A note without identical counters, and a note open in its own
  pane (SC-612), are not affected.

- **DSE plugin: in the Conditions window, "or just start typing" now also works after you click the window's title or an empty part of it (SC-613).**
  Click a row's Add Condition, click the window's title (or a blank spot), then type `daz`: nothing happened, because that click moved the keyboard out of the window to the page behind it. The Add
  search now opens with what you typed, and Escape closes just the search and puts focus on "+ Add condition". Keys stay yours when another window is open on top of this one, or a menu is showing.

- **DSE plugin: a + / - or a form Save in a hover preview of a heading, in a note saved with Windows line endings, is saved again (SC-619).**
  Hover a link to a heading (`[[Note#Heading]]`) of a note whose lines end in CRLF, a Windows-style file, and press + / - on the counter in the preview, or Save its Edit form: nothing was written and the
  "changed on disk first" Notice showed although nothing had changed. The change is now saved into the counter you hovered, and the note keeps its Windows line endings. The same
  note saved with plain line endings, a block link (`[[Note#^id]]`), an embed and a whole-note preview were not affected. When a note really did change underneath the preview (two heading
  names swapped, the hovered section deleted), the write is still refused with the Notice, as before.

- **DSE plugin: a form Save or a + / - on one of two identical counters no longer writes the other one when an outside change deleted it (SC-612).**
  A note with two identical counters separated only by blank lines, one of them deleted from outside (Sync, another app) while its Edit form
  was open or just after you pressed + / -: the Save or the click used to land in the counter that was left, which is a different block that
  only looks the same, with no message. It is now refused, nothing is written, and the "changed on disk first" Notice shows (the form stays
  open). It is also refused when, in the same outside change, an identical counter was added or removed beside yours, because then the note
  cannot tell which counter was yours. An edit elsewhere in the note, or a sibling's + / -, does not cause a refusal. Opening the form
  again, or the next click, saves as usual. A note without identical counters is not affected. In a note open in its own pane; embeds and
  hover previews (SC-607) were already covered.

- **DSE plugin: the Conditions window now matches two things you can write by hand in a note (SC-586).**
  A condition written with a color name or short form, such as `color: teal`, showed the custom color as selected, but the eyedropper's color chooser
  opened at white. It now opens at that color (`#008080` for teal), whether you wrote a name, `#abc`, `rgb()`, `hsl()` or a newer spelling such as `oklch()`; a color the browser cannot
  read still opens at white. And a condition with a blank icon (`icon: ""`) drew the default icon while "Use default" was not shown as selected; it is now, and an
  icon written with stray spaces (`icon: "skull "`) shows its icon as selected too. Looking at either writes nothing to the note.

- **DSE plugin: removing the last condition by keyboard with the Add search open no longer drops keyboard focus (SC-585).**
  In the Conditions window, if you had the "+ Add condition" search open, Shift+Tabbed back to a condition's trash button and pressed Enter to remove the last
  remaining condition, focus fell to the page and the search stayed open with nothing focused, so you had to click back into the window. Focus now moves
  to the search box, which stays open and keeps whatever you had typed. With the search closed, removing the last condition still focuses "+ Add condition",
  and removing any other condition still moves focus to the next condition (or the one above it, if you removed the bottom one).

- **DSE plugin: the Conditions window can take a color off a condition again (SC-581).**
  In a condition's editor (the cog), once you picked a color swatch nothing could put the condition back to no color, unlike Icon, Duration and Effect, which each
  have a reset choice. The Color row now starts with a **Default** button. Press it and the condition's `color` is removed from the note, the row's icon goes back to
  its plain look, and Default shows as selected, as it also does for a condition that has no color (or one whose color the plugin cannot read). It is a text button,
  so it can be told apart without relying on color. Pressing the swatch that is already selected still keeps that color.

- **DSE plugin: ability-card crests now draw the site's solid action icons (SC-563).**
  In the Steel look, the shield on an ability card (including the abilities inside a statblock), a trait card or a kit signature card used a thin outline icon, while the site shows a filled glyph. The plugin now
  bundles MCDM's Draw Steel Glyphs font (unmodified, CC BY-SA 4.0) and draws the site's glyph for each action: main action, maneuver, triggered action, move,
  no action and trait. As on the site, "no action" and "trait" share one star, and several glyphs are placeholders until MCDM ships official action icons.
  A villain action keeps its skull outline. Printing is unchanged (crests are not printed). The trait eyebrow label stays grey.

- **DSE plugin: in Live Preview, a half-typed Malice quick-add (amount and label) now survives the initiative tracker's own save (SC-605).**
  Type an amount and a label, then press Advance round, the Malice - / + stepper, or any other tracker action that saves, and in Live
  Preview both boxes used to keep your text for a moment and then empty about half a second later when the note was written. They now
  keep it, with the caret where it was if you were still in one of them. Only a successful Add (the button or Enter) empties them, and what
  you have typed is never written to the note. A mouse click still never pulls focus into the tracker. An edit made to the note from outside
  starts the boxes empty as before. Not covered: another copy of the same tracker (an identical twin block, or the same note open in a
  second pane) still loses its own draft when this one saves (SC-620). Reading view and the sidebar tracker are unchanged.

- **DSE plugin: initiative tracker: hand-editing a creature's `amount` now keeps the existing creatures (SC-600).**
  Change `amount: 3` to `amount: 4` in an encounter that is already running and the tracker used to throw away every creature of that
  type: conditions gone, stamina back to full. Now the creatures you already have keep their conditions and stamina. New ones are added
  at the end (full stamina, no conditions) and, if you lower the number, creatures are removed from the end of the list. This applies the
  same way to squad minions (they keep their conditions; the squad's shared stamina pool is not changed), captains and regular creatures.

- **DSE plugin: an outside change to the note while an initiative tracker window is open now closes the window with a Notice and returns keyboard focus to the tracker (SC-608).**
  The windows are the minion Stamina pool, hero and creature Stamina, Conditions and the Reset encounter confirm; the views are Reading view, Live Preview and the pinned sidebar tracker.
  A change from outside (Sync, another device) that alters the tracker redraws it; the window used to vanish silently and focus fell to the top of the page.
  Now a Notice says "The note changed outside, so this window closed without saving" (what you typed or staged in it is dropped, so it can never overwrite the outside change)
  and focus goes to the same control in the reloaded tracker, the one you opened the window from. A window opened with the mouse shows the Notice but moves no focus.
  A change elsewhere in the note that leaves the tracker alone keeps the window open, and the tracker's own Apply, Done and Escape are unchanged (no Notice).
  **In the pinned sidebar, a window's Apply (or Add condition) after an outside change was silently lost:** the window stayed open, wrote into a stale copy of the tracker, and nothing reached the note.
  It now closes the same way when the tracker changed, and when the change was elsewhere in the note the window stays open and its Apply writes.

- **DSE plugin: Conditions window: each colour swatch is now announced by its colour name (SC-582).**
  A screen reader said "Color #1e8449" for the green swatch, and the colour's name was only in the hover tooltip. It now says
  "Green" (and Red, Amber, Blue, Purple) inside the Color group. The tooltip is unchanged, and after you pick a swatch
  keyboard focus stays on it. The custom colour picker's labels are unchanged, since a custom colour has no name.

- **DSE plugin: in Live Preview, keyboard focus now stays on the button you pressed when the element saves and Obsidian redraws it (SC-602).**
  Press Enter on a counter's + (or Advance round, Make captain, Catch Breath, and so on) and the element saves; before, focus fell to the page
  about half a second later. Focus now stays on the pressed button, or on the control that replaced it (else on the element itself), with the keyboard ring
  when you were using the keyboard. This is done once for every element, not per element. A mouse click still never pulls focus into an element. Reading view is unchanged. Not covered: the Conditions window still closes when a write lands (SC-384).

- **DSE plugin: a hand-written condition key in capitals, such as `key: Dazed`, is now the standard condition (SC-583).**
  Condition keys used to match only in lowercase, so `Dazed` showed as a custom condition, and picking Dazed in the Conditions
  window added a second, lowercase `dazed`. A standard condition key now matches whatever its capitals: `Dazed` shows Dazed's
  name and icon, and picking Dazed again adds nothing. The key keeps the spelling you wrote; the plugin never rewrites it.
  Custom condition keys match the same way, so adding a custom "hexed" next to a hand-written `Hexed` does not add a second one.

- **DSE plugin: Conditions window: typing a letter now opens the Add search with it typed (SC-580).**
  The docs said "Click + Add condition (or just start typing)", but typing did nothing. With the window open and focus on a button
  (the first thing focused is + Add condition), typing a letter now opens the search with that letter in it, so typing `daz`
  shows Dazed. If the search is already open and focus has moved to another control in the window, the next letter goes to the
  end of what you typed and focus returns to the search. Space, Enter, Tab, the arrow keys, Escape, shortcuts held with Ctrl,
  Cmd or Alt, and anything typed into a text field keep working as before. Pressing Escape in a search that a typed letter
  opened (nothing picked) closes just the search and puts focus back on the control you typed from.

- **DSE plugin: removing a condition with the mouse while using the keyboard keeps focus in the initiative tracker's conditions row, in Reading view and the pinned sidebar tracker (SC-614).**
  With the keyboard focus on a row's Add Condition button (or on another condition's icon), a mouse click on a condition icon removed it,
  and focus fell to the top of the page. Focus now stays on the Add Condition button, or on the same condition's icon (the next control in
  the row when the icon that had focus is the one removed). Removing with Enter or Space does the same. A click when focus was not already
  in the tracker still does not pull focus into it.

- **DSE plugin: clicking a creature in the initiative roster while typing in a tracker text box keeps focus in the tracker, in Reading view, Live Preview and the pinned sidebar tracker (SC-615).**
  With the cursor in the Malice quick-add amount or label, a mouse click on a roster cell selected that creature, and focus fell to the top
  of the page. Focus now moves to the creature you clicked, and what you had typed stays in the box. A click when focus was not already in the
  tracker still does not pull focus into it.

- **DSE plugin: clicking another creature in the initiative roster while using the keyboard keeps focus in the tracker, in Reading view (SC-609).**
  With the keyboard focus on the detail row's Stamina control, a mouse click on another roster cell switched the detail row to that
  creature, and focus fell to the top of the page. Focus now moves to the creature you clicked. A click when focus was not already
  in the tracker still does not pull focus into it. Since SC-602 this holds in Live Preview too.

- **DSE plugin: a + or - (or a form Save) in a hover preview or embed that stayed open while the note changed no longer writes into a different, identical counter in the shapes below (SC-607).**
  Open a hover preview or an embed of part of a note (`[[note#Tracker]]`, `![[note#^id]]`) and leave it open while something else
  changes the note, for example Sync deleting the first of two identical `## Tracker` sections or swapping two heading names. A click on
  its + used to be saved into the other, identical counter with no message. It is now saved into the counter the preview shows, or
  refused with the "changed on disk first" Notice and nothing written. Rare timing races remain, as before: a change that lands
  within a few hundredths of a second of Obsidian drawing or redrawing a preview can still be missed. New refusals, all safe (a
  Notice, nothing written): a section moved to another place in the note while its preview is open (reopen the preview to click
  again); an identical block added or deleted right next to the block you are editing; a change of more than 400 lines around the
  block while an identical counter exists; an outside edit within about a tenth of a second of opening a hover preview (that
  preview then refuses until reopened); and a preview that could not be placed when it was drawn.

- **DSE plugin: clicking in the Compendium search no longer closes a hover preview you are editing, and a pick can no longer vanish silently (SC-601).**
  Open a hover preview of a note, click into its text to edit it, and run "Insert Draw Steel: compendium reference" or "compendium
  block (snapshot)". A click in the search box, on its list or on the dimmed background used to close the preview behind the
  search, and the entry you then picked was written into the closed preview and lost, with no message. The preview now stays open
  while the search is open, and the pick lands in the note you were editing. Clicking the dimmed background still closes just the
  search. If the note you were editing is closed some other way while the search is open, picking an entry now shows "The note you
  were editing was closed, so nothing was inserted." instead of doing nothing. Obsidian's own Quick switcher, Command palette and
  Insert template still close an editing preview, as they did before.

- **DSE plugin: Montage: a hand-typed block whose hero list has an empty item, a bare word or number, or a hero with no name no longer breaks the board (SC-610).**
  An empty item (`- `) used to stop the board drawing at all. The other shapes drew a row labelled "undefined" and could leave
  the Log an action button with nothing to open. Such an item is now skipped on the board and reported in the developer console.
  When you change the board, the note keeps the item as you typed it, in its place. An item with nothing in it (`- `, `- {}`, or
  `- name:` with no value) is removed when the board next saves the note.

- **DSE plugin: the Edit form opened from an embed or hover preview of part of a note no longer saves into an identical counter elsewhere in the note (SC-596).**
  If the counter was changed from outside (Sync, another app, another pane) just before the form opened, Save could write into the
  identical counter and say nothing. It is now placed like a + / - click (SC-594): when the note does not confirm which counter
  is yours, nothing is written, the form stays open and a Notice says why ("the block changed on disk first", or "can't tell where
  this block sits" for a stale callout or a vanished section). Rare shapes that saved before now refuse, even with no identical
  counter: a stale callout or a section gone at the click (also for + / -), a heading link whose name occurs twice with identical counters.

- **DSE plugin: Montage: clicking a logged action to edit it now opens its window when the hero's entry has no skills list (SC-606).**
  The window used to open half-built and throw an error, and in a hover preview the half-built window and the preview then
  closed on the next click. A hero with no `skills_used` list now works everywhere on the board (editing, logging,
  correcting, removing, resetting), and your note only gains a `skills_used` list for a hero once a skill is logged for them.

- **DSE plugin: keyboard focus stays in the initiative tracker after Apply in the minion Stamina pool window, and after closing the Conditions window, in Reading view and in the pinned sidebar tracker (SC-603).**
  Apply in the pool window rebuilds the whole tracker (and so does a captain's Stamina edit that turns its squad's bonus on or off),
  and an edit in the Conditions window rebuilds that conditions row, so the button you had used to open the window was gone and
  focus fell to the top of the page. The window now gives focus back to the control that replaced it: the detail row's Stamina
  control, the roster cell of the same minion, or the Add Condition button. Cancel and Escape still return to the button you
  pressed. A mouse click never pulls focus into the tracker, and neither does a window opened while focus was somewhere else.
  Since SC-602 the pool window's Apply keeps focus in Live Preview too (the Conditions window route there is not covered: it closes when the write
  lands, SC-384).

- **DSE plugin: + and - in a hover preview of a heading or block link now save when an identical counter sits elsewhere in the note (SC-594).**
  Hover over a link such as `[[long note#Tracker]]` or `[[note#^id]]` and press + or - on a counter in the preview: if the note
  held a counter with the same contents elsewhere, the click was not saved and the "changed on disk first" Notice showed,
  although nothing had changed. The click is now saved into the counter you hovered, and the identical one is left alone (also
  for a second click in the same preview, a counter in a callout, Reading view and Live Preview, and `![[note#Heading]]` and
  `![[note#^id]]` embeds). The click is saved only when the note itself confirms where the hovered counter is; otherwise nothing
  is written and the Notice shows. So a click is no longer written into a counter you did not hover when the note was edited
  from outside (Sync, another app) just before your click. Not saved, with the Notice: a counter in a list item or a footnote; a
  counter edited from outside just before the click (the preview still shows its old value); a hovered section moved, pasted
  over or removed from outside just before the click, before Obsidian has re-read the note; a preview Obsidian did not open from
  a link hover, one already open when the plugin loaded, or (heading links) one that shows another heading than its link names;
  a link that names two places (two headings of that name, or two `^id` lines) while the counter's contents also occur twice; a
  heading hover where the heading is written with an underline (`Tracker` over `=====`) or differs from the link's name
  (formatting, a colon); and a whole-note hover whose counter was edited from outside. The Edit form opened from a preview is
  placed the same way (SC-596; the preview-left-open case is fixed by SC-607).

- **DSE plugin: a second click inside a window opened from a hover preview, right after the opening click, no longer closes it (SC-598).**
  A second click inside a window opened from a hover preview, right after the click that opened it, no longer closes the
  window and the preview. Opening the window again from the same preview and clicking inside it at once no longer switches
  the preview to the note's source text. A quick double-click on the stamina bar's numbers in a preview still closes the
  window, as it does in a note, but the preview now stays open.

- **DSE plugin: what you have typed in the initiative tracker's Malice quick-add boxes is no longer lost when the tracker rebuilds, in Reading view and in the pinned sidebar tracker (SC-589).**
  Type an amount and a label, then press Advance round (or Make/Relieve captain, Reset turns, Reset encounter, or any other
  action that rebuilds the whole tracker), and both boxes used to come back empty. They now keep what you typed, with the caret
  where it was if you were still in one of them, and the sidebar tracker keeps your place in a box when the note changes from
  outside. Only a successful Add (the button or Enter) empties them, and what you have typed is never written to the note.
  Since SC-605 this holds in Live Preview too.

- **DSE plugin: keyboard focus stays in the initiative tracker after Advance round, Make/Relieve captain, Reset turns, Reset encounter and the Malice quick-add, in Reading view (SC-588).**
  Each of these rebuilds the whole tracker, and focus used to fall to the top of the page, so a keyboard user had to Tab back in
  from the top of the note after every press. The control that replaced the one you pressed now takes focus: the same button
  (Advance round, Reset turns, the Malice amount or label field, the Reset encounter item once its confirm window has closed),
  or, for a captain badge, Make captain and Relieve captain trade places on the same creature. A mouse click never pulls focus
  into the tracker, and neither does a rebuild that starts while focus is somewhere else. Since SC-602 this holds in Live Preview too.

- **DSE plugin: a window opened from a hover preview with the keyboard stays open (SC-597).**
  Hover over a link to a note that holds a Stamina bar, focus the bar in the preview and press Enter or Space: the Stamina
  window used to open and then close by itself about a third of a second later, taking the preview with it. It now opens and
  stays, exactly as it does for a mouse click: clicks inside it do not close it, Apply saves, Escape closes the window and
  the preview stays until you click outside it. The same goes for pressing Enter or Space on a cell of a Montage board in a
  preview, which opens the Montage log window. Enter and Space work as before outside a preview. On a Montage cell,
  Ctrl, Cmd or Alt with Enter no longer opens the window, as on the Stamina bar.

- **DSE plugin: a click inside a block's edit form opened from a hover preview no longer closes it and loses what you typed (SC-595).**
  Hover over a link to a note that holds a counter, press + and then the Edit pencil in the preview: the first mouse click
  anywhere in the form used to close the preview and the form together, and the typed edit was gone. It now stays open, the
  preview stays behind it, and Save writes the edit as usual. The same goes for the other Draw Steel windows opened from a
  preview (the Stamina window, the Conditions windows of the initiative tracker and of the conditions panel, the minion
  stamina pool, Reset encounter, the Montage log and setup windows, the hero sheet's Stamina and Edit definition windows, the
  free-heal confirmation), whatever you click in them, including buttons that redraw the window (Add condition) and the ones
  that close it (Cancel, Confirm, Apply: a free-heal Confirm no longer takes the Stamina window and its staged heal with
  it). Escape now closes a form opened from a preview (before, it did nothing, and in Live Preview it
  moved the cursor into the note behind it). After you save or cancel, the preview stays until you click outside it, as
  Obsidian does for any preview you have clicked into.

- **DSE plugin: conditions you typed as plain names stay plain names when the initiative tracker saves (SC-592).**
  Removing one condition in a minion's pool window, or any other tracker action that saves (a turn, damage, Malice), rewrote
  every condition you had written as `- grabbed` into `- key: grabbed`. Now those stay as you wrote them, and a removal
  changes only the line you removed. A condition you give a colour, icon, effect or duration in the Conditions window still
  becomes the longer form, since a plain name cannot hold that. Conditions the tracker adds itself, and ones you wrote as
  `- key: hexed`, are written as before. Extra fields you put on a condition (`source: trap`) are no longer deleted, and the
  fields keep your order. Quotes, comments and `[a, b]` lists in the block are still rewritten on a save (SC-599).

- **DSE plugin: the Malice log records what the pool actually did (SC-578).**
  With Malice at 2, quick-adding -5 set Malice to 0 but the log said -5, so the log no longer added up to the pool;
  Advance round with a negative `round_gain` had the same gap. Now a log entry's amount is the change the pool really
  made, and when the pool stopped at 0 the entry also keeps what was asked for (a new optional `requested` field) and the
  log line says so: `R2: -2 — Spend (-5, capped at 0)`. A change that applies nothing (-5 from 0, or a negative
  `round_gain` from 0) is still logged as `R3: 0 — Round gain (-3, capped at 0)`; a zero amount reads `0`, not `+0`.
  Entries that were not capped are unchanged.

- **DSE plugin: a block's edit form saves again in two cases that SC-556 refused although nothing was unclear (SC-584).**
  (1) Hover over a link to a note holding a counter (or see the counter in an embed of part of a note), press + on it and
  then its Edit pencil right away: Save was refused ("a change to a block in <note> was not saved — the block changed on
  disk first") even when that counter was the only one in the note, in a short note too. It now saves into the counter
  you pressed + on. How the form finds its block: when the card is a block on its own, by the embed's link or the block's
  text, and failing that by the spot where the plugin wrote that +; when the card is a callout, a quote or another
  container holding several blocks, always by the spot where the plugin wrote that +, because the container Obsidian shows
  is still the one from before the +. So two counters in one callout or quote that read the same after the + save the
  lower one (a heading embed used to write the upper one). If the counter is edited or deleted from outside (Sync,
  another editor) between the + and Save, Save still writes nothing and shows the same Notice. A form opened on a hover
  preview or an embed without a + on that card first is unchanged: when the plugin cannot tell which block the preview
  shows, Save is refused with the same Notice. A counter inside a list item or a footnote is unchanged too: the + is not
  written there (a Notice says so), and so Save writes nothing. (2) A block embed of a
  callout (`![[note#^id]]`) whose callout has more text after the counter, in a note with an identical callout elsewhere:
  Save was refused. It now saves into the embedded callout and never into the other one. A callout embed whose `^id` line
  is not directly under the callout, or whose position Obsidian's index of the note has wrong, is still refused with the
  same Notice, and so is a form in a container holding several blocks when hundreds of lines changed on both sides of it
  between the + and Save.

- **DSE plugin: Malice in the initiative tracker no longer goes below 0 (SC-577).**
  Pressing - on Malice at 0 wrote `value: -1` into the note, and a negative `round_gain` took Malice below 0 on Advance
  round and put "Advance round (+-3 Malice)" on the button. Now the - button is disabled at 0 (a hand-edited
  value below 0 shows as 0 and counts as 0: Advance round or a +3 quick-add from a stored -2 gives 3), Advance round applies a negative `round_gain` but stops at 0 (the Malice log shows the change it
  made, see the SC-578 entry above), and the button reads "Advance round (-3 Malice)".

- **DSE plugin: deleting a block right after clicking it no longer sends the click into another block (SC-480).**
  If you pressed + or − on a block and, before the click had been saved, that block was deleted from outside (Sync,
  another editor, another pane), the click was saved into a different block of the note: an identical one that was left,
  or a neighbour that the same outside edit had changed to read the same. You never touched that block. Now nothing is
  saved and a Notice says so ("a change to a block in <note> was not saved — the block changed on disk first"); the
  outside change is kept. A note with no identical block behaves as before, except that if the same outside edit deleted another block and moved this one into its place, the click is refused with the same Notice. Limits. If the block was cut and pasted
  somewhere else in the note in that same moment and the note has another block that reads the same, the click is
  refused with the same Notice although the block still exists. If hundreds of lines changed around the block in that
  moment and an identical block exists, the click is refused the same way. Two identical blocks with only blank lines
  between them: if one is deleted from outside the plugin cannot tell which, so a click on the upper block is saved into
  the block that is left. When a click is refused but its block is still in the note (the cut and paste case and the
  hundreds-of-lines case above), the card keeps showing the click: the next click on that card saves it together with
  the new one, and leaving the note first drops it.

- **DSE plugin: Reset encounter now clears a minion squad's pressed action pips (SC-575).**
  A minion squad whose Move, Main, Maneuver, Second move or Triggered pip was pressed kept it pressed after Reset
  encounter -> Yes, in the note and after a reload. Reset now clears the squad's pips along with every other creature's.
- **DSE plugin: saving a block's edit form after that same block was changed or deleted elsewhere no longer writes your edit into another block (SC-556).**
  When a note has two or more blocks that read the same and you had a block's edit form open while that same block was
  edited or deleted from outside (Sync, another editor, a hand edit), Saving the form could write your edit into one of
  the identical blocks that was left, one you never opened. Now nothing is saved, a Notice says so ("a change to a block
  in <note> was not saved — the block changed on disk first"), the form stays open, and the outside change is kept. The
  Notice shows on every such Save, also when you press Save again within a few seconds. A card's own + and − are not
  affected, and neither is a form whose block only moved because of an edit above or below it, or a form opened on a card in an embed of one heading or one block of a note (`![[note#Heading]]`, `![[note#^id]]`), also right after pressing + on the card. A form in an embed finds its block by the embed's own link. In a hover preview, or when Obsidian's index of the note is behind a change, it finds the block by its text instead. If the plugin cannot tell which block an embed or preview shows (the same text appears twice, or the block changed before you opened the form), Save writes nothing and shows the same Notice, in a short note as in a long one, and never writes into another block. Limits. Two identical blocks
  with only blank lines between them: if one is deleted from outside, the plugin cannot tell which, so the form on the
  upper block saves into the block that is left, and the form on the lower block is refused with the same Notice. And if
  hundreds of lines changed both above and below the block while the form was open, Save is refused the same way even
  though the block itself is unchanged: copy your text out and reopen the form.

- **DSE plugin: the coloured left stripes are gone from cards in Obsidian (SC-558).**
  Four places drew a thick coloured bar down the left edge: the action-type bar on ability cards (red, blue, green and so
  on), the tier bars on power-roll rows and on the Montage "Test tiers" strip, the bar beside a featureblock's "Level N
  Advancement" options, and the left edge of the error card. They are removed. An ability's action type now shows in the
  small icon beside its name and in its "Main action" / "Maneuver" text, and a power-roll row's tier in its badge (the
  coloured wash behind the row stays). The error card now has a thin frame all the way round in its stage colour (red,
  orange or blue), and its title takes that colour, toned a little toward the body text so it stays easy to read. A featureblock's "Level N Advancement" group now sits in its own
  recessed panel with the "Level N Advancement" line as its header. On paper (print and PDF export) the action-type bar
  is gone from statblocks, featureblocks and kits, and the violet bar Obsidian draws on the left of a class or perk quote
  is gone too, so printed pages of those shift by a few pixels. The v2 site is unchanged (SC-564).

- **DSE plugin: the Recoveries popover's −, + and Catch breath buttons keep the plugin's own compact look in Obsidian (SC-526).**
  With the "Edit Recoveries with a popover" setting on, clicking the Recoveries markers opens a small popover with −, + and Catch
  breath buttons. In Obsidian those three took Obsidian's own button look: taller (30px instead of about 18px for − and +),
  with Obsidian's drop shadow, text colour and font size. They now keep the plugin's compact buttons (− and + about 18px,
  Catch breath about 26px, on desktop and phone) in the card's font, without Obsidian's shadow. Keyboard focus on them
  shows the plugin's usual teal-cyan ring instead of Obsidian's grey halo.

- **DSE plugin: an edit form opened on one of several identical blocks saves into the block you opened it on (SC-552, SC-549).**
  When a note has two or more blocks that read the same and you clicked + on an upper one and then opened the edit form
  (the pencil) on a lower one within about half a second, Saving the form wrote your edit into the block below the one you
  had opened. The same happened when another block was edited (by you elsewhere, or by a sync) while the form was open.
  With two identical blocks the form on the lower one even closed by itself, with nothing saved. Now the edit is saved
  into the block you opened the form on, and the form stays open until you save or cancel it as long as the note is still
  on screen. A click on an identical block followed quickly by typing in the note or an outside edit above it now also
  counts in the block you clicked.

- **DSE plugin: turning Draw Steel Elements off and back on no longer leaves cards in Live Preview callouts and embeds unclickable (SC-545).**
  With a note open in Live Preview, turning the plugin off and on in Community plugins left the cards inside a
  `> [!note]` callout, or inside a note embedded with `![[note]]`, on screen but dead: a click on + saved nothing and
  no error showed. The cards are now redrawn when the plugin is back on, so the click saves; a card that was scrolled
  out of the page at that moment (about a screen or more away) is redrawn when you scroll back to it. A note whose
  callout was changed while the plugin was off (a click's save still pending when you turned it off), or that was
  opened while the plugin was off, is redrawn as a whole once the plugin is on, which clears that note's undo
  history. The update that installs this fix does the same once for each open note that has such a card, and during that
  one update a card scrolled out of the page stays unclickable until you reopen the note. Not covered: cards on a
  canvas and in hover previews.

- **DSE plugin: in Live Preview, typing and scrolling in a note with a callout holding many blocks is no longer slowed by the identical-callout check (SC-547).**
  Since SC-537 the plugin checks, after every edit, scroll and cursor move, whether a callout's cards still sit on
  their own blocks. For a callout holding many blocks (forty counters, say) that check re-read the whole callout once
  for every block in it, so it got much slower with each block added and made typing and scrolling in such a note
  feel heavier. It now reads each callout once per check. Which cards are redrawn, and when, is unchanged, with one fix: in two
  identical callouts that each hold two or more blocks of two kinds, a click could leave a card of one kind in the other callout
  showing the clicked value, and that card's next click wrote the callout you had clicked first. Both kinds are checked now.

- **DSE plugin: on a long Montage Test, the hero names stay in view while the rounds scroll sideways (SC-490).**
  When the board is wider than its card, the "Hero" corner (with the + button that adds a hero) and each hero's
  name (with its "Log an action" button) now stay fixed at the left edge while the round columns and the Tally
  slide under them, so you can tell which row is which in round 12 or at the Tally. The pinned column has a solid
  background (a close match for the card, so nothing shows through) and a thin line down its right edge. Tabbing
  through the board never leaves a control hidden under it. A board that fits looks exactly as before, and the
  narrow one-column layout and printing are unchanged.

- **DSE plugin: two quick clicks on identical blocks each count in the block you clicked (SC-544).**
  When a note has three or more blocks that read the same (three counters set to 5, or three callouts each holding
  the same counter) and you clicked + on one and then + on another within about half a second, the second click
  could be saved into the block below it. Disk went from `[5,5,5]` to `[6,5,6]` instead of `[6,6,5]`, and the lower
  card briefly showed the other card's number. Now each click is saved into the block you clicked and each card shows
  its own number. This holds in Live Preview (callouts and plain code blocks), in Reading view (callouts and plain
  code blocks), with one pane or two panes of the same note, and when a block edit form on one block is saved right after a click on another block.

- **DSE plugin: in Live Preview, clicking a button on a card inside a callout no longer turns the callout into its markdown text (SC-540).**
  A card inside a `> [!note]` callout (a counter, for example) used to be replaced by the callout's markdown, with
  the cursor inside it, after a click on one of its buttons (+ on a counter) or on its text, and the cursor moved into
  the callout when Enter opened the edit form from its Edit pencil. The card now stays drawn, the cursor and scroll
  position do not move, and the click still does its job. Clicking the callout's own text or title, its `</>` button
  and its fold arrow work as before, and links inside a card in a callout still open.
  The same holds for buttons that redraw the whole card (an initiative tracker's Advance round, a project's Add project
  roll), and an initiative tracker embedded with `![[note]]` is no longer selected by such a click either.

- **DSE plugin: pressing Enter on "Unpin from sidebar" no longer drops keyboard focus to the page (SC-511).**
  With the keyboard, unpinning a block from the Draw Steel sidebar removed the panel and left focus on the page
  body, so you had to Tab in from the top again. Focus now goes to the pinned block that took its place (the link
  to its note at the top of the panel), or to the block above if you unpinned the last one, or to the "No pinned
  blocks" message if none is left. The same applies to the "Remove panel" button on an unavailable panel. A mouse
  click works as before, and focus you had already moved elsewhere is left alone. The note link and the message now
  show a focus ring in your theme's accent colour when focused.

- **DSE plugin: on a slow or busy computer a note no longer jumps up after a tracker changes, and the end of a note no longer snaps back 64 px (SC-472).**
  When a tracker in an open note changes (a click, Sync, another pane or another plugin writing the note), Obsidian
  redraws it, and the plugin holds the note's height so your reading position stays put. That hold was dropped after
  a fixed 2.5 seconds. When the computer was slow or busy, for example with the same note open in a second pane,
  Obsidian often had not started to redraw yet, the hold ended too early, and the note jumped up (in our tests it
  scrolled from 2779 px to 2001 px in Reading view, and from 7486 px to 3745 px in a Live Preview note that embeds the
  tracker). The hold now ends when Obsidian has finished redrawing the tracker, and the 2.5 seconds are only a safety net,
  so a redraw that comes late no longer jumps, even if you scroll while you wait for it (a reader who scrolls to the very end of a long note can still settle up to about 500 px higher, as before). A change that
  Obsidian never redraws still lets go after about 3 seconds, and the hold lets go at once when you open another note
  in the same pane. Also fixed: holding the position added 64 px of empty space below a note, so if you were reading at
  the very end, the page snapped back 64 px when the hold ended. One small trade: when a change makes the end of a note
  shorter (you delete the last tracker), the empty space under the note stays about 1 second longer than before, and
  the page ends in the same place.

- **DSE plugin: a reference that points back to itself now shows one "Reference loop" card instead of nesting forever, and a note open in two panes no longer shows a false "Reference nesting too deep" (SC-536).**
  A card whose text holds a reference back to itself (a feature whose effect shows `@Self.md`, or two notes that
  show each other) used to open card inside card without end in Reading view and Live Preview, until Obsidian
  slowed down. It now stops at one card with a "Reference loop: … is already shown by a card this one is inside"
  card nested in it. References nested more than 5 deep stop with "Reference nesting too deep: more than 5
  references inside one another". The check follows what is actually inside what, so the same note shown in two
  panes, after turning the plugin off and on, or redrawn twice quickly, shows its card each time instead of a
  "Reference nesting too deep" error in one of them.

- **DSE plugin: a tracker redraws about 40 % faster after a change (SC-533).**
  Each time a tracker was redrawn (a stamina change, a hero added, a write from another pane or from Sync), the
  hover menu's placement code made the browser restyle the whole tracker twice more before anything was drawn.
  For a 25-hero tracker that was about 340 ms of an 850-900 ms redraw, in Reading view and Live Preview alike.
  The menu now measures its card in the next frame, once for every card drawn in that frame, and the redraw takes
  about 500 ms. Also fixed on the way: in Reading view, the hover menu of a block that starts below the first
  screen sat 1 px too low and 1 px too far left, on the card's top border; it now sits where it does on every other block.

- **DSE plugin: retyping a reference in the block edit form no longer shows "Reference nesting too deep" (SC-525).**
  With experimental authoring controls on, a feature or statblock whose YAML box holds a reference such as `@Ref.md`
  could show "Reference nesting too deep" in the preview if you typed another key (a trailing space, a paste) while
  the reference was still being looked up, and kept showing it until the next key. The preview now shows the
  referenced card. A card in the sidebar that redraws while its lookup is running also shows one card, not the
  card under a stale error.

- **DSE plugin: in Live Preview, with two identical callouts in a note, a click in one no longer changes the other callout's number or its block (SC-537).**
  Put two callouts with exactly the same text in one note, each holding the same block (two `ds-counter` blocks at 5,
  say), and click + in the upper one in Live Preview. The note was right (6 and 5), but the lower callout then showed
  6, and a click on it changed the upper block instead of the lower one. If you had saved an edit in the upper block's
  edit form first (with experimental authoring controls on), that click also erased your edit. Each callout now keeps
  its own card and value, and its clicks and saves go to its own block. This holds when the two callouts are far apart
  in the note (the lower one off screen when you click, shown correctly when you scroll to it), when you click the
  other callout's title straight after the +, for three identical callouts, for callouts holding two blocks, and for
  callouts inside callouts.

- **DSE plugin: with two identical blocks in a note, editing one no longer makes the other disappear, show the wrong number, or write into the first block (SC-481).**
  Put two blocks with exactly the same text in one note (two identical counters, say), open it in Reading view or
  Live Preview, and click a control in the upper one. The lower block could vanish until you reopened the note,
  show the upper one's new value, and a click on it then changed the upper block instead of the lower one. After
  a Save in the block's edit form the same click also undid the edit you had just saved. Each block now keeps
  its own card, its own value, and its clicks and saves go to its own block. Three identical blocks, identical
  montages, blocks inside a callout or a quote, and the view adoption setting turned off are covered too.

- **DSE plugin: a Live Preview note no longer jumps when a tracker in a note it embeds changes or is clicked (SC-522).**
  With `![[Tracker note]]` in a note open in Live Preview, a change to the tracker (from another pane, an outside
  edit, or the edit form) could throw the embedding note elsewhere when you were scrolled near the end or below the
  embed (for example from the end of the note up into the middle of it), and a click on a control in the embedded
  tracker scrolled the note to the top of the embed. The embedding note now keeps its scroll position and the text on
  screen in both cases. One visible change inside Live Preview embeds: clicking a tracker card in the embed no longer
  selects the embed (the cursor does not move onto it and the selected-embed outline does not appear); clicking the
  rest of the embed still does. Reading view and trackers placed directly in a Live Preview note are unchanged.

- **DSE plugin: after Save in a block's edit form, keyboard focus returns to the card's Edit button instead of jumping to the top of the page (SC-518).**
  With experimental authoring controls on, Tab to a card's Edit button, press Enter, change a field and press Save:
  the card is redrawn with the new content, and keyboard focus used to be lost (the next Tab started again from
  the top of the page). Focus now goes back to the redrawn card's Edit button, with the keyboard focus ring, in
  Reading view, the sidebar and Live Preview, including when the edited block has an identical twin. Opening the form
  with the mouse changes nothing about focus, as before. Cancel and Escape are unchanged.

- **DSE plugin: a Reading-view note no longer jumps to the top when a tracker in a note it embeds changes (SC-479).**
  With `![[Tracker note]]` in a note you are reading, a change to the tracker (from another pane or an outside edit)
  could throw the embedding note back to its title when the embed filled most of the page and you were scrolled to
  its end. The embedding note now keeps its scroll position. (Live Preview: see SC-522 above.)

- **DSE plugin: the hover menu of a block at the top of a callout can be clicked (SC-520).**
  When a block (a stamina bar, a counter, a statblock, ...) is the first thing inside a `> [!note]` callout, the
  hover menu above it (Collapse, Pin to sidebar, the experimental Edit pencil) sits over the callout's title row,
  and Obsidian cut it off there in Live Preview and in Reading view: it was never drawn, and a mouse click on the
  spot landed on the callout title instead (in Live Preview that turned the callout into its source text; on a
  foldable callout it folded it). The menu now shows above the block when you hover it, its buttons work with
  the mouse, and clicking one no longer opens the callout's source. In Live Preview the menu sits a little
  further left in such a callout, so Obsidian's own `</>` button no longer covers the Collapse button. The
  callout's own title, fold arrow and `</>` button work as before. If the same callout also holds something wider
  than it (a wide table), the whole callout scrolls sideways, title included, instead of only its body.
  Blocks with text above them in the callout were not affected.

- **DSE plugin: the block edit form's preview no longer shows a stale error while you type a reference (SC-510).**
  With experimental authoring controls on, typing a reference such as `@Ref.md` into a feature or statblock's YAML
  box one character at a time could leave the preview on "Reference file (Ref.m) not found", or on a mix of earlier
  and current results, even though the finished text was fine. The preview now always shows the text currently in
  the box. Saving was never affected. A reference the element cannot read no longer raises an error in the
  background either; the preview shows the same "failed to render" message the block itself would show.

- **DSE plugin: in Reading view and the sidebar, the block edit form opened right after a click on the card now includes that click (SC-519).**
  With experimental authoring controls on, pressing the pencil within a moment of a button on the card (for
  example Increase on a counter) opened the edit form with the content from before that click, and Save then wrote
  it back, so the click was undone without any message. The form now waits for the click to be saved first and
  starts from what the card shows. In the sidebar the form also started from the content the panel was first built
  with, even long after a click; it now starts from the current content. (Live Preview is not covered by this fix.)

- **DSE plugin: the hover menu above an element can be clicked in Live Preview (SC-502).**
  In Live Preview, a mouse click on the menu above a block (Collapse, Pin to sidebar, the experimental Edit pencil)
  did nothing and moved the editor cursor to the line above the block: Obsidian cut the menu off at the block's top
  edge, so it was never drawn there. The menu now shows above the block when you hover it, the same place as in
  Reading view, its buttons work with the mouse, and it stays up while the pointer passes over Obsidian's own `</>`
  button on the way to Collapse. On the collapsed one-line bar, Expand now sits just left of that `</>` button
  (it used to be underneath it, so clicking it opened the block's source instead of expanding); the `</>` button
  works as before.

- **DSE plugin: keyboard Collapse, Expand and Pin no longer drop you out of the block (SC-505).**
  Pressing Enter on an element's Collapse button used to throw keyboard focus to the page, so the next Tab started
  again from the top of the note; Expand on the collapsed one-line bar and Pin to sidebar did the same. Now Collapse
  moves focus to the one-line bar's Expand button, Expand moves it back to the Collapse button, and Pin to sidebar
  leaves it on the Pin button, each with the focus outline. This applies to every element with the hover menu, not
  only the stamina bar. Clicking with the mouse behaves as before.

- **DSE plugin: the block edit form's Save now redraws the card right away (SC-509).**
  The block edit form (experimental authoring controls) wrote your change to the note, but in Reading view and in
  the sidebar the card kept showing the old content until you left the note and came back. The card now redraws
  with the saved content as soon as you press Save. Buttons you press on the card itself still update it in place,
  as before.

- **DSE plugin: saving the block edit form no longer drops a block's `collapsed:` line (SC-494).**
  The block edit form (experimental authoring controls) used to write the block back without its
  `collapsed: true` / `collapsed: false` line (and, on blocks such as Skills, Conditions and Surges, showed a schema error
  with Save switched off), so a block you had set to start collapsed came back expanded. Save now keeps
  `collapsed:`, `collapsible:` and `collapse_default:`, and a Save with no changes writes the block unchanged,
  except that collapse lines placed below other settings move to the top of the block.

- **DSE plugin: emptying the YAML box in the block edit form no longer saves a broken block (SC-493).**
  For a block the form edits as raw YAML (for example Counter, Negotiation, Party, Encounter, Values row,
  Characteristics), clearing the box and pressing Save used to write an empty block that then showed an error
  card. The form now says "This block can't be empty. Add at least one setting, or press Cancel." and keeps Save
  off while the box is empty; Montage and Project, which accept an empty body, still save it.

- **DSE plugin: the stamina bar can be opened from the keyboard (SC-498).**
  Tab now stops on the bar (in the Stamina Bar element and on the hero sheet), a teal outline shows it has focus,
  and Enter or Space opens the Stamina window, the same as a click. The Edit pencil, Collapse and Pin buttons in
  the bar's menu keep doing only their own job when pressed from the keyboard. A read-only bar (print, canvas)
  is not a tab stop.

- **DSE plugin: the block edit form no longer rewrites what you wrote when you save (SC-489).**
  The block edit form (experimental authoring controls) used to save a lowercased, trimmed copy of some values
  even when you had not touched them: `Climb` in a skills block became `climb`, and `style: Chips` or a Stamina
  bar's `style: Sheet` became `chips` and `sheet`. Save no longer lowercases or trims values you did not edit
  (`Climb` stays `Climb`, `style: Chips` stays `Chips`). A dropdown whose value is written in a different case, like `style: Chips`, now opens on the matching
  option instead of blank.

- **DSE plugin: the initiative tracker no longer adds keys you never wrote when you click in it (SC-485).**
  A tracker with a hero and an enemy group used to gain `isHero`, `conditions: []`, `current_stamina`,
  `temp_stamina`, `has_taken_turn`, `is_squad`, a full `instances` list for every creature and a `malice` line
  the first time you toggled a turn or changed Stamina. Values the tracker fills in for you now stay out of the
  note until they change; damaging one creature writes that group's instance list, and everything you wrote is
  kept as before. A hero or creature written as just a `statblock:` keeps following that statblock instead of
  copying its name, Stamina and image into the block on the first click.

- **DSE plugin: the − / + steppers keep keyboard focus when a press reaches the lowest or highest value (SC-495).**
  Steppers (Temporary Stamina, Stamina, counters, tokens, Surges, the roll controls' Edges and Banes, and the like)
  turn the − button off at the lowest value and the + button off at the highest. If you pressed that button with the
  keyboard, it used to lose focus when it turned off, so Enter and Space did nothing until you tabbed again, the
  focus outline vanished, and a screen reader lost its place. Focus now moves to the number beside the button, with
  the usual focus outline, so you can carry on from there. Steppers that only display their number (Edges and Banes)
  get the same, without making the number a Tab stop. Using the mouse behaves as before.

- **DSE plugin: the buttons in a Stamina bar's menu panel no longer also open the Stamina window (SC-492).**
  Clicking the panel's collapse button used to open the Stamina window as well as collapsing the bar. With the
  experimental authoring controls on, clicking the Edit pencil in that panel opened the edit form and, on top of it, the
  Stamina window. The panel's buttons now do only their own job; clicking anywhere else on the bar still opens the
  Stamina window.

- **DSE plugin: "Pin to sidebar" no longer leaves a dead anchor in your note for a block the sidebar cannot show (SC-487).**
  Pinning a block whose type the sidebar cannot show (for example a code block that is not a Draw Steel
  element) used to write a `_dse_anchor` line into the note, show an "unavailable" card in the sidebar and lose any
  save made from it. Pinning now changes nothing in the note and shows one notice saying the block cannot be
  sent to the sidebar. Also fixed: Live Preview draws a block even when its type is followed by an invisible
  character (a zero-width space, a soft hyphen, a left-to-right mark) or by punctuation such as `:` or `.`,
  for example ```` ```ds-counter: ````, but "Pin to sidebar" read that whole text as the type and could not pin it.
  The type now ends at the first character other than a letter (A to Z), digit, `-`, `_`, `/`, `+` or `#`, which is how
  Live Preview reads it, so those blocks pin and save like any other. (Reading view shows such a fence as plain
  code, as before.) The notice also spells out invisible characters, for example `ds-counter<U+200B>`.
  A ``` fence with a backtick on its opening line is not a block in either view and is now left alone too; a ~~~ fence
  with one is still a block in Reading view, as before, and still pins.

- **DSE plugin: keyboard focus now stays in the Stamina window when a heal fills Stamina (SC-465).**
  In the Stamina editor, pressing Spend Recovery (or Heal Recovery Value, after you confirm) with the keyboard
  could heal you to full, or use your last Recovery, and turn the button off while you were on it. Focus then fell out of the window, and
  the next Tab started again from the top of the page. Focus now moves to the next button in the window
  (Reset), with the usual focus outline when you used the keyboard, so Tab carries on from there.

- **DSE plugin: the roll controls on ability cards are labelled and start closed (SC-279).**
  With Enable rolling on, the dice icon in a power roll's header used to open one row of unlabelled
  steppers, toggles and a bare reset icon. It still rolls on the first click, and now shows a Roll button
  plus a Modifiers section that is closed by default and says in words what the next roll will use
  ("Reason 0, skill +2, 1 edge"). Opened, each stepper has a caption (the characteristic, Edges, Banes),
  the two toggles are labelled checkboxes, and Reset modifiers is a text button. The roll controls no
  longer print. Also fixed: abilities in one statblock or featureblock shared their roll settings, so an
  edge set on one was used for the next; each ability now keeps its own.

- **DSE plugin: a block with no closing ``` at the end of a note no longer loses the note's final newline (SC-477).**
  If a block was never closed (nothing after it but the end of the note), saving a change added the closing ```
  but deleted the newline (or blank lines) that ended the note, whether you stayed on the note or switched to
  another one before it saved. Both saves now keep them.

- **DSE plugin: the Conditions window's color swatches now show which one is chosen and which one the keyboard is on (SC-361, SC-473).**
  The chosen swatch gets a white check mark inside it (with a thin dark outline, so it reads on every color), and the
  teal focus ring, the same one the rest of the plugin uses, now shows which swatch the keyboard is on. A swatch can
  show both at once, and the two no longer look alike. The custom-color (eyedropper) swatch now shows keyboard focus
  too, and when a color that isn't one of the five presets is chosen it fills with that color and shows the check.
  The swatches also drop Obsidian's grey button shadow and all draw at one size.

- **DSE plugin: the Temporary Stamina "−" button and a lower typed value now lower temp (SC-433).**
  In the Stamina editor, the Temporary Stamina field is now edited directly, the same as the Stamina
  field. "−" takes one off, "+" adds one, and a typed number sets temp to exactly that number (a
  negative number becomes 0). Before, "−" and a lower typed number did nothing, so a mistyped 50
  instead of 5 could not be fixed after Apply. Damage, Kill and Full Heal still use up temp as before.

- **DSE plugin: Spend Recovery no longer heals for free (SC-432).**
  In the Stamina editor, Spend Recovery used to heal one Recovery's worth every press for
  creatures and for heroes whose block tracks no Recoveries, without spending anything. Now it is
  disabled for creatures (hover it: "Creatures have no Recoveries"). For a hero with no Recoveries
  pool (a standalone stamina bar without `recoveries_max`, and every hero in the initiative
  tracker) the button is renamed "Heal Recovery Value", and its first press in an editor window
  asks you to confirm that it heals one Recovery's worth and spends no Recovery; Cancel (or Escape)
  changes nothing. A hero with a Recoveries pool works exactly as before.

- **DSE plugin: the block edit form's dropdowns show the value the block really uses (SC-488).**
  With authoring controls on (experimental), a dropdown whose field the block leaves out used to show its first
  option, such as `list` for a Skills block that actually renders as `ledger`, or `power-roll` and `easy` for a Roll
  block that has neither. It now starts on a first entry labelled "Default (…)" naming the value the block uses
  (for example "Default (ledger)", or "Default (test)" for `roll: Might test`, which follows the roll as you edit it;
  "Default (none)" when there is no value). Nothing is filled in for you, so the live preview matches exactly what
  Save writes. Choosing "Default" again removes that line from the block.

- **DSE plugin: saving the block edit form no longer adds fields you never touched (SC-483).**
  With authoring controls on, opening the form on a block that left out a dropdown field, such as a Stamina Bar
  without `style`, and saving used to write that field with its first option (`style: default`). A dropdown you
  never changed is now left out of the saved block; one you change, or that the block already had, is written as before.

- **DSE plugin: the option chips in the Conditions modal and the Log-an-action form now use the plugin's own fill and text color, and keep their height (SC-356).**
  The Duration, Effect and icon chips in the Conditions modal and the Result chips in the Log-an-action form
  were painted with Obsidian's button gray and text color instead of the plugin's. They now match the rest
  of the plugin's controls. The chips are the same height as before, and still follow Obsidian's button height
  on a phone, so nothing gets harder to tap.

- **DSE plugin: counters, projects, montages, parties, encounters and negotiations no longer add lines you never wrote when the plugin saves a change (SC-482).**
  A counter holding only a name and a value used to gain `min_value: 0`, `value_height: 3` and `name_height: 1`
  the first time you pressed + or -, a montage gained `successes: 0` and `current_round: 1`, a project
  `current_respite: 1`, a party `members: []`, a negotiation its `currentArgument` and `i5`..`i0` lines, and an
  encounter gained `party: {}` just from being viewed. A save now changes only the fields it touched; anything you
  did write is kept as before.

- **DSE plugin: a Reading view no longer jumps to the top when a tracker in it changes from another pane, a popout, or an outside edit such as Sync (SC-470).**
  Clicking a tracker in one pane used to throw a second pane on the same note back to the top, and so did an edit
  arriving from Sync, git or another plugin. Every open Reading view of the note now keeps its scroll position.
  Setting and releasing that hold is also much cheaper, so large tracker notes stutter less after a click.

- **DSE plugin: Live Preview no longer jumps when a tracker in the note changes from another pane, a popout, your own click, or an outside write such as Sync, git or another plugin (SC-478).**

- **DSE plugin: changing Stamina on an older Stamina Bar block no longer adds lines you never wrote (SC-466).**
  A `ds-stamina` / `ds-stamina-bar` block that held only its stamina numbers used to gain `collapsible`,
  `collapse_default`, `temp_stamina`, `height` and `style` lines the first time you applied Damage, Healing,
  Catch Breath or a Recovery change. A write now changes only the fields it touched; anything you did write,
  including `collapse_default: true`, is kept as before.

- **DSE plugin: key and value suggestions now appear inside a code block opened with extra words after its type (SC-476).**
  In a block opened with ```` ```ds-stamina-bar extra ````, the suggester used to read the whole line after the
  backticks as the block's type, find no such type and offer nothing. It now reads only the first word, as the
  rest of the plugin does.

- **DSE plugin: a long Montage Test no longer cuts off its later rounds and the Tally (SC-326).**
  With many rounds (or on a touch screen, where the round columns are wider) the board grew wider than
  the card and the right-hand rounds and the Tally were clipped with no way to reach them. The board now
  scrolls sideways inside its frame (Shift + mouse wheel, trackpad, touch, or Tab to a control), keeps
  the Tally readable at the end, and stays where you scrolled it when you log a result or end a round,
  instead of jumping back to round 1. A board that fits looks exactly as before.

- **DSE plugin: in the Conditions window, clicking a row's cog or a colour swatch while the "Add condition" dropdown is open now works (SC-474).**
  The dropdown used to collapse as soon as the mouse button went down, which shrank and re-centred the
  window under the pointer, so the click often landed on nothing. It now collapses when the click
  completes, after the cog or swatch has been pressed.

- **DSE plugin: in the Conditions window, choosing a colour, duration or effect with the keyboard keeps focus where you were (SC-468).**
  Pressing Enter or Space on a colour swatch, a duration chip or an effect chip used to send focus
  back to that condition's cog button, so you had to Tab all the way back to the next option. Focus
  now stays on the option you just chose (a custom colour stays on the custom colour field). Picking
  with the mouse shows no extra focus ring.

- Fixed: a Draw Steel block whose opening line has a space (or several, or a tab) before the block name ("``` ds-counter") now saves a click made just before you leave the note (switching notes or closing the tab): such a block used to lose it, with a "not saved" notice. "Pin to sidebar" also works on these blocks now. The space before the block name is kept. (SC-457)

- Edits in Reading view now save in notes that contain a stray carriage-return character above the block (SC-460); the sidebar also pins the right block in such notes. Nothing outside the block is changed.

- **DSE plugin: the "View on steelcompendium.io" link in the not-installed card now uses the plugin's teal-cyan link colour (SC-366).**
  When a referenced compendium entry is not installed locally, the card's link (and its external-link
  arrow) used to show in Obsidian's own purple-blue link colour; it now matches every other plugin
  link (print keeps its link colour). The card's blue left stripe is also gone, from this card and
  from the other compendium-reference notice card; both now have a plain border all round.

- Fixed: Draw Steel blocks inside a callout or quote now save their changes (Reading view, Live Preview callouts, and the sidebar); a block that can't be saved (one inside a list item) now says so with a notice instead of failing silently. (SC-455)

- Fixed: notes with Windows (CRLF) line endings now work with the Draw Steel sidebar (pinned blocks could not be found, so edits never saved), and DSE saves no longer leave a CRLF note with mixed line endings. (SC-453)

- **DSE plugin: Escape now backs out of the one thing you are in before it closes the window (SC-431).**
  In the Stamina and Temporary Stamina fields of the Stamina editor, Escape used to close the whole
  editor and throw away every pending change (a Damage you had just pressed, for example). Now the
  first Escape puts the field back to its last value and leaves the editor open with your other
  changes intact; a second Escape closes it. The same applies to the pool Stamina field in the
  initiative minion Stamina window, and to the Conditions window's "Add condition" dropdown (the
  first Escape closes just the dropdown instead of the whole window).

- **DSE plugin: the Stamina editor's Apply button now says exactly what it will apply (SC-427).**
  Typing a Stamina value above max or below the lowest allowed (with max 20 and 10 current, typing
  30) used to make the button promise more than it did ("Gain 20 Stamina" while only 10 was
  gained). The field now snaps to the allowed range when you commit it, the button states the real
  change (also while you are still typing), and the + / - buttons stop at the limits. A
  hand-edited Stamina that is already out of range no longer flips the controls: Damage never
  heals, Healing never damages, Kill and Full Heal never say "Gain" / "Lose" the wrong way round,
  a Damage or Healing that only brings it part of the way back still shows the change that really
  gets saved, and applying only a Temp Stamina change no longer quietly rewrites an out-of-range
  Stamina. An exponent in the Apply box such as "1e3" now counts as 1000 instead of 1 (also in the
  initiative minion Stamina window's damage and minion-count boxes), and Reset puts the Apply box
  back to 0.

- **DSE plugin: hovering a button now shows its explanation, not just its name (SC-324).**
  The hero Respite button, negotiation Complete Argument, the compendium migration's Sync
  without moving, a save-ends condition's Roll save and the initiative Advance round (with its
  Malice gain) each had hover text that was silently discarded, so the hover repeated the
  label. Each now has one full label (the name first, then what it does) that both the hover
  and screen readers use. Spend Recovery and the read-only Catch Breath keep their names when
  they show why they are disabled.

- **DSE plugin: Catch Breath no longer spends a Recovery for nothing, and a Recoveries marker
  click keeps keyboard focus (SC-428).** At full Stamina (or a recovery value of 0, max Stamina
  2 or less) Catch Breath stayed enabled and a click spent a Recovery for +0 Stamina; it is now
  disabled with a reason tooltip on the Stamina bar and hero sheet, and the Recoveries popover's
  "Catch breath" button is disabled with a reason in the same cases (plus no Recoveries / Dying).
  The Stamina editor's Spend Recovery says "Recovery value is 0" when that is the reason. After
  clicking a marker the arrow keys and Escape now work from the row, with no Tab first. A mouse
  click draws no focus ring. A keyboard Catch Breath that fills Stamina, or the popover's Catch
  breath pressed with the keyboard, hands focus to the row instead of dropping it. A hero with an
  unresolved class says "Max Stamina unknown", not "Recovery value is 0".

- **DSE plugin: clicking a hero's portrait in the initiative tracker now shows the acted
  frame immediately (SC-423).** The 2px light-grey metal frame used to appear only after
  something else re-rendered the tracker (adding a Malice log entry, for example); the seal
  badge showed at once but the frame did not. Un-clicking clears it at once too. The
  in-place repaint now stamps the same pressed state a full rebuild does, and the frame's
  CSS no longer depends on it. The initiative docs GIF is regenerated.

- **DSE plugin: the negotiation tracker is redesigned in the Steel style (SC-379).** Patience
  runs across and Interest runs down, both as numbered seals with the current value in solid
  teal; the tracker now says when the negotiation is over (final offer, deal, or hostile) and
  stops offering Complete Argument; tier results update the moment you pick a motivation or
  modifier; Motivations are marked spent from their card; argument results can no longer push
  Interest or Patience outside 0–5.

- **DSE plugin: power-roll tier rows are compact again (SC-378).** Each tier row
  (ability cards, statblocks, featureblocks, kits, negotiation, `ds-roll`) is back to
  about 50px for a one-line outcome, the same as the site, down from about 82px.
  SC-202's paragraph-spacing reset had added a full line of space above and below each
  outcome's text. Screen only; print was never affected.

- **DSE plugin: initiative tracker tweaks (SC-377).** The tracker can be named (a `name:`
  field or click the title to edit). Reset turns / Reset encounter state moved into the
  tracker's menu panel, and the round label + Advance round sit on the Heroes heading line.
  The Malice pool is an always-visible stepper, its quick-add submits on Enter and flags a
  missing field, and heroes and enemy groups share one seal-style turn mark. Typing into any
  in-card field (quick-add, counter, party award) now works with a plain mouse click.

- **DSE plugin: headings inside a card's markdown body are back to Obsidian's own
  heading sizes (SC-318).** A `######` heading no longer renders smaller than body
  text, the hero's CHARACTERISTICS region title is back to its pre-regression size,
  and a `###` heading gets its full top spacing back after a paragraph — screen now
  matches what print/export and a real Obsidian note already showed all along.

- **DSE plugin: external links now carry an arrow icon (SC-317).** Any plugin link
  that leaves the vault — an SCC link falling back to steelcompendium.io, the "not
  installed locally" reference card's link, a plain external link in card prose —
  now shows Obsidian's own external-link arrow, drawn by the plugin itself so it
  follows the link's teal-cyan color (and hover color) in both light and dark. Screen
  only; print is unaffected.

- **DSE plugin: Steel section titles ("Effect"/"Trigger"/"Special"/…) are now 15px
  with 1.8px letter spacing, so their letters match the site's height (SC-235),**
  because the site fakes its small caps. The boxed panel header on ability/feature
  cards, a statblock's nested features, featureblock and a kit's signature ability
  was 16px with 1.12px letter-spacing. The title's line-height and the Obsidian
  text-size slider still scale it the same way as before.

- **DSE plugin: the Sync and Check-for-updates buttons now show when a compendium
  operation is running (SC-243).** Previously both stayed clickable through a whole
  sync, so a double-click (or the command palette, or the "sync anyway"/"sync after
  migrating" choices) could start a second run underneath the first. The Settings
  Compendium row now disables both buttons the moment Sync or Check for updates is
  clicked — Sync reads "Syncing…", Check reads "Checking…" — and a second request
  from any entry point while one is in flight is refused with a Notice instead of
  starting. The buttons re-enable live if the settings window is left open through a
  sync, with no need to close and reopen it.

- **DSE plugin: option chips now show a visible keyboard focus ring (SC-338).** The
  Result chips on the "Log an action…" form and the icon/duration/effect choices in the
  Conditions dialog were the one control family that never joined the plugin's shared
  focus ring: a pressed chip showed no focus indicator at all, and an unpressed one only
  got Obsidian's own faint grey ring. Both now draw the same outlined ring every other DSE
  control uses, with the pressed chip's own bevel look untouched. Unpressed chips also
  drop Obsidian's own drop-shadow plate at rest and on hover, matching every other DSE
  button — they never asked for that plate in the first place, and this makes them
  consistent with the rest of the plugin.

- **DSE plugin: card-head names read at the site's own size, per family
  (SC-232).** Every card name — a kit head, a standalone ability card, a
  statblock band, a featureblock band, the GM project tracker — used to
  share one 20px rule regardless of family, well under the site's own
  per-family scale (the site gives a statblock name nearly twice the
  plugin's size). Names now match the live site's computed pixels exactly
  for each family: generic 27px, ability card 33.3px, statblock 41.4px,
  featureblock 37.8px, project 28.8px. At a narrow pane width (a card head
  480px wide or less) names step back down to today's shared 20px, so a
  narrow pane never reads worse than before.

- **DSE plugin: card heads now show their provenance, kind-noun, level and usage,
  matching the site (SC-232).** A trait or ability card's head was missing its
  lower-left provenance line — e.g. the "Determination" trait never showed "Human"
  — even though the synced entity already carried the field; the head simply
  never read it. Traits and class features now show ancestry/class/kit (+
  subclass); abilities show class (+ subclass), falling back to a kit's own name
  for a kit's own inline signature ability (a synced kit's nested signature
  ability doesn't carry its kit's name yet — filed as a follow-up). A plain class
  feature's left-eyebrow now correctly reads "Feature" instead of "Trait". A
  malice featureblock's left-eyebrow now reads "Malice" when the synced entity
  carries that kind, instead of falling silent. A statblock's left-eyebrow now
  reads its real kind ("Monster", "Companion", "Retainer", "Summon") instead of
  always showing its keywords, which moved to their own provenance line under the
  name. A standalone ability or kit signature ability's cost, level and usage now
  read where the site puts them — cost (or "Signature" for a kit's own signature
  ability) beside the name, level as its own chip, usage as its own chip —
  instead of a single mixed cost/type chip pair; a statblock or featureblock
  ability keeps its action type in the keyword band (the site's own placement),
  and its cost now reads beside the name. The book's own "Signature Ability"
  wording is shortened to "Signature" to match.

- **DSE plugin: print preview is readable in a dark-theme vault (SC-127).** It now draws
  its own white page with black text, like the PDF export, instead of inheriting your
  Obsidian theme's dark colors.

- **v2 site: the display face is now Cinzel, at the weight the design always wanted
  (SC-325).** Forum had a single 400 weight, so every heading's boldness was faked
  with an outline — and an outline is the wrong tool, because one thickness never
  suits both a 96px page title and a 25px band title. Cinzel is a variable family, so
  headings now use a genuine 900 and the outline is gone. The 900 is deliberate: the
  target is Beaufort, the face the site was originally designed around and the closest
  match to the MCDM book, which is far heavier than Forum ever was. Headings are sized
  to restore Beaufort's exact line breaks. The Settings panel's heading-font choices
  list Cinzel in Forum's place.

- **Display headers: the outline now scales with size (SC-315).** The Forum display role painted a fixed 2px stroke on every header, from the page title down to 32px card heads, so card names and the goal numeral looked bloated. The stroke is now 0.02em, unchanged on the page title and a hairline on card heads and stat values.

- **DSE plugin: the light color scheme has its own, darker status colors, and three
  color-only signals now show a hover tooltip (SC-196).** Every color-coded state —
  Stamina healthy (green), winded (amber), dying (red), and temporary Stamina (purple);
  the critical-hit power-roll badge (gold); malice and victory points
  (gold); warnings (orange); and the initiative tracker's selection ring (red), plus the turn-done and danger accents that share those colors — used to
  reuse the dark scheme's exact colors in light mode, where several were too pale to read
  reliably against a white background. Light mode now has its own darker version of all
  eleven, checked against the WCAG AA contrast minimum; the dark scheme is unchanged. Three
  of those surfaces had no other way to tell the state apart by eye: hovering the `+N`
  temporary-Stamina badge, a selected creature in the initiative tracker, or a rolled
  power-roll result row now shows a tooltip naming what's highlighted, in words.

- **DSE Montage Test tracker cleanup (SC-334).** The "Log an action…" form is down to
  Result, Skill and Note: the hero and round come from the cell (or button) that opened
  it and are named in its title, so the form can no longer silently move an entry to a
  different hero or round; the "success starts at" tier reminder and the Roll row are gone
  (the Test tiers strip above the board still has the tiers). The form no longer clips its
  right edge behind a sideways scrollbar, and "Set limits…" no longer cuts off the focus
  ring on its first field. A new **Back to round N** button steps the montage back to the
  previous round without removing anything logged — also offered when a montage ran out of
  rounds, never once a limit is reached. "Log an action…" greys out once every hero has
  acted in the round in play, instead of quietly logging a second, invisible action for the
  first hero. In the outcome band, filled failure slots are now red, with the same light
  gradient as the filled success slots; the last slot of each track no longer wears a
  bright white end-cap; and a montage that ran out of rounds no longer reports one more
  "round used" than it has.

- **DSE Montage Test tracker: the quick-entry trio is back, and past rounds are now
  editable from the board (SC-299).** An empty cell in the round currently in play once
  again carries the three one-click buttons (log a success, a failure, or an assist with
  no skill/note) that the settled design always called for; a spec omission had left the
  board wired only to the full "Log an action…" sheet. An empty cell from an earlier round
  is now a click target too, opening the same sheet pre-filled for that round, so a
  Director who forgot to log a hero's test can add it after the fact instead of being
  stuck.

- **DSE conditions (SC-277):** Standard and custom conditions support saved icon choices with search and reset to default. Color swatches now display their colors in Obsidian.

- **DSE plugin: every display family now renders a full Steel card, not a prose wall
  (SC-120).** Kit was the only family with a Steel composition; the other ten (class,
  career, ancestry, culture, title, perk, complication, treasure, condition, rule) fell
  back to a plain bold title, pill badges, and a loose label/value list. Each family now
  renders its site counterpart's composition: crest + small-caps family label in the
  head, stat-tile strips (class Basics/Potency, career's four-slot benefits row,
  treasure's two-slot Project row), and structured bands (Benefit/Drawback,
  Prerequisite/Effect, Skill Options, per-tier treasure level effects). Body lines a band
  replaces are stripped by band-gated, segment-aware stripping that never deletes content
  it cannot replace — which also fixes the treasure card's double-rendered Project
  values. Base (non-Steel) renders stay byte-identical; all 24 frozen steel-print
  hashes were individually approved and swapped at landing.
- **DSE plugin: the Draw Steel sidebar gets a fix round — pin/unpin from the chrome menu,
  panel headers, an empty state, and layout that actually persists (SC-184).** The sidebar
  shipped in 7.0.0 as a one-panel MVP: the only way to add a block was a cursor-gated
  command invisible in Reading mode (the only mode elements render in), there was no way to
  remove a single panel short of closing the whole leaf and losing every one, panels were an
  unlabeled unseparated stack, and the ribbon icon opened straight into a blank, unexplained
  div. All fixed: every chrome-bearing block's **⋯** menu now offers **Pin to sidebar** in a
  note and **Unpin from sidebar** once it's there; each panel gets a header naming its
  element and source note (clickable back to the note); a pinned/removed panel now actually
  survives an Obsidian restart (`requestSaveLayout` was never called before); an empty
  sidebar explains what it's for; and a broken panel (unknown element, deleted or renamed
  note) gets a dismiss button instead of sitting there forever. The docs also drop the "your
  tracker, but persistent" pitch in favor of the honest one — a GM dashboard assembled from
  blocks that live in **different** notes — and now say plainly that a pinned note tab is
  the better tool when everything you track already lives in one note.
- **DSE plugin: the Montage Test tracker is now a working board (SC-191).** A full visual
  overhaul of `ds-montage`: a grid of one row per hero and one column per round, a **Log
  an action…** button (plus a per-row shortcut and a click on any cell) that opens a small
  form to log or correct a hero's test — result, an optional skill, and a note, with a
  live reminder of each difficulty's success threshold and, when rolling is on, a **Roll**
  button that resolves the test for you. A collapsible cheat-sheet above the board and a
  collapsible guide at the foot cover the test tiers and how a montage runs. The schema is
  purely additive (`description`, `entries[]`) — an existing block renders unchanged, no
  migration needed. See the [plugin's own changelog](draw-steel-elements/CHANGELOG.md) for
  the full detail.
- **DSE plugin: buttons finally look the way the plugin designed them (SC-203).** In a real
  vault, Obsidian's own `button` styling was overriding ours on **every** button — its rule is
  more specific than the plugin's, which nothing had noticed because the screenshot harness
  renders the plugin with none of Obsidian's CSS present. The visible cost: accent buttons like
  **Roll** lost their accent fill and rendered as dark plates with a thin outline, "ghost"
  buttons rendered as filled grey plates instead of transparent ones, every button's text
  colour came from Obsidian rather than the Steel palette, and a forced height *crushed* the
  taller controls — the initiative roster cell rendered at 30px instead of 108. All of it is now
  re-grounded, and a new check asserts every button is unaffected by Obsidian's styling, so this
  class of drift can't return unseen.
- **DSE plugin: card borders no longer fade at their corners (SC-204).** A shared corner-radius
  token is expressed in `em`, so it silently resolved to a different size for each element that
  used it — anything sitting flush inside a rounded parent could round *differently* from the
  parent and either paint over its border or expose the surface beneath. Two real cases: the
  initiative turn button chewed its own hairline at all four corners, and the hero region strip
  cut the corners off its own fill. Both fixed, the token is now documented as the chip/control
  radius with plates naming their own, and a new geometric check covers every element in both
  colour schemes.

- **DSE plugin: the note no longer jumps to the top when you click inside an element (SC-198).**
  Clicking anything that changes a value — an action pip in a long initiative tracker, a stamina
  control — made the note scroll back to its title. The cause was never the plugin's own
  rendering: *any* write to a file makes Obsidian rebuild the whole reading-mode preview, which
  collapses its height placeholder, and the browser then clamps the scroll position to zero. A
  note dominated by a long tracker always clamped. The plugin now holds that placeholder's height
  across its own writes, so the scroll position is **never lost** rather than lost and restored.
  Measured at zero drift across single and repeated clicks. The brief flash on click and the loss
  of keyboard focus are unchanged — those need Live Preview support, which is tracked separately.

- **DSE plugin: the font-size sweep, part 2 (SC-185).** Six of eight audited categories moved
  onto the `--dse-fs-*` role scale, so text that was pinned to Obsidian's *interface* sliders
  or to absolute `rem`/`px` now tracks the plugin's own type settings. Visible effects: the
  roll bar and roll-card small print drop 16px → 12.8px (they had been inheriting an
  interface size applied to note content); the statblock item value settles 30px → 28px; the
  initiative cell readout lands on 13.6px. The stamina numeral now rides the Large-text knob
  it had been ignoring, with no pixel change. Two categories were deliberately declined —
  the stamina-editor modal (documented as interface furniture) and the statblock sticky
  header (converting it collapsed the value/label hierarchy). Declarations on the role scale
  rose 55 → 98 and the shrink-only allowlist fell 62 → 26. Freeze baseline: sanctioned
  94-line rebaseline (47 capture pairs), count unchanged at 210.

- **DSE plugin: `taunted` is a real condition again (SC-197).** The plugin filed taunted
  under its *pseudo*-conditions list — the bucket for things it draws with the same chip UI
  but that aren't rules conditions (marked, hidden, winded, and so on). Nothing user-visible
  changes today beyond taunted sorting with the other eight in the add-condition dropdown,
  because every consumer already merged both lists. The point is forward-looking: anything
  that treats "the conditions list" as authoritative was silently getting eight of nine, the
  exact trap that would have dropped 16 abilities from SC-90's site filter.

### Internal

- **Parity gate now catches wrong-polarity backgrounds (SC-126, step 1).** The plugin/site
  parity harness sampled `background-color` on both sides but never compared it, so an entire
  defect class — a translucent *white* wash where the site uses translucent *black* — passed
  the gate green across 13 declaration sites. A new `bg-polarity` rule flags opposite-family
  backgrounds, proven against the real historical values from that defect (it goes red on them
  and green on today's tree, and both are pinned as tests). Full value comparison remains
  deliberately out of scope; it needs a tolerance model, since some pairs vary alpha by design.

- **DSE plugin: "Flat List" feature style now matches the site (SC-188).** In flat mode
  the plugin still drew the action-type colored spine down each feature's left edge —
  a bar the v2 site never draws in that style, so the setting didn't produce the look it
  advertises. Flat features now carry no spine and rely on the HFS separators between
  them, exactly as the site renders them; card style is unchanged. (An earlier fix round
  had only squared the bar's corners, acting on an assumption its own comment recorded
  as fact.) Freeze baseline: sanctioned 4-line rebaseline, count unchanged at 210.
- **DSE plugin: the settings preview is a full-height sample, not a porthole; Features
  get their own settings page (SC-187, SC-193).** The preview pane was docked to the
  bottom of the settings page and therefore height-capped — 350px showing a 3646px
  statblock, its own scrollbar nested inside Obsidian's, and on some pages the *only*
  scrollbar on screen. Worse, it never scrolled far enough to reach a feature card, so
  four settings (Feature style, Feature columns, Keyword display, Distance+target)
  changed content you couldn't see. The dock is gone: the sample sits in the page flow
  at its natural height, one scroller per page, with a shorter canned statblock chosen
  so every setting on the page visibly moves it. Separately, two preferences that have
  always affected standalone Features were filed under Statblock display; they now have
  a **Feature display** page of their own (still part of the statblock preset, so
  nothing changes for existing vaults).
- **Filter abilities by condition (SC-90).** The feature Search & Filter page gained a
  **Condition** chip row — bleeding, dazed, frightened, grabbed, prone, restrained,
  slowed, taunted, weakened — so "show me everything that deals with *prone*" is one
  click (44 abilities), and it combines with the existing Type/Source/Level/Action/
  Keyword facets and the any/all toggle (prone **and** slowed → 1). Every ability card
  now chips the conditions it involves, so a filtered result shows on its face why it
  matched. A condition counts when it appears in the ability's **rules text** —
  whether the ability inflicts it, requires it, or removes it; flavor text doesn't
  count, so Assassinate's "an already weakened foe" and Accelerate's "the world has
  slowed down" stay out of those lists.
- **DSE plugin: the initiative tracker wears the stamina instruments, and the portrait
  is the turn control (SC-183).** Every hero row and expanded enemy row now mounts the
  real stamina bar — state word, big readout, temp plate, forged gauge — on a rebalanced
  row (bigger portrait, the gauge and its numeral on one line); collapsed enemy cells get
  a mini gauge under their numbers. The dedicated turn checkbox is gone from the screen:
  **click a combatant's portrait to mark their turn taken**, which stamps a struck steel
  seal into the portrait's corner and reads the whole row as spent — while every control
  on that row stays fully usable, because the Director still edits Stamina out of turn.
  WINDED/DYING moved into the conditions row as word-chips. Squads gained real support:
  **multiple minion squads per group**, Stamina pools that resolve per squad, and a
  captain badge that is itself the one-click control for promoting or relieving a captain
  (GitHub #67). Two rules bugs fixed along the way — a squad pool no longer shows the
  "winded" frame (minions can't be winded), and monsters show DEAD rather than "Dying"
  (dying is hero-only). Print keeps the checkbox, since paper has no portrait to click.
  Freeze baseline 196 → 210 (additions-only widening; no existing shot moved).
- **DSE plugin: the card's border no longer fades away at its top corners, and the element
  menu panel is properly seated (SC-189).** Three separate defects, all found because the
  reported symptom ("the panel feels detached, almost 1 pixel too low") kept surviving fixes.
  The panel's glyphs are real buttons, so Obsidian's own button rule reached them: it painted a
  five-layer plate shadow that spilled onto the card's top border, and it forced a 30px height
  that made the panel a slab in every real vault while the in-repo screenshots showed 24px. Both
  are now re-grounded, and the glyphs gained breathing room. Separately — and visible with the
  panel not even shown — a statblock's or featureblock's header band rounded its top corners
  tighter than the card itself, so the band painted straight over the card's 1px hairline for the
  whole curve of each corner: the top edge and right edge read fine and the corner between them
  dissolved. The band now derives the card's own radius and the hairline runs unbroken. The panel
  also gained a subtle inset so the card reads as sitting slightly in front of it.
  *Internal:* the visual battery now injects Obsidian's real button rule and measures the corner
  arc against each card's own straight edges, on every family in both schemes — the previous
  check sampled two points that were both on the straight edge, which is why this shipped three
  times.
- **DSE plugin: font sizes are a named scale you can tune, not scattered literals
  (SC-185, part 1).** The plugin's type sizes were 116 hand-written values across 30
  distinct numbers, so "a label" was a different size in every element. They now come
  from nine named roles — heading, subheading, numeral, body, control, secondary, label,
  caption, micro — and three new Typography sliders retune them against your own theme:
  **Small text size** (labels, captions, hints, log lines), **Large text size** (card
  names, band titles, display numbers) and **Control text size** (buttons, steppers,
  tabs), each 80–120% with the live preview reacting as you drag. Every size is stated
  as a *ratio* to your theme's own text size rather than in fixed pixels, so changing
  your Obsidian font size carries the whole plugin with it. Defaults are today's exact
  sizes — nothing moves until you move a slider. *Internal:* the rule that new CSS must
  use the scale is enforced by a build test, not just documented, and the remaining 106
  pre-scale declarations are inventoried for the round-2 sweep.
- **DSE plugin: buttons and other controls are no longer oversized, and the type-scale
  sweep continues (SC-185, part 2).** A bare button ("Reset Encounter State" and
  friends) rendered about 23% larger than a native Obsidian button beside it — the
  complaint that opened the ticket. `--dse-fs-control`'s default is now `0.85em`
  (13.6px at a 16px note, within 0.6px of Obsidian's own 13px), so every
  un-contextualised control shrinks to match. *Internal:* 44 more of round 1's
  inventoried declarations were moved onto the named-role tokens — a pure rename, proven
  byte-identical (freeze 210/210, shots byte-identical across two runs); 62 remain, of
  which 8 are separate, deliberate scale systems and the rest are real rendering changes
  queued for Scott's review.
- **DSE plugin: one Conditions manager modal replaces the picker + Customize pair
  (SC-186).** A vertical list of the *active* conditions (duration/effect badges,
  inline cog editor, per-row delete) with an autocomplete "Add condition" input —
  typing filters the catalog and any novel text becomes a custom condition with a
  fallback glyph. Conditions gain a first-class `duration` (`eot` / `save-ends` /
  `eoe`); the old modal's bug that silently erased hand-authored durations on save is
  fixed. Full independent-review pipeline: 4 HIGH + 5 MED findings fixed and
  probe-verified before landing.
- **DSE plugin: `ds-skills` is a High-Fantasy Steel element with three layouts
  (SC-182).** The two-viewport plain checklist gives way to a `style:` YAML choice —
  `ledger` (recessed codex-niche grid, the new default, ~2.9× shorter), `chips`
  (forged owned-chips against ghost chips, whole catalog in ~one viewport) or the
  classic `list` — plus a menu-panel eye button that shows/hides unowned skills
  per block (YAML `only_show_selected` seeds it). Print/PDF always keeps the classic
  checklist form.
- **DSE plugin: the character-sheet elements are forged cards, and characteristics
  are the statblock's own rail (SC-152).** Characteristics, Values row, Heroic
  resource, Surges, Hero tokens and Conditions all rendered as bare text; they now
  carry the same forged plate every tracker has, so a sheet reads as a set of
  matching panels (heroic-resource/surges also got a dead-selector repair that
  restores their intended padding + bold label). The characteristics element goes
  one further: it renders the statblock's own characteristics rail — same code,
  same CSS, same signed values, following the same two Characteristics display
  settings — because they are exactly the same five numbers; the hero sheet's
  Characteristics region does too. `ds-skills` is deliberately left bare — it
  needs a real overhaul, not a frame (SC-182). Freeze baseline: sanctioned
  10-pair rebaseline, count unchanged at 196.
- **DSE plugin: inner features get real breathing room (SC-168).** A feature nested
  inside a standalone ability/feature card rendered flush against its parent card's
  edges with no frame of its own; it now wears the same nested-card treatment
  statblock/featureblock sub-features already have — its own rounded plate, proper
  insets, and the action-type spine as the card's left edge. Screen-only; print and
  the frozen shot baseline are byte-unchanged.
- **DSE plugin: the initiative tracker's round/Malice controls become a command bar;
  encounter/initiative spacing overhauled (SC-154); broken portraits get themed
  placeholders (SC-162).** The round counter, its two controls, the Malice pool,
  quick-add and log used to hang off the right of the "Enemy groups" heading, leaving
  the left half of that band empty; they now form a single full-width bar between the
  heroes and the enemies — round state at the left edge, Malice at the right, the log
  folded into a "Malice log · N entries" disclosure that opens a full-width drawer,
  stays open across edits, always prints open, and stacks to one column in a narrow
  pane. (Scott picked this "command bar" from three fully-built candidates on the
  ticket.) Underneath it, the whole tracker got a measured spacing pass: both tracker
  roots carry the standard tracker padding, hero rows got real card insets with the
  turn checkbox built inside the row, buttons wrap as whole units, the quick-add inputs
  fit their placeholders, and the encounter roster scrolls at sidebar width instead of
  losing columns. Imageless combatants show a themed shield (heroes) / skull (enemies)
  glyph instead of the browser's broken-image icon (SC-162). Freeze baseline 182 → 196
  (sanctioned 4-pair rebaseline + 7 new capture ids).
- **DSE plugin: every card element gains a standard hover menu and one-line collapse
  (SC-169).** Point at a statblock, ability card, hero sheet or GM tracker and a small
  icon-only panel appears at its top-right corner, seated on the card's edge — always a
  collapse control, plus the edit pencil when that setting is on. Collapsed, an element folds
  to a single line carrying its type, its name and an expand button ("STATBLOCK: Goblin
  Stinker", "ENCOUNTER: Ambush at the Ford (EV 42)"); a compendium reference resolves to the
  entry's real name rather than showing its code. Three block keys (`collapsed:`,
  `collapsible:`, `collapse_default:`) plus two global defaults control it; a collapse is
  remembered for the session and never edits the note, and the panel is absent from print and
  PDF export — a collapsed element prints in full. Always visible instead of hover-revealed on
  mobile. The stamina bar's own "Stamina Bar" disclosure header is retired in favour of it.
  The panel is now a design-language component ([`DESIGN.md`](DESIGN.md) → "The element chrome
  panel").
- **DSE plugin: compendium insert commands fixed; the starter hero is no longer broken
  (SC-147, SC-148, SC-156).** "Insert compendium block" no longer double-wraps a reference
  (SC-147) and the two insert-command failures are pinned by regression tests (SC-148).
  The `ds-hero` starter block every user gets from "Insert element" shipped two placeholder
  ability codes, so every new hero began with unresolvable abilities (the origin of the
  SC-141 report); it now ships two real Fury abilities, and a test resolves every code in
  the shipped example against the real compendium so a placeholder can't ship again.
  Docs screenshots refreshed; the docs-screenshot pipeline now refuses to run on the
  developer's own display.
- **DSE plugin: PDF export and Ctrl-P print now use the print scheme (SC-170).** Real
  printing kept the full Steel card plate (gradient, border, radius, shadow, boxed stat
  cells) — only the on-screen "print preview" toggle ever showed the neutral print look.
  Both now render identically (verified on a real Obsidian PDF export: white ground, square
  corners, thin frame, no shadow), and the print-preview twin is also fixed in light-theme
  vaults (Obsidian's exporter forces light). Harness gains a real-print capture class
  pinned byte-identical to the preview twin (freeze 72 → 144 lines).
- **DSE plugin: statblock/featureblock headers and power-roll tier washes render again in
  the app (SC-171).** Obsidian's engine (Chromium 106) silently dropped every Steel surface
  whose enhanced `color-mix()` declaration used a `var()` — the static fallback authored
  beside it never survived — so statblock and featureblock headers lost their background
  and rule, the notch halos vanished, and the four power-roll tier washes were missing.
  All eight are now behind proper `@supports` gates; the harness (modern Chromium) is
  byte-identical, and a source-scan test rejects the pattern (two-sided: gate AND fallback
  required; `not()`/`or` gates rejected).
- **DSE plugin: statblock sticky mini-header (SC-160).** While a statblock's own header is
  scrolled out of view, a compact bar with the monster's name and core stats pins to the top
  of the pane (Reading view, sidebar in a compact form, popout windows); inert on canvas
  and in print/PDF. Two new settings, both ON to match the site: "Sticky mini-header" and a
  dependent "↳ Sticky mini-header: include secondary stats" (Immunity/Weakness/Movement
  row). Documented limits: no bar inside callouts (they don't scroll); the bar briefly
  covers a strip of following text at the very end of a statblock. Real-Obsidian
  verification of this feature also surfaced SC-171 (color-mix fallbacks inert on the
  app's Chromium 106 — statblock header loses its background there today).
- **DSE plugin: compendium links work in Live Preview and Source mode (SC-135).** A
  `scc.v1:` link typed into a note used to prompt "open external link?" and then do
  nothing outside Reading view. Clicking one now opens the compendium note everywhere
  (Reading view, Live Preview, Source mode, popout windows), with Ctrl/Cmd- and
  middle-click for new tab/split, matching Obsidian's own conventions (in raw-syntax
  view a plain click just places the cursor). Backlinks/graph still don't see these
  links, and links inside code spans behave slightly differently while editing — both
  spelled out in the docs (SC-166 tracks the sync-format option; FOLLOWUPS #72 the
  code-span nuance).
- **DSE plugin: "Open in sidebar" no longer duplicates the initiative tracker or wipes
  live combat (SC-153).** Pressing the encounter's sidebar button now binds to the tracker
  block the note already has instead of appending another (and, in the fix's first cut,
  regenerating it — which would have reset round/HP mid-combat; the review caught that).
  A user-deleted tracker regenerates cleanly with exactly one sidebar panel. The tracker
  is a snapshot: encounter edits don't flow into it (docs say so; SC-167 tracks a re-sync
  action).
- **DSE plugin: homebrew snapshots no longer paste a duplicate you can't edit (SC-165).**
  "Insert compendium block" (the copy-and-edit snapshot) used to include the entry's
  `metadata:` block — for an ability, a second copy of most of the entry whose edits never
  changed the rendered card. Snapshots now drop it (an ability snapshot roughly halves);
  synced compendium files are unchanged. Pinned by tests that render the snapshot and the
  original synced block byte-identically.
- **DSE plugin: the "legacy" theme is gone (SC-144).** The Steel look is now the only look.
  The Theme row leaves Settings → Appearance, and a beta vault that had chosen Legacy is
  moved to Steel silently on next load. No released user is affected — the picker only ever
  existed in unreleased 7.0.0. Print and PDF export are byte-for-byte unchanged, as is
  every Steel surface: all 200 Steel screenshots are identical before and after. The visual
  freeze baseline retires from 200 to 66 lines (print only), removals-only, with no hash
  changed.
- **Site: crest glyphs optically centered (SC-129)** — the shield-crest icons across
  browse cards, category headers, folder/kit tiles, ability/trait cards and preview lists
  sat 0.4-1.5px off the shield's optical center; nudges are now measured (polygon-erosion
  pixel audit), verified in both schemes and across card-scale/zoom settings.
- **Plugin: hero sheet grid panels hug their own content (SC-107)** — Characteristics /
  Conditions / Skills (and any sparse region sharing a row with a fuller one, e.g.
  Stamina) no longer stretch to their row's tallest neighbour and show a slab of blank
  space below a couple of lines of content; Steel-scoped fix, Legacy is unchanged.

### Internal

- **SC-4 (D2/D3 polish) audited to closure** — the six code items on the ticket's list
  were re-verified against current `draw-steel-elements` main (97c71d2) rather than
  assumed stale: five were already fixed by earlier D3/D4 commits and by SC-4's own prior
  session (`b1d33a0`, 2026-07-18) — the kit `head:''`→`false` normalize (`a1945bf`),
  `aria-selected` on role-less divs (`ConditionSelectModal.ts`, `b1d33a0`), the
  cardHead-contract test's `.dse-head {` grep (now anchored `^\.dse-head\s*\{`,
  `cardHead.test.ts:154`), kit-index color-function scan symmetry
  (`kit-index.test.ts:116,135`), and `void prefs.set` hardening (every call site is now
  `.catch`-ed or `await`-ed, `theme.ts:108`). `CodeBlocks.ts` and `labeledIcon` were
  confirmed production-import-dead (only two test suites still import `CodeBlocks.ts`, as
  an intentional byte-compat oracle; `labeledIcon` is fully gone). The provisional Steel
  taste-calls item closed separately as SC-106 (2026-08-04). One item stayed open: whether
  Legacy prints should mute their tier/stamina fill colors to fully monochrome — that's a
  taste call for Scott, tracked on the ticket rather than decided here. No code changed;
  full battery reconfirmed green (tsc clean, jest 2414/156, shots 229, freeze 137/137,
  parity 0/0/16).

### Added (pending plugin 7.0.0 release)

> The plugin major below was drafted as "6.0.0". That number is **retired** after the
> `6.0.0-rc1` incident (an RC published as a regular release; `6.0.1` was cut as a
> recovery re-release of 5.1.1). It ships as **7.0.0** — see the plugin CHANGELOG.

- **Stamina cluster redesigned for the Steel theme (SC-132)** — the bar, temp Stamina,
  Recoveries, Winded/Dying and Catch Breath are one forged instrument: a state crest
  whose glyph breathes when Winded and falters when Dying, big current-Stamina numerals
  with a temp chip, and a gauge whose zero is a marked bulkhead (green is Stamina you
  have, red is how far past zero you are — never the same pixels) with temp as a real
  segment past the pour. Recoveries became editable by clicking a marker, with an Undo
  on every change; the hero sheet's duplicate `− 31 +` row is gone and its bar opens the
  editor instead. Closes the last child of the High-Fantasy Steel overhaul (SC-97).

- **Plugin: pre-7.0.0 compendium links survive the reorganisation (SC-125)** — the
  data-unified switch renames every compendium file, which would have broken every
  user-authored `[[wikilink]]` into it. The plugin now ships a reviewed old-path →
  new-path map (3,290 entries across all 243 data-md-dse releases; 2,036 of the final
  release's 2,443 paths, 83.3%) and replays it through `FileManager.renameFile`, so
  **Obsidian** rewrites the links — the plugin never edits a user note. Dry-run preview,
  abortable, resumable (each move is recorded *before* it happens, so even a force-quit
  strands nothing and the next sync re-offers rather than silently closing the door),
  and it cannot delete or overwrite anything. Declining does not fall through
  into a sync — a sync creates the new files and makes the move impossible, so that is
  its own labelled choice. Before anything moves, every file whose bytes differ from the
  release it came from is copied into a backup folder beside the compendium (Scott's
  approval condition), and a file that could not be copied is not moved. Every skipped
  or flagged path is listed in the dialog and in a report note written into the vault; unmapped paths are enumerated with reasons in
  the plugin's `docs/compendium-migration-map.md`.

- **Encounter builder → initiative tracker fixed (SC-134)** — builder-generated tracker
  blocks (SCC-code statblock refs) render again instead of an error card; pre-existing
  generated encounters recover with no edits.
- **Draw Steel Elements plugin 7.0.0** — compendium sync now pulls from data-unified
  releases instead of the retired data-md-dse repo, is non-destructive and
  manifest-driven (only plugin-installed files are ever updated or trashed), and
  resolves `scc.v1:` links throughout compendium notes and element text. Statblock YAML
  adopts the SDK 3.x `role`/`organization`/`keywords` fields (legacy `roles`/`ancestry`
  keys still work through the 7.x cycle with a deprecation warning; support is removed
  in 8.0.0). Re-sync your compendium after updating.
- **DSE compendium reference family (D6)** — eleven new plugin elements (`ds-kit`,
  `ds-ancestry`, `ds-culture`, `ds-career`, `ds-class`, `ds-title`, `ds-perk`,
  `ds-treasure`, `ds-complication`, `ds-condition`, `ds-rule`), reference-by-SCC for
  statblocks/features/featureblocks, compendium search/insert commands, and the
  `CompendiumIndex` typed-entity API.
- **GM subsystems (D8)** — a persistent Draw Steel sidebar panel; an Encounter Builder
  (`ds-encounter`) computing live EV/budget/difficulty from the synced compendium;
  `ds-montage`/`ds-project`/`ds-party` trackers; the initiative tracker's Malice pool
  as a first-class panel plus a per-turn action checklist.
- **Hero suite (D7)** — flagship hero sheet (`ds-hero`) plus standalone
  conditions/resource/surges/tokens trackers; stamina recoveries, winded/dying badge,
  Catch Breath.
- **Steel theme, High-Fantasy Steel port (SC-10)** — the plugin's Steel theme now
  matches the steelcompendium.io look (forged cards, embossed serif titles with bundled
  Source Serif 4, crest badges, role-tinted statblock plates, teal links); the original
  look remains available as the Legacy style.
- **Steel material parity (plan 20)** — the plugin's Steel theme now carries the site's
  actual material treatment (sheen/bevel/hairline on card plates, section heads and the
  ability cost chip; tier-coloured power-roll washes; role and malice header bands; crest
  accent) rather than an approximation of it. It also adds a developer-run site-vs-plugin
  parity check (`npm run parity` in `draw-steel-elements`): it diffs the plugin's computed
  styles, in both colour schemes, against a committed capture of the live site's, over 12
  mapped selector pairs, and fails when a surface the site forges renders flat. It is a
  narrow instrument on purpose — **not wired into CI** (see FOLLOWUPS #36), covering 5 of
  the 32 element families, asserting flat-vs-forged only and never exact colour,
  typography or pseudo-elements. The jest material contract
  (`test/dom/theme/steelMaterial.test.ts`) pins the same declarations offline and does run
  in CI. The pair makes a wholesale flattening loud; it does not make the plugin
  pixel-identical to the site, and drift within those blind spots can still pass.
- **Steel typography, spacing & ink parity (plan 21)** — the plugin's Steel theme now also
  matches the site's body **type, spacing and ink** on the same card families (feature/
  ability, statblock, featureblock, card-ref/condition, and the shared head/row/band
  primitives): body and label text is routed to a serif face, opened to the site's
  line-height and card/head/row/band spacing, and given the site's cooler ink. The parity
  check was widened to measure type, spacing, ink and letter-spacing alongside material
  across the same 12 selector pairs (~5 of 32 element families), both schemes — still
  **not wired into CI** (FOLLOWUPS #36) — and a second offline jest contract
  (`test/dom/theme/steelTypography.test.ts`) pins the serif route, the ≥1.6 body
  line-height and the ~24px card inset. Two deliberate limits: the site's licensed slab
  (BerlingskeSlab) can't be bundled, so the plugin uses a free serif (Source Serif 4) — a
  serif, not that exact slab, and only its 600/700 weights ship, so body copy reads a
  touch heavier than the site's; and this is **only** the shared card families. It does
  **not** cover the plugin-only families, nor the deferred structural rebuilds — the kit
  stat-tile grid (FOLLOWUPS #32, needs its own plan against the print/legacy freeze), the
  featureblock option layout (#33), the feature action spine (#34) and the statblock notch
  (#35) all remain as they were. Bundling the slab is a possible future upgrade.
- **Steel body-text coherence (plan 22)** — plan 21's body-type routing above reached only
  the shared card families; every plugin-only family (hero sheet, encounter, negotiation,
  montage, initiative, project, party, and the rest) still rendered a serif card head next
  to a sans body/label/control, reading as two different type systems in the same note.
  The routing now lives on a single Steel-theme-root selector (every `[data-dse-element]`
  host) instead of a four-family allow-list, so body text, labels, table cells, sub-headers
  and chips are serif and open-line-height everywhere Steel is active. One exclusion was
  written to keep numeric stepper/counter values (hero stamina/ferocity/surges steppers,
  montage/initiative trackers, the standalone counter) in their prior, non-serif
  rendering. [Correction, SC-112: that exclusion quietly died during SC-105's font-slot
  rename — its token chain went invalid at the root and steppers silently rendered serif
  under Steel, unseen by the freeze (which covers legacy+print shots only). Scott's
  SC-112 ruling makes the serif deliberate: Controls default to "same as Body" — see the
  SC-112 bullet below.] The encounter head's numeric `EV n / n` chip now
  takes the exact same serif small-caps treatment as every other chip — a fully uniform
  chip family, with no numeric-content exemption — so its digits render at small-caps cap
  height, a Source Serif 4 `smcp` behavior; this is accepted as the correct look, and the
  old sans rendering's big-digit emphasis is gone by design. `steelTypography.test.ts`
  gained a dedicated contract test that locks the *shape* of the selector (every element
  root, not a named list) independently of the existing font-value assertion, so a future
  edit can't quietly re-narrow the routing without failing the suite. Same honest limits as
  plan 21: screen-only (print/export and Legacy are untouched), serif-not-slab, and only the
  600/700 weights ship. No parity-gate coverage exists for the plugin-only families (they
  have no site counterpart in the 12 mapped pairs), so a shot-read remains the primary
  visual guard for this surface.
- **Steel modal theming (SC-104)** — DSE's modals (stamina edit / Spend Recovery,
  condition pickers, the form editor, and others) now follow the active theme too:
  Steel renders the forged treatment (title emboss, sunken sections, forged footer
  buttons) instead of unstyled defaults, and Legacy modals are unchanged.
- **Steel body-text true weight (SC-105 face decision)** — the Steel theme now bundles
  Source Serif 4's Regular (400) weight alongside the existing 600/700, so body and
  label prose render at their real book weight instead of being mapped up to the
  bundled 600 (SemiBold) face for lack of a 400 — the "reads slightly heavier than the
  site's" gap called out in plan 21/22 above is closed. Titles are unaffected (they set
  600/700 explicitly). Screen-only, same scoping as the rest of the Steel typography
  work: Legacy and print/export are untouched. Adds ~20KB to the bundled font payload.
- **Steel kit card stat-tile rebuild (SC-100 / plan 24)** — the plugin's Steel kit card
  (`ds-kit`) now renders the site's composition instead of a label-value list: a crest and
  kind eyebrow head ("Martial/Magic/Psionic Kit"), a boxed Equipment panel, and Kit
  Bonuses as the fixed two-row stat-tile grid with "—" dash tiles for absent bonuses; the
  signature ability keeps the plugin's richer full inline ability card (site convergence
  filed as SC-115). Structurally this is the plugin's first theme-conditional DOM: an
  optional `CardLayout.steel` composition slot, branched once at mount and re-rendered on
  a live theme switch, while the Legacy theme keeps the old DOM verbatim (all frozen shots
  byte-identical; the single sanctioned freeze change is the `kit--steel-print.png`
  one-hash rebaseline, approved by Scott's visual gate 2026-08-03 and applied at landing).
  A gate-round finding worth keeping: the site's dark-mode tile richness is the card's own
  gradient bleeding through **translucent-black** fills — the plugin's
  `--dse-surface-sunken` 6%-white wash was occluding it (two selectors fixed; the pattern
  seeds SC-117's dark-mode audit). Remaining display families (class/career/…) are
  sequenced as SC-120; site-side kit gaps filed as SC-115/SC-116/SC-119.
- **Plugin typography settings (SC-112 / plan 23)** — the plugin settings gain a
  Typography section: six font pickers (Title/Body/Controls primary, Card
  body/Label/Monospace behind an Advanced fold; curated list + "Custom…" free text +
  a feature-detected "List installed fonts" affordance) and two size sliders (Text
  60%–140%, Card 80%–120%, 5% steps — the site's exact slider ranges and snap
  semantics). Every picker defaults to "Default (Obsidian vault fonts)" — the
  plugin's only-ever prior behavior — and choices apply under both Steel and Legacy
  (the Legacy support gate's verdict was SHIP; at defaults Legacy stays
  byte-identical, freeze-verified). Controls (steppers/buttons/tabs) now default to
  "same as Body" per Scott's ruling — ratifying the serif rendering steppers already
  had (see the plan-22 correction above) rather than changing pixels; print pins
  controls sans and always renders text/cards at 100%.
- **Steel UI refinement pass (SC-121)** — a systematic four-batch polish sweep across
  every element family, both color schemes, driven by a screenshot-audited defect
  catalog. Highlights: compact stepper/icon-button density (28px on desktop pointers,
  full 44px touch targets on mobile); the ability-card keyword/type/distance/target
  region rebuilt to the site's two-band grammar with the type chip right-aligned;
  power-roll tier badges at site proportions and the "≤" glyph rendering correctly in
  real Obsidian; crest faces corrected per scheme (a hairline token had inverted them);
  statblock stat-row gaps; themed negotiation checkboxes; markdown tables scroll
  instead of clipping; the treasure card's Project row renders its markdown (was a raw
  literal — a content fix reaching all themes, with a Scott-sanctioned 5-shot freeze
  rebaseline). The pass also unearthed and fixed silent capability-floor failures:
  CSS nesting dropped wholesale on older-Electron Obsidian installs (SC-122 — trackers
  rendered unstyled there for ~a year), the monospace font token never resolving,
  and color-mix()/text-wrap uses above the supported floor — each now regression-
  guarded, with harness coverage extended to modals, the sidebar, canvas read-only
  states and the settings tab (freeze pins 101 → 107).
- **Steel structural trio — action spine, villain actions, statblock notch (SC-101/
  SC-102/SC-103, plan 25)** — the plugin's Steel theme closes its last three DOM-level
  divergences from the site. The action-spine and statblock-notch fixes are Steel-scoped
  CSS only (no DOM restructuring); villain-action classification needed a real TypeScript
  rendering fix instead. Villain actions (Shoot!, Form Up!, and every "Villain Action N" ability
  in your synced compendium) now render with their own red accent and a skull crest,
  instead of no decoration at all — a mapping bug had them falling through unclassified
  in every theme. A card's coloured action-type bar now appears only where the site
  draws one: inside a statblock or featureblock's nested feature list, never on a
  standalone ability card. Those nested lists — a malice featureblock's options, a
  statblock's abilities — now render each entry as its own bordered, filled card
  (matching the site) instead of one continuous accent line, and a featureblock
  option's cost renders as plain large display text next to its name instead of a
  small outlined chip (statblock/standalone costs keep the existing forged pill, same
  as the site). The statblock and featureblock's diamond notch moves from a generic
  divider between the characteristics strip and the feature list to the site's actual
  position, straddling the bottom edge of the head band, tinted to the block's role.
  **Known limits:** compendium content synced before 2026-07-16 carries villain actions
  as plain body-markdown prose (how they were written at the time) rather than the
  structured card — re-sync your compendium to get the new rendering. Printed/exported
  output follows the same structural change as the screen; Scott signed off on the five
  moved print goldens on 2026-08-08 (the ask and its before/after pairs are on SC-102),
  and the rebaseline was applied at landing.
- **Steel horizontal rules — both of the site's variants (SC-128)** — the site draws two
  distinct diamond rules and the plugin now carries both. The standalone `ds-hr` /
  `ds-horizontal-rule` element gets the **ornate** one: a small haloed diamond flanked by
  two seed dots, with hairlines fading outward to nothing, replacing the old heavy look (a
  large solid diamond on two thick full-width lines). The **plain** variant — the same
  diamond seated on a solid line, no dots, no fade — is the statblock header's bottom edge
  and was already shipped verbatim by SC-103's notch, so nothing was rebuilt for it. Where
  the site draws no rule at all (between a statblock's characteristics and its features)
  the plugin still draws none. Screen only; printed output is unchanged.

### Fixed

- **Circle of Storms minions were missing their essence-cost traits (SC-137)** — 9 of the
  13 Elemental-portfolio minions (Walking Boulder, Crux of Ash, Flow of Magma, Desolation
  of Sand, Dancing Silk, Principle of the Swamp, Iron Reaver, Knight of Blood, Light of
  the Sun) each lost a whole trait — Pile Up, Ashen Cloud, Eruption, Shifting Sand Pit,
  Web, Sludgefoot, Iron Barricade, Red River, Radiant Field. Their essence cost had been
  transcribed after the bold name ("**Pile Up** 1 Essence") instead of in the corpus-wide
  cost parenthetical ("**Pile Up (1 Essence)**"), and a title the statblock parser can't
  match is discarded outright rather than rendered plainly, so the trait vanished from
  every format with no warning. The nine titles now use the standard form and the traits
  are back, with the cost in the same head chip every other cost uses. A corpus guard test
  now scans all four books for unparseable feature titles.
- **Portfolio Champion Level 10 advancements are labelled again (SC-138)** — Size Increase
  and each champion's eidos-costed Champion Action rendered as ordinary innate features on
  the Demon Lord's Aspect / Dragon's Portent / Celestial Attendant / Avatar of Death stat
  blocks, with nothing marking them as 10th-level. They now sit in their own
  "<Champion> Advancement Features" card under a **Level 10 Advancement** band — the same
  presentation beastheart companion and summoner fixture advancements already get — shown
  both on its own page and inline on the champion's page. Those four abilities also had
  their eidos cost sitting in the spec table's action-type cell, which pushed "Champion
  Action" out below the table as a stray bold line under the effect. The source now uses
  the standard form the rest of the corpus uses — cost in the title parenthetical
  ("**Reality Flense (1 Eidos)**"), action type in the table — so each card reads like the
  book: **1 Eidos** beside the name and a **Champion Action** chip under it.
- **Steel dark mode reads flat — the sunken-surface polarity (SC-117)** — every recessed
  panel inside a Steel card (ability sections, power-roll frames, Distance/Targets cells,
  statblock stat and field boxes, hero regions, initiative cells, the encounter summary)
  was painted with a 6%-**white** wash in dark mode and an opaque grey in light. Both
  occluded the card plate's own diagonal gradient, which is exactly where
  steelcompendium.io's dark-mode richness comes from — so every panel landed on the same
  flat tone regardless of where it sat on the plate. They now carry the site's measured
  translucent-**black** fills, per surface, in both schemes, and section header strips
  drop the opaque plate they painted under their sheen (the site paints none).
- **A roleless statblock lost its section break under Steel (FOLLOWUPS #56, with SC-128)** —
  a statblock whose role maps to nothing (a summoner Champion, a Noncombatant — 5 of the
  512 statblocks the pipeline emits) was left with no head band, no diamond notch and no
  divider, so its characteristics strip butted straight into its feature list. It keeps the
  diamond divider again. Role-mapped statblocks are unchanged.

### Internal

- **Draw Steel Elements visual-harness coverage** — featureblock advancement bands
  and the sidebar panel now have dedicated fixtures with golden-PNG shots: the
  featureblock fixture's legacy/print renders joined the frozen set (98 → 101),
  while its Steel-scheme shots and both new sidebar shots are regenerated
  (unfrozen) goldens verified by eye.
- **Draw Steel Elements font token vocabulary (SC-105)** — the plugin's single
  `--dse-font-display` token is retired, replaced by six semantic slots
  (title/body/card-body/label/controls/mono), each independently themeable.
  Every consumer was re-pointed to its classified slot with zero rendering
  change — freeze and parity gates stayed green throughout. Groundwork only,
  for user-customizable fonts (SC-112).

## 2026-10-18 — Beastheart companions are statblocks; data-unified release v4.20261018225007 (SC-390; steel-etl 1b57338, v2 0b9571dbd3)

- **Beastheart companions now render in the DSE plugin (SC-390).** The 14 companions
  (Panther, Drake, and the rest) are real statblocks in the data instead of generic
  feature groups, so `ds-scc` references such as
  `mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther` render the plugin's
  statblock card (stats, Level 1 abilities) instead of "has no renderer". Codes and
  permalinks are unchanged and the website looks the same. The shared statblock schema
  gains optional `skills` and allows text Free Strike (`1 + M`); data-sdk-npm 3.1.0 follows.
  The data is live with this deploy; the plugin side ships with the next plugin release, after which a compendium re-sync in Obsidian shows the Panther.

## 2026-10-17 — Book-text fixes from a 6.0.2 plugin bug report; data-unified release v4.20261017150517 (SC-416; steel-etl b155140, v2 b7dcce5af3)

- **Compendium: book-text fixes from a 6.0.2 plugin bug report (SC-416).** Hexer retainer's Take Root and Undead Servitor's Death to Death are now Level 7 (a mangled source heading had tagged them Level 4); Talent's Psi Boost spends clarity, not discipline, and links to Talent's own ability; the Troubadour advancement table reads `Signature, 3, 5, 7, 9` at 7th and `5, 9` for 8th-level class-act abilities; Gnoll Gnasher shows `EV -` and "Horrific Feast"; Dwarf Mortar's advancement abilities are ordered 4/7/10 with the Pacifier Shell "(save ends)" paren closed; Hobgoblin Flameslinger's duplicated stats row is gone; two Conduit domain-table rows now link to Conduit's own codes. Shipped to plugin users in data-unified release `v4.20261017150517`.

## 2026-10-09 — Revenant purchased traits and Negotiation attitudes table back in place (SC-385; steel-etl 0c74f4f, v2 3aacc9a)

- **v2 site: Revenant purchased traits and the Negotiation Starting Attitudes table are back
  where the book puts them (SC-385).** On the Revenant ancestry page, "Purchased Revenant
  Traits" and the five traits under it were nested inside the Tough But Withered signature
  trait; they now sit beside the two signature traits like every other ancestry. In the
  Negotiation chapter, the Starting Attitudes table had split the first sentence of
  "Uncovering Motivations" in two; it now follows the Starting Stats paragraph that
  refers to it, and that sentence reads whole again.

## 2026-09-24 — Search reaches the book text; ten new rule pages (SC-329; steel-etl 88aec3b, v2 3bfe2ce)

- **v2 site: search now reaches the book text itself (SC-329).** Rules that only lived in
  a book chapter — like "you can move freely through an ally's space…" under Combat ›
  Movement — never showed up in search, because the Books tab was excluded to avoid
  duplicate results. Search now includes every book section that has no Browse page of
  its own (labeled with its book, e.g. "Combat · Draw Steel: Heroes") and still skips the
  ones that do, so nothing appears twice (a few Monsters-book echelon introductions are
  still only on the Books tab — SC-345). Ten rules sections also got their own Browse
  pages: Movement, Hide and Sneak, Assist a Test, End of Combat, Stacking Unique Effects,
  Ending Effects, Roll Against Multiple Creatures, Making Arguments, NPC Response and
  Offer, and Opening a Negotiation.

## 2026-09-23 — Scorpion Tail maneuver renders as an ability card (SC-341; steel-etl ff9c15f, v2 072f14f)

- **Scorpion Tails: the Scorpion Tail maneuver now renders as an ability card (SC-341).**
  The beastheart leveled weapon's embedded maneuver had been scrambled at extraction —
  its header row flattened to "Melee, Strike Maneuver o Melee 2 x One creature" and its
  effect cut off mid-sentence ("3 + your"). It now shows the book's keywords, action
  type, distance, target, and full effect ("3 + your Might score") on both the Browse
  and Read pages.

## 2026-09-23 — Root landing page uses the v2 site's fonts (SC-335)

- **steelcompendium.io: same fonts as the v2 site (SC-335).** The root landing page
  was still loading unlicensed copies of Berlingske Slab, Newzald and Beaufort from a
  third-party font site. It now uses the v2 faces: licensed Berlingske Slab for body
  text (loaded from the v2 site's own copy), Cinzel for big headings, Petrona for
  subheads and JetBrains Mono for code. Bold text on the page now actually renders
  bold. The legacy site (steelcompendium.io/compendium) is not yet fixed.

### Internal

- **One host for the licensed fonts (SC-335).** The root site now serves Berlingske Slab
  for the whole domain at `/fonts/licensed/berlingske-slab/`. v2 loads it from there,
  and a future v3 only needs to copy v2's six `@font-face` rules: no secret, no private
  checkout, no special deploy. The root site deploys through GitHub Actions now, as v2
  does. Rules: `ARCHITECTURE.md` → "Licensed fonts".

## 2026-09-23 — Body text is licensed Berlingske Slab again (SC-320; v2 8f98bcd)

- **v2 site: body text is Berlingske Slab again, now properly licensed (SC-320).**
  Berlingske Slab is the Draw Steel book's own body face. The site used it until
  2026-09-06 from an unlicensed copy, then switched to the free Zilla Slab. It is back
  under a paid Playtype web license, served from the site itself, and this time with
  real bold and italic cuts instead of browser-faked ones. Zilla Slab stays available
  under Settings → Fonts. Saved font choices that no longer exist are cleared: readers
  who saved the old default before 2026-09-06 (and have been seeing Georgia since) get
  Berlingske back, and retired heading picks (Beaufort, Newzald, Forum) fall back to
  today's defaults.

## 2026-09-14 — Cost / Signature filter on the feature Search & Filter page (SC-92; v2 b9a37c0)

- **Filter for signature abilities (SC-92).** The feature Search & Filter page gained a
  **Cost** chip row — Signature, No cost, or the amount of your class resource it costs
  (1, 3, 5, 7, 9, 11) — so "show me every signature ability" is one click (100 abilities),
  and it composes with every other facet on the page (Type, Source, Level, Action,
  Keyword, Condition, Track — e.g. "my Conduit's signature ability" → 8). The chip is the
  same cost the card already shows in its head, so a costed result reads its cost on its
  face; no new UI element was needed there.

## 2026-09-14 — Dragon's Fire moves to a Treasures ability bucket (SC-323; steel-etl c4e0526, v2 1108492)

- **Dragon's Fire moves out of Common Abilities into a new Treasures bucket (SC-323).** The Dragon Soul II armor enhancement's granted ability was misclassified under Browse → Abilities → Common alongside universal actions like Grab and Free Strike. It now lives under Browse → Abilities → Treasures; its permalink changes from `…feature.ability.common/dragons-fire` to `…feature.ability.treasure/dragons-fire`.

## 2026-09-14 — Ability cost / "Signature" line at subtitle size (SC-115; v2 2f4e8e2)

- **Site: an ability's cost/type line no longer competes with its name for size
  (SC-115).** On every card that uses the shared ability header — the Browse kit
  tile's signature ability, a class ability page, a kit detail page, an embedded
  card — the small line in the top-right corner (a resource cost like "9 Ferocity",
  "Free Strike", or "Signature") rendered nearly as large as the ability's own name.
  It now matches the size of the small-caps subtitle line underneath the name (e.g.
  "Fury" or "Shining Armor"), so it reads as a quiet detail instead of a second
  heading.

## 2026-09-13 — Heroes ability effects in source order + display/subhead fonts (SC-310, SC-315; steel-etl f90da5f)

- **Site: kit Browse tiles show the right kind — Martial, Magic, or Psionic
  (SC-116).** Every kit tile on the site's Browse kit index used to say "Martial
  Kit" — a hidden bug, because the keyword sniff ran against a page body that no
  longer carried the keyword line — and the tiles now read 21 Martial / 3 Magic /
  1 Psionic, matching the kit detail pages (Battlemind is the Psionic one); and
  the kit data files gain a `kit_type` field (Martial / Magic / Psionic) that the
  DSE plugin and the API can read instead of re-deriving it.
- **Site: kit Browse tiles show "—" for every absent bonus, matching the kit detail page and the DSE plugin (SC-119).** The Browse kit index tile rendered an absent bonus as "0" on its first stat row (Stamina / Speed / Stability / Disengage) but as "—" on its second (Melee and Ranged Dmg / Dist). Both rows now use the detail page's `kitBonus()` helper, so a kit with no bonus in a slot shows a dash everywhere — Boren's tile reads `— — — —` on both rows instead of `0 0 0 0` over `— — — —`.
- **Site: kit Browse tiles show the full signature-ability card, not a one-line
  summary (SC-115).** The Browse kit index tile now renders the kit's signature
  ability as the full ability card (keywords, action, power-roll tiers, effects)
  — the same card the kit detail page shows — instead of a one-line type + name;
  tiles in a row therefore vary in height.
- **Heroes ability cards and data now keep every power roll in source order (SC-310):**
  Divine Dragon shows both its breath and claw tables; abilities whose Effect precedes
  the roll no longer show the roll first.

- **v2 site: the downtime project goal reads in the display face (SC-315).** On a
  project card the goal numeral sat inside the head's display slot, inheriting its
  size, tracking and outline, but was set in the code font — so "GOAL 3,000" read
  as two different faces. It now uses the display face like the word beside it,
  with tabular figures for the alignment the code font was there for. This was the
  only place on the site where display-size text was not the display face; the
  small code-font numerals on chips and badges are deliberate and unchanged.

- **v2 site: the display type got heavier and larger.** Everything set in Forum —
  H1 and H2, statblock and card names, role lines, band titles, stat numerals, the
  trait drop cap — is 1.2x larger, tracked out by 2px, and drawn with a 2px outline
  in its own color. That outline is what makes the display type read bold: Forum has
  no bold cut, so its weight stays at 400 rather than letting the browser synthesize
  one. Everything set in Petrona — subheads and every small-caps label — is a real
  weight 700. Long names such as "Goblin Warrior" and the home page H1 now wrap onto
  two lines at the larger size.

- **v2 site: the subhead face is now Petrona (Google Fonts).** H3 through H6 and the
  small-caps labels on statblocks and cards used Test Newzald, loaded from a
  third-party font mirror; they now use Petrona, an OFL variable serif served by
  Google Fonts, as the free stand-in for the PDF's Newzald. With Forum already in
  Beaufort's place, the site no longer loads any commercial face. The Settings
  panel's heading-font choices list Petrona where they listed Test Newzald.

- **v2 site: the display heading face is now Forum (Google Fonts).** Big uppercase
  H1/H2 headings previously used Beaufort W01 Heavy, loaded from a third-party font
  mirror; they now use Forum, an OFL face served by Google Fonts, as the free stand-in
  for the PDF's Beaufort. The Settings panel's heading-font choices list Forum in
  Beaufort's place. Forum has a single 400 weight where Beaufort W01 Heavy was heavy
  at 400, so the display role now asks for bold — statblock names, card names, band
  titles and stat numerals keep the weight they had.

## 2026-09-07 — Statblock abilities in exact book order + nested effects data (SC-308, SC-309; steel-etl bdab23e)

- **Monster/malice/terrain abilities now render in the book's exact order — the power
  roll no longer jumps above a preceding Trigger/Effect/Special paragraph, and every
  tier table shows (SC-308, folds SC-309).** The Wode Hag's villain action "Snackies for
  Sweeties" showed only one table, and it had the PC's Agility-test outcomes for removing
  a pastry instead of the pie-explosion's poison damage — a second, header-less tier list
  was silently overwriting the first, AND the power roll always rendered before any
  section that preceded it in the book, even when the book puts prose first. Both are the
  same underlying bug: the site card no longer follows the source's document order at
  all. Fixed for every affected ability, including every ordinary single-roll one — the
  ordered `effects` list (name/prose + the tier table that follows it, exactly as an
  entry moves through the SDK's own effect model) is now the single source of truth for
  both the rendered card and the statblock JSON/YAML, roughly 62 Monsters abilities had a
  section before their power roll and are reordered, and a header-less table is now
  labeled from the characteristic test it names (e.g. "Agility Test") whenever one is
  named, on every such table, not just a later one. The statblock JSON/YAML now also
  carries every Effect/Special/Trigger/Malice paragraph for every roll-bearing ability
  (previously dropped once tiers were present). The site's dice roller highlights the
  rolled tier only in the table that was clicked, not in every table on the card. (The
  underlying `power_roll` convenience field on featureblock/terrain data now holds the
  FIRST tier list rather than the last — the ordered `effects` list is the source of
  truth for a multi-roll feature either way.)

## 2026-09-06 — Heroes errata, Free Strike page, search ranking + site deploys (SC-304, SC-179, SC-306; steel-etl 15f931b, feaf130, 5035174)

- **Search finds what you typed (SC-306).** Typing an item's exact name now
  returns that page first (52% → 98.2% of unique titles on the bench). Container
  pages no longer re-index the cards they embed, monster names are no longer
  demoted, and the search ranking now runs in our own worker: all words
  required, exact titles first, no stop-word stripping ("To the Death!" works).

- **Downtime projects (SC-201):** Projects now have Steel Plate cards with requirement ledgers and separate enhancement panels. Granted abilities stay inside their enhancement; project requirements are also available in data exports.

- **Site: the Free Strike page now shows the free strike abilities (SC-179).** Browse →
  Feature → Common → Main Actions → Free Strike explained the rule but never listed the
  two abilities you actually roll — the book prints *Melee/Ranged Weapon Free Strike* in
  Chapter 2 and the rule in Chapter 10, so nothing on the site connected them. The rule
  page now ends with a **Free Strike Abilities** card grid linking straight to both.
  Reported on Discord; the reporter couldn't find the abilities through search either,
  so the book's universal actions and common ability cards (Free Strike, Charge, Grab,
  Hide, Knockback, …) are now ranked with the rules glossary instead of tying with the
  ~3,000 class-specific features they were buried under.

- **Compendium site: body text now uses Zilla Slab instead of Berlingske Slab.** The
  licensed Berlingske Slab Demibold was hot-linked from a third-party font mirror; Zilla
  Slab (OFL, Google Fonts) is the closest free slab and ships regular through bold with
  italics, so emphasis and bold body text render in true faces instead of synthesized
  ones. The Settings panel's "Text font" default is renamed to match.
- **Heroes: Gravitic Well (Talent) Target corrected to "Each enemy and object in the area" per Heroes p197 (SC-304).**
- **Compendium site: card page actions move into a hover-revealed chrome plate,
  replacing the old floating top-center button strip (SC-297).** Copy-link, pin,
  add-to-encounter, and MD/PNG export now live on one plate seated above the card's
  top edge — the same geometry, material, and depth as the chrome panel DSE plugin
  elements carry — on all five card families that host page actions: statblock,
  featureblock, ability, trait, and kit. The plate is right-anchored and grows
  right-to-left, hidden until the card is hovered or focused, always visible with
  reserved space on touch/narrow screens, and absent in print. This also fixes the
  ability card's controls colliding with the card name, a visible defect of the old
  strip's mismatched anchoring.
- **Compendium site: two Read-chapter bugs fixed (SC-297).** A chapter page that
  embeds multiple statblocks no longer shows an "add to encounter" chip on the first
  one (it silently added whichever creature was printed first); and an embedded card
  no longer shows a copy-link that copies the *chapter's* permalink instead of
  nothing. Embedded cards carry no per-card page actions, by design.
- **Compendium site: trait pages no longer show a duplicated title (SC-297).** Every
  trait leaf page (e.g. "Glowing Recovery") showed both the page's own heading and
  the card's identical name directly beneath it; trait pages now hide the redundant
  heading the same way statblock, featureblock, ability, and kit pages already do.
- **Compendium site: three retainer-minion statblock pages no longer show their
  title twice (SC-297, SC-301).** `Razor`, `Gorrre`, and `Violent` (each summoned by
  a Devil Detective) each printed their name once as the page heading and again on
  the card immediately below it; they now hide the redundant heading like every
  other statblock page.

## 2026-09-05 — My Table improvements (SC-177, SC-300)

- My Table: tuck the add-section form behind a button and reduce title/category headings to keep saved rules in view (SC-300).

- My Table: save site headings under your own names and expand their content inline, including child subsections and tables; other web URLs remain links.

## 2026-08-21 — v2 site deploys (steel-etl 7bd5f54, 7ef2284)

- **Site: subclass features render as proper Feature/Ability cards again (SC-174).** Any
  feature or ability whose heading carried an extra attribute (its subclass, a cost) was
  silently skipped by the card-splice pass and rendered as raw prose with icons — 60
  headings across the Beastheart, Summoner and Fury class pages, and (since the Source of
  Earth statblock fix) the Elementalist's whole 8th-level specialization section. A
  one-line regex widening restores the cards everywhere; a regression test pins it.

- **Site: the Source of Earth statblock renders as a real statblock card (SC-180).** The
  Elementalist's Summon Source of Earth summon — the heroes book's only statblock — used
  to render as a flattened wall of raw `>` markers and pipe-table syntax with its stats
  scrambled. It's now a proper Draw Steel statblock card (head band, stat tiles,
  characteristics, traits, Boulder Bash with its power roll) on the Elementalist class
  page, the Read chapter, and its own new Browse page under `monster/summon/elementalist/`
  — pinnable and permalinked like every other statblock
  (`mcdm.heroes.v1/monster.summon.elementalist.statblock/source-of-earth`, the registry's
  first heroes-book `monster.*` code).

## 2026-08-20 — v2 site deploy (steel-etl a59b5a4)

- **Site: six class features render as proper ability blocks again (SC-173).** A user
  reported the Talent's level-1 "Repel" showing as plain text with a stray entry in the
  page's section sidebar. Root cause: its heading was one level short of its siblings, so
  it escaped its tradition grouping. Fixed — plus five more of the same class found by a
  full four-book sweep (Talent L8 Stasis Shield / Universal Connection; Null L5 Chilling
  Readiness / Inertial Fulcrum / Instant Action) — and a structural test in steel-etl now
  fails on the pattern. Registry unchanged (3,085 codes). The sweep also exposed a larger,
  separate defect: 60 headings across three books render as prose because the site's
  card-splice regex rejects headings with extra attributes — tracked as SC-174.

## 2026-08-03 — site deploy (SC-118 downtime table placement)

### Fixed

- **Downtime project tables now sit in their owning projects** — the Heroes book
  transcription carried two page-layout artifacts where a table trailed the previous
  project: the Hone Career Skills Events Table rendered on the Go Undercover page
  instead of Hone Career Skills, and the Build or Repair Road Renown Table rendered
  on the Build Airship page instead of Build or Repair Road. Both moved to their
  correct projects. The shared Crafting and Research Events Table (the d100 fallback
  for all crafting/research projects) was likewise hoisted out of Discover Lore's
  Forbidden Knowledge subsection onto its own downtime-rule page. (SC-118)

## 2026-08-02 — site deploy (SC-113/SC-114 rules-content fixes)

### Fixed

- **Wall rule page no longer carries the "Straight Lines" sidebar** — the printed
  sidebar sits inside the Wall section in the Heroes book, so the ETL folded it into
  the wall rule's Browse page. It is now tagged as a loose callout, so the narrow wall
  page drops it while book-faithful pages (Area of Effect, the Read chapter) keep it
  in its printed position. (SC-114)
- **Table-reference combat modifiers: corrected opportunity-attack trigger** — the
  summary said "leaving a creature's reach without shifting"; the trigger is
  adjacency-based, so it now reads "willingly moving out of a square adjacent to a
  creature without shifting". (SC-113)

## 2026-07-29 — site deploy (SC-95 statblock action labels)

### Fixed

- **Monster statblock abilities name their action type in the default "Crest" keyword
  display** — the "Crest (decorated)" keyword-display setting hid each feature's Action
  field (it assumed the since-retired head eyebrow carried it), so the default view
  never said whether an ability was a main action, maneuver, or triggered action. The
  action type now renders as a right-aligned chip on the keyword line in crest mode —
  the inline-text option's placement, pill-styled to match the head's cost chip. The
  other keyword-display modes (Inline text / Grid / Ledger) already showed it and are
  unchanged. (An intermediate take that stamped the label into every feature header
  regardless of display mode shipped briefly earlier today and was reverted — it
  doubled the label everywhere except crest.) (SC-95)
- **Settings rebuilt as native Obsidian pages with global search (SC-131)** — the 6,850px
  single-scroll settings tab became native per-section pages rendered from declarative
  definitions; every setting is findable from Obsidian's built-in settings search; the live
  preview docks to the viewport bottom so it stays visible while toggling. [BREAKING for
  pre-1.13 Obsidian clients: minAppVersion raised to 1.13.0; versions.json pins them to
  6.0.1.]
- **Plugin crest glyphs optically centered (SC-130)** — the plugin twin of the site's
  SC-129 fix; one measured em-based nudge across all crest surfaces, scale-proof at the
  text-size extremes.
- **Stamina edit modal math fixed (SC-133)** — negative Apply inputs no longer invert
  operations, Spend Recovery never burns a Recovery for zero gain (honest preview + real
  disabled state with reason), and temp grants follow RAW take-higher against live
  session temp.
- **Encounter builder no longer charges 4× EV for minions** — a minion statblock's EV
  buys *four* minions ("The EV for minions represents four minions together"), and the
  builder adds them four at a time, but two paths priced that group per-creature: the
  qualifier match only accepted the word spelling `for four minions`, so the 12
  statblocks the book spells `for 4 minions` (angulotl, dwarf, radenwight) were billed
  4× — four 1st-level minions cost 12 EV instead of 3; and the statblock-page **+**
  button captured only the first token of the `EV 3 for four minions` head chip,
  dropping the qualifier and mispricing *every* minion added from its own page. Both
  now price per group of four, so eight 1st-level minions total 6 EV — exactly one
  1st-level hero slot, matching the quick-build rule "eight minions fill one hero slot".
- **Ability `effects[]` no longer drops named effects** — the parser previously
  recognized only `Effect`, the *first* `Spend X`, and `Trigger`, so any other named
  rider (`Persistent N`, `Strained`, `Special`, `Mark Benefit`, class-specific labels)
  and every second `Spend X` were dropped from the structured `effects[]` array in the
  JSON/YAML/DSE data (they still showed in the rendered body). Effects are now captured
  generally, in document order, across all formats. Fixes the reported gaps on Minor
  Telekinesis (missing "Spend 3 Clarity"), Conflagration (missing "Persistent 2"), and
  Hoarfrost (missing "Strained"). The array now mirrors source document order, including
  where the power roll sits (e.g. an Effect stated before the power roll stays before it).
  No schema change (the existing `{name, cost, effect}` entry already covered it).
- **Dragon's Fire no longer lists eight armor enhancements as its effects** — the
  9th-level armor-enhancement descriptions (Invulnerable, Leyline Walker, Life, …) were
  printed after the Dragon's Fire statblock in the source and got absorbed into its
  `effects[]`. The source now places the ability at the end of the enhancement list, so
  its `effects[]` is just the power roll; the enhancements render as prose on the Imbue
  Armor page as before. (The general "end a section's scope without moving content"
  annotation this motivates is roadmapped.)

## 2026-07-21 — any/all keyword filters (SC-88)

### Added

- **Keyword filters can now require ALL selected keywords** (SC-88) — the Features and
  Bestiary browsers' Keyword facet gained an `any`/`all` toggle pill: `any` keeps the
  match-any behavior, `all` narrows to entries carrying every selected keyword
  (e.g. Area **and** Fire). Single-valued facets (Type, Role, Level…) are unchanged.

## 2026-07-21 — site fix (SC-89)

### Fixed

- **Green Animal Forms table no longer shows literal `<br>` text** (SC-89) — the
  elementalist Disciple of the Green forms table carried mid-sentence `<br>`
  PDF-extraction artifacts, and the feature-card table renderer escaped them into
  visible text. Artifacts removed from the source, and card prose now renders a
  deliberate `<br>` (e.g. the Summon Source of Earth stat grid) as a real line break.

## 2026-07-20 — data + site deploy (DSE 6.0.0 wave)

### Added

- **Monster statblocks now carry their family's Malice features** — every monster
  statblock page embeds the group's shared Malice featureblock as a band (381 Browse
  statblock pages; the standalone Malice pages remain).
- **Statblock secondary-stat cell is now context-driven** — minions show their real
  "With Captain" bonus (a parser field that was silently dropped is now rendered),
  summoner minions show "Free Strike Damage Type", and creatures with neither drop the
  blank cell instead of showing a dash.
- **All statblock action-type usage cells link to the rules glossary** — 1,685 cells
  swept across all four books (Main action, Maneuver, Triggered action, …), completing
  the linking pass the first 19 exemplar cells started.
- **Class-owned bestiary pages back-link their class** — beastheart companions and
  summoner fixtures (36 pages) now point back to `class/beastheart` / `class/summoner`.
- **Statblock sticky mini-header gets a compact phone variant** — one-line truncating
  name + single stat row (~9% of a 390px viewport, was ~23%); desktop unchanged.
- **Treasure data is now structurally complete** (SC-13) — `item_prerequisite`,
  `project_source`, and per-level `level_effects` populate in the JSON/YAML formats,
  and every entity's JSON declares its `scc` key so strict schema validation passes.
- **`steel-compendium-sdk` 3.0.0 published to npm** — the first 3.x release: single
  `role` + `organization` + `keywords` statblock fields, ten new typed model families,
  2019-09 schemas. Existing 2.x version-range consumers are unaffected until they
  upgrade.

### Fixed

- **Idiomatic false-positive links removed** (SC-86, SC-87) — 23 prose words that were
  wrongly linked as game terms ("guidelines", "edge case", "in turn", "misguided", …)
  are plain text again; genuinely mechanical uses keep their links.
- **Companion/fixture/rival pages no longer show a duplicate page title** — the
  class-owned back-link line now sits inside the statblock card, preserving the
  title-suppression the other statblock pages get.

### Internal

- **data-unified publishes pinnable releases** — `just deploy` (and standalone
  `just release-data`) cuts a GitHub Release on data-unified (tag `v4.<timestamp>`)
  carrying `md-dse-unified-en.zip`, the DSE-format Browse tree the Draw Steel Elements
  plugin syncs from (F2 OD-2). Today's release: `v4.20260720213840` (first:
  `v4.20260717013458`).
- Deploy recipe fix: `release-data` is now invoked against the workspace justfile
  (sub-repo justfiles shadowed it, aborting the first full `just deploy`).

## 2026-07-15 — site fixes (SC-84)

### Fixed

- **Stray purple line beside ancestry/class content** — every ancestry page (and the
  class pages' big ability collections) wrapped its whole trait tree in one card
  whose panel spanned thousands of pixels, invisible except its 3px purple act
  spine running down the page gutter. Section-scale wrappers are now frameless
  (the crested header stays; nested sections carry the framing), and their content
  aligns with the rest of the page. Leaf trait cards are unchanged. (SC-84)

## 2026-07-14 — site fixes (SC-66, SC-81)

### Fixed

- **Statblock "Villain Actions" band lost its stray admonition chrome** — Material
  styles every `details`/`summary` in page content as a collapsible "note"
  admonition, which painted a pencil icon, a blue border, a second chevron, and a
  cramped block header over the band's own design; the band now neutralizes that
  chrome (crest · title · one chevron on the rail, correct spacing). Head chips
  mixing a link and a value ("Villain Action 1", "2 Malice") also regained the
  space that inline-flex was dropping — all ~350 such chips site-wide. (SC-66)

- **Beastheart Companion Rules match the sourcebook** — the "Ranged Free Strikes"
  and "Shared Maneuvers" entries were merged into one bullet, the two "You and your
  companion…" action-economy paragraphs floated as unlabeled bullets instead of
  sitting inside the "Companion Actions" entry, and the list split in two at a PDF
  column break. The input transcription now matches the book, and the trait-card
  renderer learned proper markdown list semantics (loose lists stay one list;
  indented continuation paragraphs stay inside their item). (SC-81)

## 2026-07-12 — title pages show echelon (SC-83 follow-up)

### Fixed

- **Title pages show their echelon** — each Browse title leaf page now carries an
  "**Echelon:** 1st" line above its Prerequisite (the flat page had lost the book's
  echelon group header; follow-up to the grouped Titles index). (SC-83)

## 2026-07-12 — site fixes (SC-79, SC-80)

### Fixed

- **Summoner and Beastheart Basics match the base classes** — both class pages
  rendered their Basics section as a "Level 1 Feature" trait card (with a nested
  advancement-table card) instead of the plain prose every Heroes-book class uses,
  and their class landing cards were missing the stats strip (starting stamina,
  stamina per level, recoveries, potencies, skills) and primary-characteristic
  tags. The Basics sections were annotated as features against the annotation
  guide, hiding their prose from the class parser; they now render and carry
  class data exactly like the base classes. (SC-79)
- **Beastheart's Ride Along and Wild Rumpus perks render as proper ability blocks** —
  both perk pages showed raw PDF-extraction artifacts: keywords and action type mashed
  into one bold line, a garbled "o Melee 1 x Companion" distance/target line, a stray
  "Main action" line, and a mid-sentence line break in Wild Rumpus's effect text. The
  book source now carries the standard blockquoted ability shape (keywords/action +
  📏/🎯 tables, verified against the printed book), so they render like the heroes
  book's ability-granting perks. (SC-80)

## 2026-07-12 — site fixes (SC-82, SC-83) + card polish

### Fixed

- **Polder traits render as proper trait cards** — the Polder ancestry page showed
  "Signature Trait: Small!" and all six purchased traits as plain text without their
  point costs (the signature-trait heading sat at the wrong level, outside the
  "Polder Traits" section every other ancestry nests under). They now render as
  nested trait cards with cost chips, matching the other ancestries, and
  "Signature Trait: Shadowmeld" gained its own trait page/code
  (`feature.trait.polder/shadowmeld`) embedding the Shadowmeld ability, like
  Wode Elf's The Wode Defends. (SC-82)
- **Titles show their echelon again** — the Browse Titles index is grouped under
  "1st Echelon" … "4th Echelon" sub-headers (as the book and the v1 site grouped
  them), each title card's type label reads "Echelon N", and the `echelon` field
  now flows into title frontmatter/JSON/YAML for both the Heroes and Summoner
  books. (The `N-echelon-titles` groups in the book sources never carried the
  `@echelon` annotation, so no title ever got the field.) (SC-83)
- **Card-preview names no longer break mid-word** — long ability names on index
  cards (e.g. "Unearthly Reflexes", "To the Uttermost End") wrapped as
  "UNEARTH / LY / REFLEXES"; they now wrap on whole words. (Material's prose-link
  `word-break` was being inherited into the card `<a>`, and the compact preview
  name/rail sizing was starving the title track.)
- **Card titles & stat readouts are legible in light mode** — the "steel" ink
  used for ability/statblock/featureblock titles, stat values, and card footer
  figures was a washed-out ~1.9:1 grey on light backgrounds; it now uses a
  readable steel. (Dark mode is unchanged.)
- **No more stray "-" keyword chip** — abilities with no keywords (Furious Change,
  Unearthly Reflexes, …) rendered a lone "-" chip on their preview and full cards;
  the "none" placeholder is now dropped.
- **Chip text is vertically centered** — keyword chips, folder-count pills, and the
  class-page "Level 1–10" rail no longer ride high/low in their pills; the rail
  figures also sit flat on the baseline (lining numerals).
- **Settings sliders line up** — Text size and Card size both show 100% with their
  thumbs at the same (centered) track position instead of at 33% vs 60%.

## 2026-07-02 — round-2 review fixes (SOT-3847)

Fixes from the round-2 review (SOT-3847 comment feedback).

### Changed

- **Card control strip is one aligned row** — the copy-permalink button now
  mounts inside the card head with the pin / encounter-add / MD/PNG buttons
  (same top, matching gaps); it no longer straddles the card border, where it
  had ended up overlapping the scaler's "≈ scaled from level…" note.
- **Empty encounter tray still expands** — the heroes/level/victories party
  inputs (and difficulty bands) are reachable before any monster is added;
  the share/markdown actions stay hidden until there is something to share.
- **Class card rail reads as one field** — the deck line under the
  "Might · Presence" mini is now its caption ("primary characteristics")
  instead of the second data point "start at 2".

### Removed

- **"In this chapter" mini-TOC** on Read chapters — redundant with the
  built-in right-sidebar table of contents, and it sat off-center under the
  new centered chapter titles.

## 2026-07-02 — UX-wave feedback round 2 (SOT-3850…3854)

Second feedback round on the UX wave (SOT-3847 subtasks SOT-3850…3854).

### Changed

- **Statblock scaler lives in the Level chip** — hover the card and −/+ steppers
  appear flanking the chip (the same reveal as the copy-link/pin/encounter
  controls); while scaled the chip turns amber, the steppers stay visible, and
  the approximation note above the card gains a Reset button. The separate
  "Scale to level" input row above the card is gone. (SOT-3850)
- **Page actions moved to a top-right strip** — on plain (non-card) pages the
  page permalink and pin are now always-visible card-style buttons in the
  top-right of the content pane, replacing the hover-revealed inline icons
  beside the H1. Read chapters — whose pin previously mounted on the first
  *embedded* card — now pin correctly as pages, under the chapter's own title.
  (SOT-3851)
- **Encounter tray: the whole header row collapses/expands** — the chevron
  alone was too small a target; the ⋯ menu button hides while collapsed (its
  dropdown opened below the bottom-fixed tray, off-screen) and an empty tray's
  menu now opens upward. (SOT-3852)
- **Class card header balanced** — the head's right rail now carries the book
  chip and the primary characteristics ("Might · Agility" + "start at 2"),
  mirroring the statblock's Level/role/EV rail; the stat and potency strips
  became two matched 3-column rows of centered value-over-label cells (the
  statblock defense-grid pattern). (SOT-3853)
- **Chapter pages open book-style** — centered title with a small-caps
  "book · Chapter N" eyebrow above it, symmetric over the ◆ divider, instead
  of a full-width display H1 jammed left. (SOT-3854)

### Fixed

- **Duplicate page title over statblock cards (live regression)** — the
  scaler's control row sat between the page's `hr` and the card, breaking the
  strict h1+hr+card adjacency that hides the duplicate H1; the scaler UI (now
  the note) lives inside the card wrap instead. (found while testing SOT-3850)

## 2026-07-02 — UX-wave feedback round (SOT-3847)

Feedback round on the UX wave — the SOT-3847 subtasks (SOT-3839…3845).

### Fixed

- **Pinboard removal works** — the × on `/pins/` used a toggle that could re-add the
  item with no title (rendering "undefined"); removal is now a pure remove, the
  delegated listener survives instant-nav script re-execution, and removing the last
  pin restores the empty-state prose. (SOT-3840)
- **"Copy as Markdown" no longer truncates** — python-markdown's link pattern outranks
  its raw-HTML pattern and rewrote `[text](url)` *inside* the card's `data-src`
  attribute into an `<a href>` whose quote terminated the attribute mid-statblock.
  Trigger characters (`[`, backtick, backslash) are now entity-encoded; the copied
  markdown also converts file-relative links to absolute site URLs. (SOT-3843)
- **Statblock scaler potencies actually scale** — the potency rewrite matched a
  literal `<` but tier rows arrive as innerHTML where it's `&lt;`; the pattern is now
  entity-aware. (SOT-3844)

### Changed

- **Pin control is a pushpin and auto-hides** — the ★ became the Material pushpin
  (outline → filled when pinned) and the inline button beside prose H1s is
  hover-revealed like the ¶ permalink. (SOT-3841)
- **Encounter tray got a ⋯ menu** — Clear encounter / Reset builder / Close (close is
  session-scoped and re-opens when something is added). The footer Clear button moved
  into the menu. (SOT-3842)
- **Statblock scaler is comprehensive** — "Scale to level" now also shifts the five
  characteristics (clamped ±5), every "Power Roll +N" bonus (the dice roller follows),
  and potencies inside ability effect prose, all as deltas from the printed values
  per the book's *Adjusting Monster Levels* formulas. (SOT-3844)
- **Class landing card carries the class's numbers** — starting characteristics,
  starting stamina, stamina per level, recoveries, and the skills line, plus the
  flavor text styled inside the card (its duplicate opening paragraph is dropped from
  the body). The ten "Nth-Level Features" jump pills collapsed into one "Level
  1 2 … 10" group. Parser now emits `starting_stamina` / `stamina_per_level` /
  `recoveries` / `primary_characteristics` frontmatter (schema fields already
  existed). (SOT-3845)
- **Table Reference covers the official Rules Reference** — added common main/move
  actions, hero token spends, surges, saving throws / EoT / potency notation, size,
  areas of effect, forced-movement specifics (stability, slams, breaking objects),
  edge+bane mixing, and the skill +2 — paraphrased and cross-checked against the
  book text (which supersedes the PDF where they differ, e.g. surge damage).
  (SOT-3839)

## 2026-07-02 — the UX wave (P1–P11)

Eleven efforts from the 2026-07-01 UX review
(`docs/superpowers/specs/2026-07-01-v2-ux-analysis.md`), all shipped to the live v2
site across a series of deploys on 2026-07-02. Per-effort detail:
`docs/superpowers/plans/2026-07-01-p1…p11-*.md`.

### Fixed

- **Mobile statblock names no longer collapse letter-per-line** — at phone widths the
  card header's right rail (role/Level/EV) now stacks *under* the name instead of
  starving its grid column. Applies to every card type (statblock, ability, kit,
  featureblock). (P1)
- **Class pages and Read chapters got their titles back** — the CSS that hides the
  duplicate `# Name` heading on single-card leaf pages over-matched any page
  *containing* a card; it is now keyed on strict `h1 + hr + card` adjacency. (P1)
- **Custom 404 page** — search hint, links to Browse/Books/Bestiary, and a
  report-a-broken-link action, replacing the bare "404 - Not found". (P1)
- **Leftover `/Browse/index_old/` page removed** — it was live, search-indexed, and
  the source of the phantom duplicate "Browse Rules" sidebar entry. (P1)
- **Browse landing "View Retainers" card** pointed at the retired `retainer/` path;
  now links `monster/retainer/`. (P1)
- **Search ranking favors canonical pages** — per-type `search.boost` frontmatter
  (classes 4×, rules/conditions/ancestries/movement 3×, statblocks 0.6×): searching
  "fury" now returns the Fury class before the four Rival Fury statblocks, "jump" the
  movement rule before War Dog Blood Jumper. (P2)
- **Bestiary Size filter is a closed vocabulary** — dynamic-terrain free-text area
  descriptions ("any area; the area can't be moved through", …) bucket as a single
  "Area" chip instead of appearing verbatim. (P2)
- **Home page polish** — brand line unified ("Steel Compendium" + curated-by byline),
  the 12-repo legacy data list collapsed behind a disclosure. (P1)

### Added — navigation

- **Class landing headers** — every Browse class page opens with a card (Class
  eyebrow, name, Weak/Average/Strong potency strip) and a jump bar over its ~12
  sections, instead of untitled prose 82,000px tall. (P3)
- **Read-chapter reading aids** — prev/next chapter links (book order), a collapsible
  "In this chapter" mini-TOC at the top of each chapter, and a "Resume reading (N%)"
  chip that restores your last position per chapter. (P4)
- **Per-class ability tables** — each `Browse → Features → Abilities → <class>` index
  now carries a sortable Name · Lv · Cost · Action · Distance · Target table of the
  class's complete ability list (tablesort column sorting; responsive column-dropping
  on phones). (P5)

### Added — at-the-table tools

- **Table Reference tab** — a one-page GM screen: turn structure, the power roll with
  edge/bane/crit rules, condition one-liners (verified against the rule text), common
  maneuvers, movement, dying/recovery, combat modifiers, and director quick numbers.
  Print-optimized. (P6)
- **"My Table" pinboard** — a ★ control on every entity page pins it to `/pins/`,
  grouped by kind (localStorage, this-browser-only). (P7)
- **Encounter builder** — a "+" on every Bestiary row (and on statblock pages) feeds a
  budget tray: party inputs (heroes/level/victories), the book's encounter-strength
  math and Trivial→Extreme difficulty bands, minions priced four-at-a-time, over-level
  ⚠ warnings, shareable `?enc=` links, and copy-as-markdown. (P8)
- **Click-to-roll power rolls** — click any power-roll header for a 2d10 popover with
  edge/bane steppers (single = ±2, double = tier shift, natural 19–20 crits) and a
  highlight on the matching tier row. (P9)
- **Card exports** — hover any entity card for MD (copies the original source
  markdown) and PNG (2× card render) export chips, joining copy-link / pin /
  add-to-encounter in the top-center control strip. (P10)
- **Statblock level scaler** — a "Scale to level" stepper applies the Monsters book's
  *Adjusting Monster Levels* formulas as deltas from the printed values (EV, Stamina,
  free strike, damage tiers, potencies — the formulas reproduce printed blocks
  exactly at their own level), with a dashed outline + "approximation, not a published
  statblock" banner and exact restore. Session-only by design. (P11)

### Internal

- **Test infrastructure**: two e2e regression suites (`page-titles`, `cardhead-mobile`;
  playwright-core driving Brave, runnable against local builds or production) and six
  new node:test unit suites (~35 tests) over the new `*-core.js` logic modules; five
  new Go test files in steel-etl's site builder.
- **steel-etl site builder**: new leaf transforms `class_page.go` (landing header),
  `ability_table.go`, `search_boost.go`, `export_src.go` (single-line `sc-src`
  source-template island; the embed pass strips it from transclusions), and
  `sizeFacet` normalization in `bestiary_search.go`.
- **Shared UI contract**: per-card page actions live in the hover-revealed top-center
  control strip (documented in `DESIGN.md` → "Card header system") — the head grid's
  right column is off-limits.
- **Bestiary data seam**: `steel-bestiary-browser.js` republishes its parsed records
  as `window.SC_BESTIARY_ITEMS` (its mount destroys the JSON island).
- **Vendored**: `html-to-image` 1.11.13 (MIT) for the PNG export.
- **Docs**: v2 `.repo-docs` + `README`/`CLAUDE.md` refreshed and cold-start-tested;
  steel-etl `docs/site-builder.md` extended; DESIGN.md component rows; FOLLOWUPS #23
  (mobile sticky mini-header bulk) recorded; all 11 plans + the analysis stamped
  executed.
