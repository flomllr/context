const Websocket = require('ws');
const runApplescript = require('run-applescript');


const serverUrl = 'ws://localhost:9876';

const unitId = 3516711905; // Replace with your device's unitId
const ws = new Websocket(serverUrl);

ws.on('open', () => {
    console.log('Connected to server');
});

ws.on('message', async messageJson => {
            
    // Parse received message
    const message = JSON.parse(messageJson);
    const { value: { cid1 } } = message;

    if(cid1 === 86){
        const result = await runApplescript('return "unicorn"');
        console.log(result);
    }
    
    // Dump event
    console.log(cid1);
});