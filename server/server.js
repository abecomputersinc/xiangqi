import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Server owns auth, ratings, and the online match relay. Engine work happens in the Electron client.
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const root = fileURLToPath(new URL(".", import.meta.url));
const usersPath = join(root, "data", "users.json");

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-max-age": "86400",
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...CORS_HEADERS,
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 16_384) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
  });
}

// ----- Auth and user levels -----

const sessions = new Map(); // token -> userId
let usersDb = loadUsers();

function loadUsers() {
  try {
    if (!existsSync(usersPath)) return { users: {} };
    const parsed = JSON.parse(readFileSync(usersPath, "utf8"));
    return parsed && typeof parsed === "object" && parsed.users ? parsed : { users: {} };
  } catch {
    return { users: {} };
  }
}

function saveUsers() {
  mkdirSync(dirname(usersPath), { recursive: true });
  writeFileSync(usersPath, JSON.stringify(usersDb, null, 2));
}

function cleanUsername(value) {
  return String(value || "").trim().slice(0, 20);
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(String(password), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashPassword(password, salt).split(":")[1], "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function pointsToLevel(points) {
  const clamped = Math.max(0, Math.min(9900, Number(points) || 0));
  const index = Math.floor(clamped / 100);
  const group = Math.floor(index / 10) + 1;
  const step = (index % 10) + 1;
  return `${group}-${step}`;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    level: pointsToLevel(user.points),
    points: user.points,
  };
}

function findUserByName(username) {
  const lower = username.toLowerCase();
  return Object.values(usersDb.users).find(user => user.username.toLowerCase() === lower) || null;
}

function userFromToken(token) {
  const userId = sessions.get(String(token || ""));
  return userId ? usersDb.users[userId] || null : null;
}

function authFromRequest(req, body = null) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : body?.token;
  return userFromToken(token);
}

function makeUser(username, password) {
  const user = {
    id: generateId(),
    username,
    passwordHash: hashPassword(password),
    points: 0,
    createdAt: Date.now(),
  };
  usersDb.users[user.id] = user;
  saveUsers();
  return user;
}

function issueSession(user) {
  const token = randomBytes(24).toString("hex");
  sessions.set(token, user.id);
  return token;
}

function updateUserPoints(userId, delta) {
  const user = usersDb.users[userId];
  if (!user) return null;
  user.points = Math.max(0, Math.min(9900, (Number(user.points) || 0) + delta));
  saveUsers();
  return publicUser(user);
}

async function handleAuthApi(req, res, path, method) {
  if ((path === "/api/auth/login" || path === "/api/auth/signup") && method === "POST") {
    const body = await parseBody(req);
    const username = cleanUsername(body.username);
    const password = String(body.password || "");
    if (!/^[\w -]{2,20}$/.test(username)) {
      sendJson(res, 400, { error: "Username must be 2-20 letters, numbers, spaces, _ or -." });
      return true;
    }
    if (password.length < 4) {
      sendJson(res, 400, { error: "Password must be at least 4 characters." });
      return true;
    }
    const user = findUserByName(username);
    if (path === "/api/auth/signup") {
      if (user) {
        sendJson(res, 409, { error: "Username already exists." });
        return true;
      }
      const created = makeUser(username, password);
      const token = issueSession(created);
      sendJson(res, 200, { token, user: publicUser(created) });
      return true;
    }
    if (!user) {
      sendJson(res, 404, { error: "Account not found. Please sign up first." });
      return true;
    }
    if (!verifyPassword(password, user.passwordHash)) {
      sendJson(res, 403, { error: "Wrong password." });
      return true;
    }
    const token = issueSession(user);
    sendJson(res, 200, { token, user: publicUser(user) });
    return true;
  }

  if (path === "/api/auth/me" && method === "POST") {
    const body = await parseBody(req);
    const user = authFromRequest(req, body);
    if (!user) { sendJson(res, 401, { error: "Please login first." }); return true; }
    sendJson(res, 200, { user: publicUser(user) });
    return true;
  }

  return false;
}

