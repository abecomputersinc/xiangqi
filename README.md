# Pikafish Xiangqi

An Electron Xiangqi app with local Pikafish analysis, online match play, server-owned user levels, and a searchable PGN study library.

## Features

- Play modes: user vs AI, trainer, local human vs human, online human vs human, and PGN study.
- Local Pikafish engine integration through Electron IPC.
- Legal Xiangqi move generation in the client.
- Realtime evaluation, best-move suggestions, move-quality feedback, and score bar.
- Server login/sign up for online play.
- Online ranked/random matchmaking and room-code matches.
- User levels from `1-1` to `10-10`; wins add 10 points, losses subtract 10 points, and each 100 points advances one level step.
- PGN import/export.
- Built-in searchable DPXQ/WXF PGN study library backed by SQLite.
- SQLite move tree for opening study: identical move prefixes share one branch.

## Project Structure

```text
client/
  index.html
  app.ts             # TypeScript renderer source
  app.js             # generated renderer bundle loaded by index.html
  styles.css
  electron/
    main.cjs
    preload.cjs
  pgns/
    library.sqlite     # local data file, not committed by default
server/
  server.js
scripts/
  build-pgn-sqlite.cjs
tsconfig.json
```

The client app runs in Electron. The renderer is authored in TypeScript and compiled to `client/app.js` before app startup/build. The server is a lightweight Node HTTP service for auth, levels, presence, and online match relay.

## Requirements

- Node.js 20+ recommended for the app/server.
- Node.js with `node:sqlite` support is required when rebuilding `client/pgns/library.sqlite`.
- npm.
- A Pikafish executable and NNUE file for AI analysis.
- Electron dependencies installed with `npm install`.
- The Electron PGN viewer uses the local `sqlite3` command; set `SQLITE_BIN=/path/to/sqlite3` if it is not at `/usr/bin/sqlite3`.

## Install

```sh
npm install
```

## Engine Files

The Electron client expects these files at the repository root:

```text
pikafish
pikafish.nnue
```

You can override the paths:

```sh
PIKAFISH_PATH=/path/to/pikafish PIKAFISH_NNUE=/path/to/pikafish.nnue npm start
```

## Run Locally

Start the match/auth server:

```sh
npm run server
```

Start the Electron client:

```sh
npm start
```

`npm start` compiles `client/app.ts` first, then opens Electron.

By default the Electron app points to:

```text
http://129.153.61.43:4173
```

Use a different server URL when needed:

```sh
XIANGQI_SERVER_URL=http://localhost:4173 npm start
```

For LAN testing:

```sh
HOST=0.0.0.0 PORT=4173 npm run server
XIANGQI_SERVER_URL=http://YOUR_COMPUTER_IP:4173 npm start
```

## Build macOS Client

The macOS package bundles:

- `pikafish`
- `pikafish.nnue`
- `client/pgns/library.sqlite`

Build unsigned macOS DMG and ZIP artifacts:

```sh
npm run dist:mac
```

The output is written to `dist/`. Because the app is unsigned and not notarized, macOS may require right-clicking the app and choosing Open the first time.

## Online Server

The server exposes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/me`
- `POST /api/match/create`
- `POST /api/match/join`
- `POST /api/match/queue`
- `POST /api/match/ranked-queue`
- `GET /api/match/:code/events`
- `POST /api/match/:code/move`
- `POST /api/match/:code/resign`
- `POST /api/match/:code/rematch`
- `POST /api/match/:code/gameover`
- `POST /api/match/:code/leave`
- `POST /api/match/:code/state`

User data is stored as JSON by the server under:

```text
server/data/users.json
```

Do not commit real production user data.

## PGN Study Library

The PGN library lives under:

```text
client/pgns/library.sqlite
```

The Electron client reads this SQLite database directly. It does not load a giant JSON index into the browser.

Database layout:

- `games`: one row per game, including metadata and the full PGN text.
- `nodes`: a move-prefix tree. For example, all games starting with `b2e2` share the same child node under `ROOT`; games that continue with `h9g7` share the next child under that `b2e2` node.

Opening categories are based on the first move:

- 炮局: 当头炮, 兵底炮局, 仕角炮局, 过宫炮局, 金钩炮局, 边炮局, 巡河炮局, 过河炮局, 龟背炮局
- 兵局: 仙人指路, 边兵局
- 相局: 飞相局, 边相局
- 马局: 起马局, 边马局
- 仕类开局: 上仕局
- 其他类型

Rebuild the SQLite library from `client/pgns/by-opening/` source files:

```sh
npm run build:pgn-db
```

The bundled library is large and is ignored by Git by default. Use Git LFS or a GitHub Release asset for `client/pgns/library.sqlite` if you want to distribute it. The old JSON index is not used by the app anymore.

## Deployment

Deploy only the server folder and a minimal package file to your host. The server has no runtime dependencies beyond Node built-ins.

Example systemd environment:

```ini
[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/xiangqi-server
Environment=HOST=0.0.0.0
Environment=PORT=4173
ExecStart=/usr/bin/node /home/ubuntu/xiangqi-server/server/server.js
Restart=always
```

Open TCP port `4173` in both the VM firewall and cloud security rules.

## Useful Commands

```sh
npm run check:client
npm run build:client
node --check client/app.js
node --check client/electron/main.cjs
node --check client/electron/preload.cjs
node --check server/server.js
node --check scripts/build-pgn-sqlite.cjs
npm run dist:mac
```

## Publish Notes

Before publishing to GitHub:

- Do not commit private keys, tokens, or deployment credentials.
- Do not commit production `server/data/users.json`.
- Decide how to distribute `client/pgns/library.sqlite`. It is large and is excluded from the source repo by default.
- macOS release artifacts can include the engine and PGN database even though those local assets are excluded from source commits.
- Make sure `pikafish` and `pikafish.nnue` licensing and distribution are acceptable for your repository.

## License

MIT License. See [LICENSE](LICENSE).
