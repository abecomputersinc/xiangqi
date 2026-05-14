// Electron main process: hosts the BrowserWindow and runs Pikafish for the renderer.
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../../..");
const RENDERER_ROOT = path.resolve(ROOT, "src/renderer");

const SERVER_URL = process.env.XIANGQI_SERVER_URL || "https://xiangqi.abecomputers.ca";
const ENGINE_TIMEOUT_MS = positiveNumber(process.env.PIKAFISH_TIMEOUT_MS, 15000);
const ENGINE_MOVETIME_MS = positiveNumber(process.env.PIKAFISH_MOVETIME_MS, 500);
const MAX_PGN_IMPORT_BYTES = 4 * 1024 * 1024;
const PGN_LIBRARY_VERSION = 1;
const PGN_LIBRARY_SEARCH_LIMIT = 200;
const engineFileName = process.platform === "win32" ? "pikafish.exe" : "pikafish";
let pgnLibraryCache = null;

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function bundledPath(...parts) {
  return app.isPackaged ? path.join((process as any).resourcesPath, ...parts) : path.join(ROOT, ...parts);
}

const enginePath = process.env.PIKAFISH_PATH ? path.resolve(process.env.PIKAFISH_PATH) : bundledPath(engineFileName);
const nnuePath = process.env.PIKAFISH_NNUE ? path.resolve(process.env.PIKAFISH_NNUE) : bundledPath("pikafish.nnue");
const engineCwd = process.env.PIKAFISH_PATH ? path.dirname(enginePath) : (app.isPackaged ? (process as any).resourcesPath : ROOT);

function formatEngineExitCode(code) {
  if (code == null) return "unknown";
  if (process.platform !== "win32") return String(code);
  const unsignedCode = code >>> 0;
  const hexCode = `0x${unsignedCode.toString(16).toUpperCase().padStart(8, "0")}`;
  return `${code} (${hexCode})`;
}

function engineExitMessage(code, signal, output = "") {
  const parts = [`Pikafish exited (code ${formatEngineExitCode(code)}${signal ? `, signal ${signal}` : ""}).`];
  if (process.platform === "win32" && code != null && (code >>> 0) === 0xC000001D) {
    parts.push("This usually means the Pikafish executable was built with CPU instructions this computer does not support. Use a generic x86-64 Pikafish build or set PIKAFISH_PATH to a compatible engine.");
  }
  const tail = engineOutputTail(output);
  if (tail) parts.push(tail);
  return parts.join(" ");
}

function engineOutputTail(output = "") {
  const tail = String(output).trim().split(/\r?\n/).filter(Boolean).slice(-3).join(" | ");
  return tail ? `Last engine output: ${tail}` : "";
}

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

function runPikafish(fen, { multipv = 1, movetime = ENGINE_MOVETIME_MS, depth = null } = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(enginePath)) return reject(new Error("The pikafish executable was not found."));
    if (!fs.existsSync(nnuePath)) return reject(new Error("pikafish.nnue is missing beside the engine."));

    const mpv = Math.max(1, Math.min(8, Number(multipv) || 1));
    const thinkMs = Math.max(50, Math.min(3000, Number(movetime) || ENGINE_MOVETIME_MS));
    const searchDepth = depth == null ? null : Math.max(1, Math.min(30, Number(depth) || 0));
    const timeoutMs = Math.max(
      ENGINE_TIMEOUT_MS,
      searchDepth ? searchDepth * 2500 : thinkMs + 10000,
    );
    const engine = spawn(enginePath, [], { cwd: engineCwd, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let lineBuffer = "";
    let settled = false;
    let phase = "startup";

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        engine.kill("SIGKILL");
        const tail = engineOutputTail(output);
        reject(new Error(`Pikafish timed out during ${phase} after ${timeoutMs} ms.${tail ? ` ${tail}` : ""}`));
      }
    }, timeoutMs);

    const writeLine = line => {
      if (!engine.stdin.writable) return;
      engine.stdin.write(`${line}\n`);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try { writeLine("quit"); } catch { /* ignore */ }
      resolve(parseEngineOutput(output, fen, mpv));
    };

    const handleLine = rawLine => {
      const line = rawLine.trim();
      if (!line || settled) return;
      if (line.startsWith("bestmove ")) {
        finish();
        return;
      }
      if (line === "uciok" && phase === "uci") {
        phase = "ready";
        writeLine("setoption name Threads value 1");
        writeLine(`setoption name EvalFile value ${nnuePath}`);
        if (mpv > 1) writeLine(`setoption name MultiPV value ${mpv}`);
        writeLine("isready");
        return;
      }
      if (line === "readyok" && phase === "ready") {
        phase = searchDepth ? `depth ${searchDepth} search` : `${thinkMs} ms search`;
        writeLine(`position fen ${fen}`);
        writeLine(searchDepth ? `go depth ${searchDepth}` : `go movetime ${thinkMs}`);
      }
    };

    engine.stdout.on("data", chunk => {
      const text = chunk.toString();
      output += text;
      lineBuffer += text;
      const lines = lineBuffer.split(/\r?\n/);
      lineBuffer = lines.pop() || "";
      for (const line of lines) handleLine(line);
      if (/^bestmove\s+\S+/.test(lineBuffer.trim())) handleLine(lineBuffer);
    });
    engine.stderr.on("data", chunk => { output += chunk.toString(); });
    engine.on("error", err => {
      if (!settled) { settled = true; clearTimeout(timeout); reject(err); }
    });
    engine.on("exit", (code, signal) => {
      if (!settled) { settled = true; clearTimeout(timeout); reject(new Error(engineExitMessage(code, signal, output))); }
    });

    phase = "uci";
    writeLine("uci");
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
  return runPikafish(String(args.fen), { movetime: args.movetime, depth: args.depth });
});