// ----- Online multiplayer match system -----

const MATCH_START_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";
const matches = new Map();   // code -> match object
const queue = [];            // [{ code, playerId, kind, points, queuedAt }] - matches waiting for an opponent
const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode() {
  for (let attempts = 0; attempts < 200; attempts += 1) {
    let code = "";
    for (let i = 0; i < 4; i += 1) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    if (!matches.has(code)) return code;
  }
  return `R${randomBytes(2).toString("hex").toUpperCase()}`;
}

function generateId() {
  return randomBytes(8).toString("hex");
}

function trimNickname(value, fallback) {
  const cleaned = String(value || "").trim().slice(0, 20);
  return cleaned || fallback;
}

function makeMatch(creator, { ranked = false } = {}) {
  const code = generateCode();
  const match = {
    code,
    createdAt: Date.now(),
    players: [creator],
    spectators: [],
    state: {
      fen: MATCH_START_FEN,
      moves: [],
      lastMove: null,
      status: "waiting",
      winner: null,
      winReason: null,
    },
    chat: [],
    rematchVotes: new Set(),
    ranked,
    rated: false,
  };
  matches.set(code, match);
  return match;
}

function publicParticipant(p) {
  return {
    id: p.id,
    userId: p.userId || null,
    nickname: p.nickname,
    color: p.color,
    level: p.level || null,
    points: Number.isFinite(p.points) ? p.points : null,
    online: !!p.sse,
  };
}

function publicMatch(match) {
  return {
    code: match.code,
    ranked: !!match.ranked,
    state: { ...match.state },
    players: match.players.map(publicParticipant),
    spectators: match.spectators.map(s => ({ id: s.id, userId: s.userId || null, nickname: s.nickname, level: s.level || null, points: Number.isFinite(s.points) ? s.points : null, online: !!s.sse })),
    chat: match.chat.slice(-50),
    rematchVotes: [...match.rematchVotes],
  };
}

function broadcast(match, event, data, exceptId = null) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const target of [...match.players, ...match.spectators]) {
    if (exceptId && target.id === exceptId) continue;
    if (!target.sse) continue;
    try { target.sse.write(payload); } catch { /* connection broken; will be cleaned up on close */ }
  }
}

function sseSend(res, event, data) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch { /* ignore */ }
}

function pruneEmptyMatches() {
  const now = Date.now();
  for (const [code, match] of matches) {
    const someoneOnline = match.players.some(p => p.sse) || match.spectators.some(s => s.sse);
    if (someoneOnline) continue;
    const stale = now - (match.lastEmpty || match.createdAt) > 5 * 60_000;
    if (!match.lastEmpty) match.lastEmpty = now;
    if (stale) matches.delete(code);
  }
}
setInterval(pruneEmptyMatches, 60_000).unref?.();

function findParticipant(match, id) {
  return match.players.find(p => p.id === id) || match.spectators.find(s => s.id === id) || null;
}

function ensureUniqueNicknames(nickname, match) {
  const taken = new Set([
    ...match.players.map(p => p.nickname),
    ...match.spectators.map(s => s.nickname),
  ]);
  if (!taken.has(nickname)) return nickname;
  let suffix = 2;
  while (taken.has(`${nickname} (${suffix})`)) suffix += 1;
  return `${nickname} (${suffix})`;
}

function dropFromQueue(code) {
  const idx = queue.findIndex(q => q.code === code);
  if (idx >= 0) queue.splice(idx, 1);
}

function rankedWindowFor(entry) {
  const waitedMs = Date.now() - (entry.queuedAt || Date.now());
  const extra = Math.floor(waitedMs / 30_000) * 100;
  return Math.min(1000, 100 + extra);
}

