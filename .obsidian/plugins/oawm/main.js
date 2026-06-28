"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => OawmPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");
var import_node_path5 = require("path");
var import_node_fs4 = require("fs");

// src/hookScript.ts
var HOOK_SCRIPT = `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(name) {
  const i = process.argv.indexOf(\`--\${name}\`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const event = process.argv[2];
const task = arg("task");
const statusDir = arg("status-dir");

if (!event || !task || !statusDir) {
  console.error("usage: oawm-hook <event> --task <id> --status-dir <dir>");
  process.exit(2);
}

mkdirSync(statusDir, { recursive: true });
writeFileSync(join(statusDir, \`\${task}.json\`), JSON.stringify({ event, ts: Date.now() }));
process.exit(0);
`;

// src/obsidian/vaultGateway.ts
var import_obsidian = require("obsidian");

// src/domain/types.ts
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function worktreeDirName(id, title) {
  return `${slugify(id)}-${slugify(title)}`;
}
function branchName(id, title) {
  return `oawm/${worktreeDirName(id, title)}`;
}
function resolveRepoPath(task, ws) {
  var _a;
  const repo = (_a = ws.repositories.find((r) => r.name === task.repositories[0])) != null ? _a : ws.repositories[0];
  return repo.path;
}

// src/obsidian/vaultGateway.ts
function frontmatterToTask(path, basename, fm) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  return {
    path,
    id: (_a = fm.id) != null ? _a : slugify(basename),
    title: basename,
    workspace: (_b = fm.workspace) != null ? _b : "",
    repositories: (_c = fm.repositories) != null ? _c : [],
    agent: (_d = fm.agent) != null ? _d : "",
    status: (_e = fm.status) != null ? _e : "Pending",
    agentState: (_f = fm.agent_state) != null ? _f : "",
    worktree: (_g = fm.worktree) != null ? _g : "",
    branch: (_h = fm.branch) != null ? _h : "",
    session: (_i = fm.session) != null ? _i : ""
  };
}
function frontmatterToWorkspace(name, fm) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  return {
    name,
    repositories: (_a = fm.repositories) != null ? _a : [],
    isolation: (_b = fm.isolation) != null ? _b : "worktree",
    baseBranch: (_c = fm.base_branch) != null ? _c : "main",
    git: { user: (_e = (_d = fm.git) == null ? void 0 : _d.user) != null ? _e : "", email: (_g = (_f = fm.git) == null ? void 0 : _f.email) != null ? _g : "" },
    mux: { backend: "zellij" },
    host: { type: "local" },
    env: (_h = fm.env) != null ? _h : {}
  };
}
function frontmatterToAgent(name, fm) {
  var _a, _b, _c, _d;
  return {
    name,
    provider: "claude",
    account: { configDir: (_b = (_a = fm.account) == null ? void 0 : _a.config_dir) != null ? _b : "" },
    command: (_c = fm.command) != null ? _c : "claude",
    env: (_d = fm.env) != null ? _d : {}
  };
}
var TASK_PATCH_KEYS = {
  path: "",
  id: "id",
  title: "",
  workspace: "workspace",
  repositories: "repositories",
  agent: "agent",
  status: "status",
  agentState: "agent_state",
  worktree: "worktree",
  branch: "branch",
  session: "session"
};
function stripTaskBody(raw) {
  return raw.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").replace(/```oawm-task[\s\S]*?```/g, "").trim();
}
var ObsidianVaultGateway = class {
  constructor(app) {
    this.app = app;
  }
  filesOfType(type) {
    return this.app.vault.getMarkdownFiles().filter((f) => {
      var _a;
      const fm = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter;
      return (fm == null ? void 0 : fm.type) === type;
    });
  }
  async listTasks() {
    return this.filesOfType("task").map((f) => {
      var _a, _b;
      return frontmatterToTask(f.path, f.basename, (_b = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter) != null ? _b : {});
    });
  }
  async getTask(path) {
    var _a, _b;
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian.TFile))
      return null;
    const fm = (_b = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter) != null ? _b : {};
    return frontmatterToTask(f.path, f.basename, fm);
  }
  async getTaskBody(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian.TFile))
      return "";
    return stripTaskBody(await this.app.vault.cachedRead(f));
  }
  async patchTask(path, patch) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian.TFile))
      return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      for (const [k, v] of Object.entries(patch)) {
        const key = TASK_PATCH_KEYS[k];
        if (key)
          fm[key] = v;
      }
    });
  }
  async getWorkspace(name) {
    var _a, _b;
    const f = this.filesOfType("workspace").find((x) => x.basename === name);
    if (!f)
      return null;
    return frontmatterToWorkspace(name, (_b = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter) != null ? _b : {});
  }
  async getAgent(name) {
    var _a, _b;
    const f = this.filesOfType("agent").find((x) => x.basename === name);
    if (!f)
      return null;
    return frontmatterToAgent(name, (_b = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter) != null ? _b : {});
  }
};

// src/backends/git.ts
var import_node_path = require("path");
var import_node_fs = require("fs");

// src/backends/exec.ts
var import_node_child_process = require("child_process");
function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    (0, import_node_child_process.execFile)(
      cmd,
      args,
      { cwd: opts.cwd, env: opts.env, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        var _a, _b;
        resolve({
          code: err && typeof err.code === "number" ? err.code : err ? 1 : 0,
          stdout: (_a = stdout == null ? void 0 : stdout.toString()) != null ? _a : "",
          stderr: (_b = stderr == null ? void 0 : stderr.toString()) != null ? _b : ""
        });
      }
    );
  });
}

// src/core/changes.ts
function parseStatus(porcelain) {
  const out = [];
  for (const line of porcelain.split("\n")) {
    if (line.trim().length === 0)
      continue;
    const x = line[0];
    const y = line[1];
    let rest = line.slice(3);
    if (line.startsWith("??")) {
      out.push({ path: rest, repo: "", staged: false, kind: "?" });
      continue;
    }
    const isRename = x === "R" || y === "R";
    if (isRename) {
      const arrow = rest.indexOf(" -> ");
      if (arrow !== -1)
        rest = rest.slice(arrow + 4);
    }
    const staged = x !== " " && x !== "?";
    let kind;
    if (isRename)
      kind = "R";
    else if (x === "A")
      kind = "A";
    else if (x === "D" || y === "D")
      kind = "D";
    else
      kind = "M";
    out.push({ path: rest, repo: "", staged, kind });
  }
  return out;
}
function parseNameStatus(out) {
  const result = [];
  for (const line of out.split("\n")) {
    if (line.trim().length === 0)
      continue;
    const cols = line.split("	");
    const code = cols[0][0];
    let kind;
    let path;
    if (code === "R") {
      kind = "R";
      path = cols[2];
    } else if (code === "A") {
      kind = "A";
      path = cols[1];
    } else if (code === "D") {
      kind = "D";
      path = cols[1];
    } else {
      kind = "M";
      path = cols[1];
    }
    result.push({ path, repo: "", staged: false, kind });
  }
  return result;
}
function groupByRepo(files) {
  var _a;
  const g = /* @__PURE__ */ new Map();
  for (const f of files) {
    const arr = (_a = g.get(f.repo)) != null ? _a : [];
    arr.push(f);
    g.set(f.repo, arr);
  }
  return g;
}
function commitEnabled(checkedCount, message) {
  return checkedCount > 0 && message.trim().length > 0;
}
function stampRepo(files, repo) {
  return files.map((f) => ({ ...f, repo }));
}

