// Electron main process: hosts the BrowserWindow and runs Pikafish for the renderer.
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { execFile, spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");

const ROOT = path.resolve(__dirname, "../..");
const CLIENT_ROOT = path.resolve(__dirname, "..");
const sqliteBin = process.env.SQLITE_BIN || "/usr/bin/sqlite3";

const SERVER_URL = process.env.XIANGQI_SERVER_URL || "http://129.153.61.43:4173";
const ENGINE_TIMEOUT_MS = Number(process.env.PIKAFISH_TIMEOUT_MS || 5000);
const ENGINE_MOVETIME_MS = Number(process.env.PIKAFISH_MOVETIME_MS || 500);

function bundledPath(...parts) {
  return app.isPackaged ? path.join(process.resourcesPath, ...parts) : path.join(ROOT, ...parts);
}

const enginePath = process.env.PIKAFISH_PATH ? path.resolve(process.env.PIKAFISH_PATH) : bundledPath("pikafish");
const nnuePath = process.env.PIKAFISH_NNUE ? path.resolve(process.env.PIKAFISH_NNUE) : bundledPath("pikafish.nnue");
const engineCwd = app.isPackaged ? process.resourcesPath : ROOT;
const pgnDbPath = app.isPackaged
  ? path.join(process.resourcesPath, "pgns", "library.sqlite")
  : path.join(CLIENT_ROOT, "pgns", "library.sqlite");

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
  win.loadFile(path.join(CLIENT_ROOT, "index.html"));
}

function sqlQuote(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function sqliteJson(sql) {
  if (!fs.existsSync(pgnDbPath)) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    execFile(sqliteBin, ["-json", pgnDbPath, sql], { maxBuffer: 32 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.trim() || error.message));
        return;
      }
      try {
        resolve(stdout.trim() ? JSON.parse(stdout) : []);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

function pgnSearchWhere(args = {}) {
  const clauses = [];
  if (args.opening) clauses.push(`opening = ${sqlQuote(args.opening)}`);
  const terms = String(args.query || "").trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
  for (const term of terms) {
    clauses.push(`lower(source || ' ' || category || ' ' || opening || ' ' || event || ' ' || date || ' ' || red || ' ' || black || ' ' || result || ' ' || title) LIKE ${sqlQuote(`%${term}%`)}`);
  }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
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

ipcMain.handle("engine:evaluate", async (_, args = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  return runPikafish(String(args.fen));
});

ipcMain.handle("engine:bestmove", async (_, args = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  const count = Math.max(1, Math.min(5, Number(args.count) || 1));
  return runPikafish(String(args.fen), { multipv: count });
});

ipcMain.handle("engine:topmoves", async (_, args = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  const count = Math.max(1, Math.min(5, Number(args.count) || 3));
  return runPikafish(String(args.fen), { multipv: count });
});

ipcMain.handle("pgn-library:index", async () => {
  if (!fs.existsSync(pgnDbPath)) return { total: 0, openings: [] };
  const [totalRows, openings] = await Promise.all([
    sqliteJson("SELECT COUNT(*) AS total FROM games"),
    sqliteJson(`
      SELECT category, opening AS name, COUNT(*) AS count
      FROM games
      GROUP BY category, opening
      ORDER BY count DESC, category, opening
    `),
  ]);
  return { total: totalRows[0]?.total || 0, openings };
});

ipcMain.handle("pgn-library:search", async (_, args = {}) => {
  if (!fs.existsSync(pgnDbPath)) return { total: 0, games: [] };
  const limit = Math.max(1, Math.min(200, Number(args.limit) || 100));
  const where = pgnSearchWhere(args);
  const [totalRows, games] = await Promise.all([
    sqliteJson(`SELECT COUNT(*) AS total FROM games ${where}`),
    sqliteJson(`
      SELECT
        id,
        source,
        source_index AS "index",
        category,
        opening,
        first_move AS firstMove,
        title,
        event,
        date,
        red,
        black,
        result,
        ply_count AS plyCount
      FROM games
      ${where}
      ORDER BY source, source_index
      LIMIT ${limit}
    `),
  ]);
  return { total: totalRows[0]?.total || 0, games };
});

ipcMain.handle("pgn-library:game", async (_, args = {}) => {
  if (!args.id) throw new Error("Missing game id.");
  const rows = await sqliteJson(`
    SELECT
      id,
      source,
      source_index AS "index",
      category,
      opening,
      first_move AS firstMove,
      title,
      event,
      date,
      red,
      black,
      result,
      ply_count AS plyCount,
      pgn
    FROM games
    WHERE id = ${sqlQuote(args.id)}
    LIMIT 1
  `);
  const row = rows[0];
  if (!row) throw new Error("Game not found.");
  const { pgn, ...game } = row;
  return { game, text: pgn };
});

ipcMain.handle("pgn-library:children", async (_, args = {}) => {
  const parentId = Math.max(1, Number(args.parentId) || 1);
  const limit = Math.max(1, Math.min(100, Number(args.limit) || 40));
  const children = await sqliteJson(`
    SELECT
      id,
      parent_id AS parentId,
      ply,
      move,
      count,
      red_wins AS redWins,
      black_wins AS blackWins,
      draws,
      sample_game_id AS sampleGameId
    FROM nodes
    WHERE parent_id = ${parentId}
    ORDER BY count DESC, move
    LIMIT ${limit}
  `);
  return { parentId, children };
});

ipcMain.handle("config:serverUrl", () => SERVER_URL);
