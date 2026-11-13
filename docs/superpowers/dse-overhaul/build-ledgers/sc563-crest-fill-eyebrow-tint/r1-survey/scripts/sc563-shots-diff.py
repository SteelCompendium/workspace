"""Compare two `sha256sum *.png` listings of visual-harness/shots (base run vs union-probe run).
usage: sc563-shots-diff.py base.sha256 union.sha256 out.json"""
import sys, json, collections
def load(p):
    d = {}
    for line in open(p):
        h, n = line.split()
        d[n] = h
    return d
a, b = load(sys.argv[1]), load(sys.argv[2])
moved = sorted(n for n in a if n in b and a[n] != b[n])
by = collections.Counter(n.rsplit('--', 1)[1] for n in moved)
ids = sorted({n.rsplit('--', 1)[0] for n in moved})
out = {'base': len(a), 'union': len(b), 'onlyBase': sorted(set(a) - set(b)), 'onlyUnion': sorted(set(b) - set(a)),
       'moved': len(moved), 'movedBySuffix': dict(by), 'movedIds': ids, 'movedNames': moved,
       'movedPrint': [n for n in moved if n.endswith(('--steel-print.png', '--steel-realprint.png'))]}
json.dump(out, open(sys.argv[3], 'w'), indent=1)
print({k: v for k, v in out.items() if k not in ('movedNames', 'movedIds')})
print('ids', len(ids), ids)
