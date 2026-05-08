// Preload script: bridges renderer → main IPC. Runs with Node access but isolated from page JS.
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
    readPath: path => ipcRenderer.invoke("pgn:read-path", { path }),
  },
  serverUrl: () => ipcRenderer.invoke("config:serverUrl"),
});
