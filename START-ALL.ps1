$root = $PSScriptRoot
Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-File',"$root\START-BACKEND.ps1"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-File',"$root\START-FRONTEND.ps1"
Write-Host "Backend and frontend terminals started." -ForegroundColor Green
