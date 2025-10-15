# start-all.ps1
$folders = @(
    "services\auth",
    "services\assessments",
    "services\ai",
    "gateway"
)

foreach ($folder in $folders) {
    Write-Host "Starting dev server in $folder ..."
    Start-Process powershell -ArgumentList "cd `"$PWD\$folder`"; npm run dev"
}
