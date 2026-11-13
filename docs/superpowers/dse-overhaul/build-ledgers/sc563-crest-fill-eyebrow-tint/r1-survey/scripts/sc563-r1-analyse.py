"""SC-563 r1 — reduce the raw JSON (site / plugin / glyphs / sweep) into the report tables.
Writes data/sc563-r1-summary.json and prints the tables."""
import json, glob, os, collections

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
site = json.load(open(os.path.join(D, 'sc563-r1-site.json')))['rows']
plug = json.load(open(os.path.join(D, 'sc563-r1-plugin.json')))['rows']
gly = json.load(open(os.path.join(D, 'sc563-r1-glyphs.json')))['rows']
sweep = []
for f in sorted(glob.glob(os.path.join(D, 'sc563-r1-sweep-*.json'))):
    sweep += json.load(open(f))['rows']
summary = {}

def c(x):
    if not x: return '-'
    o = x.get('oklch', {})
    return f"{x.get('hex')} L{o.get('L')} C{o.get('C')} h{o.get('h')} {x.get('contrast','')}:1 on {x.get('bgHex','')}"

print('== SITE glyph + eyebrow ==')
for r in site:
    if 'glyph' not in r: continue
    g = r.get('glyph') or {}
    ink = r.get('glyphInk') or {}
    eb = r.get('eyebrow') or {}
    print(r['scheme'], r['row'], 'act', r.get('act'), 'crest', r.get('crest', {}).get('rect', {}).get('w'), 'x', r.get('crest', {}).get('rect', {}).get('h'),
          'glyph', repr(g.get('text')), g.get('style', {}).get('font-size'), 'ink', ink.get('bbox', {}).get('w'), 'x', ink.get('bbox', {}).get('h'), 'area', ink.get('inkCssPx2'), 'cov', ink.get('coverage'),
          '| eyebrow', eb.get('text'), c(eb.get('ink')), 'dia', c(eb.get('diaInk')), '| name', c((r.get('name') or {}).get('ink')))

print('\n== PLUGIN heads (today + eyebrow options) ==')
for r in plug:
    if r['col'] not in ('today', 'EA', 'EC', '368A', 'EA+368A', 'EC+368A'): continue
    if r['row'] not in ('determination', 'mark'): continue
    eb = r.get('eyebrow') or {}
    print(r['scheme'], r['row'], r['col'], '| eyebrow', c(eb.get('ink')), 'dia', c(eb.get('diaInk')), '| name', c((r.get('name') or {}).get('ink')))

print('\n== GLYPHS per act (plugin, crest 48x54.39) vs site (crest 60x68, scaled x0.8 / area x0.64) ==')
site_by_act = {}
for r in site:
    if r.get('scheme') == 'dark' and r.get('row', '').startswith(('ability-', 'trait-')) and r.get('glyphInk'):
        site_by_act.setdefault(r['act'], r)
tab = []
for scheme in ('dark',):
    for act in ('maneuver', 'main', 'triggered', 'move', 'none', 'trait', 'villain'):
        row = {'act': act}
        for col in ('today', 'I1', 'I2', 'I3'):
            g = next(x for x in gly if x['scheme'] == scheme and x['act'] == act and x['col'] == col)
            ink = g['glyphInk']
            row[col] = {'icon': g['icon'] if col != 'I1' or act == 'villain' else (g['glyph'].get('before') or {}).get('content'),
                        'w': ink['bbox']['w'], 'h': ink['bbox']['h'], 'area': ink['inkCssPx2'], 'cov': ink['coverage'],
                        'sw': g['glyph']['style']['stroke-width'], 'fill': g['glyph']['style']['fill'], 'color': g['glyph']['style']['color']}
        s = site_by_act.get(act)
        if s:
            ink = s['glyphInk']
            row['site'] = {'glyph': s['glyph']['text'], 'row': s['row'], 'w': ink['bbox']['w'], 'h': ink['bbox']['h'], 'area': ink['inkCssPx2'],
                           'w@plugin': round(ink['bbox']['w'] * 0.8, 1), 'h@plugin': round(ink['bbox']['h'] * 0.8, 1), 'area@plugin': round(ink['inkCssPx2'] * 0.64, 1), 'cov': ink['coverage'], 'color': s['glyph']['style']['color']}
        tab.append(row)
        print(json.dumps(row))
summary['glyphs'] = tab

