# PowerShell version of run-tests.sh
# Colors for output
$RESET = ""
$RED = ""
$GREEN = ""
$YELLOW = ""
$CYAN = ""

if ($Host.UI.SupportsVirtualTerminal) {
    $RESET = "`e[0m"
    $RED = "`e[31m"
    $GREEN = "`e[32m"
    $YELLOW = "`e[33m"
    $CYAN = "`e[36m"
}

function Write-ColoredMessage($message, $color) {
    Write-Host "$color$message$RESET"
}

function Test-ServerRunning {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient("localhost", 3000)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Start-TestServer {
    Write-ColoredMessage "Starting server..." $CYAN
    Start-Process -FilePath "node" -ArgumentList "../server.js" -NoNewWindow
    # Wait for server to start
    $attempts = 0
    $maxAttempts = 10

    while (-not (Test-ServerRunning) -and $attempts -lt $maxAttempts) {
        Write-Host "Waiting for server to start..."
        Start-Sleep -Seconds 1
        $attempts++
    }

    if (Test-ServerRunning) {
        Write-ColoredMessage "Server started successfully!" $GREEN
        return $true
    }
    else {
        Write-ColoredMessage "Failed to start server after $maxAttempts attempts" $RED
        return $false
    }
}

function Stop-TestServer {
    if (Test-ServerRunning) {
        Write-ColoredMessage "Stopping server..." $CYAN
        # Find and stop the Node.js process running server.js
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "server.js" }

        if ($nodeProcesses) {
            foreach ($process in $nodeProcesses) {
                Stop-Process -Id $process.Id -Force
            }
            Write-ColoredMessage "Server stopped" $GREEN
        }
        else {
            Write-ColoredMessage "Could not find server process to stop" $YELLOW
        }
    }
}

function Run-BasicTests {
    Write-ColoredMessage "Running basic tests..." $CYAN

    # Execute the actual basic tests
    & node test/basic-test.js

    if ($LASTEXITCODE -eq 0) {
        Write-ColoredMessage "Basic tests completed successfully" $GREEN
        return $true
    }
    else {
        Write-ColoredMessage "Basic tests failed" $RED
        return $false
    }
}

function Confirm-PuppeteerInstall {
    Write-ColoredMessage "Checking for Puppeteer..." $CYAN

    # Check if node_modules/puppeteer exists
    if (Test-Path "node_modules/puppeteer") {
        Write-ColoredMessage "Puppeteer is already installed" $GREEN
        return $true
    }

    $answer = Read-Host "Puppeteer is not installed. Would you like to install it now? (y/n)"
    if ($answer -eq "y") {
        Write-ColoredMessage "Installing Puppeteer..." $CYAN
        npm install puppeteer

        if ($LASTEXITCODE -eq 0) {
            Write-ColoredMessage "Puppeteer installed successfully" $GREEN
            return $true
        }
        else {
            Write-ColoredMessage "Failed to install Puppeteer" $RED
            return $false
        }
    }
    else {
        Write-ColoredMessage "Puppeteer installation skipped" $YELLOW
        return $false
    }
}

function Run-UITests {
    Write-ColoredMessage "Running UI tests with Puppeteer..." $CYAN

    # Execute the actual UI tests
    & node test/game-test.js

    if ($LASTEXITCODE -eq 0) {
        Write-ColoredMessage "UI tests completed successfully" $GREEN
        return $true
    }
    else {
        Write-ColoredMessage "UI tests failed" $RED
        return $false
    }
}

function Run-MultiplayerTests {
    Write-ColoredMessage "Running multiplayer matchmaking tests..." $CYAN

    # Execute the multiplayer tests
    & node test/multiplayer-test.js

    if ($LASTEXITCODE -eq 0) {
        Write-ColoredMessage "Multiplayer tests completed successfully" $GREEN
        return $true
    }
    else {
        Write-ColoredMessage "Multiplayer tests failed" $RED
        return $false
    }
}

function Run-AllTestsAndWait {
    Write-ColoredMessage "Running all tests sequentially..." $CYAN

    # Run basic tests first
    $basicTestsPassed = Run-BasicTests
    if (-not $basicTestsPassed) {
        Write-ColoredMessage "Basic tests failed, cannot proceed" $RED
        return $false
    }

    # Then run UI tests
    $puppeteerReady = Confirm-PuppeteerInstall
    if ($puppeteerReady) {
        $uiTestsPassed = Run-UITests
        if (-not $uiTestsPassed) {
            Write-ColoredMessage "UI tests failed, cannot proceed" $RED
            return $false
        }
    }
    else {
        Write-ColoredMessage "Skipping UI tests due to missing Puppeteer" $YELLOW
    }

    # Finally run multiplayer tests
    $puppeteerReady = Confirm-PuppeteerInstall
    if ($puppeteerReady) {
        $multiplayerTestsPassed = Run-MultiplayerTests
        if (-not $multiplayerTestsPassed) {
            Write-ColoredMessage "Multiplayer tests failed, cannot proceed" $RED
            return $false
        }
    }
    else {
        Write-ColoredMessage "Skipping multiplayer tests due to missing Puppeteer" $YELLOW
    }

    Write-ColoredMessage "All tests completed successfully!" $GREEN
    return $true
}

# Main script
Clear-Host
Write-ColoredMessage "=== Political Quartett Game Test Runner ===" $CYAN
Write-ColoredMessage "=== Windows PowerShell Version ===" $CYAN

$serverWasRunning = Test-ServerRunning

if (-not $serverWasRunning) {
    $serverStarted = Start-TestServer
    if (-not $serverStarted) {
        Write-ColoredMessage "Cannot continue without a running server" $RED
        exit 1
    }
}

# Check if we should run all tests at once
if ($args.Contains("--all") -or $args.Contains("-a")) {
    $allTestsPassed = Run-AllTestsAndWait

    # Clean up
    if (-not $serverWasRunning) {
        Stop-TestServer
    }

    # Exit with appropriate status code
    if ($allTestsPassed) {
        Write-ColoredMessage "All tests passed! Proceeding with next steps..." $GREEN
        exit 0
    }
    else {
        Write-ColoredMessage "Tests failed, cannot proceed" $RED
        exit 1
    }
}

$basicTestsPassed = Run-BasicTests
if (-not $basicTestsPassed) {
    Write-ColoredMessage "Basic tests failed" $RED
    if (-not $serverWasRunning) { Stop-TestServer }
    exit 1
}

$answer = Read-Host "Would you like to run UI tests with Puppeteer? (y/n)"
if ($answer -eq "y") {
    $puppeteerReady = Confirm-PuppeteerInstall
    if ($puppeteerReady) {
        $uiTestsPassed = Run-UITests
        if (-not $uiTestsPassed) {
            Write-ColoredMessage "UI tests failed" $RED
            if (-not $serverWasRunning) { Stop-TestServer }
            exit 1
        }
    }
}

$answer = Read-Host "Would you like to run multiplayer matchmaking tests? (y/n)"
if ($answer -eq "y") {
    $puppeteerReady = Confirm-PuppeteerInstall
    if ($puppeteerReady) {
        $multiplayerTestsPassed = Run-MultiplayerTests
        if (-not $multiplayerTestsPassed) {
            Write-ColoredMessage "Multiplayer tests failed" $RED
            if (-not $serverWasRunning) { Stop-TestServer }
            exit 1
        }
    }
}

if (-not $serverWasRunning) {
    Stop-TestServer
}

Write-ColoredMessage "All tests completed successfully!" $GREEN
exit 0