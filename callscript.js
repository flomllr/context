const Websocket = require('ws');
const runApplescript = require('run-applescript');


const serverUrl = 'ws://localhost:9876';

const unitId = 3516711905; // Replace with your device's unitId
const ws = new Websocket(serverUrl);
const exec = require('child_process').exec;

const leftHalf = [0, 840, 23, 1027];
const rightHalf = [840, 1680, 23, 1027];
const topLeft = [0, 840, 23, 512]
const bottomLeft = [0, 840, 513, 1027]
const topRight = [840, 1680, 23, 512]
const bottomRight = [840, 1680, 513, 1027]

const tryRunApplescript = async (script) => {
    try {
        await runApplescript(script);
    } catch(e) {
        console.log(e);
    }
}

const getOpenApps = async () =>
    await tryRunApplescript(`
        tell application "System Events"
            set _P to a reference to (processes whose class of window 1 is window)
            set _W to a reference to windows of _P
            set _L to [_P's name, _W's size, _W's position]
            _L
        end tell
    `);

const openApp = async (app, xfrom, xto, yfrom, yto) => 
    await tryRunApplescript(`
        tell application "${app}" to activate
        tell application "System Events"
            set ssProcess to first process whose name is "${app}"
            tell ssProcess
                tell first window
                    set position to {${xfrom}, ${yfrom}}
                    set size to {${xto - xfrom}, ${yto - yfrom}}
                end tell
            end tell
        end tell
    `);

const openSafari = async (page) => 
    await tryRunApplescript(`
    tell application "Safari"
        open location "${page}"
        activate
    end tell
    `);

const closeApp = async (app) => 
    await tryRunApplescript(`
        tell application "${app}"
            quit
        end tell
    `);

const openSublimeFile = (path) => new Promise((resolve, reject) => {
    try {
        exec("/Applications/Sublime\\ Text.app/Contents/SharedSupport/bin/subl /Users/flomllr/app.js", (err, stdout, stderr) => {
            resolve();
        });
    } catch(e) {
        console.log(e);
        reject();
    }
});


const switchProfile = async (profile) => {
    switch(profile){
        case 'fun':
            await closeApp('Sublime Text');
            await closeApp('Spotify');
            await closeApp('Terminal');
            await closeApp('Safari');
            await openSafari('https://www.reddit.com/r/ProgrammerHumor/');
            await openApp('Safari', ...leftHalf);
            await openApp('Spotify', ...rightHalf);
            break;
        case 'coding':
            await closeApp('Spotify');
            await closeApp('Safari');
            await closeApp('Sublime Text');
            await closeApp('Terminal');
            await openSublimeFile('/User/flomllr/app.js');
            await openApp('Sublime Text', ...leftHalf);
            await openApp('Terminal', ...bottomRight);
            await openSafari('https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript');
            await openApp('Safari', ...topRight)
            break;
    }
}

ws.on('open', () => {
    console.log('Connected to server');
});

ws.on('message', async messageJson => {
    // Parse received message
    const message = JSON.parse(messageJson);
    const { value: { cid1 } } = message;
            
    try {
        if(cid1 === 86){
            const result = await switchProfile('fun');
            console.log(result);
        }
    
        if(cid1 === 83){
            const result = await switchProfile('coding');
            console.log(result);
        }
    } catch(err) {
        console.log('Error: ', err);
    }
  
    // Dump event
    console.log(cid1);
});