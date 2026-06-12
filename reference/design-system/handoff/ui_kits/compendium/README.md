# UI Kit — Draw Steel Compendium (web app)

A faithful, interactive recreation of **Xentis' Draw Steel Compendium**
(https://steelcompendium.io/v2/Browse/) — the dark "steel" web rulebook. The real product is a
**Material for MkDocs** site; this kit reproduces its *look and interactions* in lightweight
React, not its framework.

## Run it
Open `index.html`. It boots on the **Browse** landing and is fully click-through:

- **Browse landing** → category cards (Classes, Ancestries, Kits…) with teal count badges.
- Click **Kits** or **Classes** → a `browse-index` chip grid.
- Click an item (e.g. **Battlemind**) → a content page: intro, Equipment, Kit Bonuses, and the
  **signature Ability Card** with glyph power-roll badges and a left/right TOC rail.
- **Search** (top right) → a command-palette modal that filters classes/kits/categories.
- **Theme toggle** (☀️/🌙) flips between the signature dark "slate" and the light "default"
  scheme — every token in `colors_and_type.css` re-themes live.
- Other tabs (Rulebook Chapters, Bestiary…) show a stub — Browse is the deep recreation.

## Files
| File | Role |
|---|---|
| `index.html` | Shell — loads React 18 + Babel, tokens, and the components |
| `kit.css` | Layout + component styling (all colors/type via `../../colors_and_type.css`) |
| `data.js` | Sample content (categories, kit/class lists, the Battlemind page) |
| `AbilityCard.jsx` | **Signature component** — info table + glyph tier badges + effect |
| `Chrome.jsx` | `NavBar`, `Sidebar`, `Toc`, `SearchModal` |
| `Screens.jsx` | `BrowseLanding`, `CategoryIndex`, `ContentPage` |
| `App.jsx` | Routing + theme state, mounts to `#root` |

## Notes for reuse
- Components export to `window` so each `text/babel` file can see the others — keep that pattern.
- `AbilityCard` takes an `ability` object (see `data.js`); `type` keys the colored left border
  (`strike|ranged|maneuver|triggered|area|villain`) and `tiers` render the `!`/`@`/`#` glyphs.
- This is a cosmetic recreation: search is a client-side filter, routing is local state, and
  content is a small hand-picked subset of the real parsed data (`SteelCompendium/data-*`).
- Anything not present on the live Browse view is intentionally omitted or stubbed.
