const electron = require('electron')
const electronLocalshortcut = require('electron-localshortcut');
// Module to control application life.
const { app, globalShortcut, ipcMain } = electron

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let activeItem = 0;
let theMainWindow;

// Persistency
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

// Initialize database
const adapter = new FileSync(`db.json`)
const db = low(adapter)

// Set defaults for database
db.defaults({
  profiles: []
}).write()

const menuItems = db.getState().profiles;
let numItems = menuItems.length + 1; // +1 for the add profiles button

function mod(n, m) {
  return ((n % m) + m) % m;
}

function up() {
  console.log(numItems);
  theMainWindow.show();
  activeItem = mod((activeItem - 1), numItems);
  theMainWindow.webContents.send('item:updateActive', activeItem);
  console.log(activeItem);
}

function down() {
  console.log(numItems);
  theMainWindow.show();
  activeItem = mod((activeItem + 1), numItems);
  theMainWindow.webContents.send('item:updateActive', activeItem);
  console.log(activeItem);
}

function select() {
  theMainWindow.webContents.send('item:select', activeItem);
  console.log('Selected', activeItem);
}

function showWindow() {
  theMainWindow.setVisibleOnAllWorkspaces(true); // put the window on all screens
  theMainWindow.restore();
  //theMainWindow.focus();
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 200, height: 212, frame: false, webPreferences: { nodeIntegration: true}})
  theMainWindow = mainWindow;

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  mainWindow.webContents.on('did-finish-load', () => {    
    menuItems.forEach(item => {
      console.log("Sending item", item);
      mainWindow.webContents.send('item:add', item);
    });
    mainWindow.webContents.send('item:updateActive', activeItem);
  })

  // Shortcuts
  globalShortcut.register('CommandOrControl+Shift+Enter', () => theMainWindow.show());
  electronLocalshortcut.register(mainWindow, 'Down', down);
  electronLocalshortcut.register(mainWindow, 'Up', up);
  electronLocalshortcut.register(mainWindow, 'Enter', select);
  electronLocalshortcut.register(mainWindow, 'Esc', () => theMainWindow.hide());

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('numItems', function (e, num) {
  numItems = num;
  const newHeight = num * 53;
  const size = theMainWindow.getSize();
  const height = size[1];
  if(newHeight > height){
    theMainWindow.setSize(size[0], newHeight);
  }
  console.log(num);
});

ipcMain.on('saveConfig', function (e, title, config) {
  console.log(title)
  console.log(config)
  db.get('profiles')
    .upsert( { title, config } )
    .write()
})

db._.mixin({
  upsert: function(collection, obj, key) {
    key = key || 'id';
    for (var i = 0; i < collection.length; i++) {
      var el = collection[i];
      if(el[key] === obj[key]){
        collection[i] = obj;
        return collection;
      }
    };
    collection.push(obj);
  }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.