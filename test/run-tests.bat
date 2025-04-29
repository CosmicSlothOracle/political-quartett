@echo off
echo.
echo ===== Political Quartett Test Suite =====
echo.

:: Check if we need to open the test in browser
if "%1"=="--browser" goto open_browser

:: Run individual test files
echo Running JavaScript tests...
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed or not in PATH
  echo Please install Node.js and try again
  goto end
)

:: Run tests with Node.js if possible
if exist "test\basic-test.js" (
  echo Running basic-test.js...
  node test\basic-test.js
  echo.
)

if exist "test\card-manager-test.js" (
  echo Running card-manager-test.js...
  node test\card-manager-test.js
  echo.
)

if exist "test\deck-demo.js" (
  echo Running deck-demo.js...
  node test\deck-demo.js
  echo.
)

if exist "test\deck-factory-demo.js" (
  echo Running deck-factory-demo.js...
  node test\deck-factory-demo.js
  echo.
)

if exist "test\game-commands-test.js" (
  echo Running game-commands-test.js...
  node test\game-commands-test.js
  echo.
)

if exist "test\game-engine-test.js" (
  echo Running game-engine-test.js...
  node test\game-engine-test.js
  echo.
)

if exist "test\game-events-test.js" (
  echo Running game-events-test.js...
  node test\game-events-test.js
  echo.
)

if exist "test\game-state-test.js" (
  echo Running game-state-test.js...
  node test\game-state-test.js
  echo.
)

if exist "test\political-game-demo.js" (
  echo Running political-game-demo.js...
  node test\political-game-demo.js
  echo.
)

if exist "test\network-manager-test.js" (
  echo Running network-manager-test.js...
  node test\network-manager-test.js
  echo.
)

if exist "test\ui-adapter-test.js" (
  echo Running ui-adapter-test.js...
  node test\ui-adapter-test.js
  echo.
)

:: Browser-based tests
echo Some tests require a browser to run properly.
echo To run browser tests, run with --browser parameter.
echo.

goto end

:open_browser
echo Starting browser-based tests...

:: Try to detect browsers and open test.html
set browser_found=0

:: Try Chrome
where chrome >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Opening tests in Chrome...
  start chrome "file://%CD%\test.html"
  set browser_found=1
  goto browser_opened
)

:: Try Firefox
where firefox >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Opening tests in Firefox...
  start firefox "file://%CD%\test.html"
  set browser_found=1
  goto browser_opened
)

:: Try Edge
where msedge >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Opening tests in Microsoft Edge...
  start msedge "file://%CD%\test.html"
  set browser_found=1
  goto browser_opened
)

:: No browser found
if %browser_found% EQU 0 (
  echo Could not find a supported browser.
  echo Please open test.html manually in your browser.
)

:browser_opened
echo Browser-based tests launched.
echo Please check the browser window for test results.
echo.

:end
echo Test runner completed.
echo.