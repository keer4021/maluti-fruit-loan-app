const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');

function showDialog(event, options) {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = dialog.showMessageBoxSync(win, { title: 'Maluti Fruit Loan App', noLink: true, ...options });
  win.webContents.focus();
  return result;
}

ipcMain.on('dialog-alert', (event, message) => {
  showDialog(event, { type: 'info', message, buttons: ['OK'] });
  event.returnValue = undefined;
});

ipcMain.on('dialog-confirm', (event, message) => {
  event.returnValue = showDialog(event, { type: 'question', message, buttons: ['OK', 'Cancel'], defaultId: 0, cancelId: 1 }) === 0;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#f3f6f9',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setTitle('Maluti Fruit Loan App');
  win.loadFile(path.join(__dirname, 'pages', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
