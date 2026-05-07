const fs = require("node:fs");
const path = require("node:path");
const sqlite = require("node:sqlite");

const pgnRoot = path.resolve(__dirname, "../client/pgns");
const sourceRoot = path.join(pgnRoot, "by-opening");
const dbPath = path.join(pgnRoot, "library.sqlite");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith(".pgn")) out.push(full);
  }
  return out;
}

function tags(text) {
  const out = {};
  for (const match of text.matchAll(/^\[([^\s]+)\s+"([^"]*)"\]$/gm)) out[match[1]] = match[2];
  return out;
}

function parseMoves(text) {
  const cleaned = text
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/;[^\n]*/g, " ")
    .replace(/\([^)]*\)/g, " ");
  const moves = [];
  for (const token of cleaned.split(/\s+/)) {
    if (!token || /^\d+\.+$/.test(token)) continue;
    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) break;
    const normalized = token.replace(/[!?+#]/g, "").replace(/[-x:]/g, "").toLowerCase();
    if (/^[a-i]\d[a-i]\d$/.test(normalized)) moves.push(normalized);
  }
  return moves;
}

function gameInfo(file, text) {
  const rel = path.relative(sourceRoot, file);
  const parts = rel.split(path.sep);
  const category = parts[0] || "其他类型";
  const opening = parts[1] || "其他类型";
  const base = path.basename(file, ".pgn");
  const id = base;
  const [source = "PGN", indexText = "0"] = base.split("-");
  const headerEnd = text.indexOf("\n1.");
  const headerText = headerEnd > -1 ? text.slice(0, headerEnd) : text.slice(0, 3000);
  const headerTags = tags(headerText);
  const red = headerTags.Red || "Red";
  const black = headerTags.Black || "Black";
  const event = headerTags.Event || headerTags.Game || source;
  const date = headerTags.Date || "-";
  const result = headerTags.Result || "*";
  const moves = parseMoves(text);
  return {
    id,
    source,
    sourceIndex: Number(indexText) || 0,
    category,
    opening,
    firstMove: moves[0] || "",
    title: `${red} vs ${black}`,
    event,
    date,
    red,
    black,
    result,
    moves,
  };
}

function setupDatabase() {
  fs.mkdirSync(pgnRoot, { recursive: true });
  fs.rmSync(dbPath, { force: true });
  const db = new sqlite.DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;
    PRAGMA temp_store = MEMORY;

    CREATE TABLE games (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_index INTEGER NOT NULL,
      category TEXT NOT NULL,
      opening TEXT NOT NULL,
      first_move TEXT NOT NULL,
      title TEXT NOT NULL,
      event TEXT NOT NULL,
      date TEXT NOT NULL,
      red TEXT NOT NULL,
      black TEXT NOT NULL,
      result TEXT NOT NULL,
      ply_count INTEGER NOT NULL,
      pgn TEXT NOT NULL
    );

    CREATE TABLE nodes (
      id INTEGER PRIMARY KEY,
      parent_id INTEGER,
      ply INTEGER NOT NULL,
      move TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      red_wins INTEGER NOT NULL DEFAULT 0,
      black_wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0,
      sample_game_id TEXT,
      UNIQUE(parent_id, move)
    );

    INSERT INTO nodes (id, parent_id, ply, move, count) VALUES (1, NULL, 0, 'ROOT', 0);

    CREATE INDEX games_opening_idx ON games(opening);
    CREATE INDEX games_category_idx ON games(category);
    CREATE INDEX games_search_idx ON games(title, event, red, black);
    CREATE INDEX nodes_parent_idx ON nodes(parent_id, count DESC);
  `);
  return db;
}

function outcome(result) {
  return {
    red: result === "1-0" ? 1 : 0,
    black: result === "0-1" ? 1 : 0,
    draw: result === "1/2-1/2" ? 1 : 0,
  };
}

if (!fs.existsSync(sourceRoot)) {
  throw new Error(`Missing ${sourceRoot}. Build by-opening PGN files before creating the SQLite tree.`);
}

const db = setupDatabase();
const insertGame = db.prepare(`
  INSERT INTO games
  (id, source, source_index, category, opening, first_move, title, event, date, red, black, result, ply_count, pgn)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const upsertNode = db.prepare(`
  INSERT INTO nodes (parent_id, ply, move, count, red_wins, black_wins, draws, sample_game_id)
  VALUES (?, ?, ?, 1, ?, ?, ?, ?)
  ON CONFLICT(parent_id, move) DO UPDATE SET
    count = count + 1,
    red_wins = red_wins + excluded.red_wins,
    black_wins = black_wins + excluded.black_wins,
    draws = draws + excluded.draws
  RETURNING id
`);

const files = walk(sourceRoot);
let done = 0;
db.exec("BEGIN");
try {
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const info = gameInfo(file, text);
    insertGame.run(
      info.id,
      info.source,
      info.sourceIndex,
      info.category,
      info.opening,
      info.firstMove,
      info.title,
      info.event,
      info.date,
      info.red,
      info.black,
      info.result,
      info.moves.length,
      text
    );

    const score = outcome(info.result);
    let parent = 1;
    for (let ply = 0; ply < info.moves.length; ply += 1) {
      const row = upsertNode.get(parent, ply + 1, info.moves[ply], score.red, score.black, score.draw, info.id);
      parent = row.id;
    }
    done += 1;
    if (done % 10000 === 0) console.log(`indexed ${done}/${files.length}`);
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

db.exec("VACUUM");
const stats = {
  games: db.prepare("SELECT COUNT(*) AS count FROM games").get().count,
  nodes: db.prepare("SELECT COUNT(*) AS count FROM nodes").get().count,
  openings: db.prepare("SELECT COUNT(DISTINCT opening) AS count FROM games").get().count,
  dbPath,
};
db.close();

console.log(JSON.stringify(stats, null, 2));