function takeRandomQueueEntry(user) {
  for (let i = 0; i < queue.length; i += 1) {
    const waiting = queue[i];
    const waitingMatch = matches.get(waiting.code);
    if (waiting.kind !== "random") continue;
    if (!waitingMatch || waitingMatch.players.length >= 2 || waitingMatch.players.some(p => p.userId === user.id)) {
      queue.splice(i, 1);
      i -= 1;
      continue;
    }
    queue.splice(i, 1);
    return waitingMatch;
  }
  return null;
}

function takeRankedQueueEntry(user) {
  const userPoints = Number(user.points) || 0;
  let best = null;
  for (let i = queue.length - 1; i >= 0; i -= 1) {
    const waiting = queue[i];
    const waitingMatch = matches.get(waiting.code);
    if (waiting.kind !== "ranked" || !waitingMatch || waitingMatch.players.length >= 2 || waitingMatch.players.some(p => p.userId === user.id)) {
      queue.splice(i, 1);
      continue;
    }
    const diff = Math.abs((Number(waiting.points) || 0) - userPoints);
    const allowed = Math.max(rankedWindowFor(waiting), 100);
    if (diff > allowed) continue;
    if (!best || diff < best.diff || (diff === best.diff && waiting.queuedAt < best.entry.queuedAt)) {
      best = { index: i, entry: waiting, match: waitingMatch, diff };
    }
  }
  if (!best) return null;
  queue.splice(best.index, 1);
  return best.match;
}

function makePlayerFromUser(user, color) {
  const pub = publicUser(user);
  return {
    id: generateId(),
    userId: user.id,
    nickname: user.username,
    color,
    level: pub.level,
    points: pub.points,
    sse: null,
  };
}

function makeSpectatorFromUser(user) {
  const pub = publicUser(user);
  return {
    id: generateId(),
    userId: user.id,
    nickname: user.username,
    level: pub.level,
    points: pub.points,
    sse: null,
  };
}

function refreshParticipantRatings(match, updates) {
  for (const participant of [...match.players, ...match.spectators]) {
    const update = updates.find(item => item.id === participant.userId);
    if (!update) continue;
    participant.level = update.level;
    participant.points = update.points;
  }
}

function finishMatch(match, winner, reason, by = null) {
  if (match.state.status === "finished") return [];
  match.state.status = "finished";
  match.state.winner = winner;
  match.state.winReason = reason;
  const updates = [];
  if (!match.rated && (winner === "red" || winner === "black") && match.players.length === 2) {
    const won = match.players.find(p => p.color === winner);
    const lost = match.players.find(p => p.color !== winner);
    const winnerUpdate = won?.userId ? updateUserPoints(won.userId, 10) : null;
    const loserUpdate = lost?.userId ? updateUserPoints(lost.userId, -10) : null;
    if (winnerUpdate) updates.push(winnerUpdate);
    if (loserUpdate) updates.push(loserUpdate);
    refreshParticipantRatings(match, updates);
    match.rated = true;
  }
  broadcast(match, "gameover", { winner, reason, by, ratings: updates });
  if (updates.length) broadcast(match, "state", publicMatch(match));
  return updates;
}

