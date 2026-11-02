// build a SCRATCH copy of the in-tree lifecycle harness with probe blocks injected before main(); fixes the repo + scripts import paths.
const fs = require('fs');
const path = require('path');
const [src, out, ...blocks] = process.argv.slice(2);
let s = fs.readFileSync(src, 'utf8');
const repoLine = 'const repo = path.dirname(dir);';
if (!s.includes(repoLine)) { console.error('repo line not found'); process.exit(3); }
s = s.replace(repoLine, 'const repo = process.env.S540_REPO ?? path.dirname(dir);');
const imp = "from '../scripts/xvfb-owned.mjs'";
if (!s.includes(imp)) { console.error('xvfb import not found'); process.exit(3); }
s = s.replace(imp, `from '${path.resolve(path.dirname(src), '../scripts/xvfb-owned.mjs')}'`);
const anchor = '\nasync function main() {';
if (!s.includes(anchor)) { console.error('main anchor not found'); process.exit(3); }
s = s.replace(anchor, '\n' + blocks.map((b) => fs.readFileSync(b, 'utf8')).join('\n') + '\n' + anchor);
fs.writeFileSync(out, s);
console.log(`wrote ${out}`);
