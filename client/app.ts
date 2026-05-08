export {};

declare global {
  interface Window {
    api?: any;
  }
}

const START_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";
const PIECES = {
  K: "帥",
  A: "仕",
  B: "相",
  N: "傌",
  R: "俥",
  C: "炮",
  P: "兵",
  k: "將",
  a: "士",
  b: "象",
  n: "馬",
  r: "車",
  c: "砲",
  p: "卒"
};
const pieceNames = {
  K: "King",
  A: "Advisor",
  B: "Elephant",
  N: "Horse",
  R: "Rook",
  C: "Cannon",
  P: "Pawn",
  k: "King",
  a: "Advisor",
  b: "Elephant",
  n: "Horse",
  r: "Rook",
  c: "Cannon",
  p: "Pawn"
};
const GOOD_MOVE_LOSS_CP = 100;

function qs<T = any>(selector: string): T {
  return document.querySelector(selector) as T;
}

function qsa<T extends Element = any>(selector: string): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}

const boardEl = qs("#board");
const statusText = qs("#statusText");
const turnPill = qs("#turnPill");
const modeSelect = qs("#modeSelect");
const playerSide = qs("#playerSide");
const depthInput = qs("#depthInput");
const depthLabel = qs("#depthLabel");
const newGameBtn = qs("#newGameBtn");
const undoBtn = qs("#undoBtn");
const downloadPgnBtn = qs("#downloadPgnBtn");
const evalText = qs("#evalText");
const redBar = qs("#redBar");
const blackBar = qs("#blackBar");
const moveScore = qs("#moveScore");
const pvLine = qs("#pvLine");
const moveList = qs("#moveList");
const fenText = qs("#fenText");
const fenCopyBtn = qs("#fenCopyBtn");

// Trainer DOM
const trainerPanel = qs("#trainerPanel");
const trainerSide = qs("#trainerSide");
const trainerPrompt = qs("#trainerPrompt");
const trainerSolved = qs("#trainerSolved");
const trainerStreak = qs("#trainerStreak");
const trainerAttempts = qs("#trainerAttempts");
const trainerLine = qs("#trainerLine");
const trainerHintBtn = qs("#trainerHintBtn");
const trainerRevealBtn = qs("#trainerRevealBtn");
const trainerRestartBtn = qs("#trainerRestartBtn");

// Clock DOM
const clockRowRed = qs("#clockRowRed");
const clockRowBlack = qs("#clockRowBlack");
const redClockBase = qs("#redClockBase");
const redClockMove = qs("#redClockMove");
const blackClockBase = qs("#blackClockBase");
const blackClockMove = qs("#blackClockMove");

// PGN viewer DOM
const pgnOverlay = qs("#pgnOverlay");
const pgnOverlayClose = qs("#pgnOverlayClose");
const pgnInput = qs("#pgnInput");
const pgnFile = qs("#pgnFile");
const pgnLoadBtn = qs("#pgnLoadBtn");
const pgnStatus = qs("#pgnStatus");
const pgnLibraryPanel = qs("#pgnLibraryPanel");
const pgnSearchInput = qs("#pgnSearchInput");
const pgnOpeningSelect = qs("#pgnOpeningSelect");
const pgnLibraryCount = qs("#pgnLibraryCount");
const pgnLibraryResults = qs("#pgnLibraryResults");
const pgnNav = qs("#pgnNav");
const pgnFirstBtn = qs("#pgnFirstBtn");
const pgnPrevBtn = qs("#pgnPrevBtn");
const pgnNextBtn = qs("#pgnNextBtn");
const pgnLastBtn = qs("#pgnLastBtn");
const pgnPosition = qs("#pgnPosition");
const pgnLastMoveEl = qs("#pgnLastMove");
const pgnImportAgain = qs("#pgnImportAgain");

// Startup mode picker DOM
const startupOverlay = qs("#startupOverlay");
const startupModeStep = qs("#startupModeStep");
const startupSideStep = qs("#startupSideStep");
const startupSideBack = qs("#startupSideBack");
const startupAuthActions = qs("#startupAuthActions");
const startupLoginBtn = qs("#startupLoginBtn");
const startupSignupBtn = qs("#startupSignupBtn");
const startupOptions = qsa(".startup-option:not(.startup-side-option)");
const startupSideOptions = qsa(".startup-side-option");

// Local profile DOM
const profilePanel = qs(".profile-panel");
const profileNameEl = qs("#profileName");
const profileLevelEl = qs("#profileLevel");
const loginBtn = qs("#loginBtn");
const loginOverlay = qs("#loginOverlay");
const loginCloseBtn = qs("#loginCloseBtn");
const loginForm = qs("#loginForm");
const loginName = qs("#loginName");
const loginPassword = qs("#loginPassword");
const loginStatus = qs("#loginStatus");
const signupBtn = qs("#signupBtn");

// Online multiplayer DOM
const onlineOverlay = qs("#onlineOverlay");
const overlayCloseBtn = qs("#overlayCloseBtn");
const onlinePanel = qs("#onlinePanel");
const onlineLobby = qs("#onlineLobby");
const onlineMatchEl = qs("#onlineMatch");
const onlineNickname = qs("#onlineNickname");
const onlineCreateBtn = qs("#onlineCreateBtn");
const onlineQueueBtn = qs("#onlineQueueBtn");
const onlineRankedQueueBtn = qs("#onlineRankedQueueBtn");
const onlineJoinCode = qs("#onlineJoinCode");
const onlineJoinBtn = qs("#onlineJoinBtn");
const onlineSpectateBtn = qs("#onlineSpectateBtn");
const onlineLobbyStatus = qs("#onlineLobbyStatus");
const onlineRoomCode = qs("#onlineRoomCode");
const onlineCopyCode = qs("#onlineCopyCode");
const onlineLeaveBtn = qs("#onlineLeaveBtn");
const onlinePlayerRed = qs("#onlinePlayerRed");
const onlinePlayerBlack = qs("#onlinePlayerBlack");
const onlineMatchStatus = qs("#onlineMatchStatus");
const onlineRematchBtn = qs("#onlineRematchBtn");
const onlineResignBtn = qs("#onlineResignBtn");
const onlineSpectators = qs("#onlineSpectators");

let board = parseFen(START_FEN).board;
let turn = "red";
let selected = null;
let legalTargets = [];
let history = [];
let lastMove = null;
let lastUserRecommendationText = "";
let gameResult = null;
let currentEval = 0;
let evalRequest = 0;
let busy = false;
let pendingSideMode = "ai";
let trainerState = {
  requestId: 0,
  fen: "",
  side: "red",
  status: "idle",
  moves: [],
  bestMove: null,
  solved: 0,
  attempts: 0,
  streak: 0,
  message: "",
  hintLevel: 0,
  revealed: false,
};

let currentProfile = loadProfile();

// Online multiplayer state. null when offline.
// Shape: { code, playerId, role, myColor, status, winner, winReason, players, spectators, eventSource, applyingRemote }
let online = null;

function levelLabel(level, points = 0) {
  if (level === "1-1") return "1-1 Beginner";
  if (level === "10-10") return "10-10 Highest";
  return `${level || "1-1"} · ${points} pts`;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem("xiangqi.session");
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        token: String(saved.token || ""),
        user: saved.user || null,
      };
    }
  } catch { /* ignore */ }
  return { token: "", user: null };
}

function saveProfile(session) {
  currentProfile = { token: String(session.token || ""), user: session.user || null };
  try {
    localStorage.setItem("xiangqi.session", JSON.stringify(currentProfile));
    if (currentProfile.user?.username) localStorage.setItem("xiangqi.nickname", currentProfile.user.username);
  } catch { /* ignore */ }
  renderProfile();
}

function renderProfile() {
  const user = currentProfile.user;
  profileNameEl.textContent = user?.username || "Guest";
  profileLevelEl.textContent = user ? levelLabel(user.level, user.points) : "Login required";
  loginBtn.hidden = false;
  startupAuthActions.hidden = !!user;
  profilePanel.classList.toggle("logged-in", !!user);
  loginBtn.textContent = user ? "Logout" : "Login";
}

function openLoginOverlay(mode = "login") {
  loginName.value = currentProfile.user?.username || "";
  loginPassword.value = "";
  loginStatus.textContent = mode === "signup" ? "Create an account to play ranked matches." : (currentProfile.user ? levelLabel(currentProfile.user.level, currentProfile.user.points) : "Level is earned in online matches.");
  loginOverlay.hidden = false;
  setTimeout(() => loginName.focus(), 30);
}

function closeLoginOverlay() {
  loginOverlay.hidden = true;
}

function logout() {
  if (online) onlineLeave();
  saveProfile({ token: "", user: null });
  onlineNickname.value = "";
  closeMatchOverlay();
}

function parseFen(fen) {
  const [placement, side] = fen.trim().split(/\s+/);
  const rows = placement.split("/");
  const parsed = rows.map(row => {
    const cells = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < Number(char); i += 1) cells.push(null);
      } else {
        cells.push(char);
      }
    }
    return cells;
  });
  return { board: parsed, turn: side === "b" ? "black" : "red" };
}

function boardToFen() {
  const placement = board.map(row => {
    let out = "";
    let empty = 0;
    for (const cell of row) {
      if (!cell) {
        empty += 1;
      } else {
        if (empty) out += empty;
        empty = 0;
        out += cell;
      }
    }
    if (empty) out += empty;
    return out;
  }).join("/");
  return `${placement} ${turn === "red" ? "w" : "b"} - - 0 1`;
}

function cloneBoard(source = board) {
  return source.map(row => [...row]);
}

function colorOf(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? "red" : "black";
}

function colorLabel(color) {
  return color === "red" ? "Red" : "Black";
}

function inBounds(r, c) {
  return r >= 0 && r < 10 && c >= 0 && c < 9;
}

function palace(color, r, c) {
  const rows = color === "red" ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
  return rows && c >= 3 && c <= 5;
}

function crossedRiver(color, r) {
  return color === "red" ? r <= 4 : r >= 5;
}

function addIfValid(moves, r, c, color, targetBoard = board) {
  if (!inBounds(r, c)) return;
  if (colorOf(targetBoard[r][c]) !== color) moves.push({ r, c });
}

