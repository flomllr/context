const applescript = require('applescript');

var windows = [{}]

const script = `
tell application "System Events"
            set _P to a reference to (processes whose class of window 1 is window)
            set _W to a reference to windows of _P
            set _L to [_P's name, _W's size, _W's position]
            return _L
        end tell
`
const runAppleScript = () => new Promise(resolve => {
    applescript.execString(script, (err, rtn) => {
      if (err) {
        // Something went wrong!
      }
      if (Array.isArray(rtn)) {
      for (i in rtn[0]) {
        windows.push({
          name: rtn[0][i],
          width: rtn[1][i][0][0],
          height: rtn[1][i][0][1],
          xPos: rtn[2][i][0][0],
          yPos: rtn[2][i][0][1]
        })
      }
      resolve();
    }
  });
});

(async () => {
  return await runAppleScript();
})();