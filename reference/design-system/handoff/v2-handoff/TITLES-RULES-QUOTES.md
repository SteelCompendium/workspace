# Rules, Blockquotes & Titles — handoff

> **SHIP NOW:** the **◆ horizontal rule** and the **filigree-frame blockquote** are implemented
> in `steel-redesign.css` — pull the updated file and rebuild. **No new stylesheet, no JS, no
> markup change, no new tokens.**
>
> **PARKED:** the **page-title masthead** is intentionally *not* deployed (see §4). It needs a
> full-bleed treatment that clears the header/tabs/sidebars, and read wrong inside the centered
> content column. The design intent + the CSS are preserved below for a later pass.

Both shipped treatments are themed for **slate** (dark) + **default** (light).

> **Preview:** open `preview/site.html` → **"Rules & quotes"** tab. Renders a faux Conduit page
> (plain title + the ◆ rule + a flavor quote and the license line) on the production CSS, with the
> 🌙 light/dark toggle. The **"Browse landing"** tab shows the ◆ rule inside the category cards.

---

## 1 · Files & wire-up

| File | Repo path | Role |
|---|---|---|
| `steel-redesign.css` | `v2 → docs/stylesheets/steel-redesign.css` | The ◆ rule + filigree blockquote live at the bottom of the file. |

**No `mkdocs.yml` change.** `steel-redesign.css` is already in `extra_css` (it ships the landing
+ index cards). Because it loads **after** the site's `extra.css`, its `.md-typeset hr` and
`.md-typeset blockquote` rules win on equal specificity and override the base sheet — the dull hr
and the left-bar blockquote need no edit. **Do not** patch `extra.css`; the override is the whole
mechanism (the same additive pattern as every other `steel-*` sheet).

Rebuild: `cd v2 && mkdocs serve` → open any content page (e.g. `/Browse/kit/`).

---

## 2 · What ships (no markup change)

Both style the **bare HTML Markdown already emits** — you do not touch the generator:

| Markdown | Rendered | Styled as |
|---|---|---|
| `---` | `<hr>` | polished ◆ steel rule (— · ◆ · —) |
| `> Flavor text…` | `<blockquote><p>…</p></blockquote>` | filigree frame |

**Scope guard — ability/trait cards are safe.** Leaf ability/trait cards render as
`<article class="sc-ability">` (see `ABILITY-CARDS.md` / `TRAITS.md`), **not** `<blockquote>`,
so the filigree-frame rule never touches them. Only *plain* prose blockquotes (flavor asides,
notes, the license disclaimer) get the frame. If any legacy emoji-prefixed **ability
blockquotes** survive on an un-migrated page, give that blockquote a class and add
`.md-typeset blockquote.is-ability { … }` to opt it out — the shipped ability pipeline already
avoids this.

---

## 3 · How each is built (so you can tune it)

### Horizontal rule — `.md-typeset hr`
- Two gradients fade the 1px line **outward from the center**; sized `calc(50% - 30px)` so they
  stop short of the ornament cluster.
- `hr::before` paints the **two seed dots** flanking the centre; `hr::after` is the ◆ — a 9px
  `--fx-metal` square rotated 45° with a two-step `box-shadow` halo:
  `0 0 0 4px var(--md-default-bg-color)` (a clean gap in the page colour) then
  `0 0 0 5px var(--fx-metal-faint)` (a faint steel ring).
- Replaces the base "faded line + flat grey square" hr. Inside the small landing cards the dots
  are dropped and the line tightened (`.grid.cards > ul > li > hr`).

### Blockquote — `.md-typeset blockquote`
- A **raised steel plate**: `background: var(--fx-card-bg)` (the same `#232a2e→#181c1f` /
  `#fff→#eef1f1` card gradient as the index cards), a hairline border (`rgba(255,255,255,.06)` /
  `--md-default-fg-color--lightest`), `.6rem` radius, and `--fx-bevel` + a soft drop shadow for
  depth. This resets Material's thick left bar.
