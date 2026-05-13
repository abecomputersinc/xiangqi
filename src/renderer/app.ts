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
const SETUP_PIECE_CODES = ["K", "A", "B", "N", "R", "C", "P", "k", "a", "b", "n", "r", "c", "p"];
const SETUP_MAX_PIECES = { k: 1, a: 2, b: 2, n: 2, r: 2, c: 2, p: 5 };
const GAME_LIBRARY_KEY = "xiangqi.gameLibrary.v1";
const GAME_LIBRARY_LIMIT = 200;
const NOTATION_NUMBERS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const NOTATION_PIECES = {
  K: "帅",
  A: "仕",
  B: "相",
  N: "马",
  R: "车",
  C: "炮",
  P: "兵",
  k: "将",
  a: "士",
  b: "象",
  n: "马",
  r: "车",
  c: "炮",
  p: "卒",
};
const PIECE_VALUES = { k: 10000, r: 900, c: 450, n: 400, b: 220, a: 220, p: 100 };

const OPENING_BOOK = [
  {
    line: [],
    name: { en: "Starting position", zh: "初始局面" },
    description: {
      en: "Choose a first move to steer the game into a familiar system.",
      zh: "第一手决定开局方向。先看常见体系，再边下边记。",
    },
    moves: [
      { uci: "h2e2", name: { en: "Central Cannon", zh: "中炮" }, winRate: 56, popularity: 42, idea: { en: "Occupy the center and aim at the black king.", zh: "炮占中路，直接瞄准黑方中宫。" } },
      { uci: "b2e2", name: { en: "Central Cannon", zh: "左中炮" }, winRate: 54, popularity: 16, idea: { en: "A central cannon with different flank development.", zh: "同样抢中，保留右侧子力变化。" } },
      { uci: "h0g2", name: { en: "Horse Opening", zh: "起马局" }, winRate: 51, popularity: 14, idea: { en: "Develop steadily before committing the cannon.", zh: "先出马，布局更稳健灵活。" } },
      { uci: "c3c4", name: { en: "Pawn Opening", zh: "仙人指路" }, winRate: 50, popularity: 12, idea: { en: "Probe the opponent and keep many transpositions open.", zh: "用兵试探，对方应法不同可转多种体系。" } },
    ],
  },
  {
    line: ["h2e2"],
    name: { en: "Central Cannon", zh: "中炮" },
    description: {
      en: "Red has taken the center; Black now chooses the defensive structure.",
      zh: "红方已架中炮，黑方下一手通常决定是屏风马、顺炮还是列炮。",
    },
    moves: [
      { uci: "h9g7", name: { en: "Screen Horse", zh: "屏风马" }, winRate: 49, popularity: 34, idea: { en: "Develop a horse to guard the center and prepare the second horse.", zh: "右马护中，准备双马成屏风。" } },
      { uci: "b9c7", name: { en: "Screen Horse", zh: "屏风马" }, winRate: 49, popularity: 28, idea: { en: "The other horse develops first; the plan is still a screen-horse setup.", zh: "左马先出，仍以双马屏风抗中炮。" } },
      { uci: "h7e7", name: { en: "Same-direction Cannon", zh: "顺炮" }, winRate: 51, popularity: 18, idea: { en: "Meet cannon with cannon on the same central file.", zh: "同侧炮也平中，直接与中炮对抗。" } },
      { uci: "b7e7", name: { en: "Opposite Cannon", zh: "列炮" }, winRate: 50, popularity: 10, idea: { en: "Use the opposite cannon for sharper central tension.", zh: "异侧炮入中，形成更尖锐的中路对峙。" } },
    ],
  },
  {
    line: ["h2e2", "h9g7"],
    name: { en: "Central Cannon vs Screen Horse", zh: "中炮对屏风马" },
    description: {
      en: "The classic main family: Red attacks the center, Black builds a horse screen.",
      zh: "最经典的开局大类：红方中炮抢攻，黑方以双马屏风稳守反击。",
    },
    moves: [
      { uci: "h0g2", name: { en: "Develop right horse", zh: "马二进三" }, winRate: 53, popularity: 38, idea: { en: "Support the central cannon and prepare rook development.", zh: "补强中路，准备出车展开主线。" } },
      { uci: "b0c2", name: { en: "Develop left horse", zh: "马八进七" }, winRate: 52, popularity: 22, idea: { en: "Build both wings before choosing the attacking plan.", zh: "左右均衡出子，再决定攻势方向。" } },
      { uci: "i0i1", name: { en: "Right rook lift", zh: "车一进一" }, winRate: 51, popularity: 12, idea: { en: "Lift the rook early and keep pressure flexible.", zh: "早升右车，保持横向机动压力。" } },
    ],
  },
  {
    line: ["h2e2", "h7e7"],
    name: { en: "Same-direction Cannon", zh: "顺炮" },
    description: {
      en: "Both central cannons face the same file; development speed matters.",
      zh: "双方同侧炮平中，子力展开速度和中路线权很关键。",
    },
    moves: [
      { uci: "h0g2", name: { en: "Horse protects center", zh: "马二进三" }, winRate: 53, popularity: 36, idea: { en: "Develop naturally while protecting key central points.", zh: "自然出马，兼顾中路要点。" } },
      { uci: "i0h0", name: { en: "Rook contests file", zh: "车一平二" }, winRate: 52, popularity: 18, idea: { en: "Bring the rook toward the open flank file.", zh: "右车抢线，争取先手展开。" } },
      { uci: "b0c2", name: { en: "Balanced horses", zh: "马八进七" }, winRate: 51, popularity: 16, idea: { en: "Keep the position sound before central exchanges.", zh: "先稳固阵形，再处理中路交换。" } },
    ],
  },
  {
    line: ["h2e2", "b7e7"],
    name: { en: "Opposite Cannon", zh: "列炮" },
    description: {
      en: "The cannons enter from opposite sides, often leading to direct tactical play.",
      zh: "双方异侧炮进中，常见直接对攻和早期战术。",
    },
    moves: [
      { uci: "h0g2", name: { en: "Steady horse", zh: "马二进三" }, winRate: 52, popularity: 32, idea: { en: "Develop with tempo and keep the central cannon supported.", zh: "稳健出马，继续支撑中炮。" } },
      { uci: "i0h0", name: { en: "Rook activation", zh: "车一平二" }, winRate: 51, popularity: 15, idea: { en: "Activate the rook before the center opens.", zh: "趁中路未开，先活右车。" } },
    ],
  },
  {
    line: ["h2e2", "h9g7", "h0g2", "b9c7"],
    name: { en: "Central Cannon vs Double Screen Horse", zh: "中炮对双屏风马" },
    description: {
      en: "Black has completed the screen-horse shape; Red can choose attack or patient development.",
      zh: "黑方双马屏风成形，红方可急攻，也可稳步出车布局。",
    },
    moves: [
      { uci: "i0h0", name: { en: "Right rook out", zh: "车一平二" }, winRate: 53, popularity: 30, idea: { en: "Contest the right file and prepare pressure on the horse.", zh: "右车出动，准备压制黑方马路。" } },
      { uci: "b0c2", name: { en: "Both horses developed", zh: "马八进七" }, winRate: 52, popularity: 24, idea: { en: "Complete development before choosing a pawn break.", zh: "先完成双马，再选择兵路突破。" } },
      { uci: "e3e4", name: { en: "Central pawn probe", zh: "兵五进一" }, winRate: 50, popularity: 9, idea: { en: "Challenge the center immediately.", zh: "直接冲中兵，考验黑方中路应对。" } },
    ],
  },
  {
    line: ["b2e2"],
    name: { en: "Left Central Cannon", zh: "左中炮" },
    description: {
      en: "A central cannon from the left side; many ideas transpose to Central Cannon systems.",
      zh: "左炮平中，常可转入中炮体系，也保留右侧出子弹性。",
    },
    moves: [
      { uci: "b9c7", name: { en: "Screen Horse", zh: "屏风马" }, winRate: 49, popularity: 30, idea: { en: "Build a horse screen against the center.", zh: "以屏风马阵形抗衡中炮。" } },
      { uci: "b7e7", name: { en: "Same-direction Cannon", zh: "顺炮" }, winRate: 50, popularity: 16, idea: { en: "Answer with a central cannon from the same side.", zh: "同侧炮平中，进入顺炮类变化。" } },
    ],
  },
  {
    line: ["h0g2"],
    name: { en: "Horse Opening", zh: "起马局" },
    description: {
      en: "A flexible first move that delays the central cannon decision.",
      zh: "起马局先出子不定型，常根据黑方应法转中炮、屏风马或稳健布局。",
    },
    moves: [
      { uci: "h9g7", name: { en: "Symmetric horse", zh: "还起马" }, winRate: 50, popularity: 28, idea: { en: "Match development and keep the center flexible.", zh: "对称出马，双方保持弹性。" } },
      { uci: "h7e7", name: { en: "Central Cannon reply", zh: "炮8平5" }, winRate: 51, popularity: 20, idea: { en: "Take the center before Red commits.", zh: "趁红方未架炮，黑方先占中路。" } },
    ],
  },
  {
    line: ["c3c4"],
    name: { en: "Pawn Opening", zh: "仙人指路" },
    description: {
      en: "A probing pawn move. The opening name is humble, but the transpositions are rich.",
      zh: "以三兵探路，名称朴素，变化却很丰富。",
    },
    moves: [
      { uci: "h9g7", name: { en: "Screen Horse setup", zh: "屏风马趋向" }, winRate: 50, popularity: 26, idea: { en: "Develop a horse and wait for Red's setup.", zh: "先出马，看红方后续转型。" } },
      { uci: "h7e7", name: { en: "Central Cannon reply", zh: "中炮趋向" }, winRate: 51, popularity: 14, idea: { en: "Use the cannon to claim central space.", zh: "用炮抢中，反问红方布局。" } },
    ],
  },
];

function qs<T = any>(selector: string): T {
  return document.querySelector(selector) as T;
}

function qsa<T extends Element = any>(selector: string): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}

const boardEl = qs("#board");
const boardZone = qs(".board-zone");
const topFileLabels = qsa(".files-top span");
const bottomFileLabels = qsa(".files-bottom span");
const matePatternToast = qs("#matePatternToast");
const statusText = qs("#statusText");
const turnPill = qs("#turnPill");
const modeSelect = qs("#modeSelect");
const playerSide = qs("#playerSide");
const aiLevelSelect = qs("#aiLevelSelect");
const depthInput = qs("#depthInput");
const depthLabel = qs("#depthLabel");
const newGameBtn = qs("#newGameBtn");
const undoBtn = qs("#undoBtn");
const saveGameBtn = qs("#saveGameBtn");
const libraryBtn = qs("#libraryBtn");
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
const pgnDropZone = qs("#pgnDropZone");
const pgnOpenFileBtn = qs<HTMLButtonElement>("#pgnOpenFileBtn");
const pgnFileInput = qs<HTMLInputElement>("#pgnFileInput");
const pgnGameList = qs("#pgnGameList");
const pgnStatus = qs("#pgnStatus");
const pgnNav = qs("#pgnNav");
const pgnFirstBtn = qs("#pgnFirstBtn");
const pgnPrevBtn = qs("#pgnPrevBtn");
const pgnNextBtn = qs("#pgnNextBtn");
const pgnLastBtn = qs("#pgnLastBtn");
const pgnPosition = qs("#pgnPosition");
const pgnLastMoveEl = qs("#pgnLastMove");
const pgnPlayFromHereBtn = qs("#pgnPlayFromHereBtn");
const pgnImportAgain = qs("#pgnImportAgain");

// Startup mode picker DOM
const startupOverlay = qs("#startupOverlay");
const startupModeStep = qs("#startupModeStep");
const startupSideStep = qs("#startupSideStep");
const startupSideBack = qs("#startupSideBack");
const startupAiLevelWrap = qs("#startupAiLevelWrap");
const startupAiLevelSelect = qs("#startupAiLevelSelect");
const startupAuthActions = qs("#startupAuthActions");
const startupLoginBtn = qs("#startupLoginBtn");
const startupSignupBtn = qs("#startupSignupBtn");
const startupOptions = qsa(".startup-option:not(.startup-side-option)");
const startupSideOptions = qsa(".startup-side-option");

// Local profile DOM
const profilePanel = qs(".profile-panel");
const profileNameEl = qs("#profileName");
const profileLevelEl = qs("#profileLevel");
const languageSelect = qs("#languageSelect");
const loginBtn = qs("#loginBtn");
const loginOverlay = qs("#loginOverlay");
const loginCloseBtn = qs("#loginCloseBtn");
const loginForm = qs("#loginForm");
const loginName = qs("#loginName");
const loginPassword = qs("#loginPassword");
const loginStatus = qs("#loginStatus");
const signupBtn = qs("#signupBtn");
const gameEndOverlay = qs("#gameEndOverlay");
const gameEndResult = qs("#gameEndResult");
const gameEndPattern = qs("#gameEndPattern");
const gameEndNewBtn = qs("#gameEndNewBtn");
const gameEndReviewBtn = qs("#gameEndReviewBtn");

// Local game library DOM
const libraryOverlay = qs("#libraryOverlay");
const libraryOverlayClose = qs("#libraryOverlayClose");
const libraryTitle = qs("#libraryTitle");
const libraryHint = qs("#libraryHint");
const libraryList = qs("#libraryList");
const libraryStatus = qs("#libraryStatus");
const librarySaveCurrentBtn = qs("#librarySaveCurrentBtn");
const libraryImportPgnBtn = qs("#libraryImportPgnBtn");
const librarySearchInput = qs("#librarySearchInput");
const libraryResultFilter = qs("#libraryResultFilter");
const libraryPlayerFilter = qs("#libraryPlayerFilter");
const libraryEventFilter = qs("#libraryEventFilter");
const libraryYearFilter = qs("#libraryYearFilter");
const libraryOpeningFilter = qs("#libraryOpeningFilter");
const libraryFavoriteFilter = qs("#libraryFavoriteFilter");
const libraryClearFiltersBtn = qs("#libraryClearFiltersBtn");
const libraryCount = qs("#libraryCount");

// Setup position DOM
const setupPanel = qs("#setupPanel");
const setupGuide = qs("#setupGuide");
const setupPieceMenu = qs("#setupPieceMenu");
const setupTurnSelect = qs("#setupTurnSelect");
const setupStartBtn = qs("#setupStartBtn");
const setupClearBtn = qs("#setupClearBtn");
const setupPlayBtn = qs("#setupPlayBtn");

