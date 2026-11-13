"""SC-563 r1 — composites. Every tile is a Playwright element shot at deviceScaleFactor 2 on BOTH
sides (2 image px per CSS px); tiles are pasted 1:1, never resized. Rows labelled in text;
colours named in prose with OKLCH lightness."""
import json, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, '..')
T = os.path.join(R, 'tiles')
OUTD = os.path.join(R, 'crops')
os.makedirs(OUTD, exist_ok=True)
glyphs = json.load(open(os.path.join(R, 'data', 'sc563-r1-glyphs.json')))['rows']
site = json.load(open(os.path.join(R, 'data', 'sc563-r1-site.json')))['rows']
plug = json.load(open(os.path.join(R, 'data', 'sc563-r1-plugin.json')))['rows']

def font(sz, bold=False):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
F_H = font(26, True); F_L = font(20, True); F_S = font(17); F_T = font(15)
BG = (18, 20, 22); FG = (235, 235, 235); MUTED = (170, 175, 180); RULE = (90, 95, 100)

def img(p): return Image.open(os.path.join(T, p)).convert('RGB')

# ---------------------------------------------------------------- composite 1: crest icon (dark)
ACTS = [
    ('maneuver', 'Maneuver', 'ability-mark', 'blue, L 0.72'),
    ('main', 'Main action', 'ability-concussive-strike', 'red, L 0.63'),
    ('triggered', 'Triggered', 'ability-parry', 'green, L 0.68'),
    ('move', 'Move', 'ability-phase-leap', 'orange, L 0.76'),
    ('none', 'No action / free', 'ability-revitalizing-limerick', 'pale grey, L 0.86'),
    ('trait', 'Trait', 'trait-determination', 'light purple, L 0.71'),
    ('villain', 'Villain action', None, 'red, L 0.64'),
]
def g(act, col):
    return next(x for x in glyphs if x['scheme'] == 'dark' and x['act'] == act and x['col'] == col)
def srow(rowid, scheme='dark'):
    return next(x for x in site if x.get('row') == rowid and x.get('scheme') in (('slate',) if scheme == 'dark' else ('default',)))

ROWS1 = [
    ('today', 'Today (plugin): Lucide outline icon, no fill (stroke 2 in the harness; 1.75 in real Obsidian)', lambda a: (img(f'glyph--dark--{a}--today--crest.png'), g(a, 'today'))),
    ('site', 'Site: DrawSteelGlyphs font glyph, solid (caption: what MCDM\'s glyph chart calls it)', None),
    ('I1', 'I1: adopt the site glyph font (villain keeps its skull: the site has no villain crest)', lambda a: (img(f'glyph--dark--{a}--I1--crest.png'), g(a, 'I1'))),
    ('I2', 'I2: fill the existing outline (fill: currentColor), villain skull left outline', lambda a: (img(f'glyph--dark--{a}--I2--crest.png'), g(a, 'I2'))),
    ('I3', 'I3: heavier stroke only (stroke-width 3), still an outline', lambda a: (img(f'glyph--dark--{a}--I3--crest.png'), g(a, 'I3'))),
]
CELL_W, LABEL_H, CAP_H = 228, 34, 62
cell_h = 136 + CAP_H
W1 = 20 + CELL_W * len(ACTS) + 20
H1 = 4000
o = Image.new('RGB', (W1, H1), BG); d = ImageDraw.Draw(o)
d.text((20, 14), 'SC-563 Q1: the icon inside the crest (dark). 2 image px per CSS px, not resized.', font=F_H, fill=FG)
d.text((20, 50), 'Columns = action kind. Under each tile: glyph name; ink box W x H (CSS px); ink area (CSS px²). Plugin cells are Mark\'s real crest', font=F_S, fill=MUTED)
d.text((20, 72), 'with the icon each kind gets (renderFeature.ts crestIconFor). Site cells are live steelcompendium.io/v2 pages. Glyph colour = the', font=F_S, fill=MUTED)
d.text((20, 94), 'action accent named in the header (same tokens on both sides); the shape, not the colour, is what this question changes.', font=F_S, fill=MUTED)
y = 124
for ci, (act, name, sid, colour) in enumerate(ACTS):
    d.text((20 + ci * CELL_W, y), name, font=F_L, fill=FG)
    d.text((20 + ci * CELL_W, y + 24), colour, font=F_T, fill=MUTED)