- Generous padding (`1.45rem 1.7rem`) keeps the text clear of the corners.
- `blockquote::before` draws the **four corner L-brackets** with eight 1px gradient layers,
  `inset: 12px` so they sit a comfortable distance inside the border (no markup needed).
- `blockquote::after` seats a small ◆ on each **bracket elbow** via a 4-position CSS `mask`
  (`inset: 9px` → a 6px diamond centres on the 12px bracket corner), filled with `--fx-metal` so
  it themes automatically.
- **Tuning:** brackets inset = `::before inset`; to move the diamonds keep `::after inset =
  (::before inset − 3px)`. Soften/strengthen the plate via the border alpha + shadow.

No new tokens — both treatments compose the existing `--fx-*`, `--md-*`, and `--sc-steel-*`.

---

## 4 · PARKED — page-title masthead (do NOT deploy yet)

**Why it's parked.** The approved design (canvas `LandingIlluminated` — see
`redesign/` in the design system, or the screenshot the maintainer shared) is a **full-bleed
band**: edge-to-edge damascus waves, a crest, kicker, illuminated title and subtitle. Dropped
into the MkDocs **content column** (`.md-main`, ~60rem, centered) it reads as a boxed card and
fights the header, tabs, and nav sidebars instead of spanning behind them. Getting it right means
deciding where the band lives in the **theme shell** (an `overrides/main.html` hero region or a
full-width container that breaks out of `.md-content`), not in `.md-typeset`. That's a layout
task for a dedicated pass.

**When we revisit — the design intent:**
- Full-width steel band, subtle vertical gradient, a **flowing damascus-wave field** (mask a
  wave SVG with a themed ink so it works on dark *and* the white light band), bottom hairline.
- Hub layout: `.sc-crest` shield · (`.sc-kicker` eyebrow + `<h1>` with a `.sc-illuminated`
  metallic accent word + `.sc-sub` subtitle).
- Must break out of the reading column to the viewport (minus sidebars), and clear the sticky
  header + tabs.

**Preserved CSS** (was in `steel-redesign.css`; removed so it doesn't ship). Drop back in — but
into a full-bleed shell, not `.md-typeset h1` — when we pick this up. Needs five tokens in both
`[data-md-color-scheme]` blocks:

```css
--fx-masthead-bg: linear-gradient(180deg,#20262a,#161a1d);  /* dark; #fff→#eef1f1 light */
--fx-etch-ink:    #aeb6bb;                                   /* wave fill; #6b7378 light */
--fx-etch-opacity:.15;                                       /* .14 light */
--fx-wave: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='132' height='36'%3E%3Cpath d='M0 18 Q33 5 66 18 T132 18' fill='none' stroke='%23000' stroke-width='1.4'/%3E%3C/svg%3E");
```

```css
.sc-masthead { position:relative; overflow:hidden; display:flex; align-items:center; gap:1.35rem;
  padding:1.7rem 1.4rem 1.5rem; background:var(--fx-masthead-bg);
  border-bottom:1px solid var(--fx-metal-line); box-shadow:var(--fx-bevel); }
.sc-masthead::before { content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
  background:var(--fx-etch-ink); opacity:var(--fx-etch-opacity);
  -webkit-mask:var(--fx-wave) 0 0/132px 36px; mask:var(--fx-wave) 0 0/132px 36px; }
.sc-masthead > * { position:relative; z-index:1; }
.sc-masthead__body { min-width:0; }
.sc-masthead h1 { margin:0; font-family:var(--md-large-header-font); text-transform:uppercase;
  font-size:3rem; line-height:.9; color:var(--sc-steel-lighter); text-shadow:var(--fx-emboss); }
.sc-kicker { font-family:var(--md-small-header-font); font-variant:small-caps; text-transform:lowercase;
  letter-spacing:.18em; font-size:.92rem; color:var(--fx-metal); margin:0 0 .3rem; }
.sc-sub { color:var(--md-default-fg-color--light); font-size:1rem; line-height:1.5; margin:.45rem 0 0; max-width:64ch; }
.sc-illuminated { background:var(--fx-metal-grad); -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent; }
```

Until then, page titles keep the site's existing `<h1>` styling — untouched.