const I18N = {
  en: {
    appLang: "en",
    guest: "Guest",
    loginRequired: "Login required",
    beginner: "Beginner",
    highest: "Highest",
    points: "pts",
    logout: "Logout",
    login: "Login",
    signup: "Sign up",
    player: "Player",
    level: "Level",
    language: "Language",
    pgnReplay: "PGN replay",
    importAnotherPgn: "Import another PGN",
    loadingEngine: "Loading engine...",
    redToMove: "Red to move",
    blackToMove: "Black to move",
    trainer: "Trainer",
    redTrainer: "Red trainer",
    blackTrainer: "Black trainer",
    findBestMove: "Find the best move.",
    solved: "Solved",
    streak: "Streak",
    attempts: "Attempts",
    preparingPosition: "Preparing position.",
    hint: "Hint",
    reveal: "Reveal",
    restart: "Restart",
    clock: "Clock",
    red: "Red",
    black: "Black",
    userVsAi: "User vs AI",
    setupPosition: "Setup position",
    setupPositionHint: "Place pieces and start from any board",
    gameLibrary: "Game library",
    gameLibraryHint: "Browse saved games on this device",
    savedGamesHint: "Saved games stay on this device.",
    saveGame: "Save",
    saveCurrentGame: "Save current game",
    library: "Library",
    importPgnToLibrary: "Import PGN",
    importPgnsToLibrary: "Import PGN/PGNS",
    indexingLibrary: "Indexing game library...",
    importedLibrary: (count, name) => `Indexed ${count} games from ${name}.`,
    libraryImportUnavailable: "Large PGNS import is available in the Electron app.",
    searchGames: "Search games",
    allResults: "All results",
    redWins: "Red wins",
    blackWins: "Black wins",
    draws: "Draws",
    unknownResult: "Unknown",
    playerFilter: "Player",
    eventFilter: "Event",
    yearFilter: "Year",
    openingFilter: "Opening",
    clearFilters: "Clear",
    librarySearchCount: (shown, total) => `Showing ${shown} of ${total} indexed games.`,
    localSavedGames: "Saved games",
    indexedGames: "Indexed PGN library",
    localLibrarySearchCount: (shown, total) => `Saved ${shown} of ${total} games.`,
    noLibraryMatches: "No games match these filters.",
    favoritesOnly: "Favorites only",
    favoriteGame: "Add to favorites",
    unfavoriteGame: "Remove from favorites",
    favoriteSaved: "Favorite updated.",
    playFromHere: "Play from here",
    playingFromReview: "Playing from this review position.",
    reviewWaiting: "Queued",
    reviewFailedShort: "Analysis failed",
    reviewLossShort: loss => `Loss ${loss}`,
    reviewBestShort: label => `Best ${label}`,
    reviewMoveLine: (mark, score, loss) => `${mark ? `${mark} · ` : ""}Score ${score} · ${loss}`,
    reviewBestLine: (label, score) => `Best move: ${label}${score ? ` (${score})` : ""}`,
    coachIntro: "Why:",
    coachNoClear: "Keeps the position coordinated and avoids an immediate tactical concession.",
    coachCheck: "Gives check, so the opponent must answer the king threat first.",
    coachCapture: piece => `Wins material by taking ${piece}.`,
    coachFreeCapture: "The captured piece is not immediately recaptured.",
    coachTradeWin: (captured, piece) => `If pieces are traded, ${captured} is worth more than ${piece}.`,
    coachTradeEven: "The exchange does not lose material and simplifies the position.",
    coachTradeRisk: "The capture can be recaptured, so it needs the tactical threat behind it.",
    coachThreat: (piece, square) => `Creates a threat against ${piece} on ${square}.`,
    coachPin: piece => `Pins ${piece} to the king line, limiting its mobility.`,
    coachProtected: count => `The landing square is protected by ${count} friendly piece${count === 1 ? "" : "s"}.`,
    coachMobility: piece => `${piece} becomes more active after the move.`,
    noGameToSave: "No game to save yet.",
    gameSaved: title => `Saved ${title}.`,
    gameSaveFailed: error => `Could not save game: ${error}`,
    noSavedGames: "No saved games yet.",
    openGame: "Open",
    deleteGame: "Delete",
    confirmDeleteGame: title => `Delete ${title}?`,
    gameDeleted: "Game deleted.",
    setupGuide: "Setup guide",
    setupGuideText: "Right-click an intersection to choose a piece. Left-click clears that point. Illegal choices are disabled.",
    turn: "Turn",
    emptySquare: "Empty square",
    clearBoard: "Clear board",
    playPosition: "Play position",
    setupReady: "Set up a position. Right-click an intersection to choose a piece.",
    setupApplied: "Playing from custom position.",
    setupNeedsKings: "Add both kings before starting.",
    setupIllegalSquare: (piece, square) => `${piece} cannot be placed on ${square}.`,
    setupTooManyPieces: (color, piece, max) => `${color} can have at most ${max} ${piece}.`,
    setupKingsFacing: "Kings cannot face each other on an open file.",
    humanLocal: "Human vs Human (local)",
    userOnline: "User vs User (online)",
    pgnViewer: "PGN viewer",
    youPlay: "You play",
    aiLevel: "AI level",
    aiBeginner: "Beginner",
    aiAmateur: "Amateur",
    aiCounty: "County",
    aiMaster: "Master",
    engineDepth: "Engine depth",
    newGame: "New Game",
    realtimeScore: "Realtime score",
    moveAnalysis: "Move analysis",
    moveToSeeScore: "Make a move to see Pikafish's score.",
    moves: "Moves",
    undo: "Undo",
    downloadPgn: "Download PGN",
    exit: "Exit",
    chooseMode: "Choose a mode",
    chooseModeHint: "Pick how you want to play.",
    vsAi: "Vs AI",
    vsAiHint: "Play against Pikafish on this device",
    trainerHintMode: "Find best moves with hints and scoring",
    vsHumanLocal: "Vs Human (local)",
    vsHumanLocalHint: "Two players on the same screen",
    vsHumanOnline: "Vs Human (online)",
    vsHumanOnlineHint: "Match up over the internet",
    pgnViewerHint: "Import a game and step through it",
    chooseSide: "Choose your side",
    redFirst: "Red moves first.",
    playRed: "Play Red",
    moveFirst: "Move first",
    playBlack: "Play Black",
    pikafishFirst: "Pikafish moves first",
    back: "Back",
    loginHint: "Login with an existing account or create a new one.",
    username: "Username",
    yourName: "Your name",
    password: "Password",
    levelEarned: "Level is earned in online matches.",
    importPgn: "Import PGN",
    pgnImportHint: "Drag a PGN file here, or open a file.",
    dropPgn: "Drop PGN file here",
    openFile: "Open file",
    gameOver: "Game over",
    analyzePgn: "Analyze PGN",
    finishedGame: "Finished game",
    noCheckmatePattern: "not a checkmate finish",
    unknownMatePattern: "unidentified checkmate",
    onlinePlay: "Online play",
    account: "Account",
    loginFirst: "Login first",
    createRoom: "Create room",
    randomMatch: "Random match",
    rankMatch: "Rank match",
    roomCode: "Room code",
    join: "Join",
    spectate: "Spectate",
    room: "Room",
    copy: "copy",
    copied: "copied",
    leave: "Leave",
    rematch: "Rematch",
    resign: "Resign",
    start: "Start",
    previous: "Previous",
    next: "Next",
    end: "End",
    close: "Close",
    copyFen: "Copy FEN",
    clickToCopy: "Click to copy",
    startPosition: "Start position",
    moveCounter: (index, total) => `Move ${index} / ${total}`,
    lastMove: raw => `Last: ${raw}`,
    colorToMove: color => `${color === "red" ? "Red" : "Black"} to move`,
    flagged: (loser, winner) => `${colorLabel(loser)} flagged. ${colorLabel(winner)} wins on time.`,
    winsBy: (winner, reason) => `${colorLabel(winner)} wins by ${reason}!`,
    drawBy: reason => `Draw by ${reason}.`,
    replyPlayed: color => `${colorLabel(color)} reply is being played.`,
    preparingColorPosition: color => `Preparing ${colorLabel(color)} position.`,
    trainerUnavailablePosition: "Trainer is unavailable for this position.",
    findColorBest: color => `Find ${colorLabel(color)}'s best move.`,
    trainerUnavailable: "Trainer unavailable.",
    pikafishSide: color => `${colorLabel(color)} is Pikafish's side.`,
    hintPieceFrom: (piece, square) => `Hint: ${piece} from ${square}.`,
    positionReady: "Position ready.",
    bestLines: lines => `Best lines:\n${lines}`,
    noBestLine: "No best line available.",
    preparingTrainer: "Preparing trainer position...",
    trainerPreparing: "Trainer is preparing the position.",
    noTrainerMoveFound: "No trainer move found.",
    trainerReady: "Trainer ready",
    trainerCouldNotFind: "Trainer could not find a move.",
    noTrainerMove: "No trainer move available.",
    trainerUnavailableError: error => `Trainer unavailable: ${error}`,
    choosingTrainerReply: "Pikafish is choosing a trainer reply...",
    noLegalReply: "Pikafish returned no legal reply.",
    trainerStopped: error => `Trainer stopped: ${error}`,
    stillPreparing: "Position is still preparing.",
    choiceTry: (rank, score, loss) => `Choice #${rank} (${score}${loss}). Try to stay within 1.00.`,
    lostTry: loss => `Lost ${loss}. Try to stay within 1.00.`,
    lostSuffix: loss => `, lost ${loss}`,
    outsideTopLines: "Legal, but outside Pikafish's top lines.",
    tryAgain: "Try again.",
    bestMove: label => `Best move: ${label}.`,
    goodMove: (label, loss) => `Good move: ${label} (lost ${loss}).`,
    goodMoveLoss: loss => `Good move: lost ${loss}.`,
    needsWork: loss => `Needs work: lost ${loss}.`,
    recommendations: lines => `Recommendations:\n${lines}`,
    engineElectron: "Open in the Electron app for Pikafish analysis.",
    pikafishAnalyzing: "Pikafish is analyzing...",
    pikafishReady: "Pikafish ready",
    pikafishMissing: "Pikafish or NNUE file missing",
    engineUnavailable: error => `Engine unavailable: ${error}`,
    choosingMove: "Pikafish is choosing a move...",
    noLegalMove: "Pikafish returned no legal move.",
    engineOnlyElectron: "Engine is only available in the Electron client.",
    unknownEnginePath: path => `Unknown engine path: ${path}`,
    moveNotSent: error => `Move not sent: ${error}`,
    onlineNewGame: "Use the room controls to start a new online game.",
    undoOnline: "Undo requested. Waiting for opponent...",
    undoNoMoves: "No moves to undo.",
    undoRequestedByOpponent: name => `${name} requests to undo the last move. Allow it?`,
    undoIncoming: name => `${name} requested an undo.`,
    undoDeclined: "Undo declined.",
    undoAccepted: "Undo accepted.",
    undoRequestSent: "Undo request sent. Waiting for opponent...",
    undoTrainer: "Undo is disabled during scored training.",
    outOfSync: "Got an out-of-sync move from opponent. Reload to resync.",
    requestFailed: status => `Request failed (${status})`,
    creatingAccount: "Creating account...",
    loggingIn: "Logging in...",
    loginBeforeOnline: "Login before playing online.",
    creatingRoom: "Creating room...",
    validRoomCode: "Enter a valid room code.",
    joiningSpectator: "Joining as spectator...",
    joiningRoom: "Joining room...",
    searchingOpponent: "Searching for an opponent...",
    waitingShareCode: code => `Waiting for an opponent. Share code ${code} to invite a friend.`,
    searchingNear: level => `Searching near ${level}...`,
    waitingRanked: code => `Waiting for a ranked opponent near your level. Room ${code}.`,
    connectionIssue: "Connection issue - trying to reconnect...",
    outcomeDraw: reason => `draw (${reason})`,
    outcomeWin: (winner, reason) => `${colorLabel(winner)} wins by ${reason}`,
    confirmResign: "Resign the game?",
    rematchRequested: "Rematch requested. Waiting for opponent...",
    spectators: list => `Spectators: ${list}`,
    waitingOpponentShare: code => `Waiting for an opponent... share code ${code}.`,
    yourTurn: "Your turn.",
    opponentTurn: "Opponent's turn.",
    rankedStatus: status => `Rank match · ${status}`,
    rematchVotes: (votes, total) => `Rematch (${votes}/${total})`,
    waiting: "Waiting...",
    offline: "offline",
    roomCopied: "Room code copied.",
    noMovesFound: "No moves found. Expected ICCS/UCI moves like C3-C4 or h2e2.",
    loadedGame: (title, moves) => `Loaded ${title} (${moves} moves).`,
    loadedMoves: moves => `Loaded ${moves} move(s).`,
    foundGames: (count, source, capped, clipped) => `Found ${count} games in ${source}. Choose one to import.${capped}${clipped}`,
    showingFirst: max => ` Showing first ${max}.`,
    largeFileBeginning: " Large file was read only at the beginning.",
    readFile: name => `Reading ${name}...`,
    couldNotReadFile: error => `Could not read file: ${error}`,
    pgnFile: "PGN file",
    loadedLarge: title => `Loaded ${title}; large file was read only at the beginning.`,
    noFileDrop: "No file found in drop.",
    noMoveAnalyze: "Start position - no move to analyze yet.",
    analyzing: "Analyzing...",
    noAnalysis: "No engine analysis available.",
    analysisFailed: error => `Analysis failed: ${error || "unknown"}`,
    movesCount: count => `${count} move${count === 1 ? "" : "s"}`,
    pieceName: { K: "King", A: "Advisor", B: "Elephant", N: "Horse", R: "Rook", C: "Cannon", P: "Pawn", k: "King", a: "Advisor", b: "Elephant", n: "Horse", r: "Rook", c: "Cannon", p: "Pawn" },
  },
  zh: {
    appLang: "zh-Hans",
    guest: "游客",
    loginRequired: "需要登录",
    beginner: "入门",
    highest: "最高",
    points: "分",
    logout: "退出登录",
    login: "登录",
    signup: "注册",
    player: "玩家",
    level: "等级",
    language: "语言",
    pgnReplay: "PGN 回放",
    importAnotherPgn: "导入另一个 PGN",
    loadingEngine: "正在加载引擎...",
    redToMove: "红方走棋",
    blackToMove: "黑方走棋",
    trainer: "训练",
    redTrainer: "红方训练",
    blackTrainer: "黑方训练",
    findBestMove: "找出最佳走法。",
    solved: "已解",
    streak: "连胜",
    attempts: "尝试",
    preparingPosition: "正在准备局面。",
    hint: "提示",
    reveal: "揭示",
    restart: "重开",
    clock: "棋钟",
    red: "红方",
    black: "黑方",
    userVsAi: "人机对弈",
    setupPosition: "摆局",
    setupPositionHint: "自由摆放棋子并从任意局面开始",
    gameLibrary: "棋谱库",
    gameLibraryHint: "查看保存在本机的棋局",
    savedGamesHint: "棋谱会保存在这台设备上。",
    saveGame: "保存",
    saveCurrentGame: "保存当前棋局",
    library: "棋谱库",
    importPgnToLibrary: "导入 PGN",
    importPgnsToLibrary: "导入 PGN/PGNS",
    indexingLibrary: "正在索引棋谱库...",
    importedLibrary: (count, name) => `已从 ${name} 索引 ${count} 局。`,
    libraryImportUnavailable: "大型 PGNS 导入需要在 Electron 桌面版中使用。",
    searchGames: "搜索棋局",
    allResults: "全部结果",
    redWins: "红胜",
    blackWins: "黑胜",
    draws: "和棋",
    unknownResult: "未知",
    playerFilter: "棋手",
    eventFilter: "赛事",
    yearFilter: "年份",
    openingFilter: "开局",
    clearFilters: "清除",
    librarySearchCount: (shown, total) => `显示 ${shown} / ${total} 个索引棋局。`,
    localSavedGames: "已保存棋局",
    indexedGames: "索引棋谱库",
    localLibrarySearchCount: (shown, total) => `已保存棋局 ${shown} / ${total}。`,
    noLibraryMatches: "没有符合筛选条件的棋局。",
    favoritesOnly: "只看收藏",
    favoriteGame: "加入收藏",
    unfavoriteGame: "取消收藏",
    favoriteSaved: "收藏已更新。",
    playFromHere: "从这里重新下",
    playingFromReview: "已从当前复盘局面继续对局。",
    reviewWaiting: "排队中",
    reviewFailedShort: "分析失败",
    reviewLossShort: loss => `损失 ${loss}`,
    reviewBestShort: label => `最佳 ${label}`,
    reviewMoveLine: (mark, score, loss) => `${mark ? `${mark} · ` : ""}评分 ${score} · ${loss}`,
    reviewBestLine: (label, score) => `最佳着法：${label}${score ? `（${score}）` : ""}`,
    coachIntro: "为什么：",
    coachNoClear: "这手保持局面协调，避免马上出现战术亏损。",
    coachCheck: "形成将军，对方必须先应将，主动权在你手里。",
    coachCapture: piece => `吃掉${piece}，直接取得子力收益。`,
    coachFreeCapture: "被吃的子暂时不能被直接追回。",
    coachTradeWin: (captured, piece) => `即使兑子，${captured}的价值也高于${piece}，兑换有利。`,
    coachTradeEven: "兑子不亏，还能简化局面。",
    coachTradeRisk: "这步吃子可能被回吃，需要依靠后续威胁补偿。",
    coachThreat: (piece, square) => `制造对${square}的${piece}的威胁。`,
    coachPin: piece => `牵制${piece}，它背后连着将帅线，活动受限。`,
    coachProtected: count => `落点有 ${count} 个己方子力保护。`,
    coachMobility: piece => `${piece}走到更活跃的位置，后续选择更多。`,
    noGameToSave: "暂无可保存棋局。",
    gameSaved: title => `已保存 ${title}。`,
    gameSaveFailed: error => `保存失败：${error}`,
    noSavedGames: "暂无已保存棋谱。",
    openGame: "打开",
    deleteGame: "删除",
    confirmDeleteGame: title => `删除 ${title}？`,
    gameDeleted: "棋谱已删除。",
    setupGuide: "摆棋说明",
    setupGuideText: "在交叉点右键选择棋子。左键清空该点。不合法的选择会被禁用。",
    turn: "走棋方",
    emptySquare: "清空格子",
    clearBoard: "清空棋盘",
    playPosition: "开始此局",
    setupReady: "正在摆局。右键交叉点选择棋子。",
    setupApplied: "已从自定义局面开始。",
    setupNeedsKings: "开始前需要放置双方将帅。",
    setupIllegalSquare: (piece, square) => `${piece} 不能放在 ${square}。`,
    setupTooManyPieces: (color, piece, max) => `${color}${piece}最多 ${max} 个。`,
    setupKingsFacing: "双方将帅不能在同一路线上直接照面。",
    humanLocal: "本地双人",
    userOnline: "在线对弈",
    pgnViewer: "PGN 查看器",
    youPlay: "执棋方",
    aiLevel: "电脑级别",
    aiBeginner: "新手",
    aiAmateur: "业余",
    aiCounty: "县级",
    aiMaster: "大师",
    engineDepth: "引擎深度",
    newGame: "新棋局",
    realtimeScore: "实时评分",
    moveAnalysis: "走法分析",
    moveToSeeScore: "走一步即可查看 Pikafish 评分。",
    moves: "棋谱",
    undo: "悔棋",
    downloadPgn: "下载 PGN",
    exit: "退出",
    chooseMode: "选择模式",
    chooseModeHint: "选择你想玩的方式。",
    vsAi: "对战 AI",
    vsAiHint: "在本机与 Pikafish 对弈",
    trainerHintMode: "用提示和评分练习最佳走法",
    vsHumanLocal: "本地双人",
    vsHumanLocalHint: "两名玩家共用同一屏幕",
    vsHumanOnline: "在线双人",
    vsHumanOnlineHint: "通过互联网匹配对手",
    pgnViewerHint: "导入棋局并逐步回放",
    chooseSide: "选择执棋方",
    redFirst: "红方先行。",
    playRed: "执红",
    moveFirst: "先行",
    playBlack: "执黑",
    pikafishFirst: "Pikafish 先走",
    back: "返回",
    loginHint: "使用已有账号登录，或创建新账号。",
    username: "用户名",
    yourName: "你的名字",
    password: "密码",
    levelEarned: "等级通过在线对局获得。",
    importPgn: "导入 PGN",
    pgnImportHint: "拖入 PGN 文件，或打开文件。",
    dropPgn: "将 PGN 文件拖到这里",
    openFile: "打开文件",
    gameOver: "对局结束",
    analyzePgn: "棋谱分析",
    finishedGame: "已结束棋局",
    noCheckmatePattern: "非将死结束",
    unknownMatePattern: "未识别杀法",
    onlinePlay: "在线对弈",
    account: "账号",
    loginFirst: "请先登录",
    createRoom: "创建房间",
    randomMatch: "随机匹配",
    rankMatch: "排位赛",
    roomCode: "房间码",
    join: "加入",
    spectate: "观战",
    room: "房间",
    copy: "复制",
    copied: "已复制",
    leave: "离开",
    rematch: "再来一局",
    resign: "认输",
    start: "开始",
    previous: "上一步",
    next: "下一步",
    end: "末尾",
    close: "关闭",
    copyFen: "复制 FEN",
    clickToCopy: "点击复制",
    startPosition: "初始局面",
    moveCounter: (index, total) => `第 ${index} 步 / 共 ${total} 步`,
    lastMove: raw => `上一手：${raw}`,
    colorToMove: color => `${color === "red" ? "红方" : "黑方"}走棋`,
    flagged: (loser, winner) => `${colorLabel(loser)}超时。${colorLabel(winner)}超时胜。`,
    winsBy: (winner, reason) => `${colorLabel(winner)}因 ${reasonText(reason)} 获胜！`,
    drawBy: reason => `因 ${reasonText(reason)} 和棋。`,
    replyPlayed: color => `${colorLabel(color)}正在应招。`,
    preparingColorPosition: color => `正在准备${colorLabel(color)}局面。`,
    trainerUnavailablePosition: "此局面暂不能训练。",
    findColorBest: color => `找出${colorLabel(color)}最佳走法。`,
    trainerUnavailable: "训练不可用。",
    pikafishSide: color => `${colorLabel(color)}由 Pikafish 行棋。`,
    hintPieceFrom: (piece, square) => `提示：${piece} 从 ${square} 出发。`,
    positionReady: "局面已准备好。",
    bestLines: lines => `最佳路线：\n${lines}`,
    noBestLine: "暂无最佳路线。",
    preparingTrainer: "正在准备训练局面...",
    trainerPreparing: "训练局面正在准备。",
    noTrainerMoveFound: "未找到训练走法。",
    trainerReady: "训练已就绪",
    trainerCouldNotFind: "训练未能找到走法。",
    noTrainerMove: "暂无训练走法。",
    trainerUnavailableError: error => `训练不可用：${error}`,
    choosingTrainerReply: "Pikafish 正在选择训练应招...",
    noLegalReply: "Pikafish 没有返回合法应招。",
    trainerStopped: error => `训练已停止：${error}`,
    stillPreparing: "局面仍在准备中。",
    choiceTry: (rank, score, loss) => `第 ${rank} 选择（${score}${loss}）。尽量保持在 1.00 以内。`,
    lostTry: loss => `损失 ${loss}。尽量保持在 1.00 以内。`,
    lostSuffix: loss => `，损失 ${loss}`,
    outsideTopLines: "合法，但不在 Pikafish 主要推荐路线中。",
    tryAgain: "再试一次。",
    bestMove: label => `最佳走法：${label}。`,
    goodMove: (label, loss) => `好棋：${label}（损失 ${loss}）。`,
    goodMoveLoss: loss => `好棋：损失 ${loss}。`,
    needsWork: loss => `仍需改进：损失 ${loss}。`,
    recommendations: lines => `推荐走法：\n${lines}`,
    engineElectron: "请在 Electron 桌面应用中使用 Pikafish 分析。",
    pikafishAnalyzing: "Pikafish 正在分析...",
    pikafishReady: "Pikafish 已就绪",
    pikafishMissing: "缺少 Pikafish 或 NNUE 文件",
    engineUnavailable: error => `引擎不可用：${error}`,
    choosingMove: "Pikafish 正在选择走法...",
    noLegalMove: "Pikafish 没有返回合法走法。",
    engineOnlyElectron: "引擎只在 Electron 客户端中可用。",
    unknownEnginePath: path => `未知引擎路径：${path}`,
    moveNotSent: error => `走法未发送：${error}`,
    onlineNewGame: "请使用房间控件开始新的在线对局。",
    undoOnline: "已请求悔棋，等待对手同意...",
    undoNoMoves: "没有可悔的走法。",
    undoRequestedByOpponent: name => `${name} 请求悔棋一步，是否同意？`,
    undoIncoming: name => `${name} 请求悔棋。`,
    undoDeclined: "对方不同意悔棋。",
    undoAccepted: "已同意悔棋。",
    undoRequestSent: "已发送悔棋请求，等待对手同意...",
    undoTrainer: "评分训练中不能悔棋。",
    outOfSync: "收到不同步的对手走法。请重新加载以同步。",
    requestFailed: status => `请求失败（${status}）`,
    creatingAccount: "正在创建账号...",
    loggingIn: "正在登录...",
    loginBeforeOnline: "在线对局前请先登录。",
    creatingRoom: "正在创建房间...",
    validRoomCode: "请输入有效房间码。",
    joiningSpectator: "正在以观战者身份加入...",
    joiningRoom: "正在加入房间...",
    searchingOpponent: "正在寻找对手...",
    waitingShareCode: code => `正在等待对手。分享房间码 ${code} 邀请好友。`,
    searchingNear: level => `正在搜索 ${level} 附近的对手...`,
    waitingRanked: code => `正在等待等级相近的排位对手。房间 ${code}。`,
    connectionIssue: "连接异常，正在尝试重连...",
    outcomeDraw: reason => `和棋（${reasonText(reason)}）`,
    outcomeWin: (winner, reason) => `${colorLabel(winner)}因 ${reasonText(reason)} 获胜`,
    confirmResign: "确认认输？",
    rematchRequested: "已请求再来一局，等待对手...",
    spectators: list => `观战：${list}`,
    waitingOpponentShare: code => `等待对手中... 分享房间码 ${code}。`,
    yourTurn: "轮到你走。",
    opponentTurn: "轮到对手。",
    rankedStatus: status => `排位赛 · ${status}`,
    rematchVotes: (votes, total) => `再来一局（${votes}/${total}）`,
    waiting: "等待中...",
    offline: "离线",
    roomCopied: "房间码已复制。",
    noMovesFound: "未找到走法。应为 C3-C4 或 h2e2 这样的 ICCS/UCI 走法。",
    loadedGame: (title, moves) => `已加载 ${title}（${moves} 步）。`,
    loadedMoves: moves => `已加载 ${moves} 步。`,
    foundGames: (count, source, capped, clipped) => `在 ${source} 中找到 ${count} 个棋局。请选择一个导入。${capped}${clipped}`,
    showingFirst: max => ` 仅显示前 ${max} 个。`,
    largeFileBeginning: " 大文件仅读取了开头部分。",
    readFile: name => `正在读取 ${name}...`,
    couldNotReadFile: error => `无法读取文件：${error}`,
    pgnFile: "PGN 文件",
    loadedLarge: title => `已加载 ${title}；大文件仅读取了开头部分。`,
    noFileDrop: "拖放中未找到文件。",
    noMoveAnalyze: "初始局面 - 暂无走法可分析。",
    analyzing: "正在分析...",
    noAnalysis: "暂无引擎分析。",
    analysisFailed: error => `分析失败：${error || "未知错误"}`,
    movesCount: count => `${count} 步`,
    pieceName: { K: "帅", A: "仕", B: "相", N: "马", R: "车", C: "炮", P: "兵", k: "将", a: "士", b: "象", n: "马", r: "车", c: "炮", p: "卒" },
  },
};

