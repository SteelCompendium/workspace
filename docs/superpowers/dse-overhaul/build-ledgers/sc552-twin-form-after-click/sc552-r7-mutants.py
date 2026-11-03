#!/usr/bin/env python3
# usage: mutants.py <id|all> [--bundle]   applies one reviewer mutant to the scratch HEAD copy (src-mut), runs the SC-552 jest suites
# (and, with --bundle, builds scratch/bundle-<id>), then restores the file. The worktree is never touched.
import subprocess, sys, os, re
S = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r7-ad6d3563992bb99bd'
M = S + '/src-mut'
RMH = 'src/framework/host/ReadingModeBlockHost.ts'
FM = 'src/authoring/FormModal.ts'
LM = 'src/framework/host/lineMap.ts'
MUT = {
    'R7-M18-disable-saves-then-closes': (FM, "\t\tholder.register(() => this.close());\n", "\t\tholder.register(() => { void this.save(); this.close(); });\n"),
    'R7-M16-holder-close-not-registered': (FM, "\t\tholder.register(() => this.close());\n", ""),
    'R7-M17-holder-not-parented': (FM, "\t\tparent.addChild(holder);\n", ""),
    'R5-M12-closed-guard-removed': (FM, "if (this.kept || this.closed) return;", "if (this.kept) return;"),
    'R5-M12b-closed-never-set': (FM, "\t\tthis.closed = true;\n", ""),
    'R3-M1-pendingPin-not-cleared': (RMH, "\t\tif (options?.fromView === true) this.pendingPin = null;\n", ""),
    'R3-M2a-mapLine-tail-off-by-one': (LM, "if (line >= a.length - tail) return line + (b.length - a.length);", "if (line >= a.length - tail) return line + (b.length - a.length) + 1;"),
    'R3-M2b-mapLine-myers-off-by-one': (LM, "if (target >= startX && target < x) return head + target - (x - y);", "if (target >= startX && target < x) return head + target - (x - y) + 1;"),
    'R3-M2c-mapLine-head-off-by-one': (LM, "if (line < head) return line;", "if (line <= head) return line;"),
    'R3-M3-K-without-pin': (FM, "const keeper = modal.hasPin() ? (cx.host.keepFormOpenOn?.() ?? null) : null;", "const keeper = cx.host.keepFormOpenOn?.() ?? null;"),
    'R3-M4-host-pinOnly-falls-back': (RMH, "const target = pinned ?? (pin && options?.pinOnly ? 'miss' : this.resolveWriteTarget(content, section));", "const target = pinned ?? this.resolveWriteTarget(content, section);"),
    'R3-M5-holder-never-removed': (FM, "\t\tkept.parent.removeChild(kept.holder);\n", ""),
    'R3-M6-pin-body-check-removed': (RMH, "if (this.knownBody !== null && normalizeBody(body) !== normalizeBody(this.knownBody)) return null;", "void body;"),
    'R3-M7-repin-every-intent': (RMH, "if (pin && !this.pendingPin) this.pendingPin = pin;", "if (pin) this.pendingPin = pin;"),
    'R3-M8-K-ignores-registry-loaded': (RMH, "if (!(registry as unknown as { _loaded: boolean })._loaded) return null;", ""),
    'R3-M9-K-even-with-section': (RMH, "if (!registry || !this._renderChildGone) return null;", "if (!registry) return null;"),
    'R3-M10-unterminated-body-short': (RMH, "body = lines.slice(unterminated.lineStart + 1, unterminated.lineEnd + 1).join('\\n');", "body = lines.slice(unterminated.lineStart + 1, unterminated.lineEnd).join('\\n');"),
    'R3-M11-myers-delete-check-removed': (LM, "\t\tif (target === x && prevK === k - 1) return null; // that line was deleted at this step\n", ""),
    'R3-M14-K-any-note-shown': (RMH, ".some((leaf) => (leaf.view as MarkdownView).file?.path === this.ctx.sourcePath);", ".some((leaf) => !!(leaf.view as MarkdownView).file);"),
    'R3-M15-pin-language-ignored': (RMH, "let fence: { lineStart: number; lineEnd: number } | undefined = listFences(content, language).find((f) => f.lineStart === line);", "let fence: { lineStart: number; lineEnd: number } | undefined = listFences(content, language).find((f) => f.lineStart === line) ?? (line >= 0 ? { lineStart: line, lineEnd: line + 5 } : undefined);"),
}
SUITES = ['test/dom/authoring/formModal.test.ts', 'test/dom/framework/reading-mode-host-pin.test.ts', 'test/dom/framework/twin-reuse.test.ts', 'test/unit/framework/lineMap.test.ts']

def run(mid, bundle):
    f, a, b = MUT[mid]
    p = os.path.join(M, f)
    orig = open(p).read()
    assert orig.count(a) == 1, (mid, 'anchor count', orig.count(a))
    open(p, 'w').write(orig.replace(a, b, 1))
    try:
        log = f'{S}/jest-mut-{mid}.log'
        r = subprocess.run(['npx', 'jest', *SUITES], cwd=M, capture_output=True, text=True)
        open(log, 'w').write(r.stdout + r.stderr)
        out = r.stdout + r.stderr
        tests = re.search(r'^Tests:.*$', out, re.M)
        fails = sorted(set(re.findall(r'^  ● (.+?) › (.+)$', out, re.M)))
        print(f'{mid}: rc={r.returncode} {tests.group(0) if tests else "no Tests line"}')
        for d, t in fails[:8]:
            print(f'    x {d[:50]} > {t[:110]}')
        if bundle:
            subprocess.run(['node', 'esbuild.config.mjs', 'production'], cwd=M, capture_output=True, text=True, check=True)
            out_dir = f'{S}/bundle-{mid}'
            os.makedirs(out_dir, exist_ok=True)
            for fn in ['main.js', 'styles.css', 'manifest.json']:
                subprocess.run(['cp', os.path.join(M, fn), out_dir], check=True)
            print(f'    bundle {out_dir}')
    finally:
        open(p, 'w').write(orig)

ids = list(MUT) if sys.argv[1] == 'all' else sys.argv[1].split(',')
for mid in ids:
    run(mid, '--bundle' in sys.argv)