// src/backends/git.ts
var WT_ROOT = ".oawm-worktrees";
function findWorktreeForBranch(porcelain, branch) {
  var _a, _b;
  for (const block of porcelain.split(/\n\s*\n/)) {
    const path = (_a = block.match(/^worktree (.+)$/m)) == null ? void 0 : _a[1];
    const br = (_b = block.match(/^branch refs\/heads\/(.+)$/m)) == null ? void 0 : _b[1];
    if (path && br === branch)
      return path;
  }
  return null;
}
var RealGitBackend = class {
  wtPath(repoPath, dir) {
    return (0, import_node_path.join)(repoPath, WT_ROOT, dir);
  }
  async createWorktree(repoPath, branch, dir, baseBranch) {
    const wtDir = this.wtPath(repoPath, dir);
    if ((0, import_node_fs.existsSync)(wtDir))
      return;
    const branchCheck = await run("git", ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`], { cwd: repoPath });
    let res;
    if (branchCheck.code === 0) {
      res = await run("git", ["worktree", "add", wtDir, branch], { cwd: repoPath });
    } else {
      res = await run("git", ["worktree", "add", "-b", branch, wtDir, baseBranch], { cwd: repoPath });
    }
    if (res.code !== 0)
      throw new Error(`git worktree add failed: ${res.stderr}`);
    try {
      const excludePath = (0, import_node_path.join)(repoPath, ".git", "info", "exclude");
      const existing = (0, import_node_fs.existsSync)(excludePath) ? (0, import_node_fs.readFileSync)(excludePath, "utf8") : "";
      const toAdd = [];
      if (!existing.includes(".oawm-worktrees/"))
        toAdd.push(".oawm-worktrees/");
      if (!existing.includes(".oawm/"))
        toAdd.push(".oawm/");
      if (toAdd.length > 0)
        (0, import_node_fs.appendFileSync)(excludePath, "\n" + toAdd.join("\n") + "\n");
    } catch (e) {
    }
  }
  async diff(repoPath, baseBranch, branch) {
    const res = await run("git", ["diff", `${baseBranch}...${branch}`], { cwd: repoPath });
    let output = res.stdout;
    const untracked = await run("git", ["ls-files", "--others", "--exclude-standard"], { cwd: repoPath });
    if (untracked.stdout.trim()) {
      output += "\nUntracked files:\n" + untracked.stdout.trim().split("\n").map((f) => `  ${f}`).join("\n") + "\n";
    }
    return output;
  }
  async removeWorktree(repoPath, dir, opts) {
    const args = ["worktree", "remove", this.wtPath(repoPath, dir)];
    if (opts.force)
      args.push("--force");
    const res = await run("git", args, { cwd: repoPath });
    if (res.code !== 0)
      return { ok: false, reason: res.stderr };
    return { ok: true };
  }
  async mergeBaseIntoBranch(worktreePath, base) {
    const inProgress = (await run("git", ["rev-parse", "--verify", "--quiet", "MERGE_HEAD"], { cwd: worktreePath })).code === 0;
    if (inProgress)
      return { ok: false, conflicts: true, inProgress: true, message: "a merge is already in progress" };
    const res = await run("git", ["merge", "--no-ff", base], { cwd: worktreePath });
    const conflicts = /CONFLICT/i.test(res.stdout + res.stderr);
    if (res.code !== 0)
      return { ok: false, conflicts, inProgress: false, message: res.stdout + res.stderr };
    return { ok: true, conflicts: false, inProgress: false, message: res.stdout };
  }
  async worktreeDirty(worktreePath) {
    const res = await run("git", ["status", "--porcelain"], { cwd: worktreePath });
    return res.stdout.trim().length > 0;
  }
  async fastForwardBase(repoPath, base, branch) {
    const list = await run("git", ["worktree", "list", "--porcelain"], { cwd: repoPath });
    const baseWt = findWorktreeForBranch(list.stdout, base);
    if (baseWt) {
      const res2 = await run("git", ["merge", "--ff-only", branch], { cwd: baseWt });
      if (res2.code !== 0)
        return { ok: false, reason: (res2.stderr || res2.stdout).trim() };
      return { ok: true };
    }
    const res = await run("git", ["branch", "-f", base, branch], { cwd: repoPath });
    if (res.code !== 0)
      return { ok: false, reason: res.stderr.trim() };
    return { ok: true };
  }
  async pushBranch(repoPath, branch, opts = {}) {
    const args = ["push", "-u"];
    if (opts.mrTarget)
      args.push("-o", "merge_request.create", "-o", `merge_request.target=${opts.mrTarget}`);
    args.push("origin", branch);
    const res = await run("git", args, { cwd: repoPath });
    return { ok: res.code === 0, message: (res.stdout + res.stderr).trim() };
  }
  async pushBase(repoPath, base) {
    const res = await run("git", ["push", "origin", base], { cwd: repoPath });
    return { ok: res.code === 0, message: (res.stdout + res.stderr).trim() };
  }
  async getRemoteUrl(repoPath) {
    const res = await run("git", ["remote", "get-url", "origin"], { cwd: repoPath });
    return res.stdout.trim();
  }
  async status(worktreePath) {
    const res = await run("git", ["status", "--porcelain"], { cwd: worktreePath });
    return parseStatus(res.stdout);
  }
  async commitPaths(worktreePath, paths, message) {
    const add = await run("git", ["add", "--", ...paths], { cwd: worktreePath });
    if (add.code !== 0)
      return { ok: false, message: add.stderr.trim() };
    const res = await run("git", ["commit", "-m", message, "--", ...paths], { cwd: worktreePath });
    if (res.code !== 0)
      return { ok: false, message: (res.stdout + res.stderr).trim() };
    const sha = await run("git", ["rev-parse", "--short", "HEAD"], { cwd: worktreePath });
    return { ok: true, message: res.stdout.trim(), commit: sha.stdout.trim() };
  }
  async branchDiffFiles(worktreePath, base) {
    const res = await run("git", ["diff", "--name-status", `${base}...HEAD`], { cwd: worktreePath });
    return parseNameStatus(res.stdout);
  }
  async fileDiff(worktreePath, base, path, scope) {
    if (scope === "branch") {
      return (await run("git", ["diff", `${base}...HEAD`, "--", path], { cwd: worktreePath })).stdout;
    }
    const tracked = (await run("git", ["ls-files", "--error-unmatch", "--", path], { cwd: worktreePath })).code === 0;
    if (tracked)
      return (await run("git", ["diff", "HEAD", "--", path], { cwd: worktreePath })).stdout;
    return (await run("git", ["diff", "--no-index", "--", "/dev/null", path], { cwd: worktreePath })).stdout;
  }
  async unmergedCounts(worktreePath, base) {
    const status = await run("git", ["status", "--porcelain"], { cwd: worktreePath });
    const local = status.stdout.split("\n").filter((l) => l.trim().length > 0).length;
    const rev = await run("git", ["rev-list", "--count", `${base}..HEAD`], { cwd: worktreePath });
    const unmerged = parseInt(rev.stdout.trim(), 10) || 0;
    return { local, unmerged };
  }
};

// src/backends/zellij.ts
var import_node_fs2 = require("fs");
var import_node_os = require("os");
var import_node_path2 = require("path");

// src/backends/terminal.ts
var import_node_child_process2 = require("child_process");
function buildTerminalArgv(terminalCommand, inner) {
  const prefix = terminalCommand.trim().split(/\s+/).filter((t) => t.length > 0);
  return [...prefix, ...inner];
}
var SpawnTerminalLauncher = class {
  constructor(terminalCommand) {
    this.terminalCommand = terminalCommand;
  }
  open(inner, opts = {}) {
    const argv = buildTerminalArgv(this.terminalCommand, inner);
    return new Promise((resolve, reject) => {
      const child = (0, import_node_child_process2.spawn)(argv[0], argv.slice(1), {
        cwd: opts.cwd,
        env: { ...process.env, ...opts.env },
        detached: true,
        stdio: "ignore"
      });
      child.once("error", reject);
      child.once("spawn", () => {
        child.unref();
        resolve();
      });
    });
  }
};

// src/backends/zellij.ts
var DEFAULT_TERMINAL_COMMAND = "gnome-terminal --";
var DEFAULT_ZELLIJ_BIN = "zellij";
function parseAliveSessions(listOutput) {
  return listOutput.split("\n").filter((line) => line.trim().length > 0 && !/EXITED/i.test(line)).map((line) => line.trim().split(/\s+/)[0]);
}
function shquote(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
function kdlString(s) {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function buildLayout(command) {
  const inner = `${command}; exec bash`;
  return [
    "layout {",
    `    pane command="bash" {`,
    `        args "-lc" ${kdlString(inner)}`,
    "    }",
    "}",
    ""
  ].join("\n");
}
function buildLaunchScript(bin, session, cwd, env, layoutPath) {
  const exports2 = Object.entries(env).map(([k, v]) => `export ${k}=${shquote(v)}`);
  return [
    "#!/usr/bin/env bash",
    `cd ${shquote(cwd)} || true`,
    ...exports2,
    `${shquote(bin)} -s ${shquote(session)} -n ${shquote(layoutPath)}`,
    "ec=$?",
    "echo",
    `echo "[oawm] zellij session ended (exit $ec). Window kept open so any error above is readable; press Ctrl-D to close."`,
    "exec bash"
  ].join("\n");
}
var zellijArgs = {
  attach(session) {
    return ["attach", session];
  },
  kill(session) {
    return ["kill-session", session];
  },
  list() {
    return ["list-sessions", "--no-formatting"];
  }
};
function newPaneArgs(session, cwd, command) {
  return ["--session", session, "action", "new-pane", "--cwd", cwd, "--", "bash", "-lc", command];
}
var ZellijBackend = class {
  constructor(terminalCommand = DEFAULT_TERMINAL_COMMAND, zellijBin = DEFAULT_ZELLIJ_BIN) {
    this.terminal = new SpawnTerminalLauncher(terminalCommand || DEFAULT_TERMINAL_COMMAND);
    this.bin = zellijBin || DEFAULT_ZELLIJ_BIN;
  }
  // Launching and attaching need a real terminal, so they open an emulator
  // window. Killing and listing are headless CLI calls that need no TTY.
  async create(session, cwd, command, env) {
    const dir = (0, import_node_fs2.mkdtempSync)((0, import_node_path2.join)((0, import_node_os.tmpdir)(), "oawm-launch-"));
    const layoutPath = (0, import_node_path2.join)(dir, "layout.kdl");
    (0, import_node_fs2.writeFileSync)(layoutPath, buildLayout(command));
    const scriptPath = (0, import_node_path2.join)(dir, "launch.sh");
    (0, import_node_fs2.writeFileSync)(scriptPath, buildLaunchScript(this.bin, session, cwd, env, layoutPath), { mode: 448 });
    await this.terminal.open(["bash", scriptPath], { cwd, env });
  }
  async kill(session) {
    await run(this.bin, zellijArgs.kill(session));
  }
  async focus(session) {
    const script = `${shquote(this.bin)} attach ${shquote(session)}; echo; echo "[oawm] detached (exit $?). Ctrl-D to close."; exec bash`;
    await this.terminal.open(["bash", "-lc", script]);
  }
  async isAlive(session) {
    const res = await run(this.bin, zellijArgs.list());
    return parseAliveSessions(res.stdout).includes(session);
  }
  async openPane(session, cwd, command) {
    await run(this.bin, newPaneArgs(session, cwd, command));
  }
};

// src/backends/claude.ts
var import_node_fs3 = require("fs");
var import_node_path3 = require("path");
var import_node_os2 = require("os");
function expandTilde(p) {
  if (p === "~")
    return (0, import_node_os2.homedir)();
  if (p.startsWith("~/"))
    return (0, import_node_path3.join)((0, import_node_os2.homedir)(), p.slice(2));
  return p;
}
function shquote2(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
function buildAgentCommand(baseCommand, prompt) {
  const cmd = baseCommand || "claude";
  if (!prompt.trim())
    return cmd;
  const promptFile = (0, import_node_path3.join)((0, import_node_fs3.mkdtempSync)((0, import_node_path3.join)((0, import_node_os2.tmpdir)(), "oawm-prompt-")), "prompt.md");
  (0, import_node_fs3.writeFileSync)(promptFile, prompt);
  return `${cmd} "$(cat ${shquote2(promptFile)})"`;
}
function buildHookSettings(taskId, hookHelperPath, statusDir) {
  const cmd = (event) => `node ${JSON.stringify(hookHelperPath)} ${event} --task ${taskId} --status-dir ${JSON.stringify(statusDir)}`;
  return {
    hooks: {
      Notification: [{ hooks: [{ type: "command", command: cmd("waiting") }] }],
      Stop: [{ hooks: [{ type: "command", command: cmd("review") }] }]
    }
  };
}
var ClaudeBackend = class {
  constructor(deps) {
    this.deps = deps;
  }
  async launch(args) {
    const session = `oawm-${args.task.id}`;
    (0, import_node_fs3.rmSync)((0, import_node_path3.join)(this.deps.statusDir, `${args.task.id}.json`), { force: true });
    const claudeDir = (0, import_node_path3.join)(args.cwd, ".claude");
    (0, import_node_fs3.mkdirSync)(claudeDir, { recursive: true });
    const settings = buildHookSettings(args.task.id, this.deps.hookHelperPath, this.deps.statusDir);
    (0, import_node_fs3.writeFileSync)((0, import_node_path3.join)(claudeDir, "settings.local.json"), JSON.stringify(settings, null, 2));
    const env = { ...args.agent.env };
    if (args.agent.account.configDir) {
      env.CLAUDE_CONFIG_DIR = expandTilde(args.agent.account.configDir);
    }
    const command = buildAgentCommand(args.agent.command, args.prompt);
    await this.deps.mux.create(session, args.cwd, command, env);
    return { session };
  }
};

// src/domain/reconcile.ts
function decide(input) {
  const { desired, actual, sessionAlive } = input;
  if (desired === "Pending")
    return "none";
  if (desired === "Completed")
    return "offerMerge";
  if (desired === "Cancelled")
    return sessionAlive ? "killAndIdle" : "none";
  if (sessionAlive)
    return "none";
  switch (actual) {
    case "Running":
    case "Waiting":
      return "markFailed";
    case "NeedsReview":
    case "Failed":
      return "none";
    default:
      return "launch";
  }
}

// src/core/orchestrator.ts
var Orchestrator = class {
  constructor(deps) {
    this.deps = deps;
    this.locks = /* @__PURE__ */ new Map();
  }
  reconcileTask(path) {
    var _a;
    const prev = (_a = this.locks.get(path)) != null ? _a : Promise.resolve();
    const next = prev.catch(() => {
    }).then(() => this.runReconcile(path));
    this.locks.set(path, next);
    return next;
  }
  async runReconcile(path) {
    const task = await this.deps.vault.getTask(path);
    if (!task)
      return;
    const sessionAlive = task.session ? await this.deps.mux.isAlive(task.session) : false;
    const action = decide({ desired: task.status, actual: task.agentState, sessionAlive });
    switch (action) {
      case "launch":
        return this.launch(task);
      case "markFailed":
        return this.markFailed(task);
      case "killAndIdle":
        return this.killAndIdle(task);
      case "offerMerge":
        return this.completeAndMerge(task);
      case "none":
        return;
    }
  }
  async launch(task) {
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    const agent = await this.deps.vault.getAgent(task.agent);
    if (!ws || !agent) {
      await this.deps.vault.patchTask(task.path, { agentState: "Failed" });
      this.deps.notifier.notice(`Task ${task.id}: missing workspace or agent`);
      return;
    }
    const repoPath = resolveRepoPath(task, ws);
    const branch = branchName(task.id, task.title);
    const dir = worktreeDirName(task.id, task.title);
    let cwd = repoPath;
    if (ws.isolation === "worktree") {
      await this.deps.git.createWorktree(repoPath, branch, dir, ws.baseBranch);
      cwd = `${repoPath}/.oawm-worktrees/${dir}`;
    }
    const prompt = await this.deps.vault.getTaskBody(task.path);
    const { session } = await this.deps.agent.launch({ task, cwd, agent, vaultRoot: this.deps.vaultRoot, prompt });
    const alive = await this.waitForSession(session);
    await this.deps.vault.patchTask(task.path, {
      agentState: alive ? "Running" : "Failed",
      branch,
      worktree: cwd,
      session
    });
    this.deps.notifier.notice(
      alive ? `Task ${task.id}: agent running` : `Task ${task.id}: session did not start`
    );
  }
  async waitForSession(session) {
    const deadline = Date.now() + 8e3;
    for (; ; ) {
      if (await this.deps.mux.isAlive(session))
        return true;
      if (Date.now() >= deadline)
        return false;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  async markFailed(task) {
    await this.deps.vault.patchTask(task.path, { agentState: "Failed" });
    this.deps.notifier.notice(`Task ${task.id}: session ended unexpectedly`);
  }
  async killAndIdle(task) {
    if (task.session)
      await this.deps.mux.kill(task.session);
    await this.deps.vault.patchTask(task.path, { agentState: "Idle", session: "", branch: "", worktree: "" });
  }
  async completeAndMerge(task) {
    await this.deps.completion.merge(task, { push: false });
  }
};

// src/core/remote.ts
function parseRemote(url) {
  var _a;
  const s = url.trim().replace(/\.git$/, "");
  let hostName = "";
  let path = "";
  const ssh = s.match(/^git@([^:]+):(.+)$/);
  const https = s.match(/^[a-z]+:\/\/(?:[^@/]+@)?([^/]+)\/(.+)$/i);
  if (ssh) {
    hostName = ssh[1];
    path = ssh[2];
  } else if (https) {
    hostName = https[1];
    path = https[2];
  } else {
    return { host: "other", owner: "", repo: "" };
  }
  const parts = path.split("/").filter((p) => p.length > 0);
  const repo = (_a = parts.pop()) != null ? _a : "";
  const owner = parts.join("/");
  const host = /(^|\.)github\.com$/i.test(hostName) ? "github" : /gitlab/i.test(hostName) ? "gitlab" : "other";
  return { host, owner, repo };
}
function compareUrl(remote, base, branch) {
  return `https://github.com/${remote.owner}/${remote.repo}/compare/${base}...${branch}?expand=1`;
}

// src/core/completion.ts
var PUSH_DIRTY_WARNING = "worktree has uncommitted changes \u2014 only committed work will be pushed; uncommitted changes stay in the worktree. Continue?";
var CompletionCoordinator = class {
  constructor(deps) {
    this.deps = deps;
  }
  async merge(task, opts) {
    var _a;
    if (task.agentState === "Idle")
      return;
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    if (!ws)
      return;
    if (ws.isolation !== "worktree" || !task.branch || !task.worktree) {
      if (task.session)
        await this.deps.mux.kill(task.session);
      await this.deps.vault.patchTask(task.path, { status: "Completed", agentState: "Idle", session: "", branch: "", worktree: "" });
      return;
    }
    const repoPath = resolveRepoPath(task, ws);
    let force = false;
    if (await this.deps.git.worktreeDirty(task.worktree)) {
      const ok = await this.deps.notifier.confirm(
        `Task ${task.id}: worktree has uncommitted changes that will be discarded when the worktree is removed after merge. Merge committed work and discard the rest?`
      );
      if (!ok)
        return;
      force = true;
    }
    const integ = await this.deps.git.mergeBaseIntoBranch(task.worktree, ws.baseBranch);
    if (!integ.ok) {
      await this.deps.vault.patchTask(task.path, { status: "Running", agentState: "NeedsReview" });
      this.deps.notifier.notice(
        integ.inProgress ? `Task ${task.id}: finish resolving and commit the in-progress merge in the task terminal, then retry.` : `Task ${task.id}: merge conflict \u2014 resolve in the task terminal (Open Terminal), then click Merge again.`
      );
      return;
    }
    const ff = await this.deps.git.fastForwardBase(repoPath, ws.baseBranch, task.branch);
    if (!ff.ok) {
      await this.deps.vault.patchTask(task.path, { status: "Running", agentState: "NeedsReview" });
      this.deps.notifier.notice(`Task ${task.id}: could not fast-forward ${ws.baseBranch} (${(_a = ff.reason) != null ? _a : "blocked"}). Resolve and retry.`);
      return;
    }
    if (opts.push) {
      const pushed = await this.deps.git.pushBase(repoPath, ws.baseBranch);
      if (!pushed.ok)
        this.deps.notifier.notice(`Task ${task.id}: merged locally but push failed: ${pushed.message}`);
    }
    if (task.session)
      await this.deps.mux.kill(task.session);
    await this.deps.git.removeWorktree(repoPath, worktreeDirName(task.id, task.title), { force });
    await this.deps.vault.patchTask(task.path, { status: "Completed", agentState: "Idle", session: "", branch: "", worktree: "" });
    this.deps.notifier.notice(opts.push ? `Task ${task.id}: merged into ${ws.baseBranch} and pushed` : `Task ${task.id}: merged into ${ws.baseBranch}`);
  }
  async pushBranch(task) {
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    if (!ws || !task.branch) {
      this.deps.notifier.notice(`Task ${task.id}: no branch to push`);
      return;
    }
    if (!await this.confirmPushIfDirty(task))
      return;
    const res = await this.deps.git.pushBranch(resolveRepoPath(task, ws), task.branch);
    this.deps.notifier.notice(res.ok ? `Task ${task.id}: pushed ${task.branch}` : `Task ${task.id}: push failed: ${res.message}`);
  }
  async openPr(task) {
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    if (!ws || !task.branch) {
      this.deps.notifier.notice(`Task ${task.id}: no branch for PR`);
      return {};
    }
    if (!await this.confirmPushIfDirty(task))
      return {};
    const repoPath = resolveRepoPath(task, ws);
    const remote = parseRemote(await this.deps.git.getRemoteUrl(repoPath));
    if (remote.host === "gitlab") {
      const res2 = await this.deps.git.pushBranch(repoPath, task.branch, { mrTarget: ws.baseBranch });
      this.deps.notifier.notice(res2.ok ? `Task ${task.id}: pushed ${task.branch} and requested MR` : `Task ${task.id}: push failed: ${res2.message}`);
      return {};
    }
    const res = await this.deps.git.pushBranch(repoPath, task.branch);
    if (!res.ok) {
      this.deps.notifier.notice(`Task ${task.id}: push failed: ${res.message}`);
      return {};
    }
    if (remote.host === "github")
      return { url: compareUrl(remote, ws.baseBranch, task.branch) };
    this.deps.notifier.notice(`Task ${task.id}: pushed ${task.branch} (open a PR/MR on your host)`);
    return {};
  }
  async confirmPushIfDirty(task) {
    if (!task.worktree)
      return true;
    if (!await this.deps.git.worktreeDirty(task.worktree))
      return true;
    return this.deps.notifier.confirm(`Task ${task.id}: ${PUSH_DIRTY_WARNING}`);
  }
};

// src/core/worktrees.ts
var import_node_path4 = require("path");
function resolveTaskWorktrees(task, ws) {
  const dir = worktreeDirName(task.id, task.title);
  const branch = branchName(task.id, task.title);
  const names = task.repositories.length > 0 ? task.repositories : ws.repositories.map((r) => r.name);
  return names.map((name) => {
    var _a;
    const repo = (_a = ws.repositories.find((r) => r.name === name)) != null ? _a : ws.repositories[0];
    const path = ws.isolation === "worktree" ? (0, import_node_path4.join)(repo.path, ".oawm-worktrees", dir) : repo.path;
    return { repo: name, path, branch };
  });
}

// src/core/commit.ts
function summarizeCommit(taskId, results) {
  const parts = results.map((r) => {
    var _a, _b, _c;
    if (!r.committed)
      return `${r.repo}: commit failed \u2014 ${(_a = r.error) != null ? _a : "unknown"}`;
    if (r.error)
      return `${r.repo}: committed ${(_b = r.commit) != null ? _b : ""}, push failed \u2014 ${r.error}`;
    return `${r.repo}: committed ${(_c = r.commit) != null ? _c : ""}${r.pushed ? ", pushed" : ""}`;
  });
  return `Task ${taskId}: ${parts.join(" \xB7 ")}`;
}
var CommitCoordinator = class {
  constructor(deps) {
    this.deps = deps;
  }
  async commit(task, input) {
    var _a;
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    if (!ws) {
      this.deps.notifier.notice(`Task ${task.id}: missing workspace`);
      return [];
    }
    const byRepo = /* @__PURE__ */ new Map();
    for (const p of input.paths) {
      const arr = (_a = byRepo.get(p.repo)) != null ? _a : [];
      arr.push(p.path);
      byRepo.set(p.repo, arr);
    }
    const results = [];
    for (const wt of resolveTaskWorktrees(task, ws)) {
      const repoPaths = byRepo.get(wt.repo);
      if (!repoPaths || repoPaths.length === 0)
        continue;
      const c = await this.deps.git.commitPaths(wt.path, repoPaths, input.message);
      if (!c.ok) {
        results.push({ repo: wt.repo, committed: false, pushed: false, error: c.message });
        continue;
      }
      if (!input.push) {
        results.push({ repo: wt.repo, committed: true, pushed: false, commit: c.commit });
        continue;
      }
      const pr = await this.deps.git.pushBranch(wt.path, wt.branch);
      results.push({ repo: wt.repo, committed: true, pushed: pr.ok, commit: c.commit, error: pr.ok ? void 0 : pr.message });
    }
    if (results.length === 0)
      this.deps.notifier.notice(`Task ${task.id}: nothing to commit`);
    else
      this.deps.notifier.notice(summarizeCommit(task.id, results));
    return results;
  }
};

// src/core/statusIngest.ts
function parseMarker(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return null;
  }
  const event = data == null ? void 0 : data.event;
  if (event === "waiting")
    return { state: "Waiting" };
  if (event === "review")
    return { state: "NeedsReview" };
  return null;
}
var StatusIngest = class {
  constructor(deps) {
    this.deps = deps;
  }
  async ingest(taskId, raw) {
    const parsed = parseMarker(raw);
    if (!parsed)
      return;
    const tasks = await this.deps.vault.listTasks();
    const match = tasks.find((t) => t.id === taskId);
    if (!match)
      return;
    if (parsed.state === "Waiting" && match.agentState === "NeedsReview")
      return;
    if (parsed.state === match.agentState)
      return;
    await this.deps.vault.patchTask(match.path, { agentState: parsed.state });
    await this.deps.reconcile(match.path);
  }
};

// src/obsidian/taskCodeBlock.ts
var GIT_ACTIONS = ["merge", "mergePush", "push", "openPr"];
function stateActions(task) {
  if (task.status === "Pending")
    return ["start"];
  if (task.status === "Cancelled" || task.status === "Completed")
    return ["start"];
  if (task.agentState === "Failed") {
    const review = task.worktree ? ["viewDiff"] : [];
    return [...review, "restart", "cancel"];
  }
  const git = task.branch ? GIT_ACTIONS : [];
  return ["openTerminal", "viewDiff", ...git, "cancel"];
}
function availableActions(task) {
  const actions = stateActions(task);
  if (task.session && !actions.includes("openTerminal")) {
    return ["openTerminal", ...actions];
  }
  return actions;
}
var LABELS = {
  start: "Start",
  openTerminal: "Open Terminal",
  viewDiff: "Review Changes",
  merge: "Merge",
  mergePush: "Merge & Push",
  push: "Push",
  openPr: "Open PR/MR",
  cancel: "Cancel",
  restart: "Restart"
};
function registerTaskCodeBlock(plugin, deps) {
  plugin.registerMarkdownCodeBlockProcessor("oawm-task", async (_src, el, ctx) => {
    const path = ctx.sourcePath;
    const task = await deps.getTaskByPath(path);
    el.empty();
    if (!task) {
      el.createEl("em", { text: "OAWM: not a task note" });
      return;
    }
    const bar = el.createDiv({ cls: "oawm-action-bar" });
    bar.createSpan({ cls: `oawm-badge oawm-${task.agentState || "idle"}`, text: task.agentState || "Idle" });
    for (const action of availableActions(task)) {
      const btn = bar.createEl("button", { text: LABELS[action] });
      btn.onclick = async () => {
        const fresh = await deps.getTaskByPath(path);
        if (fresh)
          await deps.onAction(action, fresh);
      };
    }
  });
}

// src/obsidian/dashboardView.ts
var import_obsidian2 = require("obsidian");
var DASHBOARD_VIEW_TYPE = "oawm-dashboard";
var ORDER = ["Waiting", "NeedsReview", "Running", "Pending", "Failed", "Idle"];
function displayState(task) {
  if (task.status === "Pending")
    return "Pending";
  const s = task.agentState;
  if (s === "Waiting" || s === "NeedsReview" || s === "Running" || s === "Failed")
    return s;
  return "Idle";
}
function groupByState(tasks) {
  const groups = Object.fromEntries(ORDER.map((s) => [s, []]));
  for (const t of tasks)
    groups[displayState(t)].push(t);
  return groups;
}
var DashboardView = class extends import_obsidian2.ItemView {
  constructor(leaf, vault, openTask, onReview) {
    super(leaf);
    this.vault = vault;
    this.openTask = openTask;
    this.onReview = onReview;
  }
  getViewType() {
    return DASHBOARD_VIEW_TYPE;
  }
  getDisplayText() {
    return "Agent Workspace";
  }
  getIcon() {
    return "bot";
  }
  async onOpen() {
    await this.render();
  }
  async render() {
    const root = this.contentEl;
    root.empty();
    root.createEl("h3", { text: "Agent Workspace" });
    const groups = groupByState(await this.vault.listTasks());
    for (const state of ORDER) {
      const tasks = groups[state];
      if (tasks.length === 0)
        continue;
      root.createEl("h4", { text: `${state} (${tasks.length})` });
      for (const task of tasks) {
        const row = root.createDiv({ cls: "oawm-dash-row" });
        const link = row.createEl("a", { text: `${task.id} \u2014 ${task.title}`, href: "#" });
        link.onclick = (e) => {
          e.preventDefault();
          this.openTask(task.path);
        };
        row.createSpan({ cls: "oawm-dash-agent", text: ` @${task.agent}` });
        if (task.branch && task.worktree) {
          const review = row.createEl("a", { text: " Review", href: "#", cls: "oawm-dash-review" });
          review.onclick = (e) => {
            e.preventDefault();
            this.onReview(task.path);
          };
        }
      }
    }
  }
};

// src/obsidian/diffView.ts
var import_obsidian4 = require("obsidian");

// src/obsidian/diffPanel.ts
var import_obsidian3 = require("obsidian");
function classifyDiffLine(text) {
  if (text.startsWith("diff ") || text.startsWith("@@") || text.startsWith("index ") || text.startsWith("--- ") || text.startsWith("+++ "))
    return "meta";
  if (text.startsWith("+"))
    return "add";
  if (text.startsWith("-"))
    return "del";
  return "ctx";
}
function splitDiffLines(diff) {
  return diff.split("\n").map((text) => ({ text, kind: classifyDiffLine(text) }));
}
function buildSideBySide(diff) {
  const rows = [];
  let oldNo = 0, newNo = 0;
  let dels = [], adds = [];
  const flush = () => {
    var _a, _b;
    const n = Math.max(dels.length, adds.length);
    for (let i = 0; i < n; i++)
      rows.push({ type: "line", left: (_a = dels[i]) != null ? _a : null, right: (_b = adds[i]) != null ? _b : null });
    dels = [];
    adds = [];
  };
  for (const text of diff.split("\n")) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(text);
    if (hunk) {
      flush();
      oldNo = Number(hunk[1]);
      newNo = Number(hunk[2]);
      rows.push({ type: "meta", text });
      continue;
    }
    const kind = classifyDiffLine(text);
    if (kind === "meta") {
      flush();
      rows.push({ type: "meta", text });
      continue;
    }
    if (text.startsWith("\\"))
      continue;
    if (kind === "add") {
      adds.push({ lineNo: newNo++, text: text.slice(1), kind: "add" });
      continue;
    }
    if (kind === "del") {
      dels.push({ lineNo: oldNo++, text: text.slice(1), kind: "del" });
      continue;
    }
    if (text === "")
      continue;
    flush();
    rows.push({
      type: "line",
      left: { lineNo: oldNo++, text: text.slice(1), kind: "ctx" },
      right: { lineNo: newNo++, text: text.slice(1), kind: "ctx" }
    });
  }
  flush();
  return rows;
}

// src/obsidian/diffView.ts
var DIFF_VIEW_TYPE = "oawm-diff";
var DiffView = class extends import_obsidian4.ItemView {
  constructor(leaf, prefsGw) {
    super(leaf);
    this.prefsGw = prefsGw;
    this.state = { title: "Diff", diff: "" };
    this.prefs = this.prefsGw.get();
  }
  getViewType() {
    return DIFF_VIEW_TYPE;
  }
  getDisplayText() {
    return this.state.title;
  }
  getIcon() {
    return "git-compare";
  }
  setDiff(state) {
    this.state = state;
    this.render();
  }
  async onOpen() {
    this.prefs = this.prefsGw.get();
    this.render();
  }
  setLayout(layout) {
    this.prefs = { ...this.prefs, layout };
    void this.prefsGw.set(this.prefs);
    this.render();
  }
  setWrap(wrap) {
    this.prefs = { ...this.prefs, wrap };
    void this.prefsGw.set(this.prefs);
    this.render();
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.createEl("h4", { text: this.state.title });
    this.renderToolbar(root.createDiv({ cls: "oawm-diff-toolbar" }));
    const body = root.createDiv({ cls: "oawm-diff-body" });
    if (this.prefs.layout === "sideBySide")
      this.renderSideBySide(body);
    else
      this.renderUnified(body);
  }
  // One group per feature — future controls (ignore-whitespace, next/prev change)
  // append their own group here; nothing else in this file needs to change.
  renderToolbar(bar) {
    const layout = bar.createDiv({ cls: "oawm-diff-tbgroup" });
    this.tbButton(layout, "Unified", this.prefs.layout === "unified", () => this.setLayout("unified"));
    this.tbButton(layout, "Side-by-side", this.prefs.layout === "sideBySide", () => this.setLayout("sideBySide"));
    const wrap = bar.createDiv({ cls: "oawm-diff-tbgroup" });
    this.tbButton(wrap, "Wrap", this.prefs.wrap, () => this.setWrap(!this.prefs.wrap));
  }
  tbButton(group, label, active, onClick) {
    const b = group.createEl("button", { cls: "oawm-diff-tbbtn" + (active ? " oawm-tb-active" : ""), text: label });
    b.onclick = onClick;
    return b;
  }
  renderUnified(body) {
    const pre = body.createEl("pre", { cls: "oawm-diff" + (this.prefs.wrap ? " oawm-diff-wrap" : "") });
    for (const line of splitDiffLines(this.state.diff || "(no changes)")) {
      pre.createEl("div", { cls: `oawm-diff-${line.kind}`, text: line.text || " " });
    }
  }
  renderSideBySide(body) {
    const rows = buildSideBySide(this.state.diff || "");
    if (this.prefs.wrap)
      this.renderSxsGrid(body, rows);
    else
      this.renderSxsPanes(body, rows);
  }
  // Wrap on: a single 4-column grid so each row's left/right cells share one row
  // track — wrapped lines stay vertically aligned. No horizontal scroll (lines wrap).
  renderSxsGrid(body, rows) {
    const grid = body.createDiv({ cls: "oawm-diff-sxs" });
    if (rows.length === 0) {
      grid.createDiv({ cls: "oawm-diff-meta-row", text: "(no changes)" });
      return;
    }
    for (const row of rows) {
      if (row.type === "meta") {
        grid.createDiv({ cls: "oawm-diff-meta-row", text: row.text || " " });
        continue;
      }
      this.appendCell(grid, row.left);
      this.appendCell(grid, row.right);
    }
  }
  // Wrap off: two panes, each its own horizontal scroller, so a whole side scrolls
  // as one unit (not per line). Every row is one line tall, so left/right align by
  // having the same number of equal-height rows.
  renderSxsPanes(body, rows) {
    const panes = body.createDiv({ cls: "oawm-diff-sxs-panes" });
    const left = panes.createDiv({ cls: "oawm-diff-pane" });
    const right = panes.createDiv({ cls: "oawm-diff-pane" });
    if (rows.length === 0) {
      left.createDiv({ cls: "oawm-diff-meta-row", text: "(no changes)" });
      return;
    }
    for (const row of rows) {
      if (row.type === "meta") {
        left.createDiv({ cls: "oawm-diff-meta-row", text: row.text || " " });
        right.createDiv({ cls: "oawm-diff-meta-row", text: " " });
        continue;
      }
      this.appendCell(left.createDiv({ cls: "oawm-diff-srow" }), row.left);
      this.appendCell(right.createDiv({ cls: "oawm-diff-srow" }), row.right);
    }
    this.syncVerticalScroll(left, right);
  }
  // Each pane scrolls horizontally on its own, but their vertical scroll is mirrored so
  // a row stays at the same height on both sides. The value-equality guard stops the
  // ping-pong: once both scrollTops match, neither listener writes again.
  syncVerticalScroll(a, b) {
    const link = (from, to) => from.addEventListener("scroll", () => {
      if (to.scrollTop !== from.scrollTop)
        to.scrollTop = from.scrollTop;
    });
    link(a, b);
    link(b, a);
  }
  // Append a line-number gutter + a text cell for one side into `parent`
  // (a grid container in wrap mode, a row div in pane mode).
  appendCell(parent, cell) {
    if (!cell) {
      parent.createSpan({ cls: "oawm-diff-num" });
      parent.createSpan({ cls: "oawm-diff-cell oawm-diff-empty", text: " " });
      return;
    }
    parent.createSpan({ cls: "oawm-diff-num", text: String(cell.lineNo) });
    parent.createSpan({ cls: `oawm-diff-cell oawm-diff-${cell.kind}`, text: cell.text || " " });
  }
};
async function openDiffLeaf(app, target, state) {
  var _a;
  const existing = app.workspace.getLeavesOfType(DIFF_VIEW_TYPE);
  const newLeaf = () => target === "popout" ? app.workspace.openPopoutLeaf() : app.workspace.getLeaf(target === "tab" ? "tab" : "split");
  const leaf = (_a = existing[0]) != null ? _a : newLeaf();
  await leaf.setViewState({ type: DIFF_VIEW_TYPE, active: true });
  const view = leaf.view;
  if (view instanceof DiffView)
    view.setDiff(state);
  app.workspace.revealLeaf(leaf);
}

// src/obsidian/changesView.ts
var import_obsidian5 = require("obsidian");
var CHANGES_VIEW_TYPE = "oawm-changes";
var ChangesView = class extends import_obsidian5.ItemView {
  constructor(leaf, deps) {
    super(leaf);
    this.deps = deps;
    this.activeTaskPath = null;
    this.tab = "local";
    this.checked = /* @__PURE__ */ new Set();
    // "repo\0path"
    this.message = "";
  }
  getViewType() {
    return CHANGES_VIEW_TYPE;
  }
  getDisplayText() {
    return "Task Changes";
  }
  getIcon() {
    return "git-pull-request";
  }
  async onOpen() {
    await this.render();
  }
  async showTask(path) {
    this.activeTaskPath = path;
    this.checked.clear();
    this.message = "";
    this.tab = "local";
    await this.render();
  }
  key(repo, path) {
    return `${repo}\0${path}`;
  }
  async render() {
    const root = this.contentEl;
    root.empty();
    if (!this.activeTaskPath) {
      await this.renderOverview(root);
      return;
    }
    const task = await this.deps.vault.getTask(this.activeTaskPath);
    if (!task) {
      await this.renderOverview(root);
      return;
    }
    await this.renderTask(root, task);
  }
  async renderOverview(root) {
    root.createEl("h4", { text: "Workspace Changes" });
    const tasks = (await this.deps.vault.listTasks()).filter((t) => t.branch && t.worktree);
    const groups = groupByState(tasks);
    for (const state of Object.keys(groups)) {
      const list = groups[state];
      if (list.length === 0)
        continue;
      root.createEl("div", { cls: "oawm-changes-state", text: state });
      for (const t of list) {
        const row = root.createDiv({ cls: "oawm-changes-overrow" });
        const link = row.createEl("a", { text: `${t.id} \u2014 ${t.title}`, href: "#" });
        link.onclick = (e) => {
          e.preventDefault();
          void this.showTask(t.path);
        };
        const counts = await this.countsFor(t);
        row.createSpan({ cls: "oawm-changes-count", text: ` \u25CF ${counts.local} local  \u2191 ${counts.unmerged} unmerged` });
      }
    }
    if (tasks.length === 0)
      root.createEl("em", { text: "No active tasks with worktrees." });
  }
  async countsFor(task) {
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    if (!ws)
      return { local: 0, unmerged: 0 };
    let local = 0, unmerged = 0;
    for (const wt of resolveTaskWorktrees(task, ws)) {
      try {
        const c = await this.deps.git.unmergedCounts(wt.path, ws.baseBranch);
        local += c.local;
        unmerged += c.unmerged;
      } catch (e) {
      }
    }
    return { local, unmerged };
  }
  async collect(task, scope) {
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    if (!ws)
      return [];
    const all = [];
    for (const wt of resolveTaskWorktrees(task, ws)) {
      try {
        const files = scope === "local" ? await this.deps.git.status(wt.path) : await this.deps.git.branchDiffFiles(wt.path, ws.baseBranch);
        all.push(...stampRepo(files, wt.repo));
      } catch (e) {
      }
    }
    return all;
  }
  async renderTask(root, task) {
    var _a;
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    const base = (_a = ws == null ? void 0 : ws.baseBranch) != null ? _a : "main";
    const header = root.createDiv({ cls: "oawm-changes-header" });
    const back = header.createEl("a", { text: "\u25B2 ", href: "#" });
    back.onclick = (e) => {
      e.preventDefault();
      void this.showTask(null);
    };
    header.createSpan({ text: `${task.title} \xB7 ${task.branch} \u2192 ${base}` });
    const refresh = header.createEl("button", { text: "\u27F3" });
    refresh.onclick = () => {
      void this.render();
    };
    const tabs = root.createDiv({ cls: "oawm-changes-tabs" });
    const localFiles = await this.collect(task, "local");
    const unmergedFiles = await this.collect(task, "unmerged");
    this.tabButton(tabs, "local", `Local \xB7 ${localFiles.length}`);
    this.tabButton(tabs, "unmerged", `Unmerged \xB7 ${unmergedFiles.length}`);
    const body = root.createDiv({ cls: "oawm-changes-body" });
    if (this.tab === "local")
      this.renderLocal(body, task, localFiles);
    else
      this.renderUnmerged(body, task, unmergedFiles, base);
  }
  tabButton(parent, id, label) {
    const btn = parent.createEl("button", { text: label, cls: this.tab === id ? "oawm-tab-active" : "" });
    btn.onclick = () => {
      this.tab = id;
      void this.render();
    };
  }
  renderLocal(body, task, files) {
    if (files.length === 0) {
      body.createEl("em", { text: "No local changes" });
      return;
    }
    for (const [repo, repoFiles] of groupByRepo(files)) {
      body.createEl("div", { cls: "oawm-changes-repo", text: `\u25B8 ${repo}` });
      for (const f of repoFiles) {
        const row = body.createDiv({ cls: "oawm-changes-filerow" });
        const cb = row.createEl("input", { type: "checkbox" });
        cb.checked = this.checked.has(this.key(repo, f.path));
        cb.onchange = () => {
          const k = this.key(repo, f.path);
          cb.checked ? this.checked.add(k) : this.checked.delete(k);
          this.updateCommitButtons();
        };
        row.createSpan({ cls: `oawm-badge-${f.kind}`, text: f.kind });
        const link = row.createEl("a", { text: ` ${f.path}`, href: "#" });
        link.onclick = (e) => {
          e.preventDefault();
          void this.openFileDiff(task, repo, f.path, "local");
        };
        const pen = row.createEl("a", { text: " \u270E", href: "#", cls: "oawm-pen" });
        pen.onclick = (e) => {
          e.preventDefault();
          void this.deps.openEditor(task, repo, f.path);
        };
      }
    }
    const msg = body.createEl("textarea", { cls: "oawm-commit-msg", attr: { placeholder: "Commit message" } });
    msg.value = this.message;
    msg.oninput = () => {
      this.message = msg.value;
      this.updateCommitButtons();
    };
    const btns = body.createDiv({ cls: "oawm-commit-btns" });
    this.commitPush = btns.createEl("button", { text: "Commit & Push" });
    this.commitOnly = btns.createEl("button", { text: "Commit" });
    this.commitPush.onclick = () => void this.doCommit(task, true);
    this.commitOnly.onclick = () => void this.doCommit(task, false);
    this.updateCommitButtons();
  }
  updateCommitButtons() {
    const enabled = commitEnabled(this.checked.size, this.message);
    if (this.commitPush)
      this.commitPush.disabled = !enabled;
    if (this.commitOnly)
      this.commitOnly.disabled = !enabled;
  }
  async doCommit(task, push) {
    const paths = [...this.checked].map((k) => {
      const idx = k.indexOf("\0");
      return { repo: k.slice(0, idx), path: k.slice(idx + 1) };
    });
    await this.deps.commit.commit(task, { paths, message: this.message, push });
    this.checked.clear();
    this.message = "";
    await this.render();
  }
  renderUnmerged(body, task, files, base) {
    if (files.length === 0)
      body.createEl("em", { text: "No unmerged changes (branch matches base)" });
    for (const [repo, repoFiles] of groupByRepo(files)) {
      body.createEl("div", { cls: "oawm-changes-repo", text: `\u25B8 ${repo}` });
      for (const f of repoFiles) {
        const row = body.createDiv({ cls: "oawm-changes-filerow" });
        row.createSpan({ cls: `oawm-badge-${f.kind}`, text: f.kind });
        const link = row.createEl("a", { text: ` ${f.path}`, href: "#" });
        link.onclick = (e) => {
          e.preventDefault();
          void this.openFileDiff(task, repo, f.path, "unmerged");
        };
        const pen = row.createEl("a", { text: " \u270E", href: "#", cls: "oawm-pen" });
        pen.onclick = (e) => {
          e.preventDefault();
          void this.deps.openEditor(task, repo, f.path);
        };
      }
    }
    const btns = body.createDiv({ cls: "oawm-commit-btns" });
    const merge = btns.createEl("button", { text: "Merge" });
    const mergePush = btns.createEl("button", { text: "Merge & Push" });
    const pr = btns.createEl("button", { text: "Open PR/MR" });
    merge.onclick = async () => {
      await this.deps.completion.merge(task, { push: false });
      await this.showTask(null);
    };
    mergePush.onclick = async () => {
      await this.deps.completion.merge(task, { push: true });
      await this.showTask(null);
    };
    pr.onclick = async () => {
      const { url } = await this.deps.completion.openPr(task);
      if (url)
        this.deps.openExternal(url);
    };
    if (task.repositories.length > 1) {
      body.createEl("em", { cls: "oawm-changes-caveat", text: `Merge integrates the primary repo (${task.repositories[0]}) only.` });
    }
  }
  async openFileDiff(task, repo, path, scope) {
    const ws = await this.deps.vault.getWorkspace(task.workspace);
    if (!ws)
      return;
    const wt = resolveTaskWorktrees(task, ws).find((w) => w.repo === repo);
    if (!wt)
      return;
    const diff = await this.deps.git.fileDiff(wt.path, ws.baseBranch, path, scope === "local" ? "worktree" : "branch");
    await this.deps.openDiff(`${repo}/${path} (${scope})`, diff);
  }
};

// src/core/editorOpen.ts
function shellQuote(path) {
  return "'" + path.replace(/'/g, "'\\''") + "'";
}
function buildEditorCommand(template, ctx) {
  var _a;
  return template.replace(/\{file\}/g, shellQuote(ctx.file)).replace(/\{line\}/g, String((_a = ctx.line) != null ? _a : 1));
}

// src/main.ts
var DEFAULT_SETTINGS = {
  terminalCommand: DEFAULT_TERMINAL_COMMAND,
  zellijPath: DEFAULT_ZELLIJ_BIN,
  diffTarget: "popout",
  diffLayout: "sideBySide",
  diffWrap: false,
  editorStrategy: "mux",
  editorCommand: "nvim +{line} {file}"
};
var OawmPlugin = class extends import_obsidian6.Plugin {
  async onload() {
    var _a, _b, _c, _d;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new OawmSettingTab(this.app, this));
    const vaultRoot = (_c = (_b = (_a = this.app.vault.adapter).getBasePath) == null ? void 0 : _b.call(_a)) != null ? _c : "";
    this.statusDir = (0, import_node_path5.join)(vaultRoot, ".oawm", "status");
    const hookHelperPath = (0, import_node_path5.join)(vaultRoot, (_d = this.manifest.dir) != null ? _d : "", "oawm-hook.mjs");
    try {
      (0, import_node_fs4.writeFileSync)(hookHelperPath, HOOK_SCRIPT);
    } catch (e) {
      new import_obsidian6.Notice(`OAWM: could not write hook helper (${String(e)})`);
    }
    this.vault = new ObsidianVaultGateway(this.app);
    this.git = new RealGitBackend();
    this.mux = new ZellijBackend(this.settings.terminalCommand, this.settings.zellijPath);
    const notifier = { notice: (m) => new import_obsidian6.Notice(`OAWM: ${m}`), confirm: async (m) => confirm(m) };
    const agent = new ClaudeBackend({ mux: this.mux, hookHelperPath, statusDir: this.statusDir });
    this.completion = new CompletionCoordinator({ vault: this.vault, git: this.git, mux: this.mux, notifier });
    const commit = new CommitCoordinator({ vault: this.vault, git: this.git, notifier });
    this.orchestrator = new Orchestrator({ vault: this.vault, git: this.git, mux: this.mux, agent, notifier, vaultRoot, completion: this.completion });
    this.ingest = new StatusIngest({ vault: this.vault, reconcile: (p) => this.orchestrator.reconcileTask(p) });
    registerTaskCodeBlock(this, {
      getTaskByPath: (p) => this.vault.getTask(p),
      onAction: (action, task) => this.handleAction(action, task)
    });
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this.vault, (path) => this.openTask(path), (path) => this.activateChanges(path)));
    const diffPrefs = {
      get: () => ({ layout: this.settings.diffLayout, wrap: this.settings.diffWrap }),
      set: async (p) => {
        this.settings.diffLayout = p.layout;
        this.settings.diffWrap = p.wrap;
        await this.saveData(this.settings);
      }
    };
    this.registerView(DIFF_VIEW_TYPE, (leaf) => new DiffView(leaf, diffPrefs));
    this.registerView(CHANGES_VIEW_TYPE, (leaf) => new ChangesView(leaf, {
      vault: this.vault,
      git: this.git,
      completion: this.completion,
      commit,
      openDiff: (title, diff) => openDiffLeaf(this.app, this.settings.diffTarget, { title, diff }),
      openEditor: (task, repo, path) => this.openEditor(task, repo, path),
      openExternal: (url) => {
        const { shell } = require("electron");
        shell.openExternal(url);
      }
    }));
    this.addRibbonIcon("bot", "Agent Workspace", () => this.activateDashboard());
    this.addCommand({ id: "open-dashboard", name: "Open Agent Workspace", callback: () => this.activateDashboard() });
    this.addCommand({ id: "open-changes", name: "Open Task Changes panel", callback: () => this.activateChanges(null) });
    this.addCommand({
      id: "reconcile-tasks",
      name: "Reconcile tasks (self-heal state)",
      callback: () => {
        void this.sweep().then(() => new import_obsidian6.Notice("OAWM: reconciled tasks"));
      }
    });
    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      var _a2;
      const fm = (_a2 = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a2.frontmatter;
      if ((fm == null ? void 0 : fm.type) === "task")
        void this.orchestrator.reconcileTask(file.path);
    }));
    try {
      (0, import_node_fs4.mkdirSync)(this.statusDir, { recursive: true });
    } catch (e) {
      new import_obsidian6.Notice("OAWM: could not create status dir");
    }
    this.startStatusWatcher(this.ingest);
    this.sweepTimer = window.setInterval(() => void this.sweep(), 15e3);
    this.registerInterval(this.sweepTimer);
    void this.sweep();
  }
  onunload() {
    var _a;
    (_a = this.fsWatcher) == null ? void 0 : _a.close();
  }
  startStatusWatcher(ingest) {
    try {
      this.fsWatcher = (0, import_node_fs4.watch)(this.statusDir, (_e, filename) => {
        if (!filename || !filename.endsWith(".json"))
          return;
        const id = filename.replace(/\.json$/, "");
        try {
          void ingest.ingest(id, (0, import_node_fs4.readFileSync)((0, import_node_path5.join)(this.statusDir, filename), "utf8"));
        } catch (e) {
        }
      });
    } catch (e) {
    }
  }
  async sweep() {
    for (const task of await this.vault.listTasks()) {
      if (task.status !== "Running")
        continue;
      await this.selfHealFromMarker(task.id);
      void this.orchestrator.reconcileTask(task.path);
    }
  }
  async selfHealFromMarker(taskId) {
    try {
      const raw = (0, import_node_fs4.readFileSync)((0, import_node_path5.join)(this.statusDir, `${taskId}.json`), "utf8");
      await this.ingest.ingest(taskId, raw);
    } catch (e) {
    }
  }
  async handleAction(action, task) {
    switch (action) {
      case "start":
        await this.vault.patchTask(task.path, { status: "Running" });
        break;
      case "cancel":
        await this.vault.patchTask(task.path, { status: "Cancelled" });
        break;
      case "restart":
        await this.vault.patchTask(task.path, { agentState: "", status: "Running" });
        break;
      case "openTerminal":
        if (task.session)
          await this.mux.focus(task.session);
        return;
      case "viewDiff":
        await this.activateChanges(task.path);
        return;
      case "merge":
        await this.completion.merge(task, { push: false });
        break;
      case "mergePush":
        await this.completion.merge(task, { push: true });
        break;
      case "push":
        await this.completion.pushBranch(task);
        break;
      case "openPr": {
        const { url } = await this.completion.openPr(task);
        if (url) {
          const { shell } = require("electron");
          shell.openExternal(url);
        }
        break;
      }
    }
    await this.orchestrator.reconcileTask(task.path);
  }
  async activateChanges(taskPath) {
    var _a;
    const existing = this.app.workspace.getLeavesOfType(CHANGES_VIEW_TYPE);
    const leaf = (_a = existing[0]) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian6.Notice("OAWM: could not open changes panel");
      return;
    }
    await leaf.setViewState({ type: CHANGES_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    if (view instanceof ChangesView)
      await view.showTask(taskPath);
  }
  async openEditor(task, repo, path) {
    const ws = await this.vault.getWorkspace(task.workspace);
    if (!ws)
      return;
    const wt = resolveTaskWorktrees(task, ws).find((w) => w.repo === repo);
    if (!wt)
      return;
    if (!this.settings.editorCommand.trim()) {
      new import_obsidian6.Notice("OAWM: set an editor command in settings");
      return;
    }
    const command = buildEditorCommand(this.settings.editorCommand, { file: (0, import_node_path5.join)(wt.path, path) });
    if (this.settings.editorStrategy === "mux") {
      if (!task.session) {
        new import_obsidian6.Notice("OAWM: no terminal session for this task");
        return;
      }
      await this.mux.openPane(task.session, wt.path, command);
    } else {
      const { spawn: spawn2 } = require("child_process");
      spawn2("bash", ["-lc", command], { cwd: wt.path, detached: true, stdio: "ignore" }).unref();
    }
  }
  async openTask(path) {
    const f = this.app.vault.getAbstractFileByPath((0, import_obsidian6.normalizePath)(path));
    if (f instanceof import_obsidian6.TFile)
      await this.app.workspace.getLeaf(true).openFile(f);
  }
  async activateDashboard() {
    var _a;
    const existing = this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE);
    const leaf = (_a = existing[0]) != null ? _a : this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new import_obsidian6.Notice("OAWM: could not open dashboard");
      return;
    }
    await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
};
var OawmSettingTab = class extends import_obsidian6.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian6.Setting(containerEl).setName("Terminal command").setDesc(
      'Terminal emulator used to launch and attach to agent sessions. The session command is appended after this prefix. Examples: "gnome-terminal --", "konsole -e", "xterm -e", "alacritty -e", "kitty", "wezterm start --". Takes effect on the next plugin reload.'
    ).addText(
      (text) => text.setPlaceholder(DEFAULT_TERMINAL_COMMAND).setValue(this.plugin.settings.terminalCommand).onChange(async (value) => {
        this.plugin.settings.terminalCommand = value.trim() || DEFAULT_TERMINAL_COMMAND;
        await this.plugin.saveData(this.plugin.settings);
      })
    );
    new import_obsidian6.Setting(containerEl).setName("Zellij path").setDesc(
      'Path to the zellij binary. Use an absolute path (e.g. "/opt/zellij") if zellij is not on PATH for non-interactive processes \u2014 a shell alias in ~/.bashrc is not visible here. Takes effect on the next plugin reload.'
    ).addText(
      (text) => text.setPlaceholder(DEFAULT_ZELLIJ_BIN).setValue(this.plugin.settings.zellijPath).onChange(async (value) => {
        this.plugin.settings.zellijPath = value.trim() || DEFAULT_ZELLIJ_BIN;
        await this.plugin.saveData(this.plugin.settings);
      })
    );
    new import_obsidian6.Setting(containerEl).setName("Diff window").setDesc('Where file diffs open. "Popout" opens a separate window so you can read a diff while referencing code in the main window; "Split" opens in the main editor area; "New tab" opens a tab alongside your notes.').addDropdown((d) => d.addOption("popout", "Popout window").addOption("split", "Main split").addOption("tab", "New tab").setValue(this.plugin.settings.diffTarget).onChange(async (v) => {
      this.plugin.settings.diffTarget = v;
      await this.plugin.saveData(this.plugin.settings);
    }));
    new import_obsidian6.Setting(containerEl).setName("Editor open strategy").setDesc(`How the \u270E affordance opens a file. "Terminal pane" opens it in a new pane in the task's zellij session (works over SSH); "External" spawns a GUI editor command.`).addDropdown((d) => d.addOption("mux", "Terminal pane (zellij)").addOption("external", "External command").setValue(this.plugin.settings.editorStrategy).onChange(async (v) => {
      this.plugin.settings.editorStrategy = v;
      await this.plugin.saveData(this.plugin.settings);
    }));
    new import_obsidian6.Setting(containerEl).setName("Editor command").setDesc('Command template with {file} and {line} placeholders. Examples: "nvim +{line} {file}", "glow {file}", "code -g {file}:{line}".').addText((t) => t.setPlaceholder("nvim +{line} {file}").setValue(this.plugin.settings.editorCommand).onChange(async (v) => {
      this.plugin.settings.editorCommand = v;
      await this.plugin.saveData(this.plugin.settings);
    }));
  }
};
