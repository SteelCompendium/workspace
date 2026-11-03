#!/usr/bin/env python3
"""SC-551 r5: mutation check of the r4 socket-owner proof in scripts/cdp-owned.mjs, in the PRIVATE clone. Each mutant
is applied, the helper's jest file runs, and the file is restored. Prints KILLED/SURVIVED per mutant."""
import subprocess

W = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r5/r4wt'
F = W + '/scripts/cdp-owned.mjs'
OWNER_IF = "if (listening.size === 0 || [...listening].some((inode) => !ours.has(`socket:[${inode}]`))) {"
MUTANTS = [
    ('R1 skip the socket-owner check entirely', OWNER_IF, "if (false) {"),
    ('R2 accept any pid (every inode counts as ours)', "!ours.has(`socket:[${inode}]`)", "false"),
    ('R3 read only /proc/net/tcp6', "for (const table of ['/proc/net/tcp', '/proc/net/tcp6']) {", "for (const table of ['/proc/net/tcp6']) {"),
    ('R4 read only /proc/net/tcp', "for (const table of ['/proc/net/tcp', '/proc/net/tcp6']) {", "for (const table of ['/proc/net/tcp']) {"),
    ('R5 nothing listening counts as ours', OWNER_IF, "if ([...listening].some((inode) => !ours.has(`socket:[${inode}]`))) {"),
    ('R6 one of several listeners ours is enough (some -> every)', "[...listening].some((inode) => !ours.has(", "[...listening].every((inode) => !ours.has("),
    ('R7 no LISTEN-state filter', "if (f.length < 10 || f[3] !== '0A') continue;", "if (f.length < 10) continue;"),
    ('R8 unreadable procfs passes (fail open)', "if (listening === null || ourSockets === null) {", "if (false) {"),
    ('R9 socket check after the HTTP GUID read (order)', "const listening = listenInodes(report.port, readProc);", "await fetchImpl(`http://127.0.0.1:${report.port}/json/version`).catch(() => {});\n\tconst listening = listenInodes(report.port, readProc);"),
    ('R10 servesBrowser always true', "return String(v.webSocketDebuggerUrl ?? '').endsWith(`/devtools/browser/${guid}`);", "return true;"),
]
orig = open(F).read()
for name, old, new in MUTANTS:
    if old not in orig:
        print(f'{name}: PATTERN NOT FOUND'); continue
    open(F, 'w').write(orig.replace(old, new, 1))
    r = subprocess.run(['npx', 'jest', 'test/unit/build/cdpOwned.test.ts'], cwd=W, capture_output=True, text=True)
    out = r.stdout + r.stderr
    tl = [l for l in out.splitlines() if l.startswith('Tests:')]
    failed = [l.strip()[:110] for l in out.splitlines() if l.strip().startswith('✕')]
    print(f"{name}: {'KILLED' if r.returncode else 'SURVIVED'} ({tl[0].strip() if tl else '?'}) {failed[:3]}")
    open(F, 'w').write(orig)
subprocess.run(['git', '-C', W, 'checkout', '--', 'scripts/cdp-owned.mjs'])
print('restored; git status:', subprocess.run(['git', '-C', W, 'status', '--porcelain'], capture_output=True, text=True).stdout.strip() or 'clean')
