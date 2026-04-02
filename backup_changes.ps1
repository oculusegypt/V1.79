$dest = Join-Path $env:TEMP "v177_backup"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$files = @(
    ".gitignore",
    "lib\db\src\schema\tawbah.ts",
    "artifacts\api-server\src\routes\journey.ts",
    "artifacts\tawbah-web\src\pages\relapse.tsx",
    "artifacts\tawbah-web\src\pages\home\bento-cells.tsx",
    "artifacts\tawbah-web\src\pages\home\JourneyCard.tsx",
    "artifacts\tawbah-web\src\pages\sins-list.tsx"
)
foreach ($f in $files) {
    if (Test-Path $f) {
        Copy-Item -Force $f (Join-Path $dest (Split-Path $f -Leaf))
    }
}
Write-Host "Backup saved to: $dest"
