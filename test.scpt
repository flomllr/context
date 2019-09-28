tell application "System Events"
	set _P to a reference to (processes whose class of window 1 is window)
	set _W to a reference to windows of _P
	set _L to [_P's name, _W's size, _W's position]
	_L
end tell
