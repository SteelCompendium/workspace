# SC-391 R3 fix round
- Base: origin/develop still 4b233886 (no rebase). Head after R3: see commit list below.
- LOW-1: eleven -> twelve in AGENTS.md (:69, :74, alias list gained ds-prose), .repo-docs/integration.md (:129; the dated SC-149 paragraph at :64 left as history), .repo-docs/architecture.md, src/elements/display/index.ts; project/view.ts comment reworded (project resolves to the prose family, body read directly).
- LOW-2: new CSS rule in styles-source.css (prose-scoped): `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='prose'] .dse-card:not(:has(> .dse-card__band)) > .dse-head` drops the head's margin-bottom, padding-bottom and border-bottom. Uses :has, not :last-child, because the chrome toolbar is also a card child. Shared shell and genericLayout untouched.
- LOW-3: limits note added to the firstParagraph comment; no logic change.
- Test: proseCard.test.ts "zero-band prose card" (no body/band element; the scoped CSS rule text pinned).
- Gates: tsc+lint clean; jest 14806 passed / 1 skipped (14805 + 1); shots 636 PNGs; freeze 280/280; parity 0 gap / 0 undeclared / 24 declared; e2e PROSE-C01/C02 2/2 ok. Full e2e and lifecycle not run (no shared card shell, RefUnwrapView or registry change).
- styles.css CHANGED (one prose-scoped rule added); built sha256 50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98 (was a4dfc387...).
