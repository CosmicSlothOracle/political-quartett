# Test Runner Scripts

This directory contains scripts for running tests for the Political Quartett Game project.

## Available Scripts

- `run-tests.sh` - Shell script for Linux/macOS systems
- `run-tests.bat` - Batch script for Windows systems

## Features

Both scripts include:

- Automatic server management (start/stop)
- Basic test execution
- Optional UI tests with Puppeteer
- Colored output for better readability

## Usage

### On Linux/macOS:

```bash
# Make sure the script is executable
chmod +x test/run-tests.sh

# Run the script
./test/run-tests.sh
```

### On Windows:

```batch
# Run the script
test\run-tests.bat
```

## Test Types

1. **Basic tests**: Simple tests that verify basic functionality
2. **UI tests**: More advanced tests using Puppeteer to test the user interface

## Configuration

You can modify the scripts to add your specific test commands by editing the following sections:

- `run_basic_tests` function - Add your basic test commands
- `run_ui_tests` function - Add your UI test commands using Puppeteer

## Dependencies

- For UI tests: [Puppeteer](https://pptr.dev/) (will be installed if needed)
- Basic tests require Node.js

## Test Files

- `basic-test.js` - Basic server connectivity and file structure tests
- `game-test.js` - UI tests for game mechanics using Puppeteer
- `multiplayer-test.js` - Multiplayer and matchmaking tests using two browser instances
- `lobby-test.js` - Tests for the lobby system

## Running Tests

Use the provided scripts to run the tests:

- Windows PowerShell: `.\test\run-tests.ps1`
- Windows Command Prompt: `test\run-tests.bat`
- Linux/macOS: `./test/run-tests.sh`

### Command-line Options

- `--all` or `-a`: Run all tests sequentially and wait for all to complete successfully before proceeding
  - Example: `./test/run-tests.sh --all`
  - This will run basic tests, UI tests, and multiplayer tests in sequence
  - Execution will stop immediately if any test fails
  - The script will exit with code 0 only if ALL tests pass

### Prerequisites

- Node.js and npm installed
- Server must be running (scripts will start it if not running)
- Puppeteer (for UI and multiplayer tests - scripts will offer to install if missing)

## Screenshot Directory

UI and multiplayer tests save screenshots to the `test/screenshots` directory for debugging purposes.

## Making Scripts Executable (Linux/macOS)

If you're on Linux or macOS, you may need to make the shell script executable:

```bash
chmod +x test/run-tests.sh
```

Alternatively, you can use the included PowerShell script:

```bash
pwsh test/make-scripts-executable.ps1
```

## Test Report

After running the tests, a summary will be displayed showing how many tests passed, failed, or were skipped.