y += 54
for key, label, fn in ROWS1:
    d.line([(20, y), (W1 - 20, y)], fill=RULE, width=1)
    d.text((20, y + 6), label, font=F_L, fill=FG)
    y += LABEL_H
    for ci, (act, name, sid, colour) in enumerate(ACTS):
        x = 20 + ci * CELL_W
        if key == 'site':
            if not sid:
                d.text((x, y + 40), 'no site crest\n(statblock villain\nactions use a\nbare glyph)', font=F_T, fill=MUTED)
                continue
            r = srow(sid)
            tile = img(r['tiles']['crest'].replace('tiles/', ''))
            ink = r['glyphInk']; glyph = r['glyph']['text']
            MEAN = {'f': 'Self', 'l': 'Versatile', ')': 'Triggered Action', 'o': 'Area of Effect', '*': 'Trait'}
            cap = f"'{glyph}' = chart \"{MEAN.get(glyph, '?')}\"\n{ink['bbox']['w']:.0f}x{ink['bbox']['h']:.0f} at 60x68\narea {ink['inkCssPx2']:.0f} (x0.64 = {ink['inkCssPx2']*0.64:.0f})"
        else:
            tile, rec = fn(act)
            ink = rec['glyphInk']
            nm = rec['icon']
            if key == 'I1' and act != 'villain': nm = 'font ' + rec['glyph']['before']['content'].replace('"', "'")
            cap = f"{nm}  {ink['bbox']['w']:.0f}x{ink['bbox']['h']:.0f}\narea {ink['inkCssPx2']:.0f}"
        o.paste(tile, (x, y))
        d.text((x, y + tile.height + 3), cap, font=F_T, fill=MUTED)
    y += cell_h + 14
d.text((20, y + 4), 'Site area is at the site\'s 60x68 crest; "x0.64" rescales it to the plugin\'s 48x54 crest for a like-for-like ink comparison.', font=F_S, fill=MUTED)
d.text((20, y + 28), 'Shape-only reading: Today/I3 = 7 distinct outlines; I2 = 5 solid + dashed ring unchanged + skull outline; I1 = No action and Trait become the SAME star.', font=F_S, fill=MUTED)
o = o.crop((0, 0, W1, y + 60))
p1 = os.path.join(OUTD, 'sc563-r1-q1-crest-icon.png'); o.save(p1); print(p1, o.size)

# ---------------------------------------------------------------- composite 2: trait eyebrow (dark | light)
def prow(scheme, rowid, col):
    s = 'theme-dark' if scheme == 'dark' else 'theme-light'
    return next(x for x in plug if x['scheme'] == s and x['row'] == rowid and x['col'] == col)
def lab(ink): return f"{ink['hex']} L {ink['oklch']['L']:.2f}, {ink['contrast']:.1f}:1"
CROP_PLUGIN, CROP_SITE = 420, 470  # CSS px of the head's left part (crest + eyebrow + name)
ROWS2 = [
    ('today', 'Today (plugin): eyebrow word and diamond both grey; name = SC-368 option D (unchanged)'),
    ('site', 'Site: eyebrow word AND diamond in the trait accent (light purple in dark, dark purple in light)'),
    ('EA', 'E-A: copy the site (word + diamond in the trait accent), name = SC-368 D'),
    ('EC', 'E-C: diamond only in the trait accent, word stays grey, name = SC-368 D'),
    ('EA+368A', 'E-A combined with SC-368 option A (name repainted to the site\'s steel-lighter grey)'),
    ('368A', 'For reference: SC-368 option A alone (eyebrow grey)'),
]
cw = CROP_SITE * 2
W2 = 20 + cw * 2 + 40 + 20
o = Image.new('RGB', (W2, 4000), BG); d = ImageDraw.Draw(o)
d.text((20, 14), 'SC-563 Q2: the "◆ TRAIT" eyebrow on a trait card (Determination). 2 image px per CSS px, tiles cropped, not resized.', font=F_H, fill=FG)
d.text((20, 50), 'Left = dark scheme, right = light scheme. Under each tile: EYEBROW colour, lightness L (0-1) and contrast; NAME colour and L.', font=F_S, fill=MUTED)
d.text((20, 72), 'In dark the name should stay the lightest text; in light the darkest. Purple vs grey differs mostly in hue, so read the L numbers.', font=F_S, fill=MUTED)
y = 108
d.text((20, y), 'Dark (site "slate" / plugin Steel dark)', font=F_L, fill=FG)
d.text((20 + cw + 40, y), 'Light (site "default" / plugin Steel light)', font=F_L, fill=FG)
y += 34
for key, label in ROWS2:
    d.line([(20, y), (W2 - 20, y)], fill=RULE, width=1)
    d.text((20, y + 6), label, font=F_L, fill=FG)
    y += LABEL_H
    hmax = 0
    for si, scheme in enumerate(('dark', 'light')):
        x = 20 + si * (cw + 40)
        if key == 'site':
            r = srow('trait-determination', scheme)
            tile = img(r['tiles']['head'].replace('tiles/', ''))
            tile = tile.crop((0, 0, min(tile.width, CROP_SITE * 2), tile.height))
        else:
            r = prow(scheme, 'determination', key)
            tile = img(r['tiles']['head'].replace('tiles/', ''))
            tile = tile.crop((0, 0, min(tile.width, CROP_PLUGIN * 2), tile.height))
        o.paste(tile, (x, y))
        eb, nm = r['eyebrow']['ink'], r['name']['ink']
        def cname(h):
            return {'#bb8fce': 'light purple', '#7d3c98': 'dark purple', '#959b9e': 'grey', '#959b9f': 'grey', '#555960': 'dark grey', '#d3d9dd': 'near-white', '#cdd1d4': 'light steel grey', '#1a1d20': 'near-black', '#5f686d': 'mid steel grey'}.get(h, h)
        cap = f"eyebrow {cname(eb['hex'])} {lab(eb)}   |   name {cname(nm['hex'])} {nm['hex']} L {nm['oklch']['L']:.2f}"
        d.text((x, y + tile.height + 4), cap, font=F_T, fill=MUTED)
        hmax = max(hmax, tile.height + 26)
    y += hmax + 14
