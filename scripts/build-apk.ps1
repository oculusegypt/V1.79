$env:JAVA_HOME = "C:\Program Files\Android\Android Studio3\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
java -version
Write-Host "---"
$webDir = "C:\xampp\htdocs\v177\artifacts\tawbah-web"
Write-Host "Building web assets..."
Push-Location $webDir
pnpm -s build
Write-Host "Syncing Capacitor Android..."
npx cap sync android

$srcGs = Join-Path $webDir "android-config\google-services.json"
$dstGs = Join-Path $webDir "android\app\google-services.json"
if (Test-Path $srcGs) {
  Write-Host "Copying google-services.json to android/app..."
  Copy-Item -Force $srcGs $dstGs
} else {
  Write-Host "WARNING: google-services.json not found at $srcGs"
}
Pop-Location

Write-Host "---"
Push-Location "$webDir\android"
# Use --no-daemon to ensure the Gradle daemon does not run in the background
.\gradlew.bat --no-daemon assembleDebug
Pop-Location
