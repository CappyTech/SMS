const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const expressApp = require('./app'); // Import your Express app

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        frame: false,
        icon: path.join(__dirname, './public/favicon.ico'),
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation:true,
        }
    });

    mainWindow.setMenu(null);

    const PORT = 3000; // Or any other port you prefer
    expressApp.listen(PORT, () => {
        console.log(`Express app listening on http://localhost:${PORT}`);
        mainWindow.loadURL(`http://localhost:${PORT}`);
    });
}

function createTray() {
    tray = new Tray('./public/favicon.png');
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Light Mode',
            type: 'radio',
            click: () => mainWindow.webContents.send('change-mode', 'light')
        },
        {
            label: 'Dark Mode',
            type: 'radio',
            click: () => mainWindow.webContents.send('change-mode', 'dark')
        },
        { type: 'separator' },
        { label: 'Exit', click: () => app.quit() }
    ]);

    tray.setToolTip('SMS - HeronCS');
    tray.setContextMenu(contextMenu);
}

ipcMain.on('change-theme', (event, theme) => {
    mainWindow.webContents.send('change-theme', theme);
});

app.on('ready', () => {
    if (process.env.NODE_ENV === 'production') {
        autoUpdater.checkForUpdates();
    }
    createWindow();
    createTray();
});

autoUpdater.on('update-available', () => {
    // Notify the user that an update is available
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: 'A new version has been downloaded. Restart the application to apply the updates.'
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
});

autoUpdater.on('error', (error) => {
    // Log or handle errors
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
