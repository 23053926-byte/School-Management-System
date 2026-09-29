Set-Location "$PSScriptRoot\backend"
if (!(Test-Path "node_modules")) { npm install }
if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created backend\.env. Add your MongoDB/JWT/email values, then run this script again." -ForegroundColor Yellow
  Read-Host "Press Enter to close"
  exit
}
npm run dev
