# xiangqi

xiangqi is a desktop Chinese chess app for playing, training, and reviewing games. It combines a clean board, local Pikafish engine analysis, online matches, player levels, and PGN tools in one app.

![xiangqi trainer mode showing the board, realtime score, and move analysis](docs/xiangqi-trainer.png)

Use it when you want to:

- Play a full Xiangqi game against Pikafish, a local opponent, or another player online.
- Practice with Trainer mode: find the best move, ask for a hint, reveal the answer, restart the position, and track solved positions, attempts, and streaks.
- Study positions with realtime evaluation, best-move suggestions, move-quality feedback, and a visual score bar.
- Sign in for online play, ranked/random matchmaking, room-code matches, and persistent levels from `1-1` to `10-10`.
- Import and replay PGN games, export your own games, or copy the current FEN for sharing.
- Run engine analysis locally through bundled Pikafish and NNUE files.

## Main Functions

- **Play**: choose AI games, local human vs human, online human vs human, ranked/random matchmaking, or room-code matches.
- **Train**: solve best-move challenges with Hint, Reveal, Restart, solved count, streak, and attempt tracking.
- **Analyze**: see live score, recommended moves, and move-quality feedback while you play.
- **Review**: import PGN, step through saved games, and export finished games.
- **Account and levels**: log in or sign up for online play; ranked results update persistent level points.

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
- Windows/Linux/macOS release artifacts include third-party Pikafish engine and NNUE files.
- Release artifacts are not licensed as a single all-GPL package; bundled third-party components keep their own license terms.
- The bundled `pikafish.nnue` weights are not for commercial use without permission from the rightsholder.
- If you publish release artifacts, include the applicable third-party notices and source-code pointers for redistributed GPL components.

## License

xiangqi source code is licensed under the GNU General Public License version 3. See [LICENSE](LICENSE).

Release artifacts can include third-party components with separate license terms:

- `pikafish` / `pikafish.exe`: Pikafish engine, licensed separately under GPLv3 by the Pikafish project. When redistributing it, include the GPLv3 license and a source-code pointer for the exact engine build you ship.
- `pikafish.nnue`: Pikafish NNUE weights from the official Pikafish Networks release. The bundled weights are not for commercial use without permission from the rightsholder.

Do not treat a packaged release that includes `pikafish.nnue` as approved for business or commercial use unless you have the required permission for those NNUE weights.