function pseudoMoves(fromR, fromC, targetBoard = board) {
  const piece = targetBoard[fromR][fromC];
  const color = colorOf(piece);
  const kind = piece?.toLowerCase();
  const moves = [];
  if (!piece) return moves;

  if (kind === "k") {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r = fromR + dr;
      const c = fromC + dc;
      if (palace(color, r, c)) addIfValid(moves, r, c, color, targetBoard);
    }
    const step = color === "red" ? -1 : 1;
    for (let r = fromR + step; inBounds(r, fromC); r += step) {
      const seen = targetBoard[r][fromC];
      if (seen) {
        if (seen.toLowerCase() === "k" && colorOf(seen) !== color) moves.push({ r, c: fromC });
        break;
      }
    }
  }

  if (kind === "a") {
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const r = fromR + dr;
      const c = fromC + dc;
      if (palace(color, r, c)) addIfValid(moves, r, c, color, targetBoard);
    }
  }

  if (kind === "b") {
    for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
      const r = fromR + dr;
      const c = fromC + dc;
      const eyeR = fromR + dr / 2;
      const eyeC = fromC + dc / 2;
      const staysHome = color === "red" ? r >= 5 : r <= 4;
      if (inBounds(r, c) && staysHome && !targetBoard[eyeR][eyeC]) addIfValid(moves, r, c, color, targetBoard);
    }
  }

  if (kind === "n") {
    for (const move of [
      [-2, -1, -1, 0], [-2, 1, -1, 0], [2, -1, 1, 0], [2, 1, 1, 0],
      [-1, -2, 0, -1], [1, -2, 0, -1], [-1, 2, 0, 1], [1, 2, 0, 1]
    ]) {
      const [dr, dc, legR, legC] = move;
      const r = fromR + dr;
      const c = fromC + dc;
      if (inBounds(r, c) && !targetBoard[fromR + legR][fromC + legC]) addIfValid(moves, r, c, color, targetBoard);
    }
  }

  if (kind === "r" || kind === "c") {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let jumped = false;
      for (let r = fromR + dr, c = fromC + dc; inBounds(r, c); r += dr, c += dc) {
        const target = targetBoard[r][c];
        if (kind === "r") {
          if (!target) {
            moves.push({ r, c });
          } else {
            if (colorOf(target) !== color) moves.push({ r, c });
            break;
          }
        } else if (!jumped) {
          if (!target) moves.push({ r, c });
          else jumped = true;
        } else if (target) {
          if (colorOf(target) !== color) moves.push({ r, c });
          break;
        }
      }
    }
  }

  if (kind === "p") {
    const forward = color === "red" ? -1 : 1;
    addIfValid(moves, fromR + forward, fromC, color, targetBoard);
    if (crossedRiver(color, fromR)) {
      addIfValid(moves, fromR, fromC - 1, color, targetBoard);
      addIfValid(moves, fromR, fromC + 1, color, targetBoard);
    }
  }

  return moves;
}

function kingsFacing(testBoard) {
  let redKing = null;
  let blackKing = null;
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (testBoard[r][c] === "K") redKing = { r, c };
      if (testBoard[r][c] === "k") blackKing = { r, c };
    }
  }
  if (!redKing || !blackKing || redKing.c !== blackKing.c) return false;
  const c = redKing.c;
  for (let r = blackKing.r + 1; r < redKing.r; r += 1) {
    if (testBoard[r][c]) return false;
  }
  return true;
}

function isInCheck(color, targetBoard = board) {
  let king = null;
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (targetBoard[r][c]?.toLowerCase() === "k" && colorOf(targetBoard[r][c]) === color) king = { r, c };
    }
  }
  if (!king || kingsFacing(targetBoard)) return true;
  const enemy = color === "red" ? "black" : "red";
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (colorOf(targetBoard[r][c]) === enemy) {
        if (pseudoMoves(r, c, targetBoard).some(move => move.r === king.r && move.c === king.c)) return true;
      }
    }
  }
  return false;
}

function legalMoves(r, c) {
  const piece = board[r][c];
  const color = colorOf(piece);
  if (!piece || color !== turn) return [];
  return pseudoMoves(r, c).filter(move => {
    const next = cloneBoard();
    next[move.r][move.c] = piece;
    next[r][c] = null;
    return !isInCheck(color, next);
  });
}

function squareToUci(r, c) {
  return `${String.fromCharCode(97 + c)}${9 - r}`;
}

function coordsToUci(fromR, fromC, toR, toC) {
  return `${squareToUci(fromR, fromC)}${squareToUci(toR, toC)}`;
}

function uciToMove(uci) {
  if (!uci || uci.length < 4) return null;
  const fromC = uci.charCodeAt(0) - 97;
  const fromR = 9 - Number(uci[1]);
  const toC = uci.charCodeAt(2) - 97;
  const toR = 9 - Number(uci[3]);
  return { fromR, fromC, toR, toC };
}

function moveLabel(record) {
  return `${record.side === "red" ? "Red" : "Black"} ${pieceNames[record.piece]} ${squareToUci(record.fromR, record.fromC)}-${squareToUci(record.toR, record.toC)}`;
}

function moveLabelFromBoard(uci, sourceBoard, side) {
  const move = uciToMove(uci);
  if (!move) return null;
  const piece = sourceBoard[move.fromR]?.[move.fromC];
  if (!piece) return uci;
  return `${side === "red" ? "Red" : "Black"} ${pieceNames[piece]} ${squareToUci(move.fromR, move.fromC)}-${squareToUci(move.toR, move.toC)}`;
}

function recordToUci(record) {
  return coordsToUci(record.fromR, record.fromC, record.toR, record.toC);
}

