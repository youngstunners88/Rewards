const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    resizable: true,
    title: 'Rewards — Classroom Point Tracker',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the static HTML index file from the src/ directory
  win.loadFile(path.join(__dirname, 'src/index.html'));
}

// Standard Electron lifecycle hooks
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
