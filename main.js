const Websocket = require('ws');
const serverUrl = 'ws://localhost:9876';
const unitId = 3516711905; // Replace with your device's unitId
const ws = new Websocket(serverUrl);

const electron = require('electron')
// Module to control application life.
const { app, globalShortcut, ipcMain } = electron
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const menuItems = ['fun', 'coding'];
let activeItem = 0;
let numItems = menuItems.length + 1; // +1 for the add profiles button
let theMainWindow;


function mod(n, m) {
  return ((n % m) + m) % m;
}

function up() {
  console.log(numItems);
  activeItem = mod((activeItem + 1), numItems);
  theMainWindow.webContents.send('item:updateActive', activeItem);
  console.log(activeItem);
}

function down() {
  console.log(numItems);
  activeItem = mod((activeItem - 1), numItems);
  theMainWindow.webContents.send('item:updateActive', activeItem);
  console.log(activeItem);
}

function select() {
  theMainWindow.webContents.send('item:select', activeItem);
  console.log('Selected', activeItem);
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 200, height: 212, frame: false, webPreferences: { nodeIntegration: true}})
  theMainWindow = mainWindow;

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  mainWindow.webContents.on('did-finish-load', () => {    
    menuItems.forEach(e => {
      console.log("Sending item", e);
      mainWindow.webContents.send('item:add', e);
    });
    mainWindow.webContents.send('item:updateActive', activeItem);
  })

  globalShortcut.register('CommandOrControl+Alt+Up', up);

  globalShortcut.register('CommandOrControl+Alt+Down', down);

  globalShortcut.register('CommandOrControl+Alt+Enter', select);


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
app.on('ready', createWindow)

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

ws.on('open', () => {
    console.log('Connected to server');
});


let rotationBuffer = 0;
const bufferSize = 10;
ws.on('message', async messageJson => {
    // Parse received message
    const message = JSON.parse(messageJson);
    //console.log(message);
    const { path, value } = message || {};
    switch (path) {
      case undefined:
        return;
      case 'thumbWheel':
        const { rotation } = value;
        rotationBuffer += rotation;
        if(rotationBuffer > bufferSize){
          rotationBuffer = 0;
          up();
        } else if(rotationBuffer < (-1*bufferSize)){
          rotationBuffer = 0;
          down();
        }
        break;
      case 'divertedButtons':
        const {cid1, cid2, cid3, cid4} = value;
        if(cid1 === 195 || cid2 === 195 || cid3 === 195 || cid4 === 195){
          if(theMainWindow.isMinimized()){
            theMainWindow.restore();
          } else {
            select();
          }
        }
        break;
      default:
        break;
    }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.