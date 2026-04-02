$src = "C:\Users\sd\AppData\Local\Temp\v177_backup"
Get-ChildItem $src -File | ForEach-Object {
    Copy-Item -Force $_.FullName .
    Write-Host ("Restored: " + $_.Name)
}
Write-Host "Done!"
