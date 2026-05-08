# xiangqi

An Electron Xiangqi app with local Pikafish analysis, online match play, server-owned user levels, and PGN import/replay.

## Features

- Play modes: user vs AI, trainer, local human vs human, online human vs human, and PGN replay.
- Local Pikafish engine integration through Electron IPC.
- Legal Xiangqi move generation in the client.
- Realtime evaluation, best-move suggestions, move-quality feedback, and score bar.
- Server login/sign up for online play.
- Online ranked/random matchmaking and room-code matches.
- User levels from `1-1` to `10-10`; wins add 10 points, losses subtract 10 points, and each 100 points advances one level step.
- PGN import/export.

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
server/
  server.js
tsconfig.json
```

The client app runs in Electron. The renderer is authored in TypeScript and compiled to `client/app.js` before app startup/build. The server is a lightweight Node HTTP service for auth, levels, presence, and online match relay.

## Requirements

- Node.js 20+ recommended for the app/server.
- npm.
- A Pikafish executable and NNUE file for AI analysis.
- Electron dependencies installed with `npm install`.

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

Build unsigned macOS DMG and ZIP artifacts:

```sh
npm run dist:mac
npm run dist:mac:arm64
```

The output is written to `dist/`. Because the app is unsigned and not notarized, macOS may require right-clicking the app and choosing Open the first time.

## Build Windows Client

Windows builds must bundle a Windows Pikafish executable named `pikafish.exe`.

Required files:

```text
pikafish.exe                  # Windows executable
pikafish.nnue                 # downloaded from official-pikafish/Networks if missing
```

Build unsigned Windows NSIS and ZIP artifacts:

```sh
npm run dist:win
```

## Build Linux Client

Linux builds must bundle a Linux Pikafish executable. The checked-out local `pikafish` file may be a macOS binary, so replace it or build it from source before packaging on Linux.

Required files:

```text
pikafish                      # Linux ELF executable, chmod +x
pikafish.nnue                 # downloaded from official-pikafish/Networks if missing
```

Build Pikafish from source on Linux:

```sh
git clone https://github.com/official-pikafish/Pikafish.git /tmp/pikafish
make -C /tmp/pikafish/src -j"$(nproc)" profile-build
install -m 755 /tmp/pikafish/src/pikafish ./pikafish
file pikafish                 # should include "ELF"
```

Then build Linux AppImage, DEB, and tar.gz artifacts:

```sh
npm ci
curl -fL https://github.com/official-pikafish/Networks/releases/download/master-net/pikafish.nnue -o pikafish.nnue
npm run dist:linux
```

## Automated GitHub Releases

The repository includes `.github/workflows/release.yml` for automatic Windows, Linux, and macOS ARM64 releases. It runs automatically when a tag matching `v*` is pushed, and can also be started manually from the Actions tab with:

- release tag
- Pikafish branch, tag, or commit to build
- optional NNUE download URL
- whether to upload to the GitHub release

Build runners:

- Linux: `ubuntu-latest`
- Windows: `windows-latest`
- macOS ARM64: `[self-hosted, macOS, ARM64]`

The macOS ARM64 runner must have Xcode Command Line Tools available so `make` can compile Pikafish.

The workflow builds Pikafish from `https://github.com/official-pikafish/Pikafish`, downloads `pikafish.nnue` from the official `official-pikafish/Networks` `master-net` release by default, validates the engine binary for each platform, packages Electron, uploads workflow artifacts, and publishes the files plus SHA-256 checksums to the GitHub release.

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

## PGN Replay

PGN mode reads user-provided game files directly. Users can paste PGN text, drag a PGN file into the import panel, or load a pasted file path. Single-game PGNs import automatically; `.pgns` and other multi-game PGN files show a selectable game list.

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
npm run dist:mac
npm run dist:mac:arm64
npm run dist:linux
npm run dist:win
```

## Publish Notes

Before publishing to GitHub:

- Do not commit private keys, tokens, or deployment credentials.
- Do not commit production `server/data/users.json`.
- Windows/Linux/macOS release artifacts include the engine and NNUE file.
- Make sure `pikafish` and `pikafish.nnue` licensing and distribution are acceptable for your repository.

## License

MIT License. See [LICENSE](LICENSE).