function pgnEscape(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function pgnDate() {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
}

function pgnResultToken() {
  const result = gameResult || (online?.status === "finished" ? { winner: online.winner, reason: online.winReason } : null);
  if (!result) return "*";
  if (result.winner === "draw") return "1/2-1/2";
  if (result.winner === "red") return "1-0";
  if (result.winner === "black") return "0-1";
  return "*";
}

function pgnPlayerName(color) {
  if (online?.players?.length) {
    const player = online.players.find(p => p.color === color);
    if (player?.nickname) return player.nickname;
  }
  if (modeSelect.value === "ai" || modeSelect.value === "trainer") {
    return color === playerSide.value ? (currentProfile.user?.username || "User") : "Pikafish";
  }
  return color === "red" ? "Red" : "Black";
}

function buildPgn() {
  const result = pgnResultToken();
  const eventName = online?.ranked
    ? "Rank Match"
    : modeSelect.value === "online"
      ? "Online Match"
      : modeSelect.value === "trainer"
        ? "Trainer Session"
        : "Xiangqi Game";
  const headers = [
    ["Event", eventName],
    ["Site", "Pikafish Xiangqi"],
    ["Date", pgnDate()],
    ["Red", pgnPlayerName("red")],
    ["Black", pgnPlayerName("black")],
    ["Result", result],
    ["FEN", START_FEN],
  ];
  if (gameResult?.reason || online?.winReason) headers.push(["Termination", gameResult?.reason || online.winReason]);

  const lines = headers.map(([key, value]) => `[${key} "${pgnEscape(value)}"]`);
  const tokens = [];
  for (let i = 0; i < history.length; i += 2) {
    const red = history[i];
    const black = history[i + 1];
    const moveNo = Math.floor(i / 2) + 1;
    let token = `${moveNo}.`;
    if (red) token += ` ${recordToUci(red)}`;
    if (black) token += ` ${recordToUci(black)}`;
    tokens.push(token);
  }
  tokens.push(result);
  return `${lines.join("\n")}\n\n${tokens.join(" ")}\n`;
}

function downloadPgn() {
  if (history.length === 0) return;
  const blob = new Blob([buildPgn()], { type: "application/x-chess-pgn;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `xiangqi-${stamp}.pgn`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function shouldFlipBoard() {
  if (modeSelect.value === "online" && online && online.myColor === "black") return true;
  if (modeSelect.value === "ai" && playerSide.value === "black") return true;
  if (modeSelect.value === "trainer" && playerSide.value === "black") return true;
  return false;
}

function renderBoard() {
  const flipped = shouldFlipBoard();
  boardEl.classList.toggle("flipped", flipped);
  boardEl.parentElement?.classList.toggle("flipped", flipped);
  boardEl.innerHTML = `
    <svg class="board-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect class="river-band" x="5" y="45" width="90" height="10"></rect>
      <path class="grid-line" d="
        M5 5 H95 M5 15 H95 M5 25 H95 M5 35 H95 M5 45 H95
        M5 55 H95 M5 65 H95 M5 75 H95 M5 85 H95 M5 95 H95
        M5 5 V95 M95 5 V95
        M16.25 5 V45 M16.25 55 V95
        M27.5 5 V45 M27.5 55 V95
        M38.75 5 V45 M38.75 55 V95
        M50 5 V45 M50 55 V95
        M61.25 5 V45 M61.25 55 V95
        M72.5 5 V45 M72.5 55 V95
        M83.75 5 V45 M83.75 55 V95
        M38.75 5 L61.25 25 M61.25 5 L38.75 25
        M38.75 75 L61.25 95 M61.25 75 L38.75 95
      "></path>
    </svg>
    <div class="river-text left">楚河</div><div class="river-text right">漢界</div>
  `;
  const legalSet = new Set(legalTargets.map(move => `${move.r},${move.c}`));
  const trainerMove = modeSelect.value === "trainer" && trainerState.bestMove
    ? uciToMove(trainerState.bestMove)
    : null;
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const dispR = flipped ? 9 - r : r;
      const dispC = flipped ? 8 - c : c;
      const square = document.createElement("button");
      square.className = "square";
      square.style.left = `${5 + dispC * 11.25}%`;
      square.style.top = `${5 + dispR * 10}%`;
      square.dataset.r = String(r);
      square.dataset.c = String(c);
      if (selected?.r === r && selected?.c === c) square.classList.add("selected");
      if (lastMove && ((lastMove.fromR === r && lastMove.fromC === c) || (lastMove.toR === r && lastMove.toC === c))) square.classList.add("last");
      if (legalSet.has(`${r},${c}`)) square.classList.add(board[r][c] ? "capture" : "hint");
      if (trainerMove && trainerState.hintLevel >= 1 && trainerMove.fromR === r && trainerMove.fromC === c) square.classList.add("trainer-source");
      if (trainerMove && trainerState.hintLevel >= 2 && trainerMove.toR === r && trainerMove.toC === c) square.classList.add("trainer-target");
      const piece = board[r][c];
      if (piece) {
        const pieceEl = document.createElement("span");
        pieceEl.className = `piece ${colorOf(piece)}`;
        const glyphEl = document.createElement("span");
        glyphEl.className = "piece-glyph";
        glyphEl.textContent = PIECES[piece];
        pieceEl.append(glyphEl);
        square.append(pieceEl);
      }
      square.addEventListener("click", () => onSquare(r, c));
      boardEl.append(square);
    }
  }
  if (!turnPill.classList.contains("winner")) {
    turnPill.textContent = `${turn === "red" ? "Red" : "Black"} to move`;
    turnPill.classList.toggle("black", turn === "black");
  }
  fenText.textContent = boardToFen();
}

function renderHistory() {
  moveList.innerHTML = "";
  for (const record of history) {
    const li = document.createElement("li");
    li.textContent = moveLabel(record);
    moveList.append(li);
  }
  moveList.scrollTop = moveList.scrollHeight;
  downloadPgnBtn.hidden = history.length === 0 || modeSelect.value === "pgn";
}

function canHumanMove() {
  if (busy) return false;
  if (modeSelect.value === "pgn") return false;
  if (modeSelect.value === "online") {
    if (!online || online.role !== "player" || online.status !== "playing") return false;
    return online.myColor === turn;
  }
  if (modeSelect.value === "human") return true;
  if (modeSelect.value === "trainer") {
    return playerSide.value === turn && trainerState.status === "ready";
  }
  return playerSide.value === turn;
}

async function onSquare(r, c) {
  if (!canHumanMove()) return;
  const piece = board[r][c];
  if (selected && legalTargets.some(move => move.r === r && move.c === c)) {
    if (modeSelect.value === "trainer") {
      await submitTrainerMove(selected.r, selected.c, r, c);
      return;
    }
    await makeMove(selected.r, selected.c, r, c, "human");
    return;
  }
  if (piece && colorOf(piece) === turn) {
    selected = { r, c };
    legalTargets = legalMoves(r, c);
  } else {
    selected = null;
    legalTargets = [];
  }
  renderBoard();
}

// ----- Game clock (per player: 15 min base + 90 sec/move; first 3 moves: 30 sec) -----

const CLOCK_BASE_MS = 15 * 60 * 1000;
const CLOCK_MOVE_MS = 90 * 1000;
const CLOCK_OPENING_MS = 30 * 1000;
const CLOCK_OPENING_MOVES = 3;

let clock = null; // { red:{baseLeft,moveCount}, black:{...}, activeColor, turnStartMs, intervalId, flagged }

function clockBudget(color) {
  return clock[color].moveCount < CLOCK_OPENING_MOVES ? CLOCK_OPENING_MS : CLOCK_MOVE_MS;
}

function clockSnapshot(color) {
  if (!clock) return { baseLeft: CLOCK_BASE_MS, moveLeft: CLOCK_OPENING_MS };
  const rec = clock[color];
  if (clock.activeColor !== color) {
    return { baseLeft: rec.baseLeft, moveLeft: clockBudget(color) };
  }
  const elapsed = performance.now() - clock.turnStartMs;
  const budget = clockBudget(color);
  const moveLeft = Math.max(0, budget - elapsed);
  const baseLeft = Math.max(0, rec.baseLeft - elapsed);
  return { baseLeft, moveLeft };
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function renderClock() {
  const red = clockSnapshot("red");
  const black = clockSnapshot("black");
  redClockBase.textContent = formatClock(red.baseLeft);
  redClockMove.textContent = `+${formatClock(red.moveLeft)}`;
  blackClockBase.textContent = formatClock(black.baseLeft);
  blackClockMove.textContent = `+${formatClock(black.moveLeft)}`;
  const active = clock?.activeColor;
  clockRowRed.classList.toggle("active", active === "red");
  clockRowBlack.classList.toggle("active", active === "black");
  clockRowRed.classList.toggle("low", red.baseLeft <= 30_000 || red.moveLeft <= 10_000);
  clockRowBlack.classList.toggle("low", black.baseLeft <= 30_000 || black.moveLeft <= 10_000);
  clockRowRed.classList.toggle("flagged", clock?.flagged === "red");
  clockRowBlack.classList.toggle("flagged", clock?.flagged === "black");
}

function tickClock() {
  if (!clock || clock.flagged) return;
  const snap = clockSnapshot(clock.activeColor);
  // Lose on either limit: per-step (90s/30s) OR total game time (15 min).
  if (snap.baseLeft <= 0 || snap.moveLeft <= 0) {
    clockTimeout(clock.activeColor);
    return;
  }
  renderClock();
}

function startClock() {
  stopClock();
  clock = {
    red: { baseLeft: CLOCK_BASE_MS, moveCount: 0 },
    black: { baseLeft: CLOCK_BASE_MS, moveCount: 0 },
    activeColor: turn,
    turnStartMs: performance.now(),
    intervalId: null,
    flagged: null,
  };
  clock.intervalId = setInterval(tickClock, 200);
  renderClock();
}

function stopClock() {
  if (clock?.intervalId) clearInterval(clock.intervalId);
  if (clock) {
    // Commit elapsed time on the current move to base so it stays accurate when paused.
    const elapsed = performance.now() - clock.turnStartMs;
    clock[clock.activeColor].baseLeft = Math.max(0, clock[clock.activeColor].baseLeft - elapsed);
    clock.intervalId = null;
  }
  renderClock();
}

function clearClock() {
  if (clock?.intervalId) clearInterval(clock.intervalId);
  clock = null;
  // Reset display
  redClockBase.textContent = formatClock(CLOCK_BASE_MS);
  blackClockBase.textContent = formatClock(CLOCK_BASE_MS);
  redClockMove.textContent = `+${formatClock(CLOCK_OPENING_MS)}`;
  blackClockMove.textContent = `+${formatClock(CLOCK_OPENING_MS)}`;
  for (const el of [clockRowRed, clockRowBlack]) el.classList.remove("active", "low", "flagged");
}

function clockOnTurnChanged() {
  if (!clock || clock.flagged) return;
  const prev = clock.activeColor;
  const elapsed = performance.now() - clock.turnStartMs;
  // All time spent on the move is deducted from the total game time.
  clock[prev].baseLeft = Math.max(0, clock[prev].baseLeft - elapsed);
  clock[prev].moveCount += 1;
  clock.activeColor = turn;
  clock.turnStartMs = performance.now();
  renderClock();
}

function clockTimeout(loser) {
  if (!clock) return;
  clock.flagged = loser;
  if (clock.intervalId) { clearInterval(clock.intervalId); clock.intervalId = null; }
  renderClock();
  const winner = loser === "red" ? "black" : "red";
  if (modeSelect.value === "online" && online && online.role === "player" && online.status === "playing") {
    onlineDeclareGameOver(winner, "timeout").catch(() => null);
  } else {
    gameResult = { winner, reason: "timeout" };
    busy = true;
    statusText.textContent = `${loser === "red" ? "Red" : "Black"} flagged. ${winner === "red" ? "Red" : "Black"} wins on time.`;
  }
}

function applyMove(fromR, fromC, toR, toC, source) {
  const piece = board[fromR][fromC];
  const captured = board[toR][toC];
  history.push({ fromR, fromC, toR, toC, piece, captured, side: turn, source, beforeEval: currentEval });
  board[toR][toC] = piece;
  board[fromR][fromC] = null;
  lastMove = { fromR, fromC, toR, toC };
  turn = turn === "red" ? "black" : "red";
  selected = null;
  legalTargets = [];
  clockOnTurnChanged();
}

async function makeMove(fromR, fromC, toR, toC, source = "human") {
  const beforeFen = boardToFen();
  const beforeBoard = cloneBoard();
  const mover = turn;
  const isOnline = modeSelect.value === "online";
  // In local modes, only the player's own moves get analysis (engine moves are skipped).
  // In online mode, analyze every applied move so both sides see Pikafish's pick.
  const wantsRecommendation = source === "human" || source === "remote";
  // Use the prefetched analysis if it covers this position; otherwise fall back to a live fetch.
  const cachedRec = wantsRecommendation ? consumePreMoveAnalysis(beforeFen) : null;
  const liveRec = wantsRecommendation && !cachedRec
    ? enginePost("/api/topmoves", { fen: beforeFen, count: 5 }).catch(() => null)
    : Promise.resolve(null);
  const playedUci = `${squareToUci(fromR, fromC)}${squareToUci(toR, toC)}`;
  applyMove(fromR, fromC, toR, toC, source);
  renderBoard();
  renderHistory();

  // Online: send the move to the server (only when this client originated it).
  if (isOnline && online && source !== "remote" && online.role === "player") {
    onlineSendMove(playedUci, boardToFen()).catch(err => {
      onlineMatchStatus.textContent = `Move not sent: ${err.message}`;
    });
  }

  // Detect game end IMMEDIATELY (before waiting on the engine) so the result is shown without delay.
  const ending = modeSelect.value !== "pgn" ? detectGameEnd() : null;
  if (ending) {
    if (isOnline && online && online.role === "player" && online.status === "playing") {
      onlineDeclareGameOver(ending.winner, ending.reason).catch(() => null);
    }
    announceLocalEnd(ending);
  }

  // Display recommendations IMMEDIATELY when we have a cached prefetch hit.
  if (cachedRec && wantsRecommendation) {
    showRecommendations(cachedRec, beforeBoard, mover, playedUci);
  }

  // Wait for engine eval / live recommendation (still useful for analysis even after game ended).
  const [result, best] = await Promise.all([evaluatePosition(), liveRec]);
  if (cachedRec && wantsRecommendation) {
    showRecommendations(cachedRec, beforeBoard, mover, playedUci, result.score);
  }
  if (!cachedRec && best && wantsRecommendation) {
    const moves = best.moves?.length ? best.moves : (best.bestMove ? [{ rank: 1, move: best.bestMove, score: best.score, mate: best.mate }] : []);
    showRecommendations(moves, beforeBoard, mover, playedUci, result.score);
  }

  if (ending) {
    // Re-apply the announcement in case evaluatePosition overwrote statusText.
    announceLocalEnd(ending);
    return;
  }

  // Kick off precompute for the new position so it's ready before the next move lands.
  triggerPreMoveAnalysis();

  if (!isOnline) await maybeAiMove();
}

function announceLocalEnd(ending) {
  gameResult = ending;
  busy = true;
  stopClock();
  const winnerName = ending.winner === "red" ? "Red" : "Black";
  const message = `${winnerName} wins by ${ending.reason}!`;
  statusText.textContent = message;
  turnPill.textContent = message;
  turnPill.classList.add("winner");
  turnPill.classList.toggle("black", ending.winner === "black");
}

function moverScore(score, mover) {
  if (score == null || Number.isNaN(Number(score))) return null;
  return mover === "red" ? Number(score) : -Number(score);
}

function cpLossText(lossCp) {
  if (lossCp == null) return "";
  return (lossCp / 100).toFixed(2);
}

function gradePlayedMove(moves, mover, playedUci, playedScore = null) {
  const candidates = moves.filter(m => m.move);
  const best = candidates[0] || null;
  const playedIndex = candidates.findIndex(m => m.move === playedUci);
  const playedLine = playedIndex >= 0 ? candidates[playedIndex] : null;
  if (!best?.move) return { quality: "unknown", rank: playedIndex + 1, lossCp: null };
  if (playedUci === best.move) return { quality: "best", rank: 1, lossCp: 0 };

  const bestScore = best.mate == null ? moverScore(best.score, mover) : null;
  const lineScore = playedLine?.mate == null ? moverScore(playedLine?.score, mover) : null;
  const fallbackScore = moverScore(playedScore, mover);
  const playedMoverScore = lineScore ?? fallbackScore;
  const lossCp = bestScore == null || playedMoverScore == null
    ? null
    : Math.max(0, bestScore - playedMoverScore);

  return {
    quality: lossCp != null && lossCp <= GOOD_MOVE_LOSS_CP ? "good" : "miss",
    rank: playedIndex + 1,
    lossCp,
  };
}

function moveQualityText(grade) {
  if (grade.quality === "best") return "Best move.";
  if (grade.quality === "good") return `Good move: lost ${cpLossText(grade.lossCp)}.`;
  if (grade.lossCp != null) return `Needs work: lost ${cpLossText(grade.lossCp)}.`;
  return "";
}

function showRecommendations(moves, beforeBoard, mover, playedUci, playedScore = null) {
  const quality = moveQualityText(gradePlayedMove(moves, mover, playedUci, playedScore));
  const recLines = moves
    .filter(m => m.move)
    .slice(0, 3)
    .map((m, i) => {
      const label = moveLabelFromBoard(m.move, beforeBoard, mover) || m.move;
      const scoreText = formatRecommendationScore(m, mover);
      const matched = m.move === playedUci ? " ✓" : "";
      return `${i + 1}. ${label} (${scoreText})${matched}`;
    });
  const recommendations = recLines.length ? `Recommendations:\n${recLines.join("\n")}` : "";
  lastUserRecommendationText = [quality, recommendations].filter(Boolean).join("\n\n");
  moveScore.textContent = lastUserRecommendationText;
}

// ----- Pre-move analysis cache (live play) -----
// The engine analyzes the current FEN as soon as we land on it, so by the time
// the player commits a move, the recommendations for that position are ready.
const preMoveAnalysisCache = new Map(); // fen -> { status: "pending"|"done"|"error", moves, error }
let preMoveActiveFen = null;

function triggerPreMoveAnalysis() {
  if (modeSelect.value === "pgn" || modeSelect.value === "trainer") return;        // PGN/trainer modes have their own analysis flow
  const fen = boardToFen();
  preMoveActiveFen = fen;
  if (preMoveAnalysisCache.has(fen)) return;
  const entry: any = { status: "pending", moves: [] };
  preMoveAnalysisCache.set(fen, entry);
  enginePost("/api/topmoves", { fen, count: 5 })
    .then(result => {
      const moves = result?.moves?.length ? result.moves : (result?.bestMove ? [{ rank: 1, move: result.bestMove, score: result.score, mate: result.mate }] : []);
      entry.status = "done";
      entry.moves = moves;
    })
    .catch(err => {
      entry.status = "error";
      entry.error = err.message;
    });
}

function consumePreMoveAnalysis(fen) {
  const entry = preMoveAnalysisCache.get(fen);
  if (!entry || entry.status !== "done") return null;
  return entry.moves;
}

function formatScore(score) {
  if (score == null) return "...";
  return `${score >= 0 ? "+" : ""}${(score / 100).toFixed(2)}`;
}

function formatSwing(score) {
  if (score == null || Number.isNaN(score)) return "...";
  return `${score >= 0 ? "+" : ""}${(score / 100).toFixed(2)}`;
}

function formatRecommendationScore(move, mover) {
  if (move.mate != null) {
    const moverMate = mover === "red" ? move.mate : -move.mate;
    return `M${moverMate}`;
  }
  if (move.score == null) return "?";
  const moverScore = mover === "red" ? move.score : -move.score;
  return `${moverScore >= 0 ? "+" : ""}${(moverScore / 100).toFixed(2)}`;
}

function updateScore(score) {
  currentEval = score ?? currentEval;
  evalText.textContent = formatScore(score);
  const clamped = Math.max(-600, Math.min(600, score ?? 0));
  const redWidth = 50 + (clamped / 600) * 50;
  const blackWidth = 100 - redWidth;
  redBar.style.width = `${redWidth}%`;
  blackBar.style.width = `${blackWidth}%`;
}

// In Electron, engine work is done in the main process via IPC. In a plain browser
// (no preload), engine calls fail — the user is expected to run the Electron client
// for any Pikafish-backed analysis.
async function enginePost(path, data) {
  const api = window.api?.engine;
  if (api) {
    if (path === "/api/evaluate") return api.evaluate(data);
    if (path === "/api/bestmove") return api.bestmove(data);
    if (path === "/api/topmoves") return api.topmoves(data);
    throw new Error(`Unknown engine path: ${path}`);
  }
  throw new Error("Engine is only available in the Electron client.");
}

async function evaluatePosition() {
  const requestId = ++evalRequest;
  statusText.textContent = "Pikafish is analyzing...";
  try {
    const result = await enginePost("/api/evaluate", { fen: boardToFen(), depth: Number(depthInput.value) });
    if (requestId === evalRequest) {
      updateScore(result.score);
      pvLine.textContent = result.pv?.length ? `PV ${result.pv.join(" ")}` : "";
      statusText.textContent = "Pikafish ready";
    }
    return result;
  } catch (error) {
    statusText.textContent = error.message;
    pvLine.textContent = "";
    return { score: currentEval };
  }
}

async function maybeAiMove() {
  if (modeSelect.value === "online" || modeSelect.value === "pgn") return;
  if (modeSelect.value !== "ai" || playerSide.value === turn) return;
  busy = true;
  statusText.textContent = "Pikafish is choosing a move...";
  try {
    const result = await enginePost("/api/bestmove", { fen: boardToFen(), depth: Number(depthInput.value) + 1 });
    const move = uciToMove(result.bestMove);
    if (move && board[move.fromR]?.[move.fromC]) {
      await makeMove(move.fromR, move.fromC, move.toR, move.toC, "engine");
    } else {
      statusText.textContent = "Pikafish returned no legal move.";
    }
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    busy = false;
    renderBoard();
  }
}

function resetTrainerState({ keepStats = false } = {}) {
  const requestId = trainerState.requestId + 1;
  trainerState = {
    requestId,
    fen: "",
    side: "red",
    status: "idle",
    moves: [],
    bestMove: null,
    solved: keepStats ? trainerState.solved : 0,
    attempts: keepStats ? trainerState.attempts : 0,
    streak: keepStats ? trainerState.streak : 0,
    message: "",
    hintLevel: 0,
    revealed: false,
  };
}

function isLegalParsedMove(move) {
  if (!move || !inBounds(move.fromR, move.fromC) || !inBounds(move.toR, move.toC)) return false;
  const piece = board[move.fromR]?.[move.fromC];
  if (!piece || colorOf(piece) !== turn) return false;
  return legalMoves(move.fromR, move.fromC).some(target => target.r === move.toR && target.c === move.toC);
}

function trainerMoveLabel(uci, sourceBoard = board, side = turn) {
  return moveLabelFromBoard(uci, sourceBoard, side) || uci;
}

function trainerTopMoveLines() {
  const lines = trainerState.moves
    .filter(move => move.move)
    .slice(0, 3)
    .map((move, index) => {
      const label = trainerMoveLabel(move.move);
      const score = formatRecommendationScore(move, turn);
      return `${index + 1}. ${label} (${score})`;
    });
  return lines.length ? `Best lines:\n${lines.join("\n")}` : "No best line available.";
}

function trainerPromptText() {
  if (gameResult) {
    if (gameResult.winner === "draw") return `Draw by ${gameResult.reason}.`;
    return `${colorLabel(gameResult.winner)} wins by ${gameResult.reason}.`;
  }
  if (turn !== playerSide.value) return `${colorLabel(turn)} reply is being played.`;
  if (trainerState.status === "loading") return `Preparing ${colorLabel(turn)} position.`;
  if (trainerState.status === "error") return "Trainer is unavailable for this position.";
  return `Find ${colorLabel(turn)}'s best move.`;
}

function trainerLineText() {
  if (trainerState.status === "error") return trainerState.message || "Trainer unavailable.";
  if (trainerState.status === "loading") return "Preparing position.";
  if (turn !== playerSide.value) return `${colorLabel(turn)} is Pikafish's side.`;
  if (trainerState.revealed) return trainerTopMoveLines();
  if (trainerState.hintLevel >= 1 && trainerState.bestMove) {
    const move = uciToMove(trainerState.bestMove);
    const piece = board[move?.fromR]?.[move?.fromC];
    if (move && piece) return `Hint: ${pieceNames[piece]} from ${squareToUci(move.fromR, move.fromC)}.`;
  }
  return trainerState.message || "Position ready.";
}

function renderTrainerPanel() {
  const active = modeSelect.value === "trainer";
  trainerPanel.hidden = !active;
  undoBtn.disabled = active;
  if (!active) return;
  trainerSide.textContent = `${colorLabel(playerSide.value)} trainer`;
  trainerPrompt.textContent = trainerPromptText();
  trainerSolved.textContent = String(trainerState.solved);
  trainerStreak.textContent = String(trainerState.streak);
  trainerAttempts.textContent = String(trainerState.attempts);
  trainerLine.textContent = trainerLineText();
  const canUseMove = !busy && trainerState.status === "ready" && !!trainerState.bestMove && turn === playerSide.value;
  trainerHintBtn.disabled = !canUseMove || trainerState.hintLevel >= 1;
  trainerRevealBtn.disabled = !canUseMove || trainerState.revealed;
  trainerRestartBtn.disabled = busy;
}

async function prepareTrainerChallenge() {
  if (modeSelect.value !== "trainer" || gameResult) return;
  const fen = boardToFen();
  if (turn !== playerSide.value) {
    trainerState = {
      ...trainerState,
      fen,
      side: turn,
      status: "waiting",
      moves: [],
      bestMove: null,
      message: `${colorLabel(turn)} is Pikafish's side.`,
      hintLevel: 0,
      revealed: false,
    };
    renderTrainerPanel();
    renderBoard();
    return;
  }

  const requestId = trainerState.requestId + 1;
  trainerState = {
    ...trainerState,
    requestId,
    fen,
    side: turn,
    status: "loading",
    moves: [],
    bestMove: null,
    message: "Preparing position.",
    hintLevel: 0,
    revealed: false,
  };
  statusText.textContent = "Preparing trainer position...";
  moveScore.textContent = "Trainer is preparing the position.";
  renderTrainerPanel();
  renderBoard();

  try {
    const result = await enginePost("/api/topmoves", { fen, count: 5 });
    if (requestId !== trainerState.requestId || modeSelect.value !== "trainer" || fen !== boardToFen()) return;
    const moves = result?.moves?.length
      ? result.moves
      : (result?.bestMove ? [{ rank: 1, move: result.bestMove, score: result.score, mate: result.mate }] : []);
    const bestMove = moves.find(move => move.move)?.move || result?.bestMove || null;
    trainerState = {
      ...trainerState,
      status: bestMove ? "ready" : "error",
      moves,
      bestMove,
      message: bestMove ? "Position ready." : "No trainer move found.",
    };
    statusText.textContent = bestMove ? "Trainer ready" : "Trainer could not find a move.";
    moveScore.textContent = bestMove ? `Find ${colorLabel(turn)}'s best move.` : "No trainer move available.";
  } catch (error) {
    if (requestId !== trainerState.requestId || modeSelect.value !== "trainer") return;
    trainerState = {
      ...trainerState,
      status: "error",
      moves: [],
      bestMove: null,
      message: error.message,
    };
    statusText.textContent = error.message;
    moveScore.textContent = `Trainer unavailable: ${error.message}`;
  }
  renderTrainerPanel();
  renderBoard();
}

async function trainerMaybeOpponentMove() {
  if (modeSelect.value !== "trainer" || gameResult) return;
  if (turn === playerSide.value) {
    await prepareTrainerChallenge();
    return;
  }

  const fen = boardToFen();
  trainerState = {
    ...trainerState,
    fen,
    side: turn,
    status: "waiting",
    moves: [],
    bestMove: null,
    message: `${colorLabel(turn)} is Pikafish's side.`,
    hintLevel: 0,
    revealed: false,
  };
  busy = true;
  statusText.textContent = "Pikafish is choosing a trainer reply...";
  renderTrainerPanel();
  renderBoard();

  let failed = false;
  let ended = false;
  try {
    const result = await enginePost("/api/bestmove", { fen, depth: Number(depthInput.value) + 1 });
    if (modeSelect.value !== "trainer" || fen !== boardToFen()) return;
    const move = uciToMove(result.bestMove);
    if (!isLegalParsedMove(move)) throw new Error("Pikafish returned no legal reply.");
    applyMove(move.fromR, move.fromC, move.toR, move.toC, "engine");
    renderBoard();
    renderHistory();
    const ending = detectGameEnd();
    if (ending) {
      ended = true;
      announceLocalEnd(ending);
      return;
    }
    await evaluatePosition();
  } catch (error) {
    failed = true;
    trainerState = {
      ...trainerState,
      status: "error",
      message: error.message,
    };
    statusText.textContent = error.message;
    moveScore.textContent = `Trainer stopped: ${error.message}`;
  } finally {
    if (!ended) busy = false;
    renderBoard();
    renderTrainerPanel();
  }

  if (!failed && !ended && modeSelect.value === "trainer") await prepareTrainerChallenge();
}

async function startTrainer() {
  resetTrainerState();
  clearClock();
  renderTrainerPanel();
  renderBoard();
  await evaluatePosition();
  await trainerMaybeOpponentMove();
}

async function submitTrainerMove(fromR, fromC, toR, toC) {
  if (modeSelect.value !== "trainer" || busy) return;
  const fen = boardToFen();
  if (trainerState.status !== "ready" || trainerState.fen !== fen || !trainerState.bestMove) {
    trainerState.message = "Position is still preparing.";
    renderTrainerPanel();
    return;
  }

  const playedUci = coordsToUci(fromR, fromC, toR, toC);
  const mover = turn;
  const grade = gradePlayedMove(trainerState.moves, mover, playedUci);
  trainerState.attempts += 1;

  if (grade.quality !== "best" && grade.quality !== "good") {
    trainerState.streak = 0;
    trainerState.hintLevel = 0;
    trainerState.revealed = false;
    if (grade.rank > 1) {
      const candidate = trainerState.moves[grade.rank - 1];
      const loss = grade.lossCp != null ? `, lost ${cpLossText(grade.lossCp)}` : "";
      trainerState.message = `Choice #${grade.rank} (${formatRecommendationScore(candidate, mover)}${loss}). Try to stay within 1.00.`;
    } else if (grade.lossCp != null) {
      trainerState.message = `Lost ${cpLossText(grade.lossCp)}. Try to stay within 1.00.`;
    } else {
      trainerState.message = "Legal, but outside Pikafish's top lines.";
    }
    statusText.textContent = "Try again.";
    moveScore.textContent = trainerState.message;
    renderTrainerPanel();
    return;
  }

  const beforeBoard = cloneBoard();
  const label = trainerMoveLabel(playedUci, beforeBoard, mover);
  trainerState.solved += 1;
  trainerState.streak += 1;
  trainerState.status = "waiting";
  trainerState.moves = [];
  trainerState.bestMove = null;
  trainerState.hintLevel = 0;
  trainerState.revealed = false;
  trainerState.message = grade.quality === "best"
    ? `Best move: ${label}.`
    : `Good move: ${label} (lost ${cpLossText(grade.lossCp)}).`;
  moveScore.textContent = trainerState.message;

  busy = true;
  let ended = false;
  try {
    applyMove(fromR, fromC, toR, toC, "trainer");
    renderBoard();
    renderHistory();
    const ending = detectGameEnd();
    if (ending) {
      ended = true;
      announceLocalEnd(ending);
      return;
    }
    await evaluatePosition();
  } finally {
    if (!ended) busy = false;
    renderBoard();
    renderTrainerPanel();
  }

  if (!ended) await trainerMaybeOpponentMove();
}

function showTrainerHint() {
  if (modeSelect.value !== "trainer" || trainerState.status !== "ready" || !trainerState.bestMove) return;
  trainerState.hintLevel = Math.max(trainerState.hintLevel, 1);
  trainerState.message = trainerLineText();
  renderTrainerPanel();
  renderBoard();
}

function revealTrainerMove() {
  if (modeSelect.value !== "trainer" || trainerState.status !== "ready" || !trainerState.bestMove) return;
  trainerState.hintLevel = 2;
  trainerState.revealed = true;
  trainerState.message = trainerTopMoveLines();
  moveScore.textContent = trainerState.message;
  renderTrainerPanel();
  renderBoard();
}

function resetGameLocal() {
  const parsed = parseFen(START_FEN);
  board = parsed.board;
  turn = parsed.turn;
  selected = null;
  legalTargets = [];
  history = [];
  lastMove = null;
  gameResult = null;
  lastUserRecommendationText = "";
  currentEval = 0;
  busy = false;
  turnPill.classList.remove("winner");
  moveScore.textContent = "Make a move to see Pikafish’s score.";
  pvLine.textContent = "";
  updateScore(0);
  renderBoard();
  renderHistory();
  clearClock();
  // Start the clock for actively-played modes only (not PGN replay, not waiting for an online opponent).
  if (modeSelect.value === "pgn" || modeSelect.value === "trainer") return;
  if (modeSelect.value !== "online" || (online && online.status === "playing")) {
    startClock();
  }
}

function resetGame() {
  if (modeSelect.value === "online") {
    onlineLobbyStatus.textContent = "Use the room controls to start a new online game.";
    return;
  }
  if (modeSelect.value === "trainer") {
    resetGameLocal();
    startTrainer();
    return;
  }
  resetGameLocal();
  evaluatePosition().then(() => maybeAiMove());
  triggerPreMoveAnalysis();
}

function undo() {
  if (modeSelect.value === "online") {
    onlineMatchStatus.textContent = "Undo isn't available in online play.";
    return;
  }
  if (modeSelect.value === "trainer") {
    trainerState.message = "Undo is disabled during scored training.";
    renderTrainerPanel();
    return;
  }
  if (busy || history.length === 0) return;
  const steps = modeSelect.value === "ai" && history.length >= 2 ? 2 : 1;
  for (let i = 0; i < steps; i += 1) {
    const record = history.pop();
    if (!record) break;
    board[record.fromR][record.fromC] = record.piece;
    board[record.toR][record.toC] = record.captured;
    turn = record.side;
  }
  lastMove = history.at(-1) || null;
  gameResult = null;
  selected = null;
  legalTargets = [];
  renderBoard();
  renderHistory();
  evaluatePosition();
}

// Resolve the match-relay base URL (used only for online play). Engine calls go via IPC.
let cachedServerUrl = null;
async function getServerUrl() {
  if (cachedServerUrl !== null) return cachedServerUrl;
  if (window.api?.serverUrl) {
    try { cachedServerUrl = await window.api.serverUrl(); }
    catch { cachedServerUrl = ""; }
  } else {
    cachedServerUrl = ""; // browser fallback: relative URLs
  }
  return cachedServerUrl;
}

async function loadStatus() {
  // Engine status comes from the Electron main process; if we're not in Electron, say so.
  const api = window.api?.engine;
  if (!api) {
    statusText.textContent = "Open in the Electron app for Pikafish analysis.";
    return;
  }
  try {
    const status = await api.status();
    statusText.textContent = status.engine && status.nnue ? "Pikafish ready" : "Pikafish or NNUE file missing";
  } catch (e) {
    statusText.textContent = `Engine unavailable: ${e.message}`;
  }
}

// ----- Online multiplayer client -----

function hasAnyLegalMove() {
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (colorOf(board[r][c]) === turn && legalMoves(r, c).length > 0) return true;
    }
  }
  return false;
}

function detectGameEnd() {
  if (hasAnyLegalMove()) return null;
  const winner = turn === "red" ? "black" : "red";
  const reason = isInCheck(turn) ? "checkmate" : "stalemate";
  return { winner, reason };
}

function applyRemoteMove(uci) {
  const parsed = uciToMove(uci);
  if (!parsed) return;
  const { fromR, fromC, toR, toC } = parsed;
  const piece = board[fromR]?.[fromC];
  if (!piece) {
    onlineMatchStatus.textContent = "Got an out-of-sync move from opponent. Reload to resync.";
    return;
  }
  // Reuse makeMove with source "remote" so we don't re-broadcast.
  makeMove(fromR, fromC, toR, toC, "remote");
}

function onlineSavedNickname() {
  try { return localStorage.getItem("xiangqi.nickname") || currentProfile.user?.username || ""; } catch { return currentProfile.user?.username || ""; }
}

function onlineSaveNickname(value) {
  try { localStorage.setItem("xiangqi.nickname", value); } catch { /* ignore */ }
}

function setOnlineMode(active) {
  if (active) onlineNickname.value ||= onlineSavedNickname();
}

function openMatchOverlay() {
  onlineOverlay.hidden = false;
  if (online && online.role === "player") return;
  onlineNickname.value ||= onlineSavedNickname();
  setTimeout(() => onlineNickname.focus(), 30);
}

