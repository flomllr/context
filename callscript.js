const Websocket = require('ws');
const runApplescript = require('run-applescript');
const applescript = require('applescript');


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
profiles = []

const tryRunApplescript = async (script) => {
    try {
        await runApplescript(script);
    } catch(e) {
        console.log(e);
    }
}

const saveCurrentProfileAs = async (profileName) => {
    const script = `
    tell application "System Events"
        set _P to a reference to (processes whose background only = false)
        set _W to a reference to windows of _P
        set _L to [_P's name, _W's size, _W's position]
        return _L
    end tell
`
    const profile = await (() => new Promise(resolve => {
        const windows = []
        applescript.execString(script, (err, rtn) => {
            if (err) {
                // Something went wrong!
            }
            if (Array.isArray(rtn)) {
                for (i in rtn[0]) {
                    if (rtn[1][i].length == 0) {
                        continue;
                    }
                    windows.push({
                        name: rtn[0][i],
                        width: rtn[1][i][0][0],
                        height: rtn[1][i][0][1],
                        xPos: rtn[2][i][0][0],
                        yPos: rtn[2][i][0][1]
                    })
                }
            resolve(windows);
            }
        });
    }))();

    const saveProfile = {
        title: profileName,
        config: profile
    }

    profiles.push(saveProfile)
}

const openApp = async (app, xPos, width, yPos, height) => 
    await tryRunApplescript(`
        tell application "${app}" to activate
        tell application "System Events"
            set ssProcess to first process whose name is "${app}"
            tell ssProcess
                tell first window
                    set position to {${xPos}, ${yPos}}
                    set size to {${width}, ${height}}
                end tell
            end tell
        end tell
    `);

const openProfile = async (profile) => {
    let foundProfile = profiles.find(e => e.title === profile)
    foundProfile = foundProfile.config
    for (const window of foundProfile) {
        if (window.name === "Electron" || window.name === "alacritty") {
            continue;
        }

        console.log("Closing window " + window.name)
        await closeApp(window.name);
    }

    for (const window of foundProfile) {
        if (window.name === "Electron" || window.name === "alacritty") {
            continue;
        }

        console.log("Opening window " + window.name)
        await openApp(window.name, window.xPos, window.width, window.yPos, window.height)
    }
}

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

const openDesktop = async (addButton) => 
    await tryRunApplescript(`
    tell application "System Events"
	tell application "Mission Control" to launch
	tell group 2 of group 1 of group 1 of process "Dock"
		click (every button whose value of attribute "AXDescription" is "${addButton}")
		tell list 1
			set countSpaces to count of buttons
			delay 0.5
			click button (countSpaces)
		end tell
	end tell
end tell
    `);

(async () => {
    console.log("Saving")
    await saveCurrentProfileAs("test")
    console.log("Desktop switching")
    await openDesktop("añadir escritorio")
    console.log("Opening profile")
    await openProfile("test")
})();


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