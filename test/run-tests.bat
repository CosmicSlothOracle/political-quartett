@echo off
:: Batch script version of run-tests for Windows

:: Enable delayed expansion for variables
setlocal enabledelayedexpansion

:: Colors for output
set "RESET=[0m"
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "CYAN=[96m"

:: Function to print colored messages
call :init_colors
goto :main

:print_colored
echo %~2%~1%RESET%
exit /b 0

:init_colors
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "ESC=%%b"
)
set "RESET=!ESC![0m"
set "RED=!ESC![91m"
set "GREEN=!ESC![92m"
set "YELLOW=!ESC![93m"
set "CYAN=!ESC![96m"
exit /b 0

:: Function to check if server is running
:is_server_running
netstat -an | find "LISTENING" | find ":3000" > nul
if %ERRORLEVEL% equ 0 (
  exit /b 0
) else (
  exit /b 1
)

:: Function to start the server
:start_test_server
call :print_colored "Starting server..." "%CYAN%"
start /b cmd /c "node server.js"
set SERVER_PID=!ERRORLEVEL!

:: Wait for server to start
set attempts=0
set max_attempts=10

:server_wait_loop
call :is_server_running
if !ERRORLEVEL! equ 0 (
  goto :server_started
)
if !attempts! geq !max_attempts! (
  goto :server_failed
)
echo Waiting for server to start...
timeout /t 1 /nobreak > nul
set /a attempts+=1
goto :server_wait_loop

:server_started
call :print_colored "Server started successfully!" "%GREEN%"
exit /b 0

:server_failed
call :print_colored "Failed to start server after !max_attempts! attempts" "%RED%"
exit /b 1

:: Function to stop the server
:stop_test_server
call :is_server_running
if !ERRORLEVEL! equ 0 (
  call :print_colored "Stopping server..." "%CYAN%"
  for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a > nul 2>&1
  )
  call :print_colored "Server stopped" "%GREEN%"
)
exit /b 0

:: Function to run basic tests
:run_basic_tests
call :print_colored "Running basic tests..." "%CYAN%"

:: Execute the actual basic tests
node test/basic-test.js

if !ERRORLEVEL! equ 0 (
  call :print_colored "Basic tests completed successfully" "%GREEN%"
  exit /b 0
) else (
  call :print_colored "Basic tests failed" "%RED%"
  exit /b 1
)

:: Function to check for and possibly install Puppeteer
:confirm_puppeteer_install
call :print_colored "Checking for Puppeteer..." "%CYAN%"

:: Check if node_modules/puppeteer exists
if exist "node_modules\puppeteer" (
  call :print_colored "Puppeteer is already installed" "%GREEN%"
  exit /b 0
)

set /p answer=Puppeteer is not installed. Would you like to install it now? (y/n)
if /i "!answer!"=="y" (
  call :print_colored "Installing Puppeteer..." "%CYAN%"
  npm install puppeteer

  if !ERRORLEVEL! equ 0 (
    call :print_colored "Puppeteer installed successfully" "%GREEN%"
    exit /b 0
  ) else (
    call :print_colored "Failed to install Puppeteer" "%RED%"
    exit /b 1
  )
) else (
  call :print_colored "Puppeteer installation skipped" "%YELLOW%"
  exit /b 1
)

:: Function to run UI tests
:run_ui_tests
call :print_colored "Running UI tests with Puppeteer..." "%CYAN%"

:: Execute the actual UI tests
node test/game-test.js

if !ERRORLEVEL! equ 0 (
  call :print_colored "UI tests completed successfully" "%GREEN%"
  exit /b 0
) else (
  call :print_colored "UI tests failed" "%RED%"
  exit /b 1
)

:: Function to run multiplayer tests
:run_multiplayer_tests
call :print_colored "Running multiplayer matchmaking tests..." "%CYAN%"

:: Execute the multiplayer tests
node test/multiplayer-test.js

if !ERRORLEVEL! equ 0 (
  call :print_colored "Multiplayer tests completed successfully" "%GREEN%"
  exit /b 0
) else (
  call :print_colored "Multiplayer tests failed" "%RED%"
  exit /b 1
)

:: Function to run all tests sequentially and wait for completion
:run_all_tests_and_wait
call :print_colored "Running all tests sequentially..." "%CYAN%"

:: Run basic tests first
call :run_basic_tests
if !ERRORLEVEL! neq 0 (
  call :print_colored "Basic tests failed, cannot proceed" "%RED%"
  exit /b 1
)

:: Then run UI tests if Puppeteer is available
call :confirm_puppeteer_install
if !ERRORLEVEL! equ 0 (
  call :run_ui_tests
  if !ERRORLEVEL! neq 0 (
    call :print_colored "UI tests failed, cannot proceed" "%RED%"
    exit /b 1
  )
) else (
  call :print_colored "Skipping UI tests due to missing Puppeteer" "%YELLOW%"
)

:: Finally run multiplayer tests if Puppeteer is available
call :confirm_puppeteer_install
if !ERRORLEVEL! equ 0 (
  call :run_multiplayer_tests
  if !ERRORLEVEL! neq 0 (
    call :print_colored "Multiplayer tests failed, cannot proceed" "%RED%"
    exit /b 1
  )
) else (
  call :print_colored "Skipping multiplayer tests due to missing Puppeteer" "%YELLOW%"
)

call :print_colored "All tests completed successfully!" "%GREEN%"
exit /b 0

:: Main script execution starts here
:main
cls
call :print_colored "=== Political Quartett Game Test Runner ===" "%CYAN%"
call :print_colored "=== Windows Batch Version ===" "%CYAN%"

:: Check if server is already running
set "server_was_running=false"
call :is_server_running
if !ERRORLEVEL! equ 0 (
  set "server_was_running=true"
)

:: Start server if needed
if "!server_was_running!"=="false" (
  call :start_test_server
  if !ERRORLEVEL! neq 0 (
    call :print_colored "Cannot continue without a running server" "%RED%"
    exit /b 1
  )
)

:: Check if we should run all tests at once
if "%~1"=="--all" goto run_all_at_once
if "%~1"=="-a" goto run_all_at_once
goto run_interactive

:run_all_at_once
call :run_all_tests_and_wait
set test_result=!ERRORLEVEL!

:: Clean up
if "!server_was_running!"=="false" (
  call :stop_test_server
)

:: Exit with appropriate status
if !test_result! equ 0 (
  call :print_colored "All tests passed! Proceeding with next steps..." "%GREEN%"
  exit /b 0
) else (
  call :print_colored "Tests failed, cannot proceed" "%RED%"
  exit /b 1
)

:run_interactive
:: Run basic tests
call :run_basic_tests
if !ERRORLEVEL! neq 0 (
  call :print_colored "Basic tests failed" "%RED%"
  if "!server_was_running!"=="false" (
    call :stop_test_server
  )
  exit /b 1
)