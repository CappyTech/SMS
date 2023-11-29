const { ipcRenderer } = require('electron');

ipcRenderer.on('change-theme', (event, theme) => {
    document.documentElement.setAttribute('data-bs-theme', theme);
});