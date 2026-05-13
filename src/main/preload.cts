// Preload script: bridges renderer -> main IPC. Runs with Node access but isolated from page JS.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  isElectron: true,
  engine: {
    status: () => ipcRenderer.invoke("engine:status"),
    evaluate: args => ipcRenderer.invoke("engine:evaluate", args),
    bestmove: args => ipcRenderer.invoke("engine:bestmove", args),
    topmoves: args => ipcRenderer.invoke("engine:topmoves", args),
  },
  pgnFile: {
    open: () => ipcRenderer.invoke("pgn:open-dialog"),
    readPath: path => ipcRenderer.invoke("pgn:read-path", { path }),
  },
  pgnLibrary: {
    importFile: () => ipcRenderer.invoke("pgn-library:import-dialog"),
    importPath: path => ipcRenderer.invoke("pgn-library:import-path", { path }),
    search: args => ipcRenderer.invoke("pgn-library:search", args),
    readGame: id => ipcRenderer.invoke("pgn-library:read-game", { id }),
    setFavorite: (id, favorite) => ipcRenderer.invoke("pgn-library:set-favorite", { id, favorite }),
  },
  serverUrl: () => ipcRenderer.invoke("config:serverUrl"),
});
