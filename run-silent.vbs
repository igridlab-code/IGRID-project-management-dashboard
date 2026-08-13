Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\user\Desktop\IGRID project management dashboard"
WshShell.Run "node start-master.js", 0, False
