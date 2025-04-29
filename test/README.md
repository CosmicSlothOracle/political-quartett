# Political Quartett Test Suite

This directory contains tests for verifying the functionality of the Political Quartett game components.

## Test Structure

The test suite is organized by components:

- `game-engine-test.js` - Tests for the GameEngine component
- `game-commands-test.js` - Tests for the GameCommands component
- `card-manager-test.js` - Tests for the CardManager component
- `game-events-test.js` - Tests for the GameEvents component
- `network-manager-test.js` - Tests for the NetworkManager component

## Running Tests

To run the tests:

1. Open `test.html` in a web browser
2. Click the "Run All Tests" button
3. View test results in the console output or in the UI

## Test Runner

The test runner (`js/test-runner.js`) provides:

- Automatic test loading and execution
- A visual interface for viewing test results
- Console output redirection to the UI
- Individual test module execution

## Writing New Tests

To add a new test file:

1. Create a new JavaScript file in the `test` directory
2. Implement a main test function (e.g., `runYourComponentTests()`)
3. Use the `assert` function to validate expected outcomes
4. Add the test module to the imports list in `test-runner.js`

### Test Function Template

```javascript
function runYourComponentTests() {
    console.log("Running YourComponent tests...");

    // Helper assertion function
    function assert(condition, message) {
        if (!condition) {
            console.error(`❌ Assertion failed: ${message}`);
            throw new Error(message);
        } else {
            console.log(`✅ ${message}`);
        }
    }

    // Your test functions
    function testSomeFeature() {
        // Test implementation
        assert(true, "Feature works correctly");
    }

    // Run all tests
    try {
        testSomeFeature();
        // More tests...

        console.log("✅ All YourComponent tests passed!");
    } catch (error) {
        console.error("❌ YourComponent tests failed:", error.message);
    }
}

// Register with test runner
if (typeof window.testModules === 'undefined') {
    window.testModules = [];
}
window.testModules.push(runYourComponentTests);
```

## Mocking Dependencies

Each test file includes mock implementations of its dependencies:

- Mock event systems
- Mock network connections
- Mock game state

This allows for isolated testing of components without relying on external systems.

## Continuous Integration

In a production environment, these tests should be integrated with a CI/CD pipeline to run automatically on each code change.