let lang = loadLanguage();
let gameEndOverlayTimer = null;
const GAME_END_OVERLAY_DELAY_MS = 3000;
const SOUND_FILES = {
  move: "../../sound/Move.mp3",
  capture: "../../sound/Capture.mp3",
  check: "../../sound/Check.mp3",
  end: "../../sound/End.mp3",
};
const fallbackSounds = {
  end: "check",
};
const soundPlayers = new Map();

function getSoundPlayer(kind) {
  if (soundPlayers.has(kind)) return soundPlayers.get(kind);
  const audio = new Audio(SOUND_FILES[kind] || SOUND_FILES.move);
  audio.preload = "auto";
  audio.volume = 0.8;
  soundPlayers.set(kind, audio);
  return audio;
}

function unlockAudio() {
  for (const kind of ["move", "capture", "check"]) getSoundPlayer(kind).load();
}

function playSound(kind) {
  const audio = getSoundPlayer(kind);
  audio.currentTime = 0;
  audio.play().catch(() => {
    const fallback = fallbackSounds[kind];
    if (fallback) playSound(fallback);
  });
}

window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

function loadLanguage() {
  try {
    const saved = localStorage.getItem("xiangqi.language");
    if (saved === "en" || saved === "zh") return saved;
  } catch { /* ignore */ }
  return navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function text(key, ...args) {
  const value = I18N[lang][key] ?? I18N.en[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

function localized(value) {
  if (!value || typeof value === "string") return value || "";
  return value[lang] || value.en || value.zh || "";
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setAttr(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

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
let openingOverlayText = "";
let openingOverlayId = 0;
let pendingSideMode = "ai";
let setupMenuSquare = null;
let pgnSourceText = "";
let pgnSourceTitle = "";
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
// Shape: { code, playerId, role, myColor, status, winner, winReason, players, spectators, eventSource, applyingRemote, undoRequest }
let online = null;

function levelLabel(level, points = 0) {
  if (level === "1-1") return `1-1 ${text("beginner")}`;
  if (level === "10-10") return `10-10 ${text("highest")}`;
  return `${level || "1-1"} · ${points} ${text("points")}`;
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
  profileNameEl.textContent = user?.username || text("guest");
  profileLevelEl.textContent = user ? levelLabel(user.level, user.points) : text("loginRequired");
  loginBtn.hidden = false;
  startupAuthActions.hidden = !!user;
  profilePanel.classList.toggle("logged-in", !!user);
  loginBtn.textContent = user ? text("logout") : text("login");
}

function openLoginOverlay(mode = "login") {
  loginName.value = currentProfile.user?.username || "";
  loginPassword.value = "";
  loginStatus.textContent = mode === "signup" ? text("levelEarned") : (currentProfile.user ? levelLabel(currentProfile.user.level, currentProfile.user.points) : text("levelEarned"));
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

function boardToFen(sourceBoard = board, sourceTurn = turn) {
  const placement = sourceBoard.map(row => {
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
  return `${placement} ${sourceTurn === "red" ? "w" : "b"} - - 0 1`;
}

function cloneBoard(source = board) {
  return source.map(row => [...row]);
}

function colorOf(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? "red" : "black";
}

function oppositeColor(color) {
  return color === "red" ? "black" : "red";
}

function colorLabel(color) {
  return color === "red" ? text("red") : text("black");
}

function reasonText(reason) {
  if (lang !== "zh") return reason;
  const labels = {
    timeout: "超时",
    checkmate: "将死",
    stalemate: "困毙",
    resign: "认输",
  };
  return labels[reason] || reason;
}

function pieceLabel(piece) {
  return text("pieceName")[piece] || pieceNames[piece] || piece;
}

function pieceValue(piece) {
  return PIECE_VALUES[piece?.toLowerCase()] || 0;
}

function renderSetupPanel() {
  const active = modeSelect.value === "setup";
  setupPanel.hidden = !active;
  setupGuide.hidden = !active;
  boardZone.classList.toggle("setup-active", active);
  if (!active) closeSetupPieceMenu();
  const turnOptions = setupTurnSelect.querySelectorAll("option");
  if (turnOptions[0]) turnOptions[0].textContent = text("red");
  if (turnOptions[1]) turnOptions[1].textContent = text("black");
  setupTurnSelect.value = turn;
  if (active) {
    undoBtn.disabled = true;
    downloadPgnBtn.hidden = true;
  }
}

function applyLanguage() {
  document.documentElement.lang = text("appLang");
  languageSelect.value = lang;
  languageSelect.setAttribute("aria-label", text("language"));
  const profileLabels = qsa(".profile-panel .profile-label");
  if (profileLabels[0]) profileLabels[0].textContent = text("player");
  if (profileLabels[1]) profileLabels[1].textContent = text("level");
  setText(".startup-language-control .profile-label", text("language"));
  setText("#pgnNav h2", text("pgnReplay"));
  setText("#pgnImportAgain", text("importAnotherPgn"));
  setText("#trainerPanel h2", text("trainer"));
  setText("#trainerPrompt", text("findBestMove"));
  const trainerStats = qsa(".trainer-stats span");
  if (trainerStats[0]) trainerStats[0].textContent = text("solved");
  if (trainerStats[1]) trainerStats[1].textContent = text("streak");
  if (trainerStats[2]) trainerStats[2].textContent = text("attempts");
  setText("#trainerHintBtn", text("hint"));
  setText("#trainerRevealBtn", text("reveal"));
  setText("#trainerRestartBtn", text("restart"));
  setText("#clocks h2", text("clock"));
  const clockLabels = qsa(".clock-label");
  if (clockLabels[0]) clockLabels[0].textContent = text("red");
  if (clockLabels[1]) clockLabels[1].textContent = text("black");
  const modeOptions = modeSelect.querySelectorAll("option");
  if (modeOptions[0]) modeOptions[0].textContent = text("userVsAi");
  if (modeOptions[1]) modeOptions[1].textContent = text("trainer");
  if (modeOptions[2]) modeOptions[2].textContent = text("setupPosition");
  if (modeOptions[3]) modeOptions[3].textContent = text("humanLocal");
  if (modeOptions[4]) modeOptions[4].textContent = text("userOnline");
  if (modeOptions[5]) modeOptions[5].textContent = text("pgnViewer");
  const sideOptions = playerSide.querySelectorAll("option");
  if (sideOptions[0]) sideOptions[0].textContent = text("red");
  if (sideOptions[1]) sideOptions[1].textContent = text("black");
  for (const select of [aiLevelSelect, startupAiLevelSelect]) {
    const aiLevelOptions = select.querySelectorAll("option");
    if (aiLevelOptions[0]) aiLevelOptions[0].textContent = text("aiBeginner");
    if (aiLevelOptions[1]) aiLevelOptions[1].textContent = text("aiAmateur");
    if (aiLevelOptions[2]) aiLevelOptions[2].textContent = text("aiCounty");
    if (aiLevelOptions[3]) aiLevelOptions[3].textContent = text("aiMaster");
  }
  if (startupAiLevelWrap?.firstChild) startupAiLevelWrap.firstChild.textContent = `${text("aiLevel")} `;
  const controlsLabels = qsa(".controls label");
  if (controlsLabels[1]?.firstChild) controlsLabels[1].firstChild.textContent = `${text("youPlay")} `;
  if (controlsLabels[2]?.firstChild) controlsLabels[2].firstChild.textContent = `${text("aiLevel")} `;
  if (controlsLabels[3]?.firstChild) controlsLabels[3].firstChild.textContent = `${text("engineDepth")} `;
  setText("#newGameBtn", text("newGame"));
  setText(".analysis h2", text("moveAnalysis"));
  setText(".history h2", text("moves"));
  setText("#undoBtn", text("undo"));
  setText("#saveGameBtn", text("saveGame"));
  setText("#libraryBtn", text("library"));
  setText("#downloadPgnBtn", text("downloadPgn"));
  setText("#exitBtn", text("exit"));
  setText("#startupTitle", text("chooseMode"));
  setText("#startupModeStep .startup-hint", text("chooseModeHint"));
  setText("#startupLoginBtn", text("login"));
  setText("#startupSignupBtn", text("signup"));
  const optionLabels = [
    [text("vsAi"), text("vsAiHint")],
    [text("trainer"), text("trainerHintMode")],
    [text("setupPosition"), text("setupPositionHint")],
    [text("gameLibrary"), text("gameLibraryHint")],
    [text("vsHumanLocal"), text("vsHumanLocalHint")],
    [text("vsHumanOnline"), text("vsHumanOnlineHint")],
    [text("pgnViewer"), text("pgnViewerHint")],
  ];
  qsa("#startupModeStep .startup-option").forEach((btn, index) => {
    const strong = btn.querySelector("strong");
    const span = btn.querySelector("span");
    if (strong && optionLabels[index]) strong.textContent = optionLabels[index][0];
    if (span && optionLabels[index]) span.textContent = optionLabels[index][1];
  });
  setText("#startupSideStep h2", text("chooseSide"));
  setText("#startupSideStep .startup-hint", text("redFirst"));
  const sideLabels = [[text("playRed"), text("moveFirst")], [text("playBlack"), text("pikafishFirst")]];
  qsa("#startupSideStep .startup-side-option").forEach((btn, index) => {
    const strong = btn.querySelector("strong");
    const span = btn.querySelector("span");
    if (strong && sideLabels[index]) strong.textContent = sideLabels[index][0];
    if (span && sideLabels[index]) span.textContent = sideLabels[index][1];
  });
  setText("#startupSideBack", `← ${text("back")}`);
  setText("#loginTitle", text("login"));
  setText("#loginOverlay .startup-hint", text("loginHint"));
  const loginLabels = qsa("#loginForm .stack-label");
  if (loginLabels[0]?.firstChild) loginLabels[0].firstChild.textContent = `${text("username")}\n            `;
  if (loginLabels[1]?.firstChild) loginLabels[1].firstChild.textContent = `${text("password")}\n            `;
  setAttr("#loginName", "placeholder", text("yourName"));
  setAttr("#loginPassword", "placeholder", text("password"));
  setText("#loginSaveBtn", text("login"));
  setText("#signupBtn", text("signup"));
  setText("#gameEndTitle", text("gameOver"));
  setText("#gameEndNewBtn", text("newGame"));
  setText("#gameEndReviewBtn", text("analyzePgn"));
  setText("#pgnTitle", text("importPgn"));
  setText("#pgnOverlay .startup-hint", text("pgnImportHint"));
  setText("#pgnDropZone", text("dropPgn"));
  setText("#pgnOpenFileBtn", text("openFile"));
  setText("#libraryTitle", text("gameLibrary"));
  setText("#libraryHint", text("savedGamesHint"));
  setText("#librarySaveCurrentBtn", text("saveCurrentGame"));
  setText("#libraryImportPgnBtn", text("importPgnsToLibrary"));
  setAttr("#librarySearchInput", "placeholder", text("searchGames"));
  setAttr("#libraryPlayerFilter", "placeholder", text("playerFilter"));
  setAttr("#libraryEventFilter", "placeholder", text("eventFilter"));
  setAttr("#libraryYearFilter", "placeholder", text("yearFilter"));
  setAttr("#libraryOpeningFilter", "placeholder", text("openingFilter"));
  setText("#libraryClearFiltersBtn", text("clearFilters"));
  setText("#libraryFavoriteFilterText", text("favoritesOnly"));
  const resultOptions = libraryResultFilter.querySelectorAll("option");
  if (resultOptions[0]) resultOptions[0].textContent = text("allResults");
  if (resultOptions[1]) resultOptions[1].textContent = text("redWins");
  if (resultOptions[2]) resultOptions[2].textContent = text("blackWins");
  if (resultOptions[3]) resultOptions[3].textContent = text("draws");
  if (resultOptions[4]) resultOptions[4].textContent = text("unknownResult");
  setText("#setupGuide h2", text("setupGuide"));
  setText("#setupGuideText", text("setupGuideText"));
  setText("#setupPanel h2", text("setupPosition"));
  const setupLabels = qsa("#setupPanel .stack-label");
  if (setupLabels[0]?.firstChild) setupLabels[0].firstChild.textContent = `${text("turn")}\n            `;
  setText("#setupStartBtn", text("startPosition"));
  setText("#setupClearBtn", text("clearBoard"));
  setText("#setupPlayBtn", text("playPosition"));
  setText("#onlineOverlayTitle", text("onlinePlay"));
  const onlineLabel = document.querySelector("#onlineLobby label");
  if (onlineLabel?.firstChild) onlineLabel.firstChild.textContent = `${text("account")}\n              `;
  setAttr("#onlineNickname", "placeholder", text("loginFirst"));
  setText("#onlineCreateBtn", text("createRoom"));
  setText("#onlineQueueBtn", text("randomMatch"));
  setText("#onlineRankedQueueBtn", text("rankMatch"));
  setAttr("#onlineJoinCode", "placeholder", text("roomCode"));
  setText("#onlineJoinBtn", text("join"));
  setText("#onlineSpectateBtn", text("spectate"));
  setText(".online-label", text("room"));
  setText("#onlineCopyCode", text("copy"));
  setText("#onlineLeaveBtn", text("leave"));
  setText("#onlineResignBtn", text("resign"));
  setAttr("#fenText", "title", text("clickToCopy"));
  setAttr("#fenCopyBtn", "title", text("copyFen"));
  setText("#fenCopyBtn", text("copy"));
  setAttr("#pgnFirstBtn", "title", text("start"));
  setAttr("#pgnPrevBtn", "title", text("previous"));
  setAttr("#pgnNextBtn", "title", text("next"));
  setAttr("#pgnLastBtn", "title", text("end"));
  setText("#pgnPlayFromHereBtn", text("playFromHere"));
  setAttr("#loginCloseBtn", "aria-label", text("close"));
  setAttr("#pgnOverlayClose", "aria-label", text("close"));
  setAttr("#libraryOverlayClose", "aria-label", text("close"));
  setAttr("#overlayCloseBtn", "aria-label", text("close"));
  setAttr("#onlineCopyCode", "title", text("copy"));
  if (!history.length && modeSelect.value !== "pgn") moveScore.textContent = text("moveToSeeScore");
  renderProfile();
  renderBoard();
  renderHistory();
  renderTrainerPanel();
  renderSetupPanel();
  if (online) renderOnlineMatch();
  if (modeSelect.value === "pgn") {
    pgnUpdateNavUI();
    pgnRenderAnalysis();
  }
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

function findKing(color, targetBoard = board) {
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const piece = targetBoard[r][c];
      if (piece?.toLowerCase() === "k" && colorOf(piece) === color) return { r, c };
    }
  }
  return null;
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

function legalMovesOnBoard(r, c, targetBoard = board) {
  const piece = targetBoard[r]?.[c];
  const color = colorOf(piece);
  if (!piece || !color) return [];
  return pseudoMoves(r, c, targetBoard).filter(move => {
    const next = cloneBoard(targetBoard);
    next[move.r][move.c] = piece;
    next[r][c] = null;
    return !isInCheck(color, next);
  });
}

function attacksSquare(fromR, fromC, toR, toC, targetBoard = board) {
  const piece = targetBoard[fromR]?.[fromC];
  const color = colorOf(piece);
  const kind = piece?.toLowerCase();
  if (!piece || !inBounds(toR, toC) || (fromR === toR && fromC === toC)) return false;
  const dr = toR - fromR;
  const dc = toC - fromC;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if (kind === "k") {
    if (palace(color, toR, toC) && adr + adc === 1) return true;
    return fromC === toC && targetBoard[toR]?.[toC]?.toLowerCase() === "k" && piecesBetween({ r: fromR, c: fromC }, { r: toR, c: toC }, targetBoard).length === 0;
  }
  if (kind === "a") return palace(color, toR, toC) && adr === 1 && adc === 1;
  if (kind === "b") {
    const staysHome = color === "red" ? toR >= 5 : toR <= 4;
    return staysHome && adr === 2 && adc === 2 && !targetBoard[fromR + dr / 2]?.[fromC + dc / 2];
  }
  if (kind === "n") {
    if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
    const legR = fromR + (adr === 2 ? Math.sign(dr) : 0);
    const legC = fromC + (adc === 2 ? Math.sign(dc) : 0);
    return !targetBoard[legR]?.[legC];
  }
  if (kind === "r") {
    return (fromR === toR || fromC === toC) && piecesBetween({ r: fromR, c: fromC }, { r: toR, c: toC }, targetBoard).length === 0;
  }
  if (kind === "c") {
    return (fromR === toR || fromC === toC) && piecesBetween({ r: fromR, c: fromC }, { r: toR, c: toC }, targetBoard).length === 1;
  }
  if (kind === "p") {
    const forward = color === "red" ? -1 : 1;
    if (dr === forward && dc === 0) return true;
    return crossedRiver(color, fromR) && dr === 0 && adc === 1;
  }
  return false;
}

function attackersToSquare(r, c, byColor, targetBoard = board, skip = null) {
  const attackers = [];
  for (let fromR = 0; fromR < 10; fromR += 1) {
    for (let fromC = 0; fromC < 9; fromC += 1) {
      if (skip && skip.r === fromR && skip.c === fromC) continue;
      const piece = targetBoard[fromR][fromC];
      if (colorOf(piece) !== byColor) continue;
      if (attacksSquare(fromR, fromC, r, c, targetBoard)) attackers.push({ r: fromR, c: fromC, piece });
    }
  }
  return attackers;
}

function applyUciToBoard(uci, sourceBoard = board) {
  const move = uciToMove(uci);
  if (!move) return null;
  const piece = sourceBoard[move.fromR]?.[move.fromC];
  if (!piece) return null;
  const nextBoard = cloneBoard(sourceBoard);
  const captured = nextBoard[move.toR][move.toC];
  nextBoard[move.toR][move.toC] = piece;
  nextBoard[move.fromR][move.fromC] = null;
  return { move, piece, captured, nextBoard };
}

function highestThreatFrom(r, c, mover, targetBoard = board) {
  const enemy = oppositeColor(mover);
  let best = null;
  for (let targetR = 0; targetR < 10; targetR += 1) {
    for (let targetC = 0; targetC < 9; targetC += 1) {
      const piece = targetBoard[targetR][targetC];
      if (colorOf(piece) !== enemy) continue;
      if (!attacksSquare(r, c, targetR, targetC, targetBoard)) continue;
      const value = pieceValue(piece);
      if (!best || value > best.value) best = { r: targetR, c: targetC, piece, value };
    }
  }
  return best;
}

function pinnedPieceByLine(piece, r, c, mover, targetBoard = board) {
  const kind = piece?.toLowerCase();
  if (kind !== "r" && kind !== "k") return null;
  const enemyKing = findKing(oppositeColor(mover), targetBoard);
  if (!enemyKing || (enemyKing.r !== r && enemyKing.c !== c)) return null;
  const between = piecesBetween({ r, c }, enemyKing, targetBoard);
  if (between.length === 1 && colorOf(between[0].piece) === oppositeColor(mover)) return between[0];
  return null;
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
  return `${colorLabel(record.side)} ${pieceLabel(record.piece)} ${squareToUci(record.fromR, record.fromC)}-${squareToUci(record.toR, record.toC)}`;
}

function displayedMoveLabel(record) {
  return lang === "zh" ? (record.notation || moveLabel(record)) : moveLabel(record);
}

function notationNumber(value, color) {
  return color === "red" ? NOTATION_NUMBERS[value] : String(value);
}

function notationFile(c, color) {
  return notationNumber(color === "red" ? 9 - c : c + 1, color);
}

function sameFilePieceRows(sourceBoard, piece, file) {
  const rows = [];
  for (let r = 0; r < 10; r += 1) {
    if (sourceBoard[r][file] === piece) rows.push(r);
  }
  return rows;
}

function notationPrefix(record, sourceBoard) {
  const rows = sameFilePieceRows(sourceBoard, record.piece, record.fromC);
  if (rows.length !== 2) return `${NOTATION_PIECES[record.piece] || record.piece}${notationFile(record.fromC, record.side)}`;
  const frontRow = record.side === "red" ? Math.min(...rows) : Math.max(...rows);
  return `${record.fromR === frontRow ? "前" : "后"}${NOTATION_PIECES[record.piece] || record.piece}`;
}

function xiangqiMoveNotation(record, sourceBoard) {
  const pieceKind = record.piece.toLowerCase();
  const prefix = notationPrefix(record, sourceBoard);
  const isHorizontal = record.fromR === record.toR;
  const isForward = record.side === "red" ? record.toR < record.fromR : record.toR > record.fromR;
  if (isHorizontal) return `${prefix}平${notationFile(record.toC, record.side)}`;
  const verb = isForward ? "进" : "退";
  const straightMover = pieceKind === "r" || pieceKind === "c" || pieceKind === "k" || pieceKind === "p";
  const suffix = straightMover && record.fromC === record.toC
    ? notationNumber(Math.abs(record.toR - record.fromR), record.side)
    : notationFile(record.toC, record.side);
  return `${prefix}${verb}${suffix}`;
}

function moveLabelFromBoard(uci, sourceBoard, side) {
  const move = uciToMove(uci);
  if (!move) return null;
  const piece = sourceBoard[move.fromR]?.[move.fromC];
  if (!piece) return uci;
  if (lang !== "zh") {
    return `${colorLabel(side)} ${pieceLabel(piece)} ${squareToUci(move.fromR, move.fromC)}-${squareToUci(move.toR, move.toC)}`;
  }
  return xiangqiMoveNotation({
    fromR: move.fromR,
    fromC: move.fromC,
    toR: move.toR,
    toC: move.toC,
    piece,
    side,
  }, sourceBoard);
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
    ["Site", "xiangqi"],
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

function loadGameLibrary() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GAME_LIBRARY_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter(item => item && typeof item.id === "string" && typeof item.pgn === "string")
      : [];
  } catch {
    return [];
  }
}

function saveGameLibrary(games) {
  localStorage.setItem(GAME_LIBRARY_KEY, JSON.stringify(games.slice(0, GAME_LIBRARY_LIMIT)));
}

function libraryFilterState() {
  return {
    query: librarySearchInput.value,
    result: libraryResultFilter.value,
    player: libraryPlayerFilter.value,
    event: libraryEventFilter.value,
    year: libraryYearFilter.value,
    opening: libraryOpeningFilter.value,
    favorite: libraryFavoriteFilter.checked,
  };
}

function hasLibraryFilters(filters = libraryFilterState()) {
  return Object.values(filters).some(value => typeof value === "boolean" ? value : String(value || "").trim());
}

function librarySearchText(game) {
  return [
    game.searchText,
    game.title,
    game.details,
    game.event,
    game.red,
    game.black,
    game.redTeam,
    game.blackTeam,
    game.date,
    game.result,
    game.opening,
    game.sourceName,
  ].join(" ").toLowerCase();
}

function matchesLocalLibraryFilters(game, filters) {
  const query = String(filters.query || "").trim().toLowerCase();
  if (query && !librarySearchText(game).includes(query)) return false;
  if (filters.favorite && !game.favorite) return false;
  if (filters.result && game.result !== filters.result) return false;

  const event = String(filters.event || "").trim().toLowerCase();
  if (event && !String(game.event || game.details || "").toLowerCase().includes(event)) return false;

  const player = String(filters.player || "").trim().toLowerCase();
  if (player) {
    const haystack = [game.red, game.black, game.redTeam, game.blackTeam, game.title].join(" ").toLowerCase();
    if (!haystack.includes(player)) return false;
  }

  const year = String(filters.year || "").trim();
  if (year && !String(game.date || "").startsWith(year)) return false;

  const opening = String(filters.opening || "").trim().toLowerCase();
  if (opening && !String(game.opening || game.details || "").toLowerCase().includes(opening)) return false;

  return true;
}

function gameLibraryEntryFromPgn(pgn, fallbackTitle = "Xiangqi Game") {
  const red = pgnHeaderValue(pgn, "Red") || pgnHeaderValue(pgn, "White");
  const black = pgnHeaderValue(pgn, "Black");
  const redTeam = pgnHeaderValue(pgn, "RedTeam");
  const blackTeam = pgnHeaderValue(pgn, "BlackTeam");
  const event = pgnHeaderValue(pgn, "Event") || pgnHeaderValue(pgn, "Game") || fallbackTitle;
  const date = pgnHeaderValue(pgn, "Date");
  const result = pgnHeaderValue(pgn, "Result") || "*";
  const opening = pgnHeaderValue(pgn, "Opening");
  const moves = pgnParseText(pgn).length;
  const title = red && black ? `${red} vs ${black}` : event;
  const details = [event, date, result, opening && opening !== "-" ? opening : "", text("movesCount", moves)].filter(Boolean).join(" · ");
  const searchText = [title, details, event, red, black, redTeam, blackTeam, date, result, opening].join(" ").toLowerCase();
  return {
    id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    details,
    pgn,
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
    favorite: false,
    savedAt: new Date().toISOString(),
  };
}

function currentPgnForLibrary() {
  if (modeSelect.value === "pgn" && pgnSourceText) return pgnSourceText;
  if (history.length) return buildPgn();
  return "";
}

let libraryRenderRequestId = 0;
let libraryRenderTimer = 0;

function librarySectionTitle(label) {
  const heading = document.createElement("h3");
  heading.className = "library-section-title";
  heading.textContent = label;
  return heading;
}

function libraryGameRow(game, source, canDelete = false) {
  const row = document.createElement("article");
  row.className = "library-game";
  row.dataset.source = source;
  row.classList.toggle("favorite", Boolean(game.favorite));
  const meta = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = game.title || text("gameLibrary");
  const details = document.createElement("span");
  const moveCount = game.moves ?? (game.pgn ? pgnParseText(game.pgn).length : 0);
  details.textContent = [game.details || text("movesCount", moveCount), game.sourceName].filter(Boolean).join(" · ");
  meta.append(title, details);

  const actions = document.createElement("div");
  actions.className = "library-game-actions";
  const favorite = document.createElement("button");
  favorite.type = "button";
  favorite.className = "library-favorite-btn";
  favorite.dataset.action = "favorite";
  favorite.dataset.source = source;
  favorite.dataset.id = game.id;
  favorite.dataset.favorite = game.favorite ? "false" : "true";
  favorite.textContent = game.favorite ? "★" : "☆";
  favorite.title = game.favorite ? text("unfavoriteGame") : text("favoriteGame");
  favorite.setAttribute("aria-label", favorite.title);

  const open = document.createElement("button");
  open.type = "button";
  open.dataset.action = "open";
  open.dataset.source = source;
  open.dataset.id = game.id;
  open.textContent = text("openGame");
  actions.append(favorite, open);

  if (canDelete) {
    const del = document.createElement("button");
    del.type = "button";
    del.dataset.action = "delete";
    del.dataset.source = source;
    del.dataset.id = game.id;
    del.className = "danger-btn";
    del.textContent = text("deleteGame");
    actions.append(del);
  }

  row.append(meta, actions);
  return row;
}

function appendLibrarySection(fragment, title, games, source, canDelete = false) {
  if (!games.length) return false;
  fragment.append(librarySectionTitle(title));
  for (const game of games) fragment.append(libraryGameRow(game, source, canDelete));
  return true;
}

async function renderGameLibrary() {
  const requestId = ++libraryRenderRequestId;
  const filters = libraryFilterState();
  const allLocalGames = loadGameLibrary();
  const localGames = allLocalGames.filter(game => matchesLocalLibraryFilters(game, filters));
  let indexedResult = null;
  let indexedError = null;

  if (window.api?.pgnLibrary?.search) {
    try {
      indexedResult = await window.api.pgnLibrary.search({ ...filters, limit: 100 });
    } catch (error) {
      indexedError = error;
    }
  }
  if (requestId !== libraryRenderRequestId) return;

  const fragment = document.createDocumentFragment();
  const hasLocal = appendLibrarySection(fragment, text("localSavedGames"), localGames, "local", true);
  const indexedGames = Array.isArray(indexedResult?.games) ? indexedResult.games : [];
  const hasIndexed = appendLibrarySection(fragment, text("indexedGames"), indexedGames, "indexed", false);

  if (!hasLocal && !hasIndexed) {
    const empty = document.createElement("p");
    empty.className = "library-empty";
    empty.textContent = hasLibraryFilters(filters) ? text("noLibraryMatches") : text("noSavedGames");
    fragment.append(empty);
  }

  libraryList.replaceChildren(fragment);
  const counts = [];
  if (allLocalGames.length || hasLibraryFilters(filters)) {
    counts.push(text("localLibrarySearchCount", localGames.length, allLocalGames.length));
  }
  if (indexedResult) {
    counts.push(text("librarySearchCount", indexedGames.length, indexedResult.total || 0));
  }
  libraryCount.textContent = counts.join(" · ");
  if (indexedError) libraryStatus.textContent = text("couldNotReadFile", indexedError?.message || "unknown");
}

function scheduleRenderGameLibrary() {
  window.clearTimeout(libraryRenderTimer);
  libraryRenderTimer = window.setTimeout(() => {
    void renderGameLibrary();
  }, 160);
}

function clearLibraryFilters() {
  librarySearchInput.value = "";
  libraryResultFilter.value = "";
  libraryPlayerFilter.value = "";
  libraryEventFilter.value = "";
  libraryYearFilter.value = "";
  libraryOpeningFilter.value = "";
  libraryFavoriteFilter.checked = false;
  void renderGameLibrary();
}

async function importPgnLibraryFile() {
  if (!window.api?.pgnLibrary?.importFile) {
    libraryStatus.textContent = text("libraryImportUnavailable");
    return;
  }
  libraryImportPgnBtn.disabled = true;
  libraryStatus.textContent = text("indexingLibrary");
  try {
    const result = await window.api.pgnLibrary.importFile();
    if (!result) {
      libraryStatus.textContent = "";
      return;
    }
    libraryStatus.textContent = text("importedLibrary", result.count || 0, result.source?.name || text("pgnFile"));
    await renderGameLibrary();
  } catch (error) {
    libraryStatus.textContent = text("couldNotReadFile", error?.message || "unknown");
  } finally {
    libraryImportPgnBtn.disabled = false;
  }
}

function setLocalLibraryFavorite(id, favorite) {
  const games = loadGameLibrary();
  const updated = games.map(game => {
    if (game.id !== id) return game;
    const next = { ...game, favorite: Boolean(favorite) };
    if (next.favorite) {
      next.favoriteAt = new Date().toISOString();
    } else {
      delete next.favoriteAt;
    }
    return next;
  });
  saveGameLibrary(updated);
}

async function toggleLibraryFavorite(source, id, favorite) {
  try {
    if (source === "indexed") {
      if (!window.api?.pgnLibrary?.setFavorite) {
        libraryStatus.textContent = text("libraryImportUnavailable");
        return;
      }
      await window.api.pgnLibrary.setFavorite(id, favorite);
    } else {
      setLocalLibraryFavorite(id, favorite);
    }
    libraryStatus.textContent = text("favoriteSaved");
    await renderGameLibrary();
  } catch (error) {
    libraryStatus.textContent = text("couldNotReadFile", error?.message || "unknown");
  }
}

function openGameLibrary() {
  libraryOverlay.hidden = false;
  libraryStatus.textContent = "";
  void renderGameLibrary();
}

function closeGameLibrary() {
  libraryOverlay.hidden = true;
}

function saveCurrentGameToLibrary() {
  const pgn = currentPgnForLibrary();
  if (!pgn) {
    libraryStatus.textContent = text("noGameToSave");
    return;
  }
  const entry = gameLibraryEntryFromPgn(pgn, pgnSourceTitle || "Xiangqi Game");
  const games = [entry, ...loadGameLibrary()].slice(0, GAME_LIBRARY_LIMIT);
  try {
    saveGameLibrary(games);
  } catch (error) {
    libraryStatus.textContent = text("gameSaveFailed", error?.message || "unknown");
    return;
  }
  libraryStatus.textContent = text("gameSaved", entry.title);
  void renderGameLibrary();
  renderHistory();
}

function openLibraryGame(id) {
  const game = loadGameLibrary().find(item => item.id === id);
  if (!game) return;
  closeGameLibrary();
  hideStartupPicker();
  modeSelect.value = "pgn";
  modeSelect.dispatchEvent(new Event("change"));
  pgnLoadText(game.pgn, { title: game.title });
  pgnNav.hidden = false;
}

async function openIndexedLibraryGame(id) {
  if (!window.api?.pgnLibrary?.readGame) {
    libraryStatus.textContent = text("libraryImportUnavailable");
    return;
  }
  libraryStatus.textContent = text("readFile", text("pgnFile"));
  try {
    const result = await window.api.pgnLibrary.readGame(id);
    hideStartupPicker();
    modeSelect.value = "pgn";
    modeSelect.dispatchEvent(new Event("change"));
    const title = result?.game?.title || text("pgnFile");
    if (pgnLoadText(String(result?.text || ""), { title })) {
      closeGameLibrary();
      pgnNav.hidden = false;
    } else {
      libraryStatus.textContent = text("noMovesFound");
    }
  } catch (error) {
    libraryStatus.textContent = text("couldNotReadFile", error?.message || "unknown");
  }
}

function deleteLibraryGame(id) {
  const games = loadGameLibrary();
  const game = games.find(item => item.id === id);
  if (!game) return;
  if (!confirm(text("confirmDeleteGame", game.title || text("gameLibrary")))) return;
  saveGameLibrary(games.filter(item => item.id !== id));
  libraryStatus.textContent = text("gameDeleted");
  void renderGameLibrary();
}

function shouldFlipBoard() {
  if (modeSelect.value === "online" && online && online.myColor === "black") return true;
  if (modeSelect.value === "ai" && playerSide.value === "black") return true;
  if (modeSelect.value === "trainer" && playerSide.value === "black") return true;
  return false;
}

function renderFileLabels(flipped) {
  if (lang !== "zh") {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
    topFileLabels.forEach((label, index) => { label.textContent = files[index] || ""; });
    bottomFileLabels.forEach((label, index) => { label.textContent = files[index] || ""; });
    return;
  }
  const blackFiles = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const redFiles = ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
  const top = flipped ? redFiles : blackFiles;
  const bottom = flipped ? blackFiles : redFiles;
  topFileLabels.forEach((label, index) => { label.textContent = top[index] || ""; });
  bottomFileLabels.forEach((label, index) => { label.textContent = bottom[index] || ""; });
}

function sameLine(a, b) {
  return a.length === b.length && a.every((move, index) => move === b[index]);
}

function currentOpeningLine() {
  return history.map(recordToUci);
}

function findOpeningEntry(line) {
  return OPENING_BOOK.find(entry => sameLine(entry.line, line)) || null;
}

function openingMoveNameForLine(line) {
  if (!line.length) return "";
  const previousEntry = findOpeningEntry(line.slice(0, -1));
  const lastUci = line[line.length - 1];
  const bookMove = previousEntry?.moves?.find(move => move.uci === lastUci);
  return bookMove ? (bookMove.name.zh || localized(bookMove.name)) : "";
}

function showOpeningOverlay(name) {
  if (!name || modeSelect.value === "setup" || modeSelect.value === "trainer" || modeSelect.value === "pgn") return;
  const id = ++openingOverlayId;
  openingOverlayText = name;
  window.setTimeout(() => {
    if (openingOverlayId !== id) return;
    openingOverlayText = "";
    renderBoard();
  }, 1800);
}

function renderOpeningOverlay() {
  if (!openingOverlayText) return;
  const overlay = document.createElement("div");
  overlay.className = "opening-name-overlay";
  overlay.textContent = openingOverlayText;
  boardEl.append(overlay);
}

function renderBoard() {
  const flipped = shouldFlipBoard();
  renderFileLabels(flipped);
  boardEl.classList.toggle("flipped", flipped);
  boardEl.classList.toggle("setup-mode", modeSelect.value === "setup");
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
      square.addEventListener("contextmenu", event => {
        if (modeSelect.value !== "setup") return;
        event.preventDefault();
        openSetupPieceMenu(event, r, c);
      });
      boardEl.append(square);
    }
  }
  if (!turnPill.classList.contains("winner")) {
    turnPill.textContent = text("colorToMove", turn);
    turnPill.classList.toggle("black", turn === "black");
  }
  fenText.textContent = boardToFen();
  renderOpeningOverlay();
}

function renderHistory() {
  moveList.innerHTML = "";
  if (modeSelect.value === "pgn" && pgnMoves.length) {
    renderPgnReviewHistory();
    return;
  }
  for (let i = 0; i < history.length; i += 2) {
    const red = history[i];
    const black = history[i + 1];
    const li = document.createElement("li");
    const moveNo = Math.floor(i / 2) + 1;
    const redText = red ? displayedMoveLabel(red) : "";
    const blackText = black ? displayedMoveLabel(black) : "";
    li.innerHTML = `<span class="move-no">${moveNo}.</span><span class="move-red">${redText}</span><span class="move-black">${blackText}</span>`;
    moveList.append(li);
  }
  moveList.scrollTop = moveList.scrollHeight;
  downloadPgnBtn.hidden = history.length === 0 || modeSelect.value === "pgn";
  saveGameBtn.hidden = modeSelect.value === "setup" || (modeSelect.value === "pgn" ? !pgnSourceText : history.length === 0);
}

function prepareEditablePosition(nextBoard = board, nextTurn = turn) {
  board = cloneBoard(nextBoard);
  turn = nextTurn;
  selected = null;
  legalTargets = [];
  history = [];
  lastMove = null;
  gameResult = null;
  busy = false;
  lastUserRecommendationText = "";
  currentEval = 0;
  turnPill.classList.remove("winner");
  moveScore.textContent = modeSelect.value === "setup" ? text("setupReady") : text("moveToSeeScore");
  pvLine.textContent = "";
  pvLine.hidden = true;
  updateScore(0);
}

function sameSquare(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function setupPieceAllowedSquares(piece) {
  const color = colorOf(piece);
  const lower = piece.toLowerCase();
  if (lower === "k") return color === "red"
    ? [[7, 3], [7, 4], [7, 5], [8, 3], [8, 4], [8, 5], [9, 3], [9, 4], [9, 5]]
    : [[0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5]];
  if (lower === "a") return color === "red"
    ? [[7, 3], [7, 5], [8, 4], [9, 3], [9, 5]]
    : [[0, 3], [0, 5], [1, 4], [2, 3], [2, 5]];
  if (lower === "b") return color === "red"
    ? [[5, 2], [5, 6], [7, 0], [7, 4], [7, 8], [9, 2], [9, 6]]
    : [[0, 2], [0, 6], [2, 0], [2, 4], [2, 8], [4, 2], [4, 6]];
  return null;
}

function canPawnOccupy(piece, r, c) {
  if (piece === "P") {
    if (r <= 4) return true;
    return (r === 5 || r === 6) && c % 2 === 0;
  }
  if (piece === "p") {
    if (r >= 5) return true;
    return (r === 3 || r === 4) && c % 2 === 0;
  }
  return false;
}

function countSetupPieces(piece, ignoreR, ignoreC) {
  let count = 0;
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (r === ignoreR && c === ignoreC) continue;
      if (board[r][c] === piece) count += 1;
    }
  }
  return count;
}

function setupPlacementError(piece, r, c) {
  if (!piece) return "";
  const lower = piece.toLowerCase();
  const allowedSquares = setupPieceAllowedSquares(piece);
  if (allowedSquares && !allowedSquares.some(square => sameSquare(square, [r, c]))) {
    return text("setupIllegalSquare", pieceLabel(piece), squareToUci(r, c));
  }
  if (lower === "p" && !canPawnOccupy(piece, r, c)) {
    return text("setupIllegalSquare", pieceLabel(piece), squareToUci(r, c));
  }
  const max = SETUP_MAX_PIECES[lower];
  if (max && countSetupPieces(piece, r, c) >= max) {
    return text("setupTooManyPieces", colorLabel(colorOf(piece)), pieceLabel(piece), max);
  }
  return "";
}

function setupBoardError() {
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const piece = board[r][c];
      const error = setupPlacementError(piece, r, c);
      if (error) return error;
    }
  }
  if (!findKing("red") || !findKing("black")) return text("setupNeedsKings");
  if (kingsFacing(board)) return text("setupKingsFacing");
  return "";
}

function applySetupPiece(r, c, piece) {
  const error = setupPlacementError(piece, r, c);
  if (error) {
    moveScore.textContent = error;
    return;
  }
  board[r][c] = piece || null;
  turn = setupTurnSelect.value === "black" ? "black" : "red";
  prepareEditablePosition(board, turn);
  closeSetupPieceMenu();
  renderBoard();
  renderHistory();
}

function closeSetupPieceMenu() {
  setupMenuSquare = null;
  setupPieceMenu.hidden = true;
  setupPieceMenu.innerHTML = "";
}

function openSetupPieceMenu(event, r, c) {
  setupMenuSquare = { r, c };
  setupPieceMenu.innerHTML = "";
  const entries = ["", ...SETUP_PIECE_CODES];
  for (const code of entries) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = code ? `setup-piece-option ${colorOf(code)}` : "setup-piece-option empty";
    button.textContent = code ? PIECES[code] : text("emptySquare");
    const error = setupPlacementError(code, r, c);
    button.disabled = !!error;
    button.title = error || (code ? `${colorLabel(colorOf(code))} ${pieceLabel(code)}` : text("emptySquare"));
    button.addEventListener("click", () => {
      if (!setupMenuSquare) return;
      applySetupPiece(setupMenuSquare.r, setupMenuSquare.c, code);
    });
    setupPieceMenu.append(button);
  }
  setupPieceMenu.hidden = false;
  setupPieceMenu.style.left = `${event.clientX}px`;
  setupPieceMenu.style.top = `${event.clientY}px`;
  requestAnimationFrame(() => {
    const rect = setupPieceMenu.getBoundingClientRect();
    const left = Math.min(event.clientX, window.innerWidth - rect.width - 8);
    const top = Math.min(event.clientY, window.innerHeight - rect.height - 8);
    setupPieceMenu.style.left = `${Math.max(8, left)}px`;
    setupPieceMenu.style.top = `${Math.max(8, top)}px`;
  });
}

function setupSquareClick(r, c) {
  applySetupPiece(r, c, "");
}

function setupStartPosition() {
  const parsed = parseFen(START_FEN);
  modeSelect.value = "setup";
  setupTurnSelect.value = parsed.turn;
  prepareEditablePosition(parsed.board, parsed.turn);
  renderSetupPanel();
  renderBoard();
  renderHistory();
}

function setupClearBoard() {
  modeSelect.value = "setup";
  setupTurnSelect.value = "red";
  prepareEditablePosition(Array.from({ length: 10 }, () => Array(9).fill(null)), "red");
  renderSetupPanel();
  renderBoard();
  renderHistory();
}

function playSetupPosition() {
  turn = setupTurnSelect.value === "black" ? "black" : "red";
  prepareEditablePosition(board, turn);
  const error = setupBoardError();
  if (error) {
    moveScore.textContent = error;
    renderBoard();
    renderHistory();
    return;
  }
  modeSelect.value = "human";
  setupPanel.hidden = true;
  qs("#clocks").hidden = false;
  undoBtn.disabled = false;
  moveScore.textContent = text("setupApplied");
  renderBoard();
  renderHistory();
  startClock();
  evaluatePosition();
}

function canHumanMove() {
  if (busy) return false;
  if (modeSelect.value === "pgn") return false;
  if (modeSelect.value === "online") {
    if (!online || online.role !== "player" || online.status !== "playing") return false;
    if (online.undoRequest) return false;
    return online.myColor === turn;
  }
  if (modeSelect.value === "human") return true;
  if (modeSelect.value === "trainer") {
    return playerSide.value === turn && trainerState.status === "ready";
  }
  return playerSide.value === turn;
}

async function onSquare(r, c) {
  if (modeSelect.value === "setup") {
    setupSquareClick(r, c);
    return;
  }
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
    statusText.textContent = text("flagged", loser, winner);
    showGameEndOverlay(gameResult, statusText.textContent);
  }
}

