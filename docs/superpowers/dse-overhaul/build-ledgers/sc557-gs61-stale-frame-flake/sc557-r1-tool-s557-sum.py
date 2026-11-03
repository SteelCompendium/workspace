#!/usr/bin/env python3
"""usage: s557-sum.py <log>... -- one summary line per G-S61 log (stale-frame classes, longest runs, loadavg, status, failing phases)."""
import re, sys

PH = re.compile(r"\((\w+)\) [^;]*?: wrong-card frames: pending-on-another-block (\d+), stale (\d+) \(longest run (\d+)\) of (\d+)"
                r"(?: \[stale cards cu (\d+) dd (\d+) x (\d+); frames cu (\d+) hard (\d+); longest any (\d+)f/(\d+)ms, cu (\d+)f/(\d+)ms \(doc behind disk up to (\d+)ms after the write\), hard (\d+)f/(\d+)ms(?:; odd: ([^\]]*))?\])?")
for path in sys.argv[1:]:
    s = open(path).read()
    head = re.search(r"label=(\S+) kind=(\S+) rep=(\d+)", s)
    ls = re.search(r"loadavg_start=(\S+ \S+ \S+)", s)
    le = re.search(r"loadavg_end=(\S+ \S+ \S+)", s)
    rc = re.search(r"^rc=(\d+) elapsed=(\d+)s", s, re.M)
    ok = "G-S61 ok" in s
    fail = re.search(r"G-S61 FAIL: (.*?)(?: -- outcomes:|$)", s, re.M)
    agg = dict(frames=0, stale=0, longest=0, pend=0, cu=0, dd=0, x=0, anyf=0, anyms=0, cuf=0, cums=0, since=0, hardf=0, hardms=0, nph=0)
    odd = []
    perphase = []
    for m in PH.finditer(s):
        g = m.groups()
        agg['nph'] += 1
        agg['pend'] += int(g[1]); agg['stale'] += int(g[2]); agg['longest'] = max(agg['longest'], int(g[3])); agg['frames'] += int(g[4])
        if g[5] is not None:
            agg['cu'] += int(g[5]); agg['dd'] += int(g[6]); agg['x'] += int(g[7])
            agg['anyf'] = max(agg['anyf'], int(g[10])); agg['anyms'] = max(agg['anyms'], int(g[11]))
            agg['cuf'] = max(agg['cuf'], int(g[12])); agg['cums'] = max(agg['cums'], int(g[13])); agg['since'] = max(agg['since'], int(g[14]))
            agg['hardf'] = max(agg['hardf'], int(g[15])); agg['hardms'] = max(agg['hardms'], int(g[16]))
            if g[17]: odd.append(f"({g[0]}) {g[17]}")
        perphase.append(f"({g[0]}) st{g[2]}/lr{g[3]}/p{g[1]}")
    failphases = sorted(set(re.findall(r"(?:^|\| )\((\w+)\)", fail.group(1)))) if fail else []
    print(f"{path.split('/')[-1]}: {'OK' if ok else 'FAIL'} rc={rc.group(1) if rc else '?'} {rc.group(2) + 's' if rc else ''} load {ls.group(1) if ls else '?'} -> {le.group(1) if le else '?'}")
    print(f"   phases-with-recorder {agg['nph']} frames {agg['frames']} stale-frames {agg['stale']} (old longest run {agg['longest']}) pending {agg['pend']} | cards cu {agg['cu']} dd {agg['dd']} x {agg['x']} | max any {agg['anyf']}f/{agg['anyms']}ms cu {agg['cuf']}f/{agg['cums']}ms (doc behind disk <= {agg['since']}ms) hard {agg['hardf']}f/{agg['hardms']}ms")
    if odd: print("   odd:", " ; ".join(odd))
    if fail: print("   FAIL phases:", failphases, "|", fail.group(1)[:1200])