y += 6
d.text((20, y), 'Lightness, eyebrow vs name: dark  grey 0.68 / purple 0.71  vs name 0.88 (D) or 0.86 (A): the name stays lighter, so more prominent, either way.', font=F_S, fill=MUTED)
d.text((20, y + 22), 'Light  grey 0.46 / purple 0.48  vs name 0.23 (D): the name stays darker. vs 0.51 (A): BOTH eyebrows are darker than the name; that inversion is', font=F_S, fill=MUTED)
d.text((20, y + 44), 'SC-368 option A\'s, not the tint\'s (the purple is 0.02 lighter than the grey it replaces). The words "Trait" / "Feature" and the star crest stay.', font=F_S, fill=MUTED)
o = o.crop((0, 0, W2, y + 76))
p2 = os.path.join(OUTD, 'sc563-r1-q2-trait-eyebrow.png'); o.save(p2); print(p2, o.size)

# ---------------------------------------------------------------- composite 3: why the fill must be scoped
ALL = [
    ('crown', 'statblock Leader / title', 'keeps'), ('eye-off', 'statblock Ambusher', 'LOSES (smeared)'),
    ('wind', 'statblock Harrier', 'distorts'), ('target', 'statblock Artillery', 'LOSES (solid disc)'),
    ('hammer', 'statblock Brute', 'keeps'), ('brain', 'statblock Controller', 'LOSES (blob)'),
    ('sparkles', 'statblock Hexer', 'keeps'), ('footprints', 'statblock Mount; Move action', 'keeps'),
    ('heart-pulse', 'statblock Support', 'LOSES pulse (plain heart)'), ('shield', 'Defender, class, stamina healthy', 'keeps'),
    ('users', 'Minion, ancestry', 'keeps'), ('skull', 'Solo, villain, stamina dying', 'LOSES eyes (blob)'),
    ('shield-alert', 'stamina WINDED', 'LOSES "!" = same as healthy'), ('octagon-alert', 'complication', 'LOSES "!"'),
    ('briefcase', 'career', 'loses handle'), ('zap', 'condition; Triggered', 'keeps'),
    ('map', 'culture', 'LOSES folds (blob)'), ('backpack', 'kit head', 'LOSES detail (blob)'),
    ('package', 'treasure', 'LOSES (hexagon)'), ('gem', 'perk', 'LOSES facets'),
    ('book-open', 'rule', 'keeps'), ('hourglass', 'montage running', 'keeps'),
    ('trophy', 'montage won', 'distorts'), ('handshake', 'negotiation', 'LOSES (blob)'),
]
PER_ROW = 6; CW3 = 250
W3 = 20 + PER_ROW * CW3
o = Image.new('RGB', (W3, 3000), BG); d = ImageDraw.Draw(o)
d.text((20, 14), 'SC-563 Q1, why I2 is scoped: the SAME fill applied to every other crest icon', font=F_H, fill=FG)
d.text((20, 50), 'Each pair = outline today (left) | fill: currentColor (right). Dark, 2 image px per CSS px. Neutral metal ink (L 0.90) on purpose: only shape', font=F_S, fill=MUTED)
d.text((20, 72), 'differs. "LOSES" = an inner detail (eyes, "!", pulse, rings) fills into the body, so the icon stops saying what it says today.', font=F_S, fill=MUTED)
y = 108
for i in range(0, len(ALL), PER_ROW):
    hmax = 0
    for j, (icon, where, verdict) in enumerate(ALL[i:i + PER_ROW]):
        x = 20 + j * CW3
        a = img(f'allicon--dark--{icon}--today--crest.png'); b = img(f'allicon--dark--{icon}--fillAll--crest.png')
        o.paste(a, (x, y)); o.paste(b, (x + a.width + 6, y))
        d.text((x, y + a.height + 4), icon, font=F_T, fill=FG)
        d.text((x, y + a.height + 22), where, font=F_T, fill=MUTED)
        d.text((x, y + a.height + 40), verdict, font=F_T, fill=FG if verdict.startswith('LOSES') else MUTED)
        hmax = max(hmax, a.height + 66)
    y += hmax + 10
o = o.crop((0, 0, W3, y + 10))
p3 = os.path.join(OUTD, 'sc563-r1-q1-fill-spill.png'); o.save(p3); print(p3, o.size)
