const runApplescript = require('run-applescript');
const applescript = require('applescript');
const exec = require('child_process').exec;

const leftHalf = [0, 840, 23, 1027];
const rightHalf = [840, 1680, 23, 1027];
const topLeft = [0, 840, 23, 512]
const bottomLeft = [0, 840, 513, 1027]
const topRight = [840, 1680, 23, 512]
const bottomRight = [840, 1680, 513, 1027]

// Profiles are stored temporarily in this array for now (until the app restarts)
const profiles = [];

const tryRunApplescript = async (script) => {
    try {
        await runApplescript(script);
    } catch(e) {
        console.log(e);
    }
}

const getCurrentProfile = async () => {
    const script = `
        tell application "System Events"
            set _P to a reference to (processes whose background only = false)
            set _W to a reference to windows of _P
            set _L to [_P's name, _W's size, _W's position]
            return _L
        end tell
        `

    // Current window configuration will be saved in profile
    const profile = await (() => new Promise(resolve => {
        const windows = []
        applescript.execString(script, (err, rtn) => {
            if (err) {
                console.log("Error: ", err);
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

    return profile;
}
exports.getCurrentProfile = getCurrentProfile;

exports.openProfile = async (profile) => {
    const openWindows = await getCurrentProfile();
    for (const window of openWindows) {
        // Skip this app and the terminal that runs it
        if (window.name === "Electron" || window.name === "alacritty") {
            continue;
        }

        console.log("Closing window " + window.name)
        await closeApp(window.name);
    }

    for (const window of profile) {
        // Skip this app and the terminal that runs it
        if (window.name === "Electron" || window.name === "alacritty") {
            continue;
        }
        console.log("Opening window " + window.name)
        await openApp(window.name, window.xPos, window.width, window.yPos, window.height)
    }
}

const openDesktop = async () => 
    await tryRunApplescript(`
        tell application "System Events"
        tell application "Mission Control" to launch
        tell group 2 of group 1 of group 1 of process "Dock"
            click (every button whose value of attribute "AXDescription" is "add desktop")
            tell list 1
                set countSpaces to count of buttons
                delay 0.5
                click button (countSpaces)
            end tell
        end tell
        end tell
`);

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

const openPages = async (doc) => {
    await tryRunApplescript(`
    tell application "Pages"
        activate
        open "${doc}"
    end tell
    `);
}

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


exports.switchProfile = async (profile) => {
    const openWindows = await getCurrentProfile();
    for (const window of openWindows) {
        // Skip this app and the terminal that runs it
        if (window.name === "Electron" || window.name === "alacritty") {
            continue;
        }

        console.log("Closing window " + window.name)
        await closeApp(window.name);
    }
    switch(profile){
        case 'university':
            await closeApp('Pages');
            await closeApp('Safari');
            await openSafari('https://de.wikipedia.org/wiki/Wikipedia:Hauptseite');
            await openApp('Safari', ...leftHalf);
            await openPages('/Users/flomllr/deeplearning_report.pages');
            await openApp('Pages', ...rightHalf);
            break;
        case 'coding':
            await closeApp('Safari');
            await closeApp('Sublime Text');
            await closeApp('Terminal');
            await openSublimeFile('/User/flomllr/app.js');
            await openApp('Sublime Text', ...leftHalf);
            await openApp('Terminal', ...bottomRight);
            await openSafari('https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript');
            await openApp('Safari', ...topRight)
            break;
        case 'design':
            await openApp('Adobe Photoshop CC 2019', 0, 3360, 23, 1027);
            break;
        default:
            break;
    }
}