function applyMove(fromR, fromC, toR, toC, source) {
  const piece = board[fromR][fromC];
  const captured = board[toR][toC];
  const record = { fromR, fromC, toR, toC, piece, captured, side: turn, source, beforeEval: currentEval };
  history.push({ ...record, notation: xiangqiMoveNotation(record, board) });
  board[toR][toC] = piece;
  board[fromR][fromC] = null;
  lastMove = { fromR, fromC, toR, toC };
  turn = turn === "red" ? "black" : "red";
  selected = null;
  legalTargets = [];
  clockOnTurnChanged();
  playSound(isInCheck(turn) ? "check" : (captured ? "capture" : "move"));
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
  showOpeningOverlay(openingMoveNameForLine(currentOpeningLine()));
  renderBoard();
  renderHistory();

  // Online: send the move to the server (only when this client originated it).
  if (isOnline && online && source !== "remote" && online.role === "player") {
    onlineSendMove(playedUci, boardToFen()).catch(err => {
      onlineMatchStatus.textContent = text("moveNotSent", err.message);
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
  const message = gameResultMessage(ending);
  statusText.textContent = message;
  turnPill.textContent = message;
  turnPill.classList.add("winner");
  turnPill.classList.toggle("black", ending.winner === "black");
  showGameEndOverlay(ending, message);
}

function gameResultMessage(result) {
  if (!result) return "";
  if (result.winner === "draw") return text("drawBy", result.reason);
  return text("winsBy", result.winner, result.reason);
}

function piecesBetween(a, b, targetBoard = board) {
  if (a.r !== b.r && a.c !== b.c) return [];
  const dr = Math.sign(b.r - a.r);
  const dc = Math.sign(b.c - a.c);
  const pieces = [];
  for (let r = a.r + dr, c = a.c + dc; r !== b.r || c !== b.c; r += dr, c += dc) {
    const piece = targetBoard[r][c];
    if (piece) pieces.push({ r, c, piece });
  }
  return pieces;
}

function attackingPiecesToKing(loser, targetBoard = board) {
  const king = findKing(loser, targetBoard);
  if (!king) return [];
  const attacker = loser === "red" ? "black" : "red";
  const attackers = [];
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const piece = targetBoard[r][c];
      if (colorOf(piece) !== attacker) continue;
      if (pseudoMoves(r, c, targetBoard).some(move => move.r === king.r && move.c === king.c)) {
        attackers.push({ r, c, piece, kind: piece.toLowerCase() });
      }
    }
  }
  return attackers;
}

function horseMatePattern(horse, loser) {
  const king = findKing(loser);
  if (!king) return "马杀";
  const file = squareToUci(horse.r, horse.c)[0];
  const rankFromLoser = loser === "black" ? horse.r + 1 : 10 - horse.r;
  if ((file === "c" || file === "g") && rankFromLoser === 2) return "卧槽马";
  if ((file === "d" || file === "f") && rankFromLoser === 2) return "挂角马";
  if ((file === "c" || file === "g") && rankFromLoser === 3) return "钓鱼马";
  if ((file === "c" || file === "g") && rankFromLoser === 4) return "侧面虎 / 高钓马";
  return "马杀";
}

function detectMatePattern(result = gameResult) {
  if (!result || result.winner === "draw" || result.reason !== "checkmate") return text("noCheckmatePattern");
  const loser = result.winner === "red" ? "black" : "red";
  const king = findKing(loser);
  if (!king) return text("unknownMatePattern");
  const attackers = attackingPiecesToKing(loser);
  const last = history.at(-1);
  const lastKind = last?.piece?.toLowerCase();

  if (kingsFacing(board)) return "对面笑 / 白脸将";

  const cannonAttackers = attackers.filter(piece => piece.kind === "c");
  for (const cannon of cannonAttackers) {
    const screens = piecesBetween(cannon, king);
    if (screens.length === 1 && screens[0].piece.toLowerCase() === "n" && colorOf(screens[0].piece) === result.winner) {
      return "马后炮";
    }
  }
  if (cannonAttackers.length >= 2) return "重炮 / 叠炮 / 双炮";
  if (cannonAttackers.length) {
    const sameFileCannons = [];
    for (let r = 0; r < 10; r += 1) {
      const piece = board[r][king.c];
      if (piece?.toLowerCase() === "c" && colorOf(piece) === result.winner) sameFileCannons.push(piece);
    }
    if (sameFileCannons.length >= 2) return "重炮 / 叠炮 / 双炮";
    if (lastKind === "c") return "空头炮";
    return "炮杀";
  }

  const rookAttackers = attackers.filter(piece => piece.kind === "r");
  if (rookAttackers.length >= 2) return "双车错 / 长短车";
  if (rookAttackers.length && lastKind === "r") {
    if (last?.toR === (loser === "black" ? 0 : 9)) return "海底捞月 / 沉底月";
    if (last?.toC === 4 && last?.captured?.toLowerCase() === "a") return "大胆穿心 / 大刀剜心";
    return "车杀";
  }

  const horseAttackers = attackers.filter(piece => piece.kind === "n");
  if (horseAttackers.length >= 2) return "双马饮泉";
  if (horseAttackers.length) return horseMatePattern(horseAttackers[0], loser);

  const pawnAttackers = attackers.filter(piece => piece.kind === "p");
  if (pawnAttackers.length >= 2) return "二鬼拍门";
  if (pawnAttackers.length && lastKind === "p") return "老兵搜山 / 老卒搜山";

  const palacePieces = [[0, 3], [0, 5], [1, 4], [2, 3], [2, 5], [7, 3], [7, 5], [8, 4], [9, 3], [9, 5]]
    .filter(([r, c]) => palace(loser, r, c) && colorOf(board[r][c]) === loser)
    .length;
  if (palacePieces >= 2) return "闷杀 / 闷宫";
  return text("unknownMatePattern");
}

function showGameEndOverlay(result = gameResult, message = gameResultMessage(result)) {
  if (!result || !history.length || modeSelect.value === "pgn") return;
  const wasHidden = gameEndOverlay.hidden;
  const pattern = detectMatePattern(result);
  gameEndResult.textContent = message;
  gameEndPattern.textContent = pattern;
  matePatternToast.textContent = pattern;
  matePatternToast.hidden = false;
  if (wasHidden) playSound("end");
  if (!wasHidden || gameEndOverlayTimer) return;
  gameEndOverlayTimer = setTimeout(() => {
    matePatternToast.hidden = true;
    gameEndOverlay.hidden = false;
    gameEndOverlayTimer = null;
  }, GAME_END_OVERLAY_DELAY_MS);
}

function closeGameEndOverlay() {
  if (gameEndOverlayTimer) {
    clearTimeout(gameEndOverlayTimer);
    gameEndOverlayTimer = null;
  }
  matePatternToast.hidden = true;
  matePatternToast.textContent = "";
  gameEndOverlay.hidden = true;
}

async function reviewFinishedGame() {
  if (!history.length) return;
  const pgn = buildPgn();
  closeGameEndOverlay();
  closeMatchOverlay();
  modeSelect.value = "pgn";
  modeSelect.dispatchEvent(new Event("change"));
  await importPgnSource(pgn, text("finishedGame"));
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
  if (grade.quality === "best") return text("bestMove", "").replace(": .", ".").replace("：。", "。");
  if (grade.quality === "good") return text("goodMoveLoss", cpLossText(grade.lossCp));
  if (grade.lossCp != null) return text("needsWork", cpLossText(grade.lossCp));
  return "";
}

function coachMoveReasons(uci, sourceBoard = board, mover = turn) {
  const applied = applyUciToBoard(uci, sourceBoard);
  if (!applied) return [];
  const { move, piece, captured, nextBoard } = applied;
  const enemy = oppositeColor(mover);
  const reasons = [];

  if (isInCheck(enemy, nextBoard)) reasons.push(text("coachCheck"));

  if (captured) {
    reasons.push(text("coachCapture", pieceLabel(captured)));
    const recapture = attackersToSquare(move.toR, move.toC, enemy, nextBoard);
    if (!recapture.length) {
      reasons.push(text("coachFreeCapture"));
    } else {
      const diff = pieceValue(captured) - pieceValue(piece);
      if (diff > 80) reasons.push(text("coachTradeWin", pieceLabel(captured), pieceLabel(piece)));
      else if (diff >= -40) reasons.push(text("coachTradeEven"));
      else reasons.push(text("coachTradeRisk"));
    }
  }

  const threat = highestThreatFrom(move.toR, move.toC, mover, nextBoard);
  if (threat && threat.piece.toLowerCase() !== "k" && (!captured || threat.value >= pieceValue(captured))) {
    reasons.push(text("coachThreat", pieceLabel(threat.piece), squareToUci(threat.r, threat.c)));
  }

  const pin = pinnedPieceByLine(piece, move.toR, move.toC, mover, nextBoard);
  if (pin) reasons.push(text("coachPin", pieceLabel(pin.piece)));

  const protectors = attackersToSquare(move.toR, move.toC, mover, nextBoard, { r: move.toR, c: move.toC });
  if (protectors.length) reasons.push(text("coachProtected", protectors.length));

  const beforeMobility = pseudoMoves(move.fromR, move.fromC, sourceBoard).length;
  const afterMobility = legalMovesOnBoard(move.toR, move.toC, nextBoard).length;
  if (!captured && afterMobility >= beforeMobility + 2) reasons.push(text("coachMobility", pieceLabel(piece)));

  return [...new Set(reasons)].slice(0, 4);
}

function coachMoveText(uci, sourceBoard = board, mover = turn) {
  const reasons = coachMoveReasons(uci, sourceBoard, mover);
  if (!reasons.length) return `${text("coachIntro")}\n- ${text("coachNoClear")}`;
  return `${text("coachIntro")}\n- ${reasons.join("\n- ")}`;
}

function showRecommendations(moves, beforeBoard, mover, playedUci, playedScore = null) {
  const quality = moveQualityText(gradePlayedMove(moves, mover, playedUci, playedScore));
  const best = moves.find(m => m.move);
  const recLines = moves
    .filter(m => m.move)
    .slice(0, 3)
    .map((m, i) => {
      const label = moveLabelFromBoard(m.move, beforeBoard, mover) || m.move;
      const scoreText = formatRecommendationScore(m, mover);
      const matched = m.move === playedUci ? " ✓" : "";
      return `${i + 1}. ${label} (${scoreText})${matched}`;
    });
  const recommendations = recLines.length ? text("recommendations", recLines.join("\n")) : "";
  const coach = best?.move ? coachMoveText(best.move, beforeBoard, mover) : "";
  lastUserRecommendationText = [quality, recommendations, coach].filter(Boolean).join("\n\n");
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
  const redHeight = 50 + (clamped / 600) * 50;
  const blackHeight = 100 - redHeight;
  redBar.style.height = `${redHeight}%`;
  blackBar.style.height = `${blackHeight}%`;
}

function engineMoveScore(move, mover) {
  if (!move || move.mate != null || move.score == null) return null;
  return mover === "red" ? Number(move.score) : -Number(move.score);
}

const AI_LEVELS = {
  beginner: {
    movetime: 160,
    count: 5,
    maxLossCp: 650,
    minScoreCp: -700,
    temperatureCp: 260,
    blunderChance: 0.28,
    randomLegalChance: 0.10,
    blunderExtraCp: 700,
  },
  amateur: {
    movetime: 260,
    count: 5,
    maxLossCp: 320,
    minScoreCp: -300,
    temperatureCp: 150,
    blunderChance: 0.13,
    randomLegalChance: 0.03,
    blunderExtraCp: 420,
  },
  county: {
    movetime: 520,
    count: 6,
    maxLossCp: 150,
    minScoreCp: -120,
    temperatureCp: 85,
    blunderChance: 0.04,
    randomLegalChance: 0,
    blunderExtraCp: 180,
  },
  master: {
    movetime: 950,
    count: 8,
    maxLossCp: 45,
    minScoreCp: -40,
    temperatureCp: 26,
    blunderChance: 0,
    randomLegalChance: 0,
    blunderExtraCp: 0,
  },
};

function aiProfile() {
  return AI_LEVELS[aiLevelSelect.value] || AI_LEVELS.amateur;
}

function syncAiLevel(value) {
  const next = AI_LEVELS[value] ? value : "amateur";
  aiLevelSelect.value = next;
  startupAiLevelSelect.value = next;
  try { localStorage.setItem("xiangqi.aiLevel", next); } catch { /* ignore */ }
}

function loadAiLevel() {
  try {
    const saved = localStorage.getItem("xiangqi.aiLevel");
    if (saved && AI_LEVELS[saved]) return saved;
  } catch { /* ignore */ }
  return "amateur";
}

function legalUciMovesFor(color) {
  const previousTurn = turn;
  turn = color;
  try {
    const moves = [];
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (colorOf(board[r][c]) !== color) continue;
        for (const target of legalMoves(r, c)) moves.push(coordsToUci(r, c, target.r, target.c));
      }
    }
    return moves;
  } finally {
    turn = previousTurn;
  }
}

function weightedRandomMove(candidates, profile) {
  const temperature = Math.max(1, profile.temperatureCp);
  const weights = candidates.map(candidate => {
    const loss = Math.max(0, candidate.lossCp || 0);
    const rankPenalty = Math.max(0, (candidate.rank || 1) - 1) * 0.15;
    return Math.exp(-loss / temperature) / (1 + rankPenalty);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let pick = Math.random() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    pick -= weights[i];
    if (pick <= 0) return candidates[i].move;
  }
  return candidates.at(-1)?.move || null;
}

function chooseAiMove(result, mover) {
  const profile = aiProfile();
  const moves = result?.moves?.length
    ? result.moves
    : (result?.bestMove ? [{ move: result.bestMove, score: result.score, mate: result.mate }] : []);
  const legalMoves = moves.filter(candidate => {
    const move = uciToMove(candidate.move);
    return move && board[move.fromR]?.[move.fromC] && colorOf(board[move.fromR][move.fromC]) === mover;
  });
  const allLegal = legalUciMovesFor(mover);
  if (!legalMoves.length) return allLegal[Math.floor(Math.random() * allLegal.length)] || result?.bestMove || null;
  if (profile.randomLegalChance && Math.random() < profile.randomLegalChance) {
    return allLegal[Math.floor(Math.random() * allLegal.length)] || legalMoves[0].move;
  }

  const best = legalMoves[0];
  if (best.mate != null) {
    const bestMate = mover === "red" ? best.mate : -best.mate;
    const mateMoves = legalMoves.filter(candidate => {
      if (candidate.mate == null) return false;
      return (mover === "red" ? candidate.mate : -candidate.mate) === bestMate;
    });
    if (bestMate > 0 || !profile.blunderChance || Math.random() >= profile.blunderChance) {
      return mateMoves[Math.floor(Math.random() * mateMoves.length)]?.move || best.move;
    }
  }

  const bestScore = engineMoveScore(best, mover);
  if (bestScore == null) return best.move;
  const isBlunder = profile.blunderChance && Math.random() < profile.blunderChance;
  const maxLossCp = profile.maxLossCp + (isBlunder ? profile.blunderExtraCp : 0);
  const minScoreCp = profile.minScoreCp - (isBlunder ? profile.blunderExtraCp : 0);
  const candidates = legalMoves.map(candidate => {
    const score = engineMoveScore(candidate, mover);
    if (score == null) return null;
    return { ...candidate, score, lossCp: Math.max(0, bestScore - score) };
  }).filter(candidate => candidate && candidate.score >= minScoreCp && candidate.lossCp <= maxLossCp);
  return weightedRandomMove(candidates.length ? candidates : [{ ...best, score: bestScore, lossCp: 0 }], profile) || best.move;
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
    throw new Error(text("unknownEnginePath", path));
  }
  throw new Error(text("engineOnlyElectron"));
}

