// Electron main process: hosts the BrowserWindow and runs Pikafish for the renderer.
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../../..");
const RENDERER_ROOT = path.resolve(ROOT, "src/renderer");

const SERVER_URL = process.env.XIANGQI_SERVER_URL || "https://xiangqi.abecomputers.ca";
const ENGINE_TIMEOUT_MS = Number(process.env.PIKAFISH_TIMEOUT_MS || 5000);
const ENGINE_MOVETIME_MS = Number(process.env.PIKAFISH_MOVETIME_MS || 500);
const MAX_PGN_IMPORT_BYTES = 4 * 1024 * 1024;
const engineFileName = process.platform === "win32" ? "pikafish.exe" : "pikafish";

function bundledPath(...parts) {
  return app.isPackaged ? path.join((process as any).resourcesPath, ...parts) : path.join(ROOT, ...parts);
}

const enginePath = process.env.PIKAFISH_PATH ? path.resolve(process.env.PIKAFISH_PATH) : bundledPath(engineFileName);
const nnuePath = process.env.PIKAFISH_NNUE ? path.resolve(process.env.PIKAFISH_NNUE) : bundledPath("pikafish.nnue");
const engineCwd = app.isPackaged ? (process as any).resourcesPath : ROOT;

function sideFromFen(fen) {
  return fen.trim().split(/\s+/)[1] || "w";
}

function parseEngineOutput(output, fen, multipv = 1) {
  const lines = output.split(/\r?\n/);
  const bestLine = [...lines].reverse().find(line => line.startsWith("bestmove "));
  const bestMove = bestLine?.split(/\s+/)[1] || null;
  const ponder = bestLine?.match(/\bponder\s+(\S+)/)?.[1] || null;
  const side = sideFromFen(fen);

  const byMpv = new Map();
  for (const line of lines) {
    if (!/\bscore (cp|mate) /.test(line)) continue;
    const mpvMatch = line.match(/\bmultipv (\d+)/);
    const mpv = mpvMatch ? Number(mpvMatch[1]) : 1;
    const depthMatch = line.match(/\bdepth (\d+)/);
    const depth = depthMatch ? Number(depthMatch[1]) : 0;
    const cpMatch = line.match(/\bscore cp (-?\d+)/);
    const mateMatch = line.match(/\bscore mate (-?\d+)/);
    const pvMatch = line.match(/\bpv\s+(.+)$/);
    const rawScore = cpMatch ? Number(cpMatch[1]) : null;
    const mate = mateMatch ? Number(mateMatch[1]) : null;
    const pv = pvMatch ? pvMatch[1].trim().split(/\s+/).slice(0, 8) : [];
    const prev = byMpv.get(mpv);
    if (!prev || depth >= prev.depth) byMpv.set(mpv, { depth, rawScore, mate, pv });
  }

  const top = byMpv.get(1) || { rawScore: null, mate: null, pv: [] };
  const redScore = top.rawScore == null ? null : side === "w" ? top.rawScore : -top.rawScore;
  const redMate = top.mate == null ? null : side === "w" ? top.mate : -top.mate;

  const moves = [...byMpv.entries()]
    .sort((a, b) => a[0] - b[0])
    .filter(([rank]) => rank <= multipv)
    .map(([rank, info]) => ({
      rank,
      move: info.pv[0] || null,
      score: info.rawScore == null ? null : side === "w" ? info.rawScore : -info.rawScore,
      mate: info.mate == null ? null : side === "w" ? info.mate : -info.mate,
      pv: info.pv,
    }));

  return { bestMove, ponder, score: redScore, mate: redMate, pv: top.pv, moves };
}

function runPikafish(fen, { multipv = 1 } = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(enginePath)) return reject(new Error("The pikafish executable was not found."));
    if (!fs.existsSync(nnuePath)) return reject(new Error("pikafish.nnue is missing beside the engine."));

    const engine = spawn(enginePath, [], { cwd: engineCwd, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        engine.kill("SIGKILL");
        reject(new Error("Pikafish timed out."));
      }
    }, ENGINE_TIMEOUT_MS);

    engine.stdout.on("data", chunk => {
      output += chunk.toString();
      if (output.includes("\nbestmove ") || output.includes("\r\nbestmove ")) {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          try { engine.stdin.write("quit\n"); } catch { /* ignore */ }
          resolve(parseEngineOutput(output, fen, multipv));
        }
      }
    });
    engine.stderr.on("data", chunk => { output += chunk.toString(); });
    engine.on("error", err => {
      if (!settled) { settled = true; clearTimeout(timeout); reject(err); }
    });
    engine.on("exit", code => {
      if (!settled) { settled = true; clearTimeout(timeout); reject(new Error(`Pikafish exited (code ${code}).`)); }
    });

    const mpv = Math.max(1, Math.min(5, Number(multipv) || 1));
    const initLines = ["uci", "setoption name Threads value 1"];
    if (mpv > 1) initLines.push(`setoption name MultiPV value ${mpv}`);
    initLines.push("isready", `position fen ${fen}`, `go movetime ${ENGINE_MOVETIME_MS}`, "");
    engine.stdin.write(initLines.join("\n"));
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 920,
    minWidth: 900,
    minHeight: 700,
    title: "xiangqi",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(RENDERER_ROOT, "index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---- IPC: engine ----

ipcMain.handle("engine:status", async () => ({
  engine: fs.existsSync(enginePath),
  nnue: fs.existsSync(nnuePath),
  platform: process.platform,
  enginePath,
  nnuePath,
}));

ipcMain.handle("engine:evaluate", async (_, args: any = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  return runPikafish(String(args.fen));
});

ipcMain.handle("engine:bestmove", async (_, args: any = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  const count = Math.max(1, Math.min(5, Number(args.count) || 1));
  return runPikafish(String(args.fen), { multipv: count });
});

ipcMain.handle("engine:topmoves", async (_, args: any = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  const count = Math.max(1, Math.min(5, Number(args.count) || 3));
  return runPikafish(String(args.fen), { multipv: count });
});

async function readPgnFile(filePath) {
  const stat = await fs.promises.stat(filePath);
  if (!stat.isFile()) throw new Error("Path is not a file.");
  const handle = await fs.promises.open(filePath, "r");
  let bytesRead = 0;
  let buffer;
  try {
    const length = Math.min(stat.size, MAX_PGN_IMPORT_BYTES);
    buffer = Buffer.alloc(length);
    const result = await handle.read(buffer, 0, length, 0);
    bytesRead = result.bytesRead;
  } finally {
    await handle.close();
  }
  return {
    name: path.basename(filePath),
    path: filePath,
    text: buffer.subarray(0, bytesRead).toString("utf8"),
    truncated: stat.size > MAX_PGN_IMPORT_BYTES,
  };
}

ipcMain.handle("pgn:open-dialog", async event => {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(owner, {
    title: "Open PGN",
    properties: ["openFile"],
    filters: [
      { name: "PGN files", extensions: ["pgn"] },
      { name: "Text files", extensions: ["txt"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return readPgnFile(result.filePaths[0]);
});

ipcMain.handle("pgn:read-path", async (_, args: any = {}) => {
  const rawPath = String(args.path || "").trim().replace(/^['"]|['"]$/g, "");
  if (!rawPath) throw new Error("Missing file path.");
  const expandedPath = rawPath === "~" ? os.homedir() : rawPath.replace(/^~(?=\/|\\)/, os.homedir());
  return readPgnFile(path.resolve(expandedPath));
});

ipcMain.handle("config:serverUrl", () => SERVER_URL);