function closeMatchOverlay() {
  onlineOverlay.hidden = true;
}

async function postJson(path, data) {
  const base = await getServerUrl();
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || `Request failed (${response.status})`);
  return json;
}

async function loginOnServer(username, password) {
  const result = await postJson("/api/auth/login", { username, password });
  saveProfile(result);
  return result.user;
}

async function signupOnServer(username, password) {
  const result = await postJson("/api/auth/signup", { username, password });
  saveProfile(result);
  return result.user;
}

async function submitAuth(mode) {
  loginStatus.textContent = mode === "signup" ? "Creating account..." : "Logging in...";
  const user = mode === "signup"
    ? await signupOnServer(loginName.value, loginPassword.value)
    : await loginOnServer(loginName.value, loginPassword.value);
  onlineNickname.value = user.username;
  loginStatus.textContent = levelLabel(user.level, user.points);
  closeLoginOverlay();
}

async function refreshProfile() {
  if (!currentProfile.token) return null;
  try {
    const result = await postJson("/api/auth/me", { token: currentProfile.token });
    saveProfile({ token: currentProfile.token, user: result.user });
    return result.user;
  } catch {
    saveProfile({ token: "", user: null });
    return null;
  }
}

function requireLoginForMatch() {
  if (currentProfile.token && currentProfile.user) return true;
  onlineLobbyStatus.textContent = "Login before playing online.";
  openLoginOverlay();
  return false;
}

