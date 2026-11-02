import json, sys
def s(x):
    if not isinstance(x, dict) or 'sel' not in x:
        return json.dumps(x)[:300]
    parts = [f"sel {x['sel']}", f"st {x['st']}", 'RAW' if x['raw'] else 'card', f"inC {x['rootsInCallout']}/{x['roots']}", f"ic {x['ic']}"]
    if x.get('file') and not x['file'].startswith('R540/c') and not x['file'].startswith('R540/twin') and not x['file'].startswith('R540/emb') : parts.append('file ' + x['file'])
    elif x.get('file'): parts.append(x['file'].split('/')[-1])
    if x.get('mode') != 'source': parts.append('mode ' + str(x.get('mode')))
    if x['modal']: parts.append('MODAL')
    elif x['anyModal']: parts.append('anyModal')
    if x['menu']: parts.append('MENU')
    if x['popover']: parts.append(f"popover {x['popover']}")
    if x['leaves'] != 1: parts.append(f"leaves {x['leaves']}")
    parts.append(f"ae {x['ae']}")
    if x.get('aeSelRange'): parts.append(f"aeSel {x['aeSelRange']}")
    if x.get('aeValue') not in (None, ''): parts.append(f"aeVal {json.dumps(x['aeValue'][:20])}")
    if x['winSelLen']: parts.append(f"winSel {x['winSelLen']} {json.dumps(x['winSel'][:30])}")
    parts.append(f"docLen {x['docLen']}")
    return '{' + ', '.join(parts) + '}'
for f in sys.argv[1:]:
    print('=====', f.split('/')[-1])
    for line in open(f):
        name, _, rest = line.partition(': ')
        if rest.startswith('PROBE-ERROR'):
            print(name, rest.strip()[:400]); continue
        o = json.loads(rest)
        out = []
        for k, v in o.items():
            if k == 'errs':
                if v: out.append(f"ERRS {v}")
                continue
            out.append(f"{k}={s(v)}")
        print(f"## {name}\n   " + "\n   ".join(out))
