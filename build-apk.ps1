$ErrorActionPreference = 'Stop'
$jdkUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.4%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.4_7.zip"
$jdkZip = "jdk21.zip"
$jdkExtractDir = "jdk-21-portable"

Write-Host "Checking for portable JDK 21..."
if (-not (Test-Path "$jdkExtractDir")) {
    Write-Host "Downloading JDK 21... this may take a minute."
    Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZip
    Write-Host "Extracting JDK 21..."
    Expand-Archive -Path $jdkZip -DestinationPath $jdkExtractDir -Force
    Remove-Item $jdkZip
}

$jdkHome = (Get-ChildItem -Path $jdkExtractDir -Directory)[0].FullName
Write-Host "Setting JAVA_HOME to $jdkHome"
$env:JAVA_HOME = $jdkHome

Write-Host "Building Web Assets..."
npm run build

Write-Host "Syncing Capacitor..."
npx cap sync android

Write-Host "Building APK via Gradle..."
Set-Location android
.\gradlew assembleDebug