ipcMain.handle("engine:bestmove", async (_, args: any = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  const count = Math.max(1, Math.min(8, Number(args.count) || 1));
  return runPikafish(String(args.fen), { multipv: count, movetime: args.movetime, depth: args.depth });
});

ipcMain.handle("engine:topmoves", async (_, args: any = {}) => {
  if (!args.fen) throw new Error("Missing FEN");
  const count = Math.max(1, Math.min(8, Number(args.count) || 3));
  return runPikafish(String(args.fen), { multipv: count, movetime: args.movetime, depth: args.depth });
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

function pgnLibraryPath() {
  return path.join(app.getPath("userData"), "pgn-library-v1.json");
}

async function readPgnLibrary() {
  if (pgnLibraryCache) return pgnLibraryCache;
  try {
    const raw = await fs.promises.readFile(pgnLibraryPath(), "utf8");
    const parsed = JSON.parse(raw);
    pgnLibraryCache = {
      version: PGN_LIBRARY_VERSION,
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      games: Array.isArray(parsed.games) ? parsed.games : [],
    };
  } catch {
    pgnLibraryCache = { version: PGN_LIBRARY_VERSION, sources: [], games: [] };
  }
  return pgnLibraryCache;
}

async function writePgnLibrary(index) {
  pgnLibraryCache = index;
  await fs.promises.mkdir(path.dirname(pgnLibraryPath()), { recursive: true });
  await fs.promises.writeFile(pgnLibraryPath(), JSON.stringify(index), "utf8");
}

function pgnHeaderValue(pgnText, name) {
  const match = String(pgnText).match(new RegExp(`^\\s*\\[${name}\\s+"([^"]*)"\\]`, "im"));
  return match?.[1]?.trim() || "";
}

function pgnMoveCount(pgnText) {
  const cleaned = String(pgnText || "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/;[^\n]*/g, " ")
    .replace(/\([^)]*\)/g, " ");
  return cleaned
    .split(/\s+/)
    .filter(token => /^[a-iA-I]\d[-x:]?[a-iA-I]\d[!?+#]*$/.test(token))
    .length;
}

function findPgnGameStarts(buffer) {
  const starts = [];
  const gameHeader = Buffer.from("[Game ");
  const eventHeader = Buffer.from("[Event ");
  let lineStart = 0;
  let previousLineBlank = true;

  while (lineStart < buffer.length) {
    let lineEnd = buffer.indexOf(10, lineStart);
    if (lineEnd < 0) lineEnd = buffer.length;
    let contentStart = lineStart;
    if (contentStart === 0 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) contentStart = 3;
    while (contentStart < lineEnd && (buffer[contentStart] === 32 || buffer[contentStart] === 9 || buffer[contentStart] === 13)) {
      contentStart += 1;
    }
    const isBlank = contentStart >= lineEnd;
    if (previousLineBlank) {
      const line = buffer.subarray(contentStart, lineEnd);
      if (line.subarray(0, gameHeader.length).equals(gameHeader) || line.subarray(0, eventHeader.length).equals(eventHeader)) {
        starts.push(contentStart);
      }
    }
    previousLineBlank = isBlank;
    lineStart = lineEnd + 1;
  }
  if (!starts.length) starts.push(0);
  return starts;
}

function sourceIdFor(filePath, stat) {
  return crypto
    .createHash("sha1")
    .update(`${path.resolve(filePath)}:${stat.size}:${Math.floor(stat.mtimeMs)}`)
    .digest("hex");
}

function summarizePgnGame(pgnText, source, offset, length) {
  const event = pgnHeaderValue(pgnText, "Event") || pgnHeaderValue(pgnText, "Game");
  const red = pgnHeaderValue(pgnText, "Red") || pgnHeaderValue(pgnText, "White");
  const black = pgnHeaderValue(pgnText, "Black");
  const redTeam = pgnHeaderValue(pgnText, "RedTeam");
  const blackTeam = pgnHeaderValue(pgnText, "BlackTeam");
  const date = pgnHeaderValue(pgnText, "Date");
  const result = pgnHeaderValue(pgnText, "Result") || "*";
  const opening = pgnHeaderValue(pgnText, "Opening");
  const moves = pgnMoveCount(pgnText);
  const title = red && black ? `${red} vs ${black}` : (event || source.name);
  const details = [event, date, result, opening && opening !== "-" ? opening : "", `${moves} moves`].filter(Boolean).join(" · ");
  const searchText = [title, details, event, red, black, redTeam, blackTeam, date, result, opening].join(" ").toLowerCase();
  return {
    id: `${source.id}:${offset}`,
    sourceId: source.id,
    sourceName: source.name,
    sourcePath: source.path,
    offset,
    length,
    title,
    details,
    event,
    red,
    black,
    redTeam,
    blackTeam,
    date,
    result,
    opening,
    moves,
    searchText,
  };
}

async function indexPgnLibraryFile(filePath) {
  const rawPath = String(filePath || "").trim().replace(/^['"]|['"]$/g, "");
  if (!rawPath) throw new Error("Missing file path.");
  const expandedPath = rawPath === "~" ? os.homedir() : rawPath.replace(/^~(?=\/|\\)/, os.homedir());
  const finalPath = path.resolve(expandedPath);
  const stat = await fs.promises.stat(finalPath);
  if (!stat.isFile()) throw new Error("Path is not a file.");

  const buffer = await fs.promises.readFile(finalPath);
  const source = {
    id: sourceIdFor(finalPath, stat),
    path: finalPath,
    name: path.basename(finalPath),
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    indexedAt: new Date().toISOString(),
  };
  const starts = findPgnGameStarts(buffer);
  const games = [];
  for (let i = 0; i < starts.length; i += 1) {
    const offset = starts[i];
    const end = starts[i + 1] ?? buffer.length;
    const length = Math.max(0, end - offset);
    if (!length) continue;
    const pgnText = buffer.subarray(offset, end).toString("utf8").trim();
    if (!pgnText) continue;
    games.push(summarizePgnGame(pgnText, source, offset, length));
  }

  const index = await readPgnLibrary();
  const favoriteByLocation = new Map<string, any>(
    index.games
      .filter(item => item.favorite)
      .map(item => [`${item.sourcePath}:${item.offset}`, item])
  );
  for (const game of games) {
    const previous = favoriteByLocation.get(`${finalPath}:${game.offset}`);
    if (previous) {
      game.favorite = true;
      game.favoriteAt = previous.favoriteAt || previous.indexedAt || new Date().toISOString();
    }
  }
  const replacedSourceIds = new Set(
    index.sources
      .filter(item => item.id === source.id || item.path === finalPath)
      .map(item => item.id)
  );
  index.sources = [source, ...index.sources.filter(item => item.id !== source.id && item.path !== finalPath)];
  index.games = [
    ...index.games.filter(item => !replacedSourceIds.has(item.sourceId) && item.sourcePath !== finalPath),
    ...games,
  ];
  await writePgnLibrary(index);
  return { source, count: games.length };
}

function matchesLibraryFilters(game, filters) {
  const query = String(filters.query || "").trim().toLowerCase();
  if (query && !String(game.searchText || "").includes(query)) return false;
  if (filters.favorite && !game.favorite) return false;
  if (filters.result && game.result !== filters.result) return false;
  const event = String(filters.event || "").trim().toLowerCase();
  if (event && !String(game.event || "").toLowerCase().includes(event)) return false;
  const player = String(filters.player || "").trim().toLowerCase();
  if (player) {
    const haystack = [game.red, game.black, game.redTeam, game.blackTeam].join(" ").toLowerCase();
    if (!haystack.includes(player)) return false;
  }
  const year = String(filters.year || "").trim();
  if (year && !String(game.date || "").startsWith(year)) return false;
  const opening = String(filters.opening || "").trim().toLowerCase();
  if (opening && !String(game.opening || "").toLowerCase().includes(opening)) return false;
  return true;
}

function compactLibraryGame(game) {
  return {
    id: game.id,
    title: game.title,
    details: game.details,
    event: game.event,
    red: game.red,
    black: game.black,
    date: game.date,
    result: game.result,
    opening: game.opening,
    moves: game.moves,
    sourceName: game.sourceName,
    favorite: Boolean(game.favorite),
    favoriteAt: game.favoriteAt || "",
  };
}

async function searchPgnLibrary(filters: any = {}) {
  const index = await readPgnLibrary();
  const offset = Math.max(0, Number(filters.offset) || 0);
  const limit = Math.max(1, Math.min(PGN_LIBRARY_SEARCH_LIMIT, Number(filters.limit) || 50));
  const matched = [];
  const resultCounts = new Map();
  const years = new Map();
  for (const game of index.games) {
    if (!matchesLibraryFilters(game, filters)) continue;
    matched.push(game);
    resultCounts.set(game.result || "*", (resultCounts.get(game.result || "*") || 0) + 1);
    const year = String(game.date || "").slice(0, 4);
    if (/^\d{4}$/.test(year)) years.set(year, (years.get(year) || 0) + 1);
  }
  return {
    total: matched.length,
    games: matched.slice(offset, offset + limit).map(compactLibraryGame),
    sources: index.sources,
    filters: {
      results: [...resultCounts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      years: [...years.entries()].sort((a, b) => String(b[0]).localeCompare(String(a[0]))).slice(0, 60),
    },
  };
}

async function readPgnLibraryGame(id) {
  const index = await readPgnLibrary();
  const game = index.games.find(item => item.id === id);
  if (!game) throw new Error("Game not found.");
  const handle = await fs.promises.open(game.sourcePath, "r");
  let buffer;
  try {
    buffer = Buffer.alloc(game.length);
    let totalBytesRead = 0;
    while (totalBytesRead < game.length) {
      const result = await handle.read(buffer, totalBytesRead, game.length - totalBytesRead, game.offset + totalBytesRead);
      if (!result.bytesRead) break;
      totalBytesRead += result.bytesRead;
    }
    buffer = buffer.subarray(0, totalBytesRead);
  } finally {
    await handle.close();
  }
  return { game: compactLibraryGame(game), text: buffer.toString("utf8").trim() };
}

async function setPgnLibraryFavorite(id, favorite) {
  const index = await readPgnLibrary();
  const game = index.games.find(item => item.id === id);
  if (!game) throw new Error("Game not found.");
  game.favorite = Boolean(favorite);
  if (game.favorite) {
    game.favoriteAt = new Date().toISOString();
  } else {
    delete game.favoriteAt;
  }
  await writePgnLibrary(index);
  return compactLibraryGame(game);
}

ipcMain.handle("pgn:open-dialog", async event => {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(owner, {
    title: "Open PGN",
    properties: ["openFile"],
    filters: [
      { name: "PGN files", extensions: ["pgn", "pgns"] },
      { name: "Text files", extensions: ["txt"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return readPgnFile(result.filePaths[0]);
});

ipcMain.handle("pgn-library:import-dialog", async event => {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(owner, {
    title: "Import PGN Library",
    properties: ["openFile"],
    filters: [
      { name: "PGN collections", extensions: ["pgn", "pgns", "txt"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return indexPgnLibraryFile(result.filePaths[0]);
});

ipcMain.handle("pgn-library:import-path", async (_, args: any = {}) => {
  return indexPgnLibraryFile(args.path);
});

ipcMain.handle("pgn-library:search", async (_, args: any = {}) => {
  return searchPgnLibrary(args);
});

ipcMain.handle("pgn-library:read-game", async (_, args: any = {}) => {
  return readPgnLibraryGame(String(args.id || ""));
});

ipcMain.handle("pgn-library:set-favorite", async (_, args: any = {}) => {
  return setPgnLibraryFavorite(String(args.id || ""), Boolean(args.favorite));
});

ipcMain.handle("pgn:read-path", async (_, args: any = {}) => {
  const rawPath = String(args.path || "").trim().replace(/^['"]|['"]$/g, "");
  if (!rawPath) throw new Error("Missing file path.");
  const expandedPath = rawPath === "~" ? os.homedir() : rawPath.replace(/^~(?=\/|\\)/, os.homedir());
  return readPgnFile(path.resolve(expandedPath));
});

ipcMain.handle("config:serverUrl", () => SERVER_URL);
