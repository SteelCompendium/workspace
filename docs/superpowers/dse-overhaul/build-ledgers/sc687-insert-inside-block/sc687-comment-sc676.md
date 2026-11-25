SC-687 built the position scan this ticket needs; the `/ds` list and the key autocomplete are not switched onto it yet.

What SC-687 changes here: a pick from the `/ds` list in any of this ticket's three places (a block indented under a list item, the properties, a fence's opening line) is now refused with a message instead of breaking the note. The list still appears there. That part is still this ticket.

For whoever picks this up:

- `placeOfLine` in `src/authoring/fenceScan.ts` reads the note's text and answers: inside a block (and which language), on an opening or closing fence line, inside the properties. It sees blocks indented under list items (spaces and tabs) and blocks in callouts. `scanFenceState`, which `suggest.ts` and `schemaSuggest.ts` still call, is unchanged on purpose.
- The three `test.failing` markers for this ticket in `test/dom/authoring/authoringKnownBugs.test.ts` are untouched and still failing as expected.
- One gap left in the scan: a block under a list item whose lines start with a tab followed by two spaces (`- a`, then a line of tab, two spaces and a `ds-ct` fence). Reading view draws it as a block, Live Preview does not, and the scan calls it "outside". Neither tab rule (2 columns per tab, or CommonMark tab stops) explains how Reading view reads that line. Measurements are in the SC-687 ledger, `sc687-r6-rereview-report.md`, NEW-LOW-1.
