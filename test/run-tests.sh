#!/bin/bash
# Shell script version of run-tests

# Colors for output
RESET="\033[0m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"

# Function to print colored messages
print_colored() {
  echo -e "${2}${1}${RESET}"
}

# Function to check if server is running
is_server_running() {
  if nc -z localhost 3000 2>/dev/null; then
    return 0
  else
    return 1
  fi
}

# Function to start the server
start_test_server() {
  print_colored "Starting server..." "$CYAN"
  node server.js &
  SERVER_PID=$!

  # Wait for server to start
  attempts=0
  max_attempts=10

  while ! is_server_running && [ $attempts -lt $max_attempts ]; do
    echo "Waiting for server to start..."
    sleep 1
    ((attempts++))
  done

  if is_server_running; then
    print_colored "Server started successfully!" "$GREEN"
    return 0
  else
    print_colored "Failed to start server after $max_attempts attempts" "$RED"
    return 1
  fi
}

# Function to stop the server
stop_test_server() {
  if is_server_running; then
    print_colored "Stopping server..." "$CYAN"
    if [ -n "$SERVER_PID" ]; then
      kill $SERVER_PID
    else
      pkill -f "node server.js"
    fi
    print_colored "Server stopped" "$GREEN"
  fi
}

# Function to run basic tests
run_basic_tests() {
  print_colored "Running basic tests..." "$CYAN"

  # Execute the actual basic tests
  node test/basic-test.js

  if [ $? -eq 0 ]; then
    print_colored "Basic tests completed successfully" "$GREEN"
    return 0
  else
    print_colored "Basic tests failed" "$RED"
    return 1
  fi
}

# Function to check for and possibly install Puppeteer
confirm_puppeteer_install() {
  print_colored "Checking for Puppeteer..." "$CYAN"

  # Check if node_modules/puppeteer exists
  if [ -d "node_modules/puppeteer" ]; then
    print_colored "Puppeteer is already installed" "$GREEN"
    return 0
  fi

  read -p "Puppeteer is not installed. Would you like to install it now? (y/n) " answer
  if [ "$answer" = "y" ]; then
    print_colored "Installing Puppeteer..." "$CYAN"
    npm install puppeteer

    if [ $? -eq 0 ]; then
      print_colored "Puppeteer installed successfully" "$GREEN"
      return 0
    else
      print_colored "Failed to install Puppeteer" "$RED"
      return 1
    fi
  else
    print_colored "Puppeteer installation skipped" "$YELLOW"
    return 1
  fi
}

# Function to run UI tests
run_ui_tests() {
  print_colored "Running UI tests with Puppeteer..." "$CYAN"

  # Execute the actual UI tests
  node test/game-test.js

  if [ $? -eq 0 ]; then
    print_colored "UI tests completed successfully" "$GREEN"
    return 0
  else
    print_colored "UI tests failed" "$RED"
    return 1
  fi
}

# Function to run multiplayer tests
run_multiplayer_tests() {
  print_colored "Running multiplayer matchmaking tests..." "$CYAN"

  # Execute the multiplayer tests
  node test/multiplayer-test.js

  if [ $? -eq 0 ]; then
    print_colored "Multiplayer tests completed successfully" "$GREEN"
    return 0
  else
    print_colored "Multiplayer tests failed" "$RED"
    return 1
  fi
}

# Function to run all tests and only proceed when all have passed
run_all_tests_and_wait() {
  print_colored "Running all tests sequentially..." "$CYAN"

  # Run basic tests first
  run_basic_tests
  if [ $? -ne 0 ]; then
    print_colored "Basic tests failed, cannot proceed" "$RED"
    return 1
  fi

  # Then run UI tests
  confirm_puppeteer_install
  if [ $? -eq 0 ]; then
    run_ui_tests
    if [ $? -ne 0 ]; then
      print_colored "UI tests failed, cannot proceed" "$RED"
      return 1
    fi
  else
    print_colored "Skipping UI tests due to missing Puppeteer" "$YELLOW"
  fi

  # Finally run multiplayer tests
  confirm_puppeteer_install
  if [ $? -eq 0 ]; then
    run_multiplayer_tests
    if [ $? -ne 0 ]; then
      print_colored "Multiplayer tests failed, cannot proceed" "$RED"
      return 1
    fi
  else
    print_colored "Skipping multiplayer tests due to missing Puppeteer" "$YELLOW"
  fi

  print_colored "All tests completed successfully!" "$GREEN"
  return 0
}

# Main script
clear
print_colored "=== Political Quartett Game Test Runner ===" "$CYAN"
print_colored "=== Linux/macOS Shell Version ===" "$CYAN"

# Check if server is already running
server_was_running=false
if is_server_running; then
  server_was_running=true
fi

# Start server if needed
if [ "$server_was_running" = false ]; then
  start_test_server
  if [ $? -ne 0 ]; then
    print_colored "Cannot continue without a running server" "$RED"
    exit 1
  fi
fi

# Check if we should run all tests at once
if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
  run_all_tests_and_wait
  test_result=$?

  # Clean up
  if [ "$server_was_running" = false ]; then
    stop_test_server
  fi

  # Exit with appropriate status code
  if [ $test_result -eq 0 ]; then
    print_colored "All tests passed! Proceeding with next steps..." "$GREEN"
    exit 0
  else
    print_colored "Tests failed, cannot proceed" "$RED"
    exit 1
  fi
fi

# Run basic tests
run_basic_tests
if [ $? -ne 0 ]; then
  print_colored "Basic tests failed" "$RED"
  if [ "$server_was_running" = false ]; then
    stop_test_server
  fi
  exit 1
fi