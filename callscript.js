const Websocket = require('ws');
const runApplescript = require('run-applescript');


const serverUrl = 'ws://localhost:9876';

const unitId = 3516711905; // Replace with your device's unitId
const ws = new Websocket(serverUrl);

const getOpenApps = `
tell application "System Events"
	set _P to a reference to (processes whose class of window 1 is window)
	set _W to a reference to windows of _P
	set _L to [_P's name, _W's size, _W's position]
	_L
end tell
`;

ws.on('open', () => {
    console.log('Connected to server');
});

ws.on('message', async messageJson => {
            
    // Parse received message
    const message = JSON.parse(messageJson);
    const { value: { cid1 } } = message;

    if(cid1 === 86){
        const result = await runApplescript(getOpenApps);
        console.log(result);
    }
    
    // Dump event
    console.log(cid1);
});