# SC-628 dse-verify SKILL proposal (owner; dispatcher applies at landing)

Append to the "Montage e2e (SC-438)" bullet in "Lifecycle and e2e notes":

> Typed values (SC-628): `model.ts` remembers each top-level value as the user typed it (`title: 2024`,
> `rounds: "3"`) in a module-private WeakMap keyed by the parsed model, and `serialize` writes it back while the model
> still holds the value parse read. A new writer that assigns one of the six number keys must go through `setNumber`
> (which forgets the typed value), or an assigned value can be written back with the old typed form. Error-card montage
> e2e (MONT-W08, MONT-W10) use `openNote(rel, { errorCard: true })`. An empty montage block still draws a default
> montage (unlike the negotiation, which refuses one: SC-493 / SC-638).

And the CURRENT numbers paragraph (from the land-ready report).
