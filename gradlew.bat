@echo off
setlocal
set GRADLE_VERSION=8.11.1
set ROOT_DIR=%~dp0
set BOOT_DIR=%ROOT_DIR%.gradle-bootstrap
set ZIP=%BOOT_DIR%\gradle-%GRADLE_VERSION%-bin.zip
set DIST=%BOOT_DIR%\gradle-%GRADLE_VERSION%
if exist "%DIST%\bin\gradle.bat" goto run
if not exist "%BOOT_DIR%" mkdir "%BOOT_DIR%"
if not exist "%ZIP%" (
  echo Downloading Gradle %GRADLE_VERSION%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-%GRADLE_VERSION%-bin.zip' -OutFile '%ZIP%'"
  if errorlevel 1 exit /b 1
)
echo Extracting Gradle...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%BOOT_DIR%' -Force"
if errorlevel 1 exit /b 1
:run
call "%DIST%\bin\gradle.bat" %*
endlocal
