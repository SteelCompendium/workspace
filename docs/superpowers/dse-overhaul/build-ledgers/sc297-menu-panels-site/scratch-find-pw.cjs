const fs = require("fs"), path = require("path"), os = require("os");
const npx = path.join(os.homedir(), ".npm", "_npx");
let best = null, bestVer = "";
for (const hash of fs.readdirSync(npx)) {
  const dir = path.join(npx, hash, "node_modules", "playwright-core");
  const pkg = path.join(dir, "package.json");
  if (fs.existsSync(pkg)) {
    const ver = JSON.parse(fs.readFileSync(pkg, "utf8")).version || "";
    if (ver > bestVer) { bestVer = ver; best = dir; }
  }
}
console.log(best);
