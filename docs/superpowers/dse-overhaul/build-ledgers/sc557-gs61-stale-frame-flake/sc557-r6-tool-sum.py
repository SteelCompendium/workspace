#!/usr/bin/env python3
"""usage: r2-sum.py <log>... -- per G-S61 log: verdict, failing phases with the check that failed, and the recorder stats per recorded phase."""
import re, sys

PH = re.compile(r"\((\w+)\) [^;]*?: wrong-card frames: pending-on-another-block (\d+), stale (\d+) \(counted (\d+), longest counted run (\d+)\) of (\d+) \[catching up: longest (\d+) frame\(s\) / (\d+) ms, document behind the disk up to (\d+) ms after the write; stale cards: catching up (\d+), on a torn disk read (\d+), document had the disk value (\d+), neither (\d+); disk reads: torn in (\d+) frame\(s\) \(longest run (\d+)\), failed in (\d+)(?:; counted: ([^\]]*))?\]")

def kind(p):
    if 'the blocks hold' in p: return 'disk'
    if 'did not catch up' in p: return 'CAP'
    if 'could not read the note' in p: return 'READERR'
    if 'was torn in' in p: return 'TORNRUN'
    if 'wrong cards on screen' in p:
        m = re.search(r"- (\d+) frame\(s\) of \d+ with a pending edit.*?, (\d+) frame\(s\) \((\d+) in a row\)", p)
        if m:
            out = []
            if int(m.group(1)) > 0: out.append('pending')
            if int(m.group(3)) >= 3: out.append(f'stale-run{m.group(3)}')
            return '+'.join(out) or 'wrong?'
        return 'wrong?'
    if 'card of block' in p: return 'card'
    if 'names are' in p or 'is named' in p: return 'name'
    if 'outside the blocks' in p: return 'outside'
    if 'click 2' in p or 'logged' in p: return 'vacuity'
    return 'other:' + p[:80]

for path in sys.argv[1:]:
    s = open(path).read()
    hdr = s.splitlines()[0] if s else ''
    ls = re.search(r"loadavg_start=(\S+ \S+ \S+)", s); le = re.search(r"loadavg_end=(\S+ \S+ \S+)", s)
    rc = re.search(r"^rc=(\d+) elapsed=(\d+)s", s, re.M)
    ok = 'G-S61 ok' in s
    print(f"{path.split('/')[-1]}: {'OK' if ok else 'FAIL'} rc={rc.group(1) if rc else '?'} {rc.group(2) if rc else '?'}s load {ls.group(1) if ls else '?'} -> {le.group(1) if le else '?'}")
    fm = re.search(r"G-S61 FAIL: (.*?) -- (?:outcomes|passed):", s, re.S)
    if fm:
        per = {}
        for p in re.split(r" \| (?=\(\w+\) )", fm.group(1)):
            m = re.match(r"\((\w+)\)( [^:]*?then click block \d)?", p)
            ph = (m.group(1) + ('+follow' if m and m.group(2) else '')) if m else '?'
            per.setdefault(ph, []).append(kind(p))
        print('   failing:', '  '.join(f"({k}) {','.join(v)}" for k, v in per.items()))
        for p in re.split(r" \| (?=\(\w+\) )", fm.group(1)):
            if kind(p) in ('CAP','READERR','TORNRUN') or 'stale-run' in kind(p): print('     msg:', p[:300])
    elif not ok:
        print('   (no G-S61 FAIL line)', [l for l in s.splitlines() if 'FAIL' in l or 'Error' in l][:3])
    for m in PH.finditer(s):
        g = m.groups()
        print(f"   ({g[0]}) frames {g[5]} pend {g[1]} stale {g[2]} counted {g[3]} run {g[4]} | catch-up max {g[6]}f/{g[7]}ms docbehind<={g[8]}ms | cu {g[9]} u {g[10]} dd {g[11]} x {g[12]} | torn {g[13]} longest-torn-run {g[14]} failed {g[15]}" + (f" | counted {g[16][:120]}" if g[16] else ''))