print('\n== SWEEP ==')
# what each option changes, per node, per mode
def crest_sig(n):
    return (n['display'], (n['svg'] or {}).get('display'), (n['svg'] or {}).get('fill'), (n['svg'] or {}).get('sw'), n['before'], n['w'], n['h'])
def eb_sig(n):
    return (n['display'], n['color'], n['dia'], n['w'])
OPTS = ['I1', 'I2', 'I3', 'EA', 'EC', 'UNION']
moved = {m: {o: set() for o in OPTS + ['CONTROL']} for m in ('dark', 'light', 'print', 'realprint')}
nodes = {m: {o: 0 for o in OPTS + ['CONTROL']} for m in ('dark', 'light', 'print', 'realprint')}
hashmoved = {m: {o: [] for o in OPTS + ['CONTROL']} for m in ('print', 'realprint')}
contexts = collections.Counter()
eyebrow_ctx = collections.Counter()
for rec in sweep:
    t = rec['cols']['today']
    m = rec['mode']
    cid = f"{rec['el']}/{rec['fx']}"
    if m == 'dark':
        for n in t['crests']:
            contexts[(n['host'], n['cls'], n['icon'], n['act'], n['inSbFb'], n['display'])] += 1
        for n in t['eyebrows']:
            eyebrow_ctx[(n['host'], n['text'], n['act'], n['inSbFb'], n['display'], n['color'], n['dia'])] += 1
    for o in OPTS + ['CONTROL']:
        if o not in rec['cols']: continue
        a = rec['cols'][o]
        dc = sum(1 for x, y in zip(t['crests'], a['crests']) if crest_sig(x) != crest_sig(y))
        de = sum(1 for x, y in zip(t['eyebrows'], a['eyebrows']) if eb_sig(x) != eb_sig(y))
        if dc or de:
            moved[m][o].add(cid)
            nodes[m][o] += dc + de
        if m in ('print', 'realprint') and rec['hash'].get(o) != rec['hash'].get('today'):
            hashmoved[m][o].append(cid)
print('captures (element/fixture) whose crest/eyebrow computed style changes, per option and mode:')
for m in moved:
    print(' ', m, {o: len(v) for o, v in moved[m].items()}, 'nodes', nodes[m])
print('print/realprint full-page screenshot hash changes:')
for m in hashmoved:
    print(' ', m, {o: len(v) for o, v in hashmoved[m].items()})
print('combos swept', len({(r['el'], r['fx']) for r in sweep}), 'records', len(sweep))
print('\ncrest contexts (dark, today):')
for k, v in sorted(contexts.items(), key=lambda kv: (str(kv[0][0]), str(kv[0][1]))):
    print(' ', v, k)
print('\nleft-eyebrow contexts (dark, today):')
for k, v in sorted(eyebrow_ctx.items(), key=lambda kv: str(kv[0])):
    print(' ', v, k)
summary['moved'] = {m: {o: sorted(v) for o, v in moved[m].items()} for m in moved}
summary['hashMoved'] = hashmoved
summary['crestContexts'] = [[*k, v] for k, v in contexts.items()]
summary['eyebrowContexts'] = [[*k, v] for k, v in eyebrow_ctx.items()]
json.dump(summary, open(os.path.join(D, 'sc563-r1-summary.json'), 'w'), indent=1)

print('\n== print / realprint visibility today (all crests, icons, left eyebrows) ==')
vis = collections.Counter()
for rec in sweep:
    if rec['mode'] not in ('print', 'realprint'): continue
    t = rec['cols']['today']
    for n in t['crests']:
        vis[(rec['mode'], 'crest:' + n['cls'].split()[0] if 'dse-crest' in n['cls'] else n['cls'], n['display'], n['w'] > 0)] += 1
    for n in t['eyebrows']:
        vis[(rec['mode'], 'eyebrow', n['host'], 'feature' if n['act'] else 'non-feature', n['display'], n['w'] > 0)] += 1
for k, v in sorted(vis.items(), key=lambda kv: str(kv[0])):
    print(' ', v, k)
print('\n== which captures each option moves on screen (dark) ==')
for o in ['I1', 'I2', 'I3', 'EA', 'EC']:
    print(' ', o, sorted(summary['moved']['dark'][o]))
print('CONTROL print moved:', sorted(summary['moved']['print']['CONTROL']))
