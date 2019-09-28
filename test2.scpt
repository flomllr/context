tell application "iTunes" to activate
tell application "System Events" to tell process "iTunes"
	set position of window 1 to {0, 23}
	set size of window 1 to {840, 1027}
end tell
