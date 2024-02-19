// preload.js

const contextBridge = require('electron').contextBridge;

const ipcRenderer = require('electron').ipcRenderer;


// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

// Exposed protected methods in the render process
contextBridge.exposeInMainWorld(
    // Allowed 'ipcRenderer' methods
    'ipcRender', {
    // From render to main
    messageToMain: (message) => {
        ipcRenderer.send('messageToMain', message)
    },
    // From main to render
    messageFromMain: (message) => {
        ipcRenderer.on('messageFromMain', message)
    }
});