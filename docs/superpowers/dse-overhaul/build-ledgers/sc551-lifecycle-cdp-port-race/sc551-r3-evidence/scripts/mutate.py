#!/usr/bin/env python3
"""SC-551 r3: mutation check of scripts/cdp-owned.mjs in the PRIVATE clone. Each mutant is applied, the helper's
jest file is run, and the file is restored from git. Prints KILLED/SURVIVED per mutant."""
import subprocess, sys

W = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r3-review/fixwt'
F = W + '/scripts/cdp-owned.mjs'
MUTANTS = [
    ('M1 skip the GUID compare', "if (served !== report.guid) {", "if (false) {"),
    ('M2 clearStaleReport is a no-op', "fs.unlinkSync(path.join(userDataDir, 'DevToolsActivePort'));", "void 0;"),
    ('M3 skip the pinned port-mismatch check', "if (pinned && report.port !== expectedPort) {", "if (false) {"),
    ('M4 no exited check while waiting for the report', "if (dead()) throw new CdpOwnershipError('exited', 'Obsidian exited during start-up');\n\t\tconst text", "const text"),
    ('M5 accept a half-written report (no UUID shape)', "if (!Number.isInteger(port) || port <= 0 || port > 65535 || !m) return null;\n\treturn { port, guid: m[1] };", "if (!Number.isInteger(port) || port <= 0) return null;\n\treturn { port, guid: m ? m[1] : lines[1] };"),
    ('M6 portInUse probes 127.0.0.1 only', "hosts = ['127.0.0.1', '::1']", "hosts = ['127.0.0.1']"),
    ('M7 pinned no-report message drops the owner clause', "(no DevToolsActivePort in its user-data-dir)${owner}`", "(no DevToolsActivePort in its user-data-dir)`"),
    ('M8 GUID compare via localhost not 127.0.0.1', "fetchImpl(`http://127.0.0.1:${report.port}/json/version`)", "fetchImpl(`http://localhost:${report.port}/json/version`)"),
]
orig = open(F).read()
for name, old, new in MUTANTS:
    if old not in orig:
        print(f'{name}: PATTERN NOT FOUND'); continue
    open(F, 'w').write(orig.replace(old, new, 1))
    r = subprocess.run(['npx', 'jest', 'test/unit/build/cdpOwned.test.ts'], cwd=W, capture_output=True, text=True)
    out = r.stdout + r.stderr
    tl = [l for l in out.splitlines() if l.startswith('Tests:')]
    failed = [l.strip() for l in out.splitlines() if l.strip().startswith('✕')]
    print(f"{name}: {'KILLED' if r.returncode else 'SURVIVED'} ({tl[0] if tl else '?'}) {failed[:3]}")
    open(F, 'w').write(orig)
subprocess.run(['git', '-C', W, 'checkout', '--', 'scripts/cdp-owned.mjs'])
print('restored; git status:', subprocess.run(['git', '-C', W, 'status', '--porcelain'], capture_output=True, text=True).stdout.strip() or 'clean')
