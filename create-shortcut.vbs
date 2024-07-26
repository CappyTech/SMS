Set oArgs = WScript.Arguments
If oArgs.Count < 2 Then
    WScript.Echo "Usage: cscript create-shortcut.vbs <batch file path> <icon file path>"
    WScript.Quit 1
End If

sBatchFilePath = oArgs(0)
sIconFilePath = oArgs(1)

Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Start Application.lnk"

If oFSO.FileExists(sLinkFile) Then
    WScript.Echo "Shortcut already exists on Desktop."
Else
    Set oLink = oWS.CreateShortcut(sLinkFile)
    oLink.TargetPath = sBatchFilePath
    oLink.IconLocation = sIconFilePath
    oLink.Save
    WScript.Echo "Shortcut created on Desktop."
End If
