#!/usr/bin/env python3
"""usage: s557-sum2.py <log>... -- summary per G-S61 log of the shipped (post-fix) recorder output."""
import re, sys
PH = re.compile(r"\((\w+)\) [^;]*?: wrong-card frames: pending-on-another-block (\d+), stale (\d+) \(counted (\d+), longest counted run (\d+)\) of (\d+) \[catching up: longest (\d+) frame\(s\) / (\d+) ms, document behind the disk up to (\d+) ms after the write; stale cards: catching up (\d+), on a torn disk read (\d+), document had the disk value (\d+), neither (\d+); disk reads: torn in (\d+) frame\(s\), failed in (\d+)(?:; counted: ([^\]]*))?\]")
for path in sys.argv[1:]:
    s = open(path).read()
    ls = re.search(r"loadavg_start=(\S+ \S+ \S+)", s); le = re.search(r"loadavg_end=(\S+ \S+ \S+)", s)
    rc = re.search(r"^rc=(\d+) elapsed=(\d+)s", s, re.M)
    fail = re.search(r"G-S61 FAIL: (.*?)(?: -- outcomes:|$)", s, re.M)
    a = dict(n=0, frames=0, stale=0, counted=0, lr=0, cuf=0, cums=0, since=0, cu=0, u=0, torn=0, err=0, dd=0, x=0, pend=0)
    odd = []
    for m in PH.finditer(s):
        g = m.groups(); a['n'] += 1
        a['pend'] += int(g[1]); a['stale'] += int(g[2]); a['counted'] += int(g[3]); a['lr'] = max(a['lr'], int(g[4])); a['frames'] += int(g[5])
        a['cuf'] = max(a['cuf'], int(g[6])); a['cums'] = max(a['cums'], int(g[7])); a['since'] = max(a['since'], int(g[8]))
        a['cu'] += int(g[9]); a['u'] += int(g[10]); a['dd'] += int(g[11]); a['x'] += int(g[12]); a['torn'] += int(g[13]); a['err'] += int(g[14])
        if g[15]: odd.append(f"({g[0]}) {g[15]}")
    print(f"{path.split('/')[-1]}: {'OK' if 'G-S61 ok' in s else 'FAIL'} rc={rc.group(1) if rc else '?'} {rc.group(2) if rc else '?'}s load {ls.group(1) if ls else '?'} -> {le.group(1) if le else '?'}")
    print(f"   phases {a['n']} frames {a['frames']} stale-frames {a['stale']} counted {a['counted']} longest-counted-run {a['lr']} pending {a['pend']} | cards catching-up {a['cu']} torn-read {a['u']} (torn frames {a['torn']}, failed reads {a['err']}) dd {a['dd']} neither {a['x']} | max catching-up run {a['cuf']}f/{a['cums']}ms, doc behind disk <= {a['since']}ms")
    if odd: print("   odd:", " ; ".join(odd))
    if fail: print("   FAIL:", fail.group(1)[:900])