async function onlineCreate() {
  if (!requireLoginForMatch()) return;
  onlineLobbyStatus.textContent = "Creating room…";
  try {
    const result = await postJson("/api/match/create", { token: currentProfile.token, color: "red" });
    enterRoom(result);
  } catch (e) {
    onlineLobbyStatus.textContent = e.message;
  }
}

async function onlineJoin(role = "player") {
  if (!requireLoginForMatch()) return;
  const code = onlineJoinCode.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,6}$/.test(code)) {
    onlineLobbyStatus.textContent = "Enter a valid room code.";
    return;
  }
  onlineLobbyStatus.textContent = role === "spectator" ? "Joining as spectator…" : "Joining room…";
  try {
    const result = await postJson("/api/match/join", { token: currentProfile.token, code, role });
    enterRoom(result);
  } catch (e) {
    onlineLobbyStatus.textContent = e.message;
  }
}

async function onlineQueue() {
  if (!requireLoginForMatch()) return;
  onlineLobbyStatus.textContent = "Searching for an opponent…";
  try {
    const result = await postJson("/api/match/queue", { token: currentProfile.token });
    enterRoom(result);
    if (!result.matched) onlineLobbyStatus.textContent = `Waiting for an opponent. Share code ${result.code} to invite a friend.`;
  } catch (e) {
    onlineLobbyStatus.textContent = e.message;
  }
}

async function onlineRankedQueue() {
  if (!requireLoginForMatch()) return;
  onlineLobbyStatus.textContent = `Searching near ${currentProfile.user?.level || "1-1"}…`;
  try {
    const result = await postJson("/api/match/ranked-queue", { token: currentProfile.token });
    enterRoom(result);
    if (!result.matched) onlineLobbyStatus.textContent = `Waiting for a ranked opponent near your level. Room ${result.code}.`;
  } catch (e) {
    onlineLobbyStatus.textContent = e.message;
  }
}

function enterRoom(info) {
  // Successfully in a room — switch to online mode now (Match button alone doesn't change mode).
  if (modeSelect.value !== "online") modeSelect.value = "online";
  setOnlineMode(true);
  online = {
    code: info.code,
    playerId: info.playerId,
    role: info.role,
    myColor: info.color || null,
    status: info.match?.state?.status || "waiting",
    winner: info.match?.state?.winner || null,
    winReason: info.match?.state?.winReason || null,
    players: info.match?.players || [],
    spectators: info.match?.spectators || [],
    eventSource: null,
    rematchVotes: info.match?.rematchVotes || [],
    ranked: !!info.match?.ranked,
  };
  resetGameLocal();
  if (info.match?.state?.fen) loadFen(info.match.state.fen);
  onlineLobby.hidden = true;
  onlineMatchEl.hidden = false;
  onlineRoomCode.textContent = info.code;
  onlineLobbyStatus.textContent = "";
  renderOnlineMatch();
  openEventStream();
  // If the game is already underway (joined a live room), close the overlay so the board is visible.
  if (online.status === "playing") closeMatchOverlay();
}

function loadFen(fen) {
  const parsed = parseFen(fen);
  board = parsed.board;
  turn = parsed.turn;
  selected = null;
  legalTargets = [];
  history = [];
  lastMove = null;
  renderBoard();
  renderHistory();
  evaluatePosition();
}

async function openEventStream() {
  if (!online) return;
  if (online.eventSource) online.eventSource.close();
  const base = await getServerUrl();
  const url = `${base}/api/match/${encodeURIComponent(online.code)}/events?id=${encodeURIComponent(online.playerId)}`;
  const es = new EventSource(url);
  online.eventSource = es;
  es.addEventListener("welcome", e => onlineHandleWelcome(JSON.parse(e.data)));
  es.addEventListener("state", e => onlineHandleState(JSON.parse(e.data)));
  es.addEventListener("presence", e => onlineHandleState(JSON.parse(e.data)));
  es.addEventListener("joined", () => onlineHandleJoined());
  es.addEventListener("left", () => onlineHandleLeft());
  es.addEventListener("move", e => onlineHandleMove(JSON.parse(e.data)));
  es.addEventListener("rematch_voted", e => onlineHandleRematchVote(JSON.parse(e.data)));
  es.addEventListener("rematch_started", e => onlineHandleRematchStarted(JSON.parse(e.data)));
  es.addEventListener("gameover", e => onlineHandleGameOver(JSON.parse(e.data)));
  es.onerror = () => {
    onlineMatchStatus.textContent = "Connection issue — trying to reconnect…";
  };
}

function onlineHandleWelcome(data) {
  if (!online) return;
  online.role = data.you.role;
  online.myColor = data.you.color;
  applyMatchSnapshot(data.match);
}

function onlineHandleState(match) {
  if (!online) return;
  applyMatchSnapshot(match);
}

function applyMatchSnapshot(match) {
  if (!match) return;
  const wasPlaying = online.status === "playing";
  online.players = match.players;
  online.spectators = match.spectators;
  online.status = match.state.status;
  online.winner = match.state.winner;
  online.winReason = match.state.winReason;
  online.ranked = !!match.ranked;
  online.rematchVotes = match.rematchVotes || [];
  const me = match.players.find(p => p.id === online.playerId) || match.spectators.find(s => s.id === online.playerId);
  if (me) {
    online.role = match.players.includes(me) ? "player" : "spectator";
    online.myColor = me.color || null;
    if (me.userId && me.userId === currentProfile.user?.id && me.level) {
      saveProfile({ token: currentProfile.token, user: { ...currentProfile.user, level: me.level, points: me.points } });
    }
  }
  // Sync FEN if our move count is behind.
  if (match.state.moves && match.state.moves.length > history.length) {
    loadFen(match.state.fen);
  }
  // Auto-close the match overlay when the game starts.
  if (!wasPlaying && online.status === "playing") {
    closeMatchOverlay();
    startClock();
    triggerPreMoveAnalysis();
  }
  if (online.status === "finished") stopClock();
  renderOnlineMatch();
}

function onlineHandleJoined() {
  // Player/spectator presence is reflected in renderOnlineMatch via the snapshot.
}

function onlineHandleLeft() {
  // Player/spectator presence is reflected in renderOnlineMatch via the snapshot.
}

function onlineHandleMove(data) {
  if (!online) return;
  if (data.by === online.myColor) return; // it was our move; already applied locally
  applyRemoteMove(data.uci);
}

function onlineHandleRematchVote(data) {
  // The vote count appears on the Rematch button; nothing to do here.
  void data;
}

function onlineHandleRematchStarted(match) {
  // Update myColor first so renderBoard's flip uses the new color.
  const me = match.players.find(p => p.id === online.playerId);
  if (me) online.myColor = me.color;
  // Reset board + turn (calls renderBoard with the now-correct flip).
  loadFen(match.state.fen);
  // Apply snapshot (transitions status → playing, starts clock with turn=red).
  applyMatchSnapshot(match);
  renderOnlineMatch();
}

function onlineHandleGameOver(data) {
  if (!online) return;
  online.status = "finished";
  online.winner = data.winner;
  online.winReason = data.reason;
  gameResult = { winner: data.winner, reason: data.reason };
  if (Array.isArray(data.ratings)) {
    const mine = data.ratings.find(user => user.id === currentProfile.user?.id);
    if (mine) saveProfile({ token: currentProfile.token, user: mine });
  }
  stopClock();
  renderOnlineMatch();
}

function describeOutcome(winner, reason) {
  if (winner === "draw") return `draw (${reason})`;
  const color = winner === "red" ? "Red" : "Black";
  return `${color} wins by ${reason}`;
}

async function onlineSendMove(uci, fen) {
  if (!online) return;
  await postJson(`/api/match/${encodeURIComponent(online.code)}/move`, { playerId: online.playerId, uci, fen });
}

async function onlineDeclareGameOver(winner, reason) {
  if (!online) return;
  online.status = "finished";
  online.winner = winner;
  online.winReason = reason;
  gameResult = { winner, reason };
  renderOnlineMatch();
  await postJson(`/api/match/${encodeURIComponent(online.code)}/gameover`, { playerId: online.playerId, winner, reason });
}

