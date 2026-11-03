#!/usr/bin/env python3
"""usage: s557-attr.py <log>... -- per failing G-S61 phase, which checks fail it (disk / card / pending / stale-run / cu-cap / other)."""
import re, sys

for path in sys.argv[1:]:
    s = open(path).read()
    fail = re.search(r"G-S61 FAIL: (.*?)(?: -- outcomes:|$)", s, re.M)
    print(path.split('/')[-1], 'OK' if 'G-S61 ok' in s else 'FAIL')
    if not fail:
        continue
    byphase = {}
    for part in fail.group(1).split(' | '):
        m = re.match(r"\((\w+)\)", part)
        # the frame samples are inside parentheses after the message; those continuation parts have no label
        if not m or not re.match(r"\(\w+\) ", part):
            continue
        ph = m.group(1)
        kinds = byphase.setdefault(ph, set())
        if 'the blocks hold' in part:
            kinds.add('disk')
        elif 'the note\'s names' in part:
            kinds.add('names')
        elif 'card of block' in part and ('shows' in part or 'is named' in part):
            kinds.add('card')
        elif 'draws' in part:
            kinds.add('card-count')
        elif 'wrong cards on screen' in part:
            p = re.search(r"- (\d+) frame\(s\) of \d+ with a pending", part)
            r = re.search(r"(\d+) frame\(s\) \((\d+) in a row\)", part)
            if p and int(p.group(1)) > 0:
                kinds.add('pending')
            if r and int(r.group(2)) >= 3:
                kinds.add('stale-run')
            if 'did not catch up' in part:
                kinds.add('cu-cap')
        elif 'did not come before' in part or 'logged' in part:
            kinds.add('anti-vacuity')
        else:
            kinds.add('other:' + part[:80])
    for ph in sorted(byphase):
        print(f"   ({ph}): {sorted(byphase[ph])}")