async function evaluatePosition() {
  const requestId = ++evalRequest;
  statusText.textContent = text("pikafishAnalyzing");
  try {
    const result = await enginePost("/api/evaluate", { fen: boardToFen(), depth: Number(depthInput.value) });
    if (requestId === evalRequest) {
      updateScore(result.score);
      pvLine.textContent = result.pv?.length ? `PV ${result.pv.join(" ")}` : "";
      statusText.textContent = text("pikafishReady");
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
  statusText.textContent = text("choosingMove");
  try {
    const profile = aiProfile();
    const result = await enginePost("/api/topmoves", { fen: boardToFen(), count: profile.count, movetime: profile.movetime });
    const move = uciToMove(chooseAiMove(result, turn));
    if (move && board[move.fromR]?.[move.fromC]) {
      await makeMove(move.fromR, move.fromC, move.toR, move.toC, "engine");
    } else {
      statusText.textContent = text("noLegalMove");
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
  const best = trainerState.moves.find(move => move.move);
  const coach = best?.move ? coachMoveText(best.move, board, turn) : "";
  return lines.length ? [text("bestLines", lines.join("\n")), coach].filter(Boolean).join("\n\n") : text("noBestLine");
}

function trainerPromptText() {
  if (gameResult) {
    if (gameResult.winner === "draw") return text("drawBy", gameResult.reason);
    return text("winsBy", gameResult.winner, gameResult.reason).replace(/!$/, ".");
  }
  if (turn !== playerSide.value) return text("replyPlayed", turn);
  if (trainerState.status === "loading") return text("preparingColorPosition", turn);
  if (trainerState.status === "error") return text("trainerUnavailablePosition");
  return text("findColorBest", turn);
}

function trainerLineText() {
  if (trainerState.status === "error") return trainerState.message || text("trainerUnavailable");
  if (trainerState.status === "loading") return text("preparingPosition");
  if (turn !== playerSide.value) return text("pikafishSide", turn);
  if (trainerState.revealed) return trainerTopMoveLines();
  if (trainerState.hintLevel >= 1 && trainerState.bestMove) {
    const move = uciToMove(trainerState.bestMove);
    const piece = board[move?.fromR]?.[move?.fromC];
    if (move && piece) return text("hintPieceFrom", pieceLabel(piece), squareToUci(move.fromR, move.fromC));
  }
  return trainerState.message || text("positionReady");
}

function renderTrainerPanel() {
  const active = modeSelect.value === "trainer";
  trainerPanel.hidden = !active;
  undoBtn.disabled = active;
  if (!active) return;
  trainerSide.textContent = playerSide.value === "red" ? text("redTrainer") : text("blackTrainer");
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
      message: text("pikafishSide", turn),
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
    message: text("preparingPosition"),
    hintLevel: 0,
    revealed: false,
  };
  statusText.textContent = text("preparingTrainer");
  moveScore.textContent = text("trainerPreparing");
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
      message: bestMove ? text("positionReady") : text("noTrainerMoveFound"),
    };
    statusText.textContent = bestMove ? text("trainerReady") : text("trainerCouldNotFind");
    moveScore.textContent = bestMove ? text("findColorBest", turn) : text("noTrainerMove");
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
    moveScore.textContent = text("trainerUnavailableError", error.message);
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
    message: text("pikafishSide", turn),
    hintLevel: 0,
    revealed: false,
  };
  busy = true;
  statusText.textContent = text("choosingTrainerReply");
  renderTrainerPanel();
  renderBoard();

  let failed = false;
  let ended = false;
  try {
    const result = await enginePost("/api/topmoves", { fen, depth: Number(depthInput.value) + 1, count: 5 });
    if (modeSelect.value !== "trainer" || fen !== boardToFen()) return;
    const move = uciToMove(chooseAiMove(result, turn));
    if (!isLegalParsedMove(move)) throw new Error(text("noLegalReply"));
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
    moveScore.textContent = text("trainerStopped", error.message);
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
    trainerState.message = text("stillPreparing");
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
      const loss = grade.lossCp != null ? text("lostSuffix", cpLossText(grade.lossCp)) : "";
      trainerState.message = text("choiceTry", grade.rank, formatRecommendationScore(candidate, mover), loss);
    } else if (grade.lossCp != null) {
      trainerState.message = text("lostTry", cpLossText(grade.lossCp));
    } else {
      trainerState.message = text("outsideTopLines");
    }
    statusText.textContent = text("tryAgain");
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
    ? text("bestMove", label)
    : text("goodMove", label, cpLossText(grade.lossCp));
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
  closeGameEndOverlay();
  lastUserRecommendationText = "";
  currentEval = 0;
  busy = false;
  turnPill.classList.remove("winner");
  moveScore.textContent = text("moveToSeeScore");
  pvLine.textContent = "";
  updateScore(0);
  renderBoard();
  renderHistory();
  clearClock();
  // Start the clock for actively-played modes only (not PGN replay, not waiting for an online opponent).
  if (modeSelect.value === "pgn" || modeSelect.value === "trainer" || modeSelect.value === "setup") return;
  if (modeSelect.value !== "online" || (online && online.status === "playing")) {
    startClock();
  }
}

function resetGame() {
  if (modeSelect.value === "online") {
    onlineLobbyStatus.textContent = text("onlineNewGame");
    return;
  }
  if (modeSelect.value === "trainer") {
    resetGameLocal();
    startTrainer();
    return;
  }
  if (modeSelect.value === "setup") {
    setupClearBoard();
    return;
  }
  resetGameLocal();
  evaluatePosition().then(() => maybeAiMove());
  triggerPreMoveAnalysis();
}

function undo() {
  if (modeSelect.value === "online") {
    onlineRequestUndo();
    return;
  }
  if (modeSelect.value === "trainer") {
    trainerState.message = text("undoTrainer");
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

function undoLastMoveLocal(fen = "") {
  if (fen) {
    const savedOnline = online;
    loadFen(fen);
    online = savedOnline;
  } else {
    const record = history.pop();
    if (!record) return false;
    board[record.fromR][record.fromC] = record.piece;
    board[record.toR][record.toC] = record.captured;
    turn = record.side;
    lastMove = history.at(-1) || null;
    selected = null;
    legalTargets = [];
    gameResult = null;
    renderBoard();
    renderHistory();
    evaluatePosition();
  }
  if (modeSelect.value === "online" && online?.status === "playing") {
    stopClock();
    startClock();
    triggerPreMoveAnalysis();
  }
  return true;
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
    statusText.textContent = text("engineElectron");
    return;
  }
  try {
    const status = await api.status();
    statusText.textContent = status.engine && status.nnue ? text("pikafishReady") : text("pikafishMissing");
  } catch (e) {
    statusText.textContent = text("engineUnavailable", e.message);
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
    onlineMatchStatus.textContent = text("outOfSync");
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
  if (!response.ok) throw new Error(json.error || text("requestFailed", response.status));
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
  loginStatus.textContent = mode === "signup" ? text("creatingAccount") : text("loggingIn");
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
  onlineLobbyStatus.textContent = text("loginBeforeOnline");
  openLoginOverlay();
  return false;
}

async function onlineCreate() {
  if (!requireLoginForMatch()) return;
  onlineLobbyStatus.textContent = text("creatingRoom");
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
    onlineLobbyStatus.textContent = text("validRoomCode");
    return;
  }
  onlineLobbyStatus.textContent = role === "spectator" ? text("joiningSpectator") : text("joiningRoom");
  try {
    const result = await postJson("/api/match/join", { token: currentProfile.token, code, role });
    enterRoom(result);
  } catch (e) {
    onlineLobbyStatus.textContent = e.message;
  }
}

async function onlineQueue() {
  if (!requireLoginForMatch()) return;
  onlineLobbyStatus.textContent = text("searchingOpponent");
  try {
    const result = await postJson("/api/match/queue", { token: currentProfile.token });
    enterRoom(result);
    if (!result.matched) onlineLobbyStatus.textContent = text("waitingShareCode", result.code);
  } catch (e) {
    onlineLobbyStatus.textContent = e.message;
  }
}

async function onlineRankedQueue() {
  if (!requireLoginForMatch()) return;
  onlineLobbyStatus.textContent = text("searchingNear", currentProfile.user?.level || "1-1");
  try {
    const result = await postJson("/api/match/ranked-queue", { token: currentProfile.token });
    enterRoom(result);
    if (!result.matched) onlineLobbyStatus.textContent = text("waitingRanked", result.code);
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
    undoRequest: info.match?.undoRequest || null,
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
  es.addEventListener("undo_requested", e => onlineHandleUndoRequested(JSON.parse(e.data)));
  es.addEventListener("undo_accepted", e => onlineHandleUndoAccepted(JSON.parse(e.data)));
  es.addEventListener("undo_rejected", e => onlineHandleUndoRejected(JSON.parse(e.data)));
  es.addEventListener("rematch_voted", e => onlineHandleRematchVote(JSON.parse(e.data)));
  es.addEventListener("rematch_started", e => onlineHandleRematchStarted(JSON.parse(e.data)));
  es.addEventListener("gameover", e => onlineHandleGameOver(JSON.parse(e.data)));
  es.onerror = () => {
    onlineMatchStatus.textContent = text("connectionIssue");
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
  online.undoRequest = match.undoRequest || null;
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

async function onlineHandleUndoRequested(data) {
  if (!online) return;
  online.undoRequest = data;
  const requester = online.players.find(p => p.id === data.by);
  const name = requester?.nickname || colorLabel(data.color);
  if (data.by === online.playerId) {
    onlineMatchStatus.textContent = text("undoRequestSent");
    return;
  }
  onlineMatchStatus.textContent = text("undoIncoming", name);
  if (online.role !== "player" || online.status !== "playing") return;
  const accepted = confirm(text("undoRequestedByOpponent", name));
  try {
    await postJson(`/api/match/${encodeURIComponent(online.code)}/undo`, {
      playerId: online.playerId,
      requestId: data.id,
      decision: accepted ? "accept" : "reject",
    });
  } catch (e) {
    onlineMatchStatus.textContent = e.message;
  }
}

function onlineHandleUndoAccepted(data) {
  if (!online) return;
  online.undoRequest = null;
  undoLastMoveLocal(data.fen || "");
  renderOnlineMatch();
  onlineMatchStatus.textContent = text("undoAccepted");
}

function onlineHandleUndoRejected(data) {
  if (!online) return;
  online.undoRequest = null;
  void data;
  renderOnlineMatch();
  onlineMatchStatus.textContent = text("undoDeclined");
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
  showGameEndOverlay(gameResult, describeOutcome(data.winner, data.reason));
}

function describeOutcome(winner, reason) {
  if (winner === "draw") return text("outcomeDraw", reason);
  return text("outcomeWin", winner, reason);
}

async function onlineSendMove(uci, fen) {
  if (!online) return;
  await postJson(`/api/match/${encodeURIComponent(online.code)}/move`, { playerId: online.playerId, uci, fen });
}

async function onlineRequestUndo() {
  if (!online || online.role !== "player" || online.status !== "playing") return;
  if (history.length === 0) {
    onlineMatchStatus.textContent = text("undoNoMoves");
    return;
  }
  try {
    await postJson(`/api/match/${encodeURIComponent(online.code)}/undo`, { playerId: online.playerId });
    onlineMatchStatus.textContent = text("undoOnline");
  } catch (e) {
    onlineMatchStatus.textContent = e.message;
  }
}

async function onlineDeclareGameOver(winner, reason) {
  if (!online) return;
  online.status = "finished";
  online.winner = winner;
  online.winReason = reason;
  gameResult = { winner, reason };
  renderOnlineMatch();
  showGameEndOverlay(gameResult, describeOutcome(winner, reason));
  await postJson(`/api/match/${encodeURIComponent(online.code)}/gameover`, { playerId: online.playerId, winner, reason });
}

async function onlineResign() {
  if (!online || online.role !== "player" || online.status !== "playing") return;
  if (!confirm(text("confirmResign"))) return;
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
    onlineMatchStatus.textContent = text("rematchRequested");
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
    onlineSpectators.textContent = text("spectators", online.spectators.map(s => s.nickname).join(", "));
  } else {
    onlineSpectators.textContent = "";
  }

  let status = "";
  if (online.status === "waiting") status = text("waitingOpponentShare", online.code);
  else if (online.status === "playing") {
    if (online.undoRequest) {
      const requester = online.players.find(p => p.id === online.undoRequest.by);
      const name = requester?.nickname || colorLabel(online.undoRequest.color);
      status = online.undoRequest.by === online.playerId ? text("undoRequestSent") : text("undoIncoming", name);
    } else if (online.role === "spectator") status = text("colorToMove", turn);
    else if (online.myColor === turn) status = text("yourTurn");
    else status = text("opponentTurn");
  } else if (online.status === "finished") {
    status = describeOutcome(online.winner, online.winReason || "");
  }
  if (online.ranked && status) status = text("rankedStatus", status);
  onlineMatchStatus.textContent = status;

  const isPlayer = online.role === "player";
  onlineResignBtn.hidden = !(isPlayer && online.status === "playing");
  onlineRematchBtn.hidden = !(isPlayer && online.status === "finished");
  if (online.rematchVotes?.length) {
    onlineRematchBtn.textContent = text("rematchVotes", online.rematchVotes.length, online.players.length);
  } else {
    onlineRematchBtn.textContent = text("rematch");
  }
}

function setPlayerSlot(el, player, color) {
  const nameEl = el.querySelector(".online-name");
  el.classList.toggle("you", !!(player && online && player.id === online.playerId));
  el.classList.toggle("turn", online?.status === "playing" && turn === color);
  if (player) {
    const level = player.level ? ` · ${player.level}` : "";
    nameEl.textContent = `${player.nickname}${level}${player.online === false ? ` (${text("offline")})` : ""}`;
    nameEl.removeAttribute("data-empty");
  } else {
    nameEl.textContent = text("waiting");
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
    onlineMatchStatus.textContent = text("roomCopied");
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
aiLevelSelect.addEventListener("change", () => {
  syncAiLevel(aiLevelSelect.value);
});
startupAiLevelSelect.addEventListener("change", () => {
  syncAiLevel(startupAiLevelSelect.value);
});
languageSelect.addEventListener("change", () => {
  lang = languageSelect.value === "zh" ? "zh" : "en";
  try { localStorage.setItem("xiangqi.language", lang); } catch { /* ignore */ }
  applyLanguage();
  if (!libraryOverlay.hidden) void renderGameLibrary();
  loadStatus();
});
modeSelect.addEventListener("change", () => {
  const isOnline = modeSelect.value === "online";
  const isPgn = modeSelect.value === "pgn";
  const isTrainer = modeSelect.value === "trainer";
  const isSetup = modeSelect.value === "setup";
  setOnlineMode(isOnline);
  // Hide the clock section in study modes.
  qs("#clocks").hidden = isPgn || isTrainer || isSetup;
  renderTrainerPanel();
  renderSetupPanel();
  renderBoard();
  if (isTrainer || isSetup) clearClock();
  if (!isOnline && online) {
    onlineLeave();
    closeMatchOverlay();
  } else if (isOnline && (!online || online.role !== "player")) {
    openMatchOverlay();
  }
  if (!isOnline && !isTrainer && !isSetup) maybeAiMove();
});
playerSide.addEventListener("change", () => maybeAiMove());
newGameBtn.addEventListener("click", resetGame);
gameEndNewBtn.addEventListener("click", () => {
  closeGameEndOverlay();
  resetGame();
});
gameEndReviewBtn.addEventListener("click", reviewFinishedGame);
undoBtn.addEventListener("click", undo);
saveGameBtn.addEventListener("click", () => {
  openGameLibrary();
  saveCurrentGameToLibrary();
});
libraryBtn.addEventListener("click", openGameLibrary);
downloadPgnBtn.addEventListener("click", downloadPgn);
trainerHintBtn.addEventListener("click", showTrainerHint);
trainerRevealBtn.addEventListener("click", revealTrainerMove);
trainerRestartBtn.addEventListener("click", resetGame);
setupTurnSelect.addEventListener("change", () => {
  turn = setupTurnSelect.value === "black" ? "black" : "red";
  selected = null;
  legalTargets = [];
  renderBoard();
});
setupStartBtn.addEventListener("click", setupStartPosition);
setupClearBtn.addEventListener("click", setupClearBoard);
setupPlayBtn.addEventListener("click", playSetupPosition);
document.addEventListener("pointerdown", event => {
  if (setupPieceMenu.hidden) return;
  const target = event.target as Node | null;
  if (target && setupPieceMenu.contains(target)) return;
  closeSetupPieceMenu();
});
window.addEventListener("keydown", event => {
  if (event.key === "Escape") closeSetupPieceMenu();
  if (event.key === "Escape" && !libraryOverlay.hidden) closeGameLibrary();
});
libraryOverlayClose.addEventListener("click", closeGameLibrary);
libraryOverlay.addEventListener("click", event => {
  if (event.target === libraryOverlay) closeGameLibrary();
});
librarySaveCurrentBtn.addEventListener("click", saveCurrentGameToLibrary);
libraryImportPgnBtn.addEventListener("click", importPgnLibraryFile);
librarySearchInput.addEventListener("input", scheduleRenderGameLibrary);
libraryPlayerFilter.addEventListener("input", scheduleRenderGameLibrary);
libraryEventFilter.addEventListener("input", scheduleRenderGameLibrary);
libraryYearFilter.addEventListener("input", scheduleRenderGameLibrary);
libraryOpeningFilter.addEventListener("input", scheduleRenderGameLibrary);
libraryResultFilter.addEventListener("change", () => void renderGameLibrary());
libraryFavoriteFilter.addEventListener("change", () => void renderGameLibrary());
libraryClearFiltersBtn.addEventListener("click", clearLibraryFilters);
libraryList.addEventListener("click", event => {
  const btn = (event.target as HTMLElement | null)?.closest("button[data-action]") as HTMLElement | null;
  if (!btn?.dataset.id) return;
  if (btn.dataset.action === "favorite") {
    void toggleLibraryFavorite(btn.dataset.source || "local", btn.dataset.id, btn.dataset.favorite === "true");
    return;
  }
  if (btn.dataset.action === "open" && btn.dataset.source === "indexed") void openIndexedLibraryGame(btn.dataset.id);
  if (btn.dataset.action === "open" && btn.dataset.source !== "indexed") openLibraryGame(btn.dataset.id);
  if (btn.dataset.action === "delete" && btn.dataset.source !== "indexed") deleteLibraryGame(btn.dataset.id);
});

fenCopyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(fenText.textContent || "");
    const original = fenCopyBtn.textContent;
    fenCopyBtn.textContent = text("copied");
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
  closeGameEndOverlay();
  closeMatchOverlay();
  closeGameLibrary();
  closePgnOverlay();
  pgnNav.hidden = true;
  pgnMoves = [];
  pgnIndex = 0;
  pgnSourceText = "";
  pgnSourceTitle = "";
  pgnAnalysisCache.clear();
  resetTrainerState();
  trainerPanel.hidden = true;
  undoBtn.disabled = false;
  showStartupPicker();
});

// ----- PGN viewer -----

let pgnMoves = []; // [{ uci, raw }]
let pgnIndex = 0;  // 0 = before first move; pgnMoves.length = end of game
let pgnImportGames = [];
let pgnReviewRunId = 0;
const MAX_PGN_IMPORT_BYTES = 4 * 1024 * 1024;
const MAX_PGN_IMPORT_GAMES = 500;
const PGN_REVIEW_TOP_MOVETIME_MS = 220;
const PGN_REVIEW_EVAL_MOVETIME_MS = 120;

function iccsToUci(raw) {
  const match = String(raw).trim().match(/^([a-iA-I])([0-9])[-x:]?([a-iA-I])([0-9])$/);
  return match ? `${match[1]}${match[2]}${match[3]}${match[4]}`.toLowerCase() : null;
}

function splitPgnGames(pgnText) {
  const source = String(pgnText || "").replace(/^\uFEFF/, "").trim();
  if (!source) return [];
  const starts = [...source.matchAll(/^\s*\[(?:Event|Game)\s+/gim)].map(match => match.index || 0);
  if (!starts.length) return [source];
  const chunks = [];
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const end = starts[i + 1] ?? source.length;
    const chunk = source.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (chunks.length >= MAX_PGN_IMPORT_GAMES) break;
  }
  return chunks.length ? chunks : [source];
}

function pgnHeaderValue(pgnText, name) {
  const match = String(pgnText).match(new RegExp(`^\\s*\\[${name}\\s+"([^"]*)"\\]`, "im"));
  return match?.[1]?.trim() || "";
}

function describePgnGame(pgnText, index, sourceTitle) {
  const event = pgnHeaderValue(pgnText, "Event") || pgnHeaderValue(pgnText, "Game");
  const red = pgnHeaderValue(pgnText, "Red") || pgnHeaderValue(pgnText, "White");
  const black = pgnHeaderValue(pgnText, "Black");
  const date = pgnHeaderValue(pgnText, "Date");
  const result = pgnHeaderValue(pgnText, "Result");
  const moves = pgnParseText(pgnText);
  const title = event || `${sourceTitle} #${index + 1}`;
  const players = [red, black].filter(Boolean).join(" vs ");
  const details = [players, date, result, text("movesCount", moves.length)].filter(Boolean).join(" · ");
  return { text: pgnText, title, details, moves };
}

function pgnParseText(pgnText) {
  // Strip headers and comments.
  const cleaned = String(pgnText || "")
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

function pgnReplayTo(targetIndex) {
  const parsed = parseFen(START_FEN);
  const replayBoard = cloneBoard(parsed.board);
  let replayTurn = parsed.turn;
  const records = [];
  const limit = Math.max(0, Math.min(targetIndex, pgnMoves.length));

  for (let i = 0; i < limit; i += 1) {
    const moveInfo = pgnMoves[i];
    const m = uciToMove(moveInfo.uci);
    if (!m) break;
    const piece = replayBoard[m.fromR]?.[m.fromC];
    if (!piece) break;

    const beforeBoard = cloneBoard(replayBoard);
    const beforeFen = boardToFen(beforeBoard, replayTurn);
    const captured = replayBoard[m.toR][m.toC];
    const record = {
      index: i + 1,
      raw: moveInfo.raw,
      uci: moveInfo.uci,
      fromR: m.fromR,
      fromC: m.fromC,
      toR: m.toR,
      toC: m.toC,
      piece,
      captured,
      side: replayTurn,
      source: "pgn",
    };
    const notation = xiangqiMoveNotation(record, beforeBoard);

    replayBoard[m.toR][m.toC] = piece;
    replayBoard[m.fromR][m.fromC] = null;
    replayTurn = replayTurn === "red" ? "black" : "red";

    records.push({
      ...record,
      notation,
      beforeBoard,
      beforeFen,
      afterFen: boardToFen(replayBoard, replayTurn),
    });
  }

  return { board: replayBoard, turn: replayTurn, records };
}

function pgnMoveContext(targetIndex) {
  return pgnReplayTo(targetIndex).records[targetIndex - 1] || null;
}

function pgnLoadText(pgnText, meta = null) {
  const moves = pgnParseText(pgnText);
  if (!moves.length) {
    pgnStatus.textContent = text("noMovesFound");
    return false;
  }
  pgnReviewRunId += 1;
  pgnSourceText = String(pgnText || "");
  pgnSourceTitle = meta?.title || text("pgnFile");
  pgnMoves = moves;
  pgnIndex = 0;
  pgnAnalysisCache.clear();
  pgnStatus.textContent = meta ? text("loadedGame", meta.title, moves.length) : text("loadedMoves", moves.length);
  pgnApplyPosition();
  pgnNav.hidden = false;
  startPgnReviewAnalysis();
  return true;
}

function clearPgnGameList() {
  pgnImportGames = [];
  pgnGameList.hidden = true;
  pgnGameList.replaceChildren();
}

function renderPgnGameList(sourceTitle, truncated = false) {
  pgnGameList.hidden = false;
  const fragment = document.createDocumentFragment();
  for (const [index, game] of pgnImportGames.entries()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pgn-game-option";
    btn.dataset.index = String(index);
    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${game.title}`;
    const details = document.createElement("span");
    details.textContent = game.details || text("movesCount", game.moves.length);
    btn.append(title, details);
    fragment.append(btn);
  }
  pgnGameList.replaceChildren(fragment);
  const capped = pgnImportGames.length >= MAX_PGN_IMPORT_GAMES ? text("showingFirst", MAX_PGN_IMPORT_GAMES) : "";
  const clipped = truncated ? text("largeFileBeginning") : "";
  pgnStatus.textContent = text("foundGames", pgnImportGames.length, sourceTitle, capped, clipped);
}

function openPgnImportGame(index) {
  const game = pgnImportGames[index];
  if (!game) return;
  if (pgnLoadText(game.text, { title: game.title })) {
    clearPgnGameList();
    closePgnOverlay();
  }
}

async function importPgnSource(pgnText, title, truncated = false, { autoLoadSingle = true } = {}) {
  clearPgnGameList();
  const chunks = splitPgnGames(pgnText);
  const games = chunks
    .map((chunk, index) => describePgnGame(chunk, index, title))
    .filter(game => game.moves.length);
  if (!games.length) {
    pgnStatus.textContent = text("noMovesFound");
    return;
  }
  if (games.length === 1 && autoLoadSingle) {
    if (pgnLoadText(games[0].text, { title: games[0].title })) {
      if (truncated) {
        pgnStatus.textContent = text("loadedLarge", games[0].title);
      }
      closePgnOverlay();
    }
    return;
  }
  pgnImportGames = games;
  renderPgnGameList(title, truncated);
}

async function loadPgnBrowserFile(file) {
  if (!file) return;
    pgnStatus.textContent = text("readFile", file.name);
  try {
    const truncated = file.size > MAX_PGN_IMPORT_BYTES;
    const pgnText = await file.slice(0, MAX_PGN_IMPORT_BYTES).text();
    await importPgnSource(pgnText, file.name || text("pgnFile"), truncated);
  } catch (e) {
    pgnStatus.textContent = text("couldNotReadFile", e.message);
  }
}

async function openPgnFile() {
  if (!window.api?.pgnFile?.open) {
    pgnFileInput.click();
    return;
  }
  pgnOpenFileBtn.disabled = true;
  try {
    const result = await window.api.pgnFile.open();
    if (!result) return;
    await importPgnSource(String(result?.text || ""), result?.name || text("pgnFile"), Boolean(result?.truncated));
  } catch (e) {
    pgnStatus.textContent = text("couldNotReadFile", e.message);
  } finally {
    pgnOpenFileBtn.disabled = false;
  }
}

// Analysis cache: keyed by the resulting pgnIndex (1-based). cache.get(N) = analysis for move N (i.e. pgnMoves[N-1]).
const pgnAnalysisCache = new Map();

function reviewAnnotation(grade) {
  if (grade.quality === "best") return "!";
  if (grade.lossCp == null) return "";
  if (grade.lossCp >= 300) return "??";
  if (grade.lossCp >= 120) return "?";
  if (grade.lossCp <= 40) return "!";
  return "";
}

function pgnReviewMetaText(index) {
  const entry = pgnAnalysisCache.get(index);
  if (!entry) return text("reviewWaiting");
  if (entry.status === "pending") return text("analyzing");
  if (entry.status === "error") return text("reviewFailedShort");
  const parts = [];
  if (entry.annotation) parts.push(entry.annotation);
  if (entry.lossText) parts.push(text("reviewLossShort", entry.lossText));
  if (entry.bestLabel) parts.push(text("reviewBestShort", entry.bestLabel));
  return parts.join(" · ") || entry.playedScoreText || text("noAnalysis");
}

function pgnReviewMoveButton(record, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "review-move-btn";
  button.dataset.pgnIndex = String(index);
  if (pgnIndex === index) button.classList.add("current");

  const label = document.createElement("span");
  label.className = "review-move-label";
  label.textContent = record ? displayedMoveLabel(record) : (pgnMoves[index - 1]?.raw || "");

  const meta = document.createElement("span");
  meta.className = "review-move-meta";
  meta.textContent = pgnReviewMetaText(index);

  button.append(label, meta);
  return button;
}

function renderPgnReviewHistory() {
  const replay = pgnReplayTo(pgnMoves.length);
  for (let i = 0; i < pgnMoves.length; i += 2) {
    const li = document.createElement("li");
    li.className = "review-row";
    const moveNo = document.createElement("span");
    moveNo.className = "move-no";
    moveNo.textContent = `${Math.floor(i / 2) + 1}.`;
    li.append(moveNo);
    li.append(pgnReviewMoveButton(replay.records[i], i + 1));
    if (pgnMoves[i + 1]) {
      li.append(pgnReviewMoveButton(replay.records[i + 1], i + 2));
    } else {
      const empty = document.createElement("span");
      empty.className = "review-move-empty";
      li.append(empty);
    }
    moveList.append(li);
  }
}

function pgnRenderAnalysis() {
  if (pgnIndex === 0) {
    moveScore.textContent = text("noMoveAnalyze");
    return;
  }
  const entry = pgnAnalysisCache.get(pgnIndex);
  if (!entry || entry.status === "pending") {
    moveScore.textContent = text("analyzing");
    return;
  }
  if (entry.status === "done") {
    moveScore.textContent = entry.lines.length
      ? entry.lines.join("\n")
      : text("noAnalysis");
    return;
  }
  moveScore.textContent = text("reviewFailedShort");
}

async function pgnComputeAnalysis(targetIndex) {
  if (targetIndex <= 0 || targetIndex > pgnMoves.length) return null;
  const existing = pgnAnalysisCache.get(targetIndex);
  if (existing?.promise) return existing.promise;
  if (existing?.status === "done" || existing?.status === "error") return existing;

  const context = pgnMoveContext(targetIndex);
  if (!context) return null;
  const entry: any = { status: "pending", lines: [], runId: pgnReviewRunId };
  pgnAnalysisCache.set(targetIndex, entry);

  entry.promise = (async () => {
    try {
      const result = await enginePost("/api/topmoves", {
        fen: context.beforeFen,
        count: 4,
        movetime: PGN_REVIEW_TOP_MOVETIME_MS,
      });
      const afterEval = await enginePost("/api/evaluate", {
        fen: context.afterFen,
        movetime: PGN_REVIEW_EVAL_MOVETIME_MS,
      }).catch(() => null);
      const moves = result?.moves?.length
        ? result.moves
        : (result?.bestMove ? [{ rank: 1, move: result.bestMove, score: result.score, mate: result.mate }] : []);
      const playedScore = afterEval?.score ?? null;
      const beforeScore = result?.score ?? null;
      const grade = gradePlayedMove(moves, context.side, context.uci, playedScore);
      const best = moves.find(m => m.move) || null;
      const bestLabel = best?.move ? (moveLabelFromBoard(best.move, context.beforeBoard, context.side) || best.move) : "";
      const bestScoreText = best ? formatRecommendationScore(best, context.side) : "";
      const lossText = grade.lossCp != null ? cpLossText(grade.lossCp) : "";
      const annotation = reviewAnnotation(grade);
      const recLines = moves
        .filter(m => m.move)
        .slice(0, 3)
        .map((m, i) => {
          const label = moveLabelFromBoard(m.move, context.beforeBoard, context.side) || m.move;
          const scoreText = formatRecommendationScore(m, context.side);
          const matched = m.move === context.uci ? " ✓" : "";
          return `${i + 1}. ${label} (${scoreText})${matched}`;
        });
      entry.annotation = annotation;
      entry.bestLabel = bestLabel;
      entry.bestScoreText = bestScoreText;
      entry.lossText = lossText;
      entry.playedScoreText = beforeScore != null && playedScore != null
        ? `${formatScore(playedScore)} (${formatSwing(playedScore - beforeScore)})`
        : formatScore(playedScore);
      entry.lines = [
        text("reviewMoveLine", annotation, entry.playedScoreText, text("reviewLossShort", lossText || "...")),
        bestLabel ? text("reviewBestLine", bestLabel, bestScoreText) : "",
        best?.move ? coachMoveText(best.move, context.beforeBoard, context.side) : "",
        recLines.length ? text("recommendations", recLines.join("\n")) : "",
      ].filter(Boolean);
      entry.status = "done";
    } catch (e) {
      entry.status = "done";
      entry.lines = [text("reviewFailedShort")];
    } finally {
      delete entry.promise;
      if (modeSelect.value === "pgn" && entry.runId === pgnReviewRunId) {
        renderHistory();
        if (pgnIndex === targetIndex) pgnRenderAnalysis();
      }
    }
    return entry;
  })();

  return entry.promise;
}

async function startPgnReviewAnalysis() {
  const runId = ++pgnReviewRunId;
  for (let i = 1; i <= pgnMoves.length; i += 1) {
    if (runId !== pgnReviewRunId || modeSelect.value !== "pgn") return;
    await pgnComputeAnalysis(i);
  }
}

function pgnApplyPosition() {
  const replay = pgnReplayTo(pgnIndex);
  board = replay.board;
  turn = replay.turn;
  selected = null;
  legalTargets = [];
  history = replay.records.map(({ beforeBoard, beforeFen, afterFen, raw, index, uci, ...record }) => record);
  const last = history.at(-1);
  lastMove = last ? { fromR: last.fromR, fromC: last.fromC, toR: last.toR, toC: last.toC } : null;
  renderBoard();
  renderHistory();
  pgnUpdateNavUI();
  evaluatePosition();

  // Render whatever analysis we already have for the current position (or "Analyzing…").
  pgnRenderAnalysis();

  // Make sure the current position's analysis is being computed (no-op if already cached).
  if (pgnIndex > 0) {
    pgnComputeAnalysis(pgnIndex);
  }

  // Prefetch the NEXT move's analysis so when the user advances, it's ready instantly.
  if (pgnIndex < pgnMoves.length) {
    pgnComputeAnalysis(pgnIndex + 1);
  }
}

function pgnUpdateNavUI() {
  pgnPosition.textContent = text("moveCounter", pgnIndex, pgnMoves.length);
  if (pgnIndex > 0) {
    const m = pgnMoves[pgnIndex - 1];
    pgnLastMoveEl.textContent = text("lastMove", m.raw);
  } else {
    pgnLastMoveEl.textContent = text("startPosition");
  }
  pgnPrevBtn.disabled = pgnIndex <= 0;
  pgnFirstBtn.disabled = pgnIndex <= 0;
  pgnNextBtn.disabled = pgnIndex >= pgnMoves.length;
  pgnLastBtn.disabled = pgnIndex >= pgnMoves.length;
}

function playFromPgnPosition() {
  if (modeSelect.value !== "pgn") return;
  pgnReviewRunId += 1;
  const continuedHistory = history.map(record => ({ ...record, source: "review" }));
  pgnNav.hidden = true;
  modeSelect.value = "human";
  modeSelect.dispatchEvent(new Event("change"));
  history = continuedHistory;
  selected = null;
  legalTargets = [];
  gameResult = null;
  busy = false;
  pgnMoves = [];
  pgnIndex = 0;
  pgnSourceText = "";
  pgnSourceTitle = "";
  pgnAnalysisCache.clear();
  qs("#clocks").hidden = false;
  undoBtn.disabled = false;
  moveScore.textContent = text("playingFromReview");
  renderBoard();
  renderHistory();
  startClock();
  evaluatePosition();
  triggerPreMoveAnalysis();
}

function pgnGoto(idx) {
  pgnIndex = Math.max(0, Math.min(pgnMoves.length, idx));
  pgnApplyPosition();
}

function openPgnOverlay() {
  pgnOverlay.hidden = false;
  pgnStatus.textContent = "";
  clearPgnGameList();
  setTimeout(() => pgnOpenFileBtn.focus(), 30);
}

function closePgnOverlay() {
  pgnOverlay.hidden = true;
}

pgnOverlayClose.addEventListener("click", closePgnOverlay);
pgnOverlay.addEventListener("click", e => {
  if (e.target === pgnOverlay) closePgnOverlay();
});
pgnOverlay.addEventListener("dragover", e => {
  e.preventDefault();
});
pgnOverlay.addEventListener("drop", e => {
  if (e.target === pgnDropZone || pgnDropZone.contains(e.target as Node)) return;
  e.preventDefault();
  pgnDropZone.classList.remove("is-dragging");
});
pgnOpenFileBtn.addEventListener("click", openPgnFile);
pgnFileInput.addEventListener("change", () => {
  const file = pgnFileInput.files?.[0];
  pgnFileInput.value = "";
  if (file) loadPgnBrowserFile(file);
});
pgnDropZone.addEventListener("dragover", e => {
  e.preventDefault();
  e.stopPropagation();
  pgnDropZone.classList.add("is-dragging");
});
pgnDropZone.addEventListener("dragleave", () => {
  pgnDropZone.classList.remove("is-dragging");
});
pgnDropZone.addEventListener("drop", e => {
  e.preventDefault();
  e.stopPropagation();
  pgnDropZone.classList.remove("is-dragging");
  const file = e.dataTransfer?.files?.[0];
  if (!file) {
    pgnStatus.textContent = text("noFileDrop");
    return;
  }
  loadPgnBrowserFile(file);
});
pgnGameList.addEventListener("click", e => {
  const btn = (e.target as HTMLElement | null)?.closest(".pgn-game-option") as HTMLElement | null;
  if (!btn?.dataset.index) return;
  openPgnImportGame(Number(btn.dataset.index));
});
pgnFirstBtn.addEventListener("click", () => pgnGoto(0));
pgnPrevBtn.addEventListener("click", () => pgnGoto(pgnIndex - 1));
pgnNextBtn.addEventListener("click", () => pgnGoto(pgnIndex + 1));
pgnLastBtn.addEventListener("click", () => pgnGoto(pgnMoves.length));
pgnPlayFromHereBtn.addEventListener("click", playFromPgnPosition);
pgnImportAgain.addEventListener("click", openPgnOverlay);
moveList.addEventListener("click", event => {
  const btn = (event.target as HTMLElement | null)?.closest("button[data-pgn-index]") as HTMLElement | null;
  if (!btn || modeSelect.value !== "pgn") return;
  pgnGoto(Number(btn.dataset.pgnIndex) || 0);
});

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
  if (mode === "library") {
    openGameLibrary();
    return;
  }
  if (online && mode !== "online") onlineLeave();
  modeSelect.value = mode;
  modeSelect.dispatchEvent(new Event("change"));
  hideStartupPicker();
  // PGN mode opens the import overlay first; the loaded game drives resetGameLocal.
  if (mode === "pgn") {
    pgnNav.hidden = true;
    pgnMoves = [];
    pgnIndex = 0;
    pgnSourceText = "";
    pgnSourceTitle = "";
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
      startupAiLevelWrap.hidden = mode !== "ai";
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

syncAiLevel(loadAiLevel());
applyLanguage();
setOnlineMode(modeSelect.value === "online");
renderTrainerPanel();

await loadStatus();
await refreshProfile();
showStartupPicker();