async function onlineResign() {
  if (!online || online.role !== "player" || online.status !== "playing") return;
  if (!confirm("Resign the game?")) return;
  try {
    await postJson(`/api/match/${encodeURIComponent(online.code)}/resign`, { playerId: online.playerId });
  } catch (e) {
    onlineMatchStatus.textContent = e.message;
  }
}

async function onlineRematch() {
  if (!online || online.role !== "player" || online.status !== "finished") return;
  try {
    await postJson(`/api/match/${encodeURIComponent(online.code)}/rematch`, { playerId: online.playerId });
    onlineMatchStatus.textContent = "Rematch requested. Waiting for opponent…";
  } catch (e) {
    onlineMatchStatus.textContent = e.message;
  }
}

async function onlineLeave() {
  if (!online) return;
  const code = online.code;
  const playerId = online.playerId;
  if (online.eventSource) online.eventSource.close();
  online = null;
  onlineMatchEl.hidden = true;
  onlineLobby.hidden = false;
  onlineLobbyStatus.textContent = "";
  resetGameLocal();
  evaluatePosition();
  try {
    await postJson(`/api/match/${encodeURIComponent(code)}/leave`, { playerId });
  } catch { /* ignore */ }
}

function renderOnlineMatch() {
  if (!online) return;
  const red = online.players.find(p => p.color === "red");
  const black = online.players.find(p => p.color === "black");
  setPlayerSlot(onlinePlayerRed, red, "red");
  setPlayerSlot(onlinePlayerBlack, black, "black");

  if (online.spectators.length) {
    onlineSpectators.textContent = `Spectators: ${online.spectators.map(s => s.nickname).join(", ")}`;
  } else {
    onlineSpectators.textContent = "";
  }

  let status = "";
  if (online.status === "waiting") status = `Waiting for an opponent… share code ${online.code}.`;
  else if (online.status === "playing") {
    if (online.role === "spectator") status = `${turn === "red" ? "Red" : "Black"} to move.`;
    else if (online.myColor === turn) status = "Your turn.";
    else status = "Opponent's turn.";
  } else if (online.status === "finished") {
    status = describeOutcome(online.winner, online.winReason || "");
  }
  if (online.ranked && status) status = `Rank match · ${status}`;
  onlineMatchStatus.textContent = status;

  const isPlayer = online.role === "player";
  onlineResignBtn.hidden = !(isPlayer && online.status === "playing");
  onlineRematchBtn.hidden = !(isPlayer && online.status === "finished");
  if (online.rematchVotes?.length) {
    onlineRematchBtn.textContent = `Rematch (${online.rematchVotes.length}/${online.players.length})`;
  } else {
    onlineRematchBtn.textContent = "Rematch";
  }
}

function setPlayerSlot(el, player, color) {
  const nameEl = el.querySelector(".online-name");
  el.classList.toggle("you", !!(player && online && player.id === online.playerId));
  el.classList.toggle("turn", online?.status === "playing" && turn === color);
  if (player) {
    const level = player.level ? ` · ${player.level}` : "";
    nameEl.textContent = `${player.nickname}${level}${player.online === false ? " (offline)" : ""}`;
    nameEl.removeAttribute("data-empty");
  } else {
    nameEl.textContent = "Waiting…";
    nameEl.setAttribute("data-empty", "");
  }
}

// Wire online controls
overlayCloseBtn.addEventListener("click", closeMatchOverlay);
onlineOverlay.addEventListener("click", e => {
  if (e.target === onlineOverlay) closeMatchOverlay();
});
window.addEventListener("keydown", e => {
  if (e.key === "Escape" && !onlineOverlay.hidden) closeMatchOverlay();
});
onlineCreateBtn.addEventListener("click", onlineCreate);
onlineQueueBtn.addEventListener("click", onlineQueue);
onlineRankedQueueBtn.addEventListener("click", onlineRankedQueue);
onlineJoinBtn.addEventListener("click", () => onlineJoin("player"));
onlineSpectateBtn.addEventListener("click", () => onlineJoin("spectator"));
onlineLeaveBtn.addEventListener("click", onlineLeave);
onlineRematchBtn.addEventListener("click", onlineRematch);
onlineResignBtn.addEventListener("click", onlineResign);
onlineCopyCode.addEventListener("click", async () => {
  if (!online) return;
  try {
    await navigator.clipboard.writeText(online.code);
    onlineMatchStatus.textContent = "Room code copied.";
  } catch { /* ignore */ }
});
window.addEventListener("beforeunload", () => {
  if (online) {
    const base = cachedServerUrl ?? "";
    navigator.sendBeacon?.(
      `${base}/api/match/${encodeURIComponent(online.code)}/leave`,
      new Blob([JSON.stringify({ playerId: online.playerId })], { type: "application/json" })
    );
  }
});

loginBtn.addEventListener("click", () => {
  if (currentProfile.user) logout();
  else openLoginOverlay();
});
startupLoginBtn.addEventListener("click", openLoginOverlay);
startupSignupBtn.addEventListener("click", () => openLoginOverlay("signup"));
loginCloseBtn.addEventListener("click", closeLoginOverlay);
loginOverlay.addEventListener("click", e => {
  if (e.target === loginOverlay) closeLoginOverlay();
});
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await submitAuth("login");
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});
signupBtn.addEventListener("click", async () => {
  try {
    await submitAuth("signup");
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});

depthInput.addEventListener("input", () => {
  depthLabel.textContent = depthInput.value;
});
modeSelect.addEventListener("change", () => {
  const isOnline = modeSelect.value === "online";
  const isPgn = modeSelect.value === "pgn";
  const isTrainer = modeSelect.value === "trainer";
  setOnlineMode(isOnline);
  // Hide the clock section in study modes.
  qs("#clocks").hidden = isPgn || isTrainer;
  renderTrainerPanel();
  if (isTrainer) clearClock();
  if (!isOnline && online) {
    onlineLeave();
    closeMatchOverlay();
  } else if (isOnline && (!online || online.role !== "player")) {
    openMatchOverlay();
  }
  if (!isOnline && !isTrainer) maybeAiMove();
});
playerSide.addEventListener("change", () => maybeAiMove());
newGameBtn.addEventListener("click", resetGame);
undoBtn.addEventListener("click", undo);
downloadPgnBtn.addEventListener("click", downloadPgn);
trainerHintBtn.addEventListener("click", showTrainerHint);
trainerRevealBtn.addEventListener("click", revealTrainerMove);
trainerRestartBtn.addEventListener("click", resetGame);

fenCopyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(fenText.textContent || "");
    const original = fenCopyBtn.textContent;
    fenCopyBtn.textContent = "copied";
    setTimeout(() => { fenCopyBtn.textContent = original; }, 1200);
  } catch { /* clipboard not available */ }
});
fenText.addEventListener("click", () => {
  // Select all so the user can ctrl+c on browsers without clipboard write permission.
  const range = document.createRange();
  range.selectNodeContents(fenText);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});

const exitBtn = qs("#exitBtn");
exitBtn.addEventListener("click", () => {
  if (online) onlineLeave();
  clearClock();
  closeMatchOverlay();
  closePgnOverlay();
  pgnNav.hidden = true;
  pgnMoves = [];
  pgnIndex = 0;
  pgnAnalysisCache.clear();
  resetTrainerState();
  trainerPanel.hidden = true;
  undoBtn.disabled = false;
  showStartupPicker();
});

// ----- PGN viewer -----

let pgnMoves = []; // [{ uci, raw }]
let pgnIndex = 0;  // 0 = before first move; pgnMoves.length = end of game
let pgnLibrary = null;
let pgnLibraryLoadPromise = null;
let pgnLibrarySearchRequest = 0;

function iccsToUci(raw) {
  const match = String(raw).trim().match(/^([a-iA-I])([0-9])[-x:]?([a-iA-I])([0-9])$/);
  return match ? `${match[1]}${match[2]}${match[3]}${match[4]}`.toLowerCase() : null;
}

function pgnParseText(text) {
  // Strip headers and comments.
  const cleaned = text
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/;[^\n]*/g, " ")
    .replace(/\([^)]*\)/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const moves = [];
  for (const raw of tokens) {
    if (/^\d+\.+$/.test(raw)) continue; // move numbers like "1." or "1..."
    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(raw)) break; // result terminator
    // Strip annotation chars: + # ! ? = and trailing punctuation
    const stripped = raw.replace(/[!?+#]/g, "");
    const uci = iccsToUci(stripped) || stripped.replace(/-/g, "").toLowerCase();
    if (/^[a-i]\d[a-i]\d$/.test(uci)) {
      moves.push({ uci, raw });
    }
  }
  return moves;
}

function pgnLoadText(text, meta = null) {
  const moves = pgnParseText(text);
  if (!moves.length) {
    pgnStatus.textContent = "No moves found. Expected ICCS/UCI moves like C3-C4 or h2e2.";
    return false;
  }
  pgnMoves = moves;
  pgnIndex = 0;
  pgnAnalysisCache.clear();
  pgnStatus.textContent = meta ? `Loaded ${meta.title} (${moves.length} moves).` : `Loaded ${moves.length} move(s).`;
  pgnApplyPosition();
  pgnNav.hidden = false;
  return true;
}

async function loadPgnLibrary() {
  if (pgnLibrary) return pgnLibrary;
  if (!window.api?.pgnLibrary) {
    pgnLibraryPanel.hidden = true;
    return null;
  }
  if (!pgnLibraryLoadPromise) {
    pgnLibraryLoadPromise = window.api.pgnLibrary.index()
      .then(index => {
        pgnLibrary = index;
        for (const opening of index.openings || []) {
          const option = document.createElement("option");
          option.value = opening.name;
          option.textContent = `${opening.category ? `${opening.category} / ` : ""}${opening.name} (${opening.count})`;
          pgnOpeningSelect.append(option);
        }
        pgnLibraryPanel.hidden = false;
        renderPgnLibraryResults();
        return index;
      })
      .catch(error => {
        pgnLibraryCount.textContent = `Could not load library: ${error.message}`;
        return null;
      });
  }
  return pgnLibraryLoadPromise;
}