async function handleMatchApi(req, res, path, method) {
  // Static endpoints first
  if (path === "/api/match/create" && method === "POST") {
    const body = await parseBody(req);
    const user = authFromRequest(req, body);
    if (!user) { sendJson(res, 401, { error: "Please login before creating a match." }); return true; }
    const colorChoice = body.color === "black" ? "black" : body.color === "random" ? (Math.random() < 0.5 ? "red" : "black") : "red";
    const player = makePlayerFromUser(user, colorChoice);
    const match = makeMatch(player);
    sendJson(res, 200, { code: match.code, playerId: player.id, color: player.color, role: "player", match: publicMatch(match) });
    return true;
  }

  if (path === "/api/match/join" && method === "POST") {
    const body = await parseBody(req);
    const user = authFromRequest(req, body);
    if (!user) { sendJson(res, 401, { error: "Please login before joining a match." }); return true; }
    const code = String(body.code || "").trim().toUpperCase();
    const match = matches.get(code);
    if (!match) { sendJson(res, 404, { error: "Room not found." }); return true; }
    const wantsSpectator = body.role === "spectator" || match.players.length >= 2;
    if (wantsSpectator) {
      const spectator = makeSpectatorFromUser(user);
      spectator.nickname = ensureUniqueNicknames(spectator.nickname, match);
      match.spectators.push(spectator);
      broadcast(match, "joined", { kind: "spectator", id: spectator.id, nickname: spectator.nickname, level: spectator.level });
      sendJson(res, 200, { code: match.code, playerId: spectator.id, role: "spectator", color: null, match: publicMatch(match) });
      return true;
    }
    if (match.players.some(p => p.userId === user.id)) {
      sendJson(res, 409, { error: "You are already a player in this room." });
      return true;
    }
    const oppColor = match.players[0].color;
    const player = makePlayerFromUser(user, oppColor === "red" ? "black" : "red");
    player.nickname = ensureUniqueNicknames(player.nickname, match);
    match.players.push(player);
    if (match.state.status === "waiting") match.state.status = "playing";
    dropFromQueue(match.code);
    broadcast(match, "joined", { kind: "player", id: player.id, nickname: player.nickname, color: player.color, level: player.level });
    broadcast(match, "state", publicMatch(match));
    sendJson(res, 200, { code: match.code, playerId: player.id, role: "player", color: player.color, match: publicMatch(match) });
    return true;
  }

  if (path === "/api/match/queue" && method === "POST") {
    const body = await parseBody(req);
    const user = authFromRequest(req, body);
    if (!user) { sendJson(res, 401, { error: "Please login before searching for a match." }); return true; }
    const waitingMatch = takeRandomQueueEntry(user);
    if (waitingMatch) {
      const oppColor = waitingMatch.players[0].color;
      const player = makePlayerFromUser(user, oppColor === "red" ? "black" : "red");
      player.nickname = ensureUniqueNicknames(player.nickname, waitingMatch);
      waitingMatch.players.push(player);
      waitingMatch.state.status = "playing";
      broadcast(waitingMatch, "joined", { kind: "player", id: player.id, nickname: player.nickname, color: player.color, level: player.level });
      broadcast(waitingMatch, "state", publicMatch(waitingMatch));
      sendJson(res, 200, { code: waitingMatch.code, playerId: player.id, role: "player", color: player.color, matched: true, queue: "random", match: publicMatch(waitingMatch) });
      return true;
    }
    const color = Math.random() < 0.5 ? "red" : "black";
    const player = makePlayerFromUser(user, color);
    const match = makeMatch(player);
    queue.push({ code: match.code, playerId: player.id, kind: "random", points: player.points, queuedAt: Date.now() });
    sendJson(res, 200, { code: match.code, playerId: player.id, role: "player", color, matched: false, queue: "random", match: publicMatch(match) });
    return true;
  }

  if (path === "/api/match/ranked-queue" && method === "POST") {
    const body = await parseBody(req);
    const user = authFromRequest(req, body);
    if (!user) { sendJson(res, 401, { error: "Please login before searching for a ranked match." }); return true; }
    const waitingMatch = takeRankedQueueEntry(user);
    if (waitingMatch) {
      const oppColor = waitingMatch.players[0].color;
      const player = makePlayerFromUser(user, oppColor === "red" ? "black" : "red");
      player.nickname = ensureUniqueNicknames(player.nickname, waitingMatch);
      waitingMatch.players.push(player);
      waitingMatch.state.status = "playing";
      broadcast(waitingMatch, "joined", { kind: "player", id: player.id, nickname: player.nickname, color: player.color, level: player.level });
      broadcast(waitingMatch, "state", publicMatch(waitingMatch));
      sendJson(res, 200, { code: waitingMatch.code, playerId: player.id, role: "player", color: player.color, matched: true, queue: "ranked", match: publicMatch(waitingMatch) });
      return true;
    }
    const color = Math.random() < 0.5 ? "red" : "black";
    const player = makePlayerFromUser(user, color);
    const match = makeMatch(player, { ranked: true });
    queue.push({ code: match.code, playerId: player.id, kind: "ranked", points: player.points, queuedAt: Date.now() });
    sendJson(res, 200, { code: match.code, playerId: player.id, role: "player", color, matched: false, queue: "ranked", match: publicMatch(match) });
    return true;
  }

  if (path === "/api/match/cancel-queue" && method === "POST") {
    const body = await parseBody(req);
    dropFromQueue(String(body.code || ""));
    if (matches.has(body.code) && matches.get(body.code).players.length <= 1) {
      // Only delete if still empty (no opponent)
      const m = matches.get(body.code);
      if (m && m.players.length <= 1 && m.spectators.length === 0) matches.delete(body.code);
    }
    sendJson(res, 200, { ok: true });
    return true;
  }

  // Path-with-code endpoints
  const codeMatch = path.match(/^\/api\/match\/([A-Z0-9]+)\/(events|move|chat|rematch|resign|gameover|leave|state)$/);
  if (!codeMatch) return false;
  const code = codeMatch[1];
  const action = codeMatch[2];
  const match = matches.get(code);
  if (!match) { sendJson(res, 404, { error: "Room not found." }); return true; }

  if (action === "events" && method === "GET") {
    const url = new URL(req.url || "/", `http://localhost`);
    const id = url.searchParams.get("id");
    const participant = findParticipant(match, id);
    if (!participant) { sendJson(res, 404, { error: "Participant not in room." }); return true; }
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      ...CORS_HEADERS,
    });
    res.write(": ok\n\n");
    participant.sse = res;
    sseSend(res, "welcome", {
      you: {
        id: participant.id,
        nickname: participant.nickname,
        role: match.players.includes(participant) ? "player" : "spectator",
        color: participant.color || null,
        level: participant.level || null,
        points: Number.isFinite(participant.points) ? participant.points : null,
      },
      match: publicMatch(match),
    });
    broadcast(match, "presence", publicMatch(match), participant.id);
    const heartbeat = setInterval(() => {
      try { res.write(": ping\n\n"); } catch { /* ignore */ }
    }, 20_000);
    req.on("close", () => {
      clearInterval(heartbeat);
      if (participant.sse === res) participant.sse = null;
      broadcast(match, "presence", publicMatch(match));
    });
    return true;
  }

  if (method !== "POST") { sendJson(res, 405, { error: "Method not allowed." }); return true; }
  const body = await parseBody(req);
  const playerId = body.playerId;
  const participant = findParticipant(match, playerId);
  if (!participant) { sendJson(res, 403, { error: "Not in this room." }); return true; }
  const isPlayer = match.players.includes(participant);

  if (action === "move") {
    if (!isPlayer) { sendJson(res, 403, { error: "Spectators cannot move." }); return true; }
    if (match.state.status !== "playing") { sendJson(res, 400, { error: "Game is not active." }); return true; }
    const uci = String(body.uci || "");
    if (!/^[a-i]\d[a-i]\d$/.test(uci)) { sendJson(res, 400, { error: "Invalid move format." }); return true; }
    match.state.fen = String(body.fen || match.state.fen);
    match.state.moves.push(uci);
    match.state.lastMove = uci;
    broadcast(match, "move", { uci, fen: match.state.fen, by: participant.color, ply: match.state.moves.length });
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (action === "chat") {
    const text = String(body.text || "").trim().slice(0, 240);
    if (!text) { sendJson(res, 400, { error: "Empty message." }); return true; }
    const entry = {
      id: generateId(),
      from: participant.nickname,
      text,
      ts: Date.now(),
      role: isPlayer ? "player" : "spectator",
    };
    match.chat.push(entry);
    if (match.chat.length > 200) match.chat = match.chat.slice(-200);
    broadcast(match, "chat", entry);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (action === "rematch") {
    if (!isPlayer) { sendJson(res, 403, { error: "Spectators cannot start rematch." }); return true; }
    if (match.state.status !== "finished") { sendJson(res, 400, { error: "Game is not finished." }); return true; }
    match.rematchVotes.add(participant.id);
    broadcast(match, "rematch_voted", { votes: match.rematchVotes.size, total: match.players.length, by: participant.id });
    if (match.rematchVotes.size >= match.players.length && match.players.length === 2) {
      for (const p of match.players) p.color = p.color === "red" ? "black" : "red";
      match.state = { fen: MATCH_START_FEN, moves: [], lastMove: null, status: "playing", winner: null, winReason: null };
      match.rematchVotes.clear();
      match.rated = false;
      broadcast(match, "rematch_started", publicMatch(match));
    }
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (action === "resign") {
    if (!isPlayer) { sendJson(res, 403, { error: "Spectators cannot resign." }); return true; }
    if (match.state.status !== "playing") { sendJson(res, 400, { error: "Game is not active." }); return true; }
    const updates = finishMatch(match, participant.color === "red" ? "black" : "red", "resign", participant.color);
    sendJson(res, 200, { ok: true, ratings: updates });
    return true;
  }

  if (action === "gameover") {
    if (!isPlayer) { sendJson(res, 403, { error: "Only players can declare game over." }); return true; }
    if (match.state.status === "finished") { sendJson(res, 200, { ok: true }); return true; }
    const winner = body.winner === "draw" ? "draw" : (body.winner === "red" || body.winner === "black" ? body.winner : null);
    if (winner == null) { sendJson(res, 400, { error: "Invalid winner." }); return true; }
    const updates = finishMatch(match, winner, String(body.reason || "checkmate").slice(0, 30));
    sendJson(res, 200, { ok: true, ratings: updates });
    return true;
  }

  if (action === "leave") {
    if (isPlayer) {
      const idx = match.players.indexOf(participant);
      match.players.splice(idx, 1);
      broadcast(match, "left", { kind: "player", id: participant.id, nickname: participant.nickname });
      if (match.state.status === "playing") {
        finishMatch(match, participant.color === "red" ? "black" : "red", "abandoned");
      }
    } else {
      const idx = match.spectators.indexOf(participant);
      match.spectators.splice(idx, 1);
      broadcast(match, "left", { kind: "spectator", id: participant.id, nickname: participant.nickname });
    }
    if (match.players.length === 0 && match.spectators.length === 0) {
      matches.delete(code);
      dropFromQueue(code);
    }
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (action === "state") {
    sendJson(res, 200, publicMatch(match));
    return true;
  }

  sendJson(res, 404, { error: "Unknown match action." });
  return true;
}

async function handleMatchApiSafe(req, res, path, method) {
  try {
    const handled = await handleMatchApi(req, res, path, method);
    if (handled) return true;
    // Catch-all: any /api/match/* that wasn't recognized.
    sendJson(res, 404, { error: "Unknown match route." });
    return true;
  } catch (error) {
    sendJson(res, 500, { error: error.message });
    return true;
  }
}

async function handleApi(req, res, path) {
  try {
    if (path.startsWith("/api/auth/")) {
      const handled = await handleAuthApi(req, res, path, req.method);
      if (!handled) sendJson(res, 404, { error: "Unknown auth route." });
      return;
    }
    if (path.startsWith("/api/match/")) {
      await handleMatchApiSafe(req, res, path, req.method);
      return;
    }
    sendJson(res, 404, { error: "Unknown API route." });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

createServer((req, res) => {
  // CORS preflight: Electron client + browser may originate from different origins.
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url.pathname);
    return;
  }
  res.writeHead(404, { "content-type": "application/json; charset=utf-8", ...CORS_HEADERS });
  res.end(JSON.stringify({ error: "Match relay only." }));
}).listen(port, host, () => {
  console.log(`Xiangqi match relay running at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});
