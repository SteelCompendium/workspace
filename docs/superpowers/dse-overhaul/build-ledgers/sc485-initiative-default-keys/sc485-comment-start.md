Started: a design round is measuring every default the initiative tracker writes, before any fix is written.

The ticket says this one needs its own design, so the first step changes no code. An Opus worker is checking:

- which keys the tracker fills in for heroes, groups, creatures and instances, and which ones come from statblocks;
- whether SC-482's shared helper can track these keys per hero/creature, or needs an extension;
- whether `isHero` and the `instances:` list can be left out safely when you never wrote them;
- which tests and e2e checks would prove the fix in real Obsidian.

If the design turns up a choice that changes what you see in the tracker, I will post one ask here. Otherwise the fix goes straight to an implementer and an independent reviewer.