async function renderPgnLibraryResults() {
  if (!pgnLibrary?.total) {
    pgnLibraryCount.textContent = "No library games found.";
    pgnLibraryResults.replaceChildren();
    return;
  }
  if (!window.api?.pgnLibrary?.search) return;
  const query = pgnSearchInput.value.trim().toLowerCase();
  const opening = pgnOpeningSelect.value;
  const requestId = ++pgnLibrarySearchRequest;
  pgnLibraryCount.textContent = "Searching library...";
  let result;
  try {
    result = await window.api.pgnLibrary.search({ query, opening, limit: 100 });
  } catch (error) {
    if (requestId !== pgnLibrarySearchRequest) return;
    pgnLibraryCount.textContent = `Search failed: ${error.message}`;
    pgnLibraryResults.replaceChildren();
    return;
  }
  if (requestId !== pgnLibrarySearchRequest) return;
  const matched = result.games || [];
  pgnLibraryCount.textContent = `${matched.length} shown from ${Number(result.total || 0).toLocaleString()} matching games`;
  const fragment = document.createDocumentFragment();
  for (const game of matched) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pgn-library-game";
    btn.dataset.id = game.id;
    const title = document.createElement("strong");
    title.textContent = game.title;
    const meta = document.createElement("span");
    meta.textContent = `${game.source} #${game.index} · ${game.opening || "其他类型"} · ${game.event} · ${game.date} · ${game.result}`;
    btn.append(title, meta);
    fragment.append(btn);
  }
  pgnLibraryResults.replaceChildren(fragment);
}

async function openLibraryGame(id) {
  if (!window.api?.pgnLibrary) return;
  pgnStatus.textContent = "Loading selected game...";
  try {
    const { game, text } = await window.api.pgnLibrary.game({ id });
    pgnInput.value = text;
    if (pgnLoadText(text, game)) closePgnOverlay();
  } catch (error) {
    pgnStatus.textContent = `Could not open game: ${error.message}`;
  }
}

// Analysis cache: keyed by the resulting pgnIndex (1-based). cache.get(N) = analysis for move N (i.e. pgnMoves[N-1]).
const pgnAnalysisCache = new Map();

function pgnRenderAnalysis() {
  if (pgnIndex === 0) {
    moveScore.textContent = "Start position — no move to analyze yet.";
    return;
  }
  const entry = pgnAnalysisCache.get(pgnIndex);
  if (!entry || entry.status === "pending") {
    moveScore.textContent = "Analyzing…";
    return;
  }
  if (entry.status === "done") {
    moveScore.textContent = entry.lines.length
      ? `Recommendations:\n${entry.lines.join("\n")}`
      : "No engine analysis available.";
    return;
  }
  moveScore.textContent = `Analysis failed: ${entry.error || "unknown"}`;
}

async function pgnComputeAnalysis(targetIndex, beforeFen, beforeBoard, mover, playedUci) {
  if (pgnAnalysisCache.has(targetIndex)) return;
  const entry: any = { status: "pending", lines: [] };
  pgnAnalysisCache.set(targetIndex, entry);
  try {
    const result = await enginePost("/api/topmoves", { fen: beforeFen, depth: Number(depthInput.value) + 1, count: 5 });
    const moves = result?.moves?.length
      ? result.moves
      : (result?.bestMove ? [{ rank: 1, move: result.bestMove, score: result.score, mate: result.mate }] : []);
    const quality = moveQualityText(gradePlayedMove(moves, mover, playedUci));
    const recLines = moves
      .filter(m => m.move)
      .slice(0, 3)
      .map((m, i) => {
        const label = moveLabelFromBoard(m.move, beforeBoard, mover) || m.move;
        const scoreText = formatRecommendationScore(m, mover);
        const matched = m.move === playedUci ? " ✓" : "";
        return `${i + 1}. ${label} (${scoreText})${matched}`;
      });
    entry.lines = [quality, ...recLines].filter(Boolean);
    entry.status = "done";
  } catch (e) {
    entry.status = "error";
    entry.error = e.message;
  }
  // Re-render only if the user is currently viewing this position.
  if (pgnIndex === targetIndex && modeSelect.value === "pgn") pgnRenderAnalysis();
}

function pgnApplyPosition() {
  const parsed = parseFen(START_FEN);
  board = parsed.board;
  turn = parsed.turn;
  selected = null;
  legalTargets = [];
  history = [];
  lastMove = null;
  // Capture the position right before the move that brought us to pgnIndex.
  let preBoard = null;
  let preFen = null;
  let preMover = null;
  let playedUci = null;
  for (let i = 0; i < pgnIndex; i += 1) {
    const m = uciToMove(pgnMoves[i].uci);
    if (!m) break;
    const piece = board[m.fromR]?.[m.fromC];
    if (!piece) break;
    if (i === pgnIndex - 1) {
      preBoard = cloneBoard();
      preFen = boardToFen();
      preMover = turn;
      playedUci = pgnMoves[i].uci;
    }
    const captured = board[m.toR][m.toC];
    history.push({ fromR: m.fromR, fromC: m.fromC, toR: m.toR, toC: m.toC, piece, captured, side: turn, source: "pgn" });
    board[m.toR][m.toC] = piece;
    board[m.fromR][m.fromC] = null;
    lastMove = { fromR: m.fromR, fromC: m.fromC, toR: m.toR, toC: m.toC };
    turn = turn === "red" ? "black" : "red";
  }
  renderBoard();
  renderHistory();
  pgnUpdateNavUI();
  evaluatePosition();

  // Render whatever analysis we already have for the current position (or "Analyzing…").
  pgnRenderAnalysis();

  // Make sure the current position's analysis is being computed (no-op if already cached).
  if (pgnIndex > 0 && preFen && playedUci) {
    pgnComputeAnalysis(pgnIndex, preFen, preBoard, preMover, playedUci);
  }

  // Prefetch the NEXT move's analysis so when the user advances, it's ready instantly.
  if (pgnIndex < pgnMoves.length) {
    const nextFen = boardToFen();
    const nextBoard = cloneBoard();
    const nextMover = turn;
    const nextUci = pgnMoves[pgnIndex].uci;
    pgnComputeAnalysis(pgnIndex + 1, nextFen, nextBoard, nextMover, nextUci);
  }
}

function pgnUpdateNavUI() {
  pgnPosition.textContent = `Move ${pgnIndex} / ${pgnMoves.length}`;
  if (pgnIndex > 0) {
    const m = pgnMoves[pgnIndex - 1];
    pgnLastMoveEl.textContent = `Last: ${m.raw}`;
  } else {
    pgnLastMoveEl.textContent = "Start position";
  }
  pgnPrevBtn.disabled = pgnIndex <= 0;
  pgnFirstBtn.disabled = pgnIndex <= 0;
  pgnNextBtn.disabled = pgnIndex >= pgnMoves.length;
  pgnLastBtn.disabled = pgnIndex >= pgnMoves.length;
}

function pgnGoto(idx) {
  pgnIndex = Math.max(0, Math.min(pgnMoves.length, idx));
  pgnApplyPosition();
}

function openPgnOverlay() {
  pgnOverlay.hidden = false;
  pgnStatus.textContent = "";
  loadPgnLibrary();
  setTimeout(() => pgnInput.focus(), 30);
}

function closePgnOverlay() {
  pgnOverlay.hidden = true;
}

pgnOverlayClose.addEventListener("click", closePgnOverlay);
pgnOverlay.addEventListener("click", e => {
  if (e.target === pgnOverlay) closePgnOverlay();
});
pgnLoadBtn.addEventListener("click", () => {
  if (pgnLoadText(pgnInput.value)) closePgnOverlay();
});
pgnSearchInput.addEventListener("input", renderPgnLibraryResults);
pgnOpeningSelect.addEventListener("change", renderPgnLibraryResults);
pgnLibraryResults.addEventListener("click", e => {
  const btn = e.target.closest(".pgn-library-game");
  if (btn?.dataset.id) openLibraryGame(btn.dataset.id);
});
pgnFile.addEventListener("change", async () => {
  const file = pgnFile.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    pgnInput.value = text;
    if (pgnLoadText(text)) closePgnOverlay();
  } catch (e) {
    pgnStatus.textContent = `Could not read file: ${e.message}`;
  }
});
pgnFirstBtn.addEventListener("click", () => pgnGoto(0));
pgnPrevBtn.addEventListener("click", () => pgnGoto(pgnIndex - 1));
pgnNextBtn.addEventListener("click", () => pgnGoto(pgnIndex + 1));
pgnLastBtn.addEventListener("click", () => pgnGoto(pgnMoves.length));
pgnImportAgain.addEventListener("click", openPgnOverlay);

window.addEventListener("keydown", e => {
  if (modeSelect.value !== "pgn" || pgnNav.hidden) return;
  const target = e.target as HTMLElement | null;
  if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
  if (e.key === "ArrowLeft") { e.preventDefault(); pgnGoto(pgnIndex - 1); }
  if (e.key === "ArrowRight") { e.preventDefault(); pgnGoto(pgnIndex + 1); }
  if (e.key === "Home") { e.preventDefault(); pgnGoto(0); }
  if (e.key === "End") { e.preventDefault(); pgnGoto(pgnMoves.length); }
});

// ----- Startup mode picker -----

function showStartupPicker() {
  startupModeStep.hidden = false;
  startupSideStep.hidden = true;
  startupOverlay.hidden = false;
}

function hideStartupPicker() {
  startupOverlay.hidden = true;
}

function pickMode(mode) {
  if (online && mode !== "online") onlineLeave();
  modeSelect.value = mode;
  modeSelect.dispatchEvent(new Event("change"));
  hideStartupPicker();
  // PGN mode opens the import overlay first; the loaded game drives resetGameLocal.
  if (mode === "pgn") {
    pgnNav.hidden = true;
    pgnMoves = [];
    pgnIndex = 0;
    resetGameLocal();
    openPgnOverlay();
    return;
  }
  pgnNav.hidden = true;
  resetGame();
}

for (const btn of startupOptions) {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    if (!mode) return;
    if (mode === "ai" || mode === "trainer") {
      pendingSideMode = mode;
      startupModeStep.hidden = true;
      startupSideStep.hidden = false;
      return;
    }
    pickMode(mode);
  });
}

for (const btn of startupSideOptions) {
  btn.addEventListener("click", () => {
    const side = btn.dataset.side;
    if (side === "red" || side === "black") playerSide.value = side;
    pickMode(pendingSideMode);
  });
}

startupSideBack.addEventListener("click", () => {
  startupModeStep.hidden = false;
  startupSideStep.hidden = true;
});

renderProfile();
setOnlineMode(modeSelect.value === "online");
renderTrainerPanel();

await loadStatus();
await refreshProfile();
showStartupPicker();
