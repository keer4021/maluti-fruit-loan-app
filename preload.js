const { contextBridge, ipcRenderer } = require('electron');

// Native alert()/confirm() leave inputs unable to take focus on Windows,
// so the page routes them through the main process instead (see js/core.js).
contextBridge.exposeInMainWorld('desktopDialog', {
  alert: message => ipcRenderer.sendSync('dialog-alert', String(message ?? '')),
  confirm: message => ipcRenderer.sendSync('dialog-confirm', String(message ?? ''))
});
