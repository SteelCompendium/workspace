import json, sys
for f in sys.argv[1:]:
    print('=====', f.split('/')[-1])
    for line in open(f):
        name, _, rest = line.partition(': ')
        if rest.startswith('PROBE-ERROR'):
            print(name, rest.strip()[:300]); continue
        o = json.loads(rest)
        print(f"## {name}: buttons {o['total']}, clicked {len([c for c in o['clicks'] if 'bad' in c])}, BAD {o['badCount']}, errs {len(o.get('errs', []))}")
        for c in o['clicks']:
            if c.get('bad') or c.get('skipped') or c.get('error') or c.get('strayLive') or c.get('file'):
                print('   ', json.dumps(c)[:300])
        lab = [c['label'] for c in o['clicks'] if 'bad' in c and not c['bad']]
        print('    ok:', '; '.join(lab)[:400])
