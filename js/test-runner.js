/**
 * test-runner.js
 * A simple test runner to execute tests for the Card Game project
 */

// Import test modules
function importTests() {
    const testModules = [
        "/test/game-engine-test.js",
        "/test/game-commands-test.js",
        "/test/card-manager-test.js",
        "/test/game-events-test.js",
        "/test/network-manager-test.js"
    ];

    testModules.forEach(module => {
        const script = document.createElement('script');
        script.src = module;
        script.async = false;
        document.head.appendChild(script);
    });
}

// Function to run all tests
function runAllTests() {
    console.log("🧪 Starting test suite");
    console.log("----------------------");

    try {
        if (typeof runGameEngineTests === 'function') {
            runGameEngineTests();
        } else {
            console.warn("⚠️ GameEngine tests not found");
        }

        if (typeof runGameCommandsTests === 'function') {
            runGameCommandsTests();
        } else {
            console.warn("⚠️ GameCommands tests not found");
        }

        if (typeof runCardManagerTests === 'function') {
            runCardManagerTests();
        } else {
            console.warn("⚠️ CardManager tests not found");
        }

        if (typeof runGameEventsTests === 'function') {
            runGameEventsTests();
        } else {
            console.warn("⚠️ GameEvents tests not found");
        }

        if (typeof runNetworkManagerTests === 'function') {
            runNetworkManagerTests();
        } else {
            console.warn("⚠️ NetworkManager tests not found");
        }

        console.log("----------------------");
        console.log("✅ All tests completed");
    } catch (error) {
        console.error("❌ Test failure:", error);
    }
}

// Create simple UI for running tests
function createTestUI() {
    // Create container
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';

    // Create header
    const header = document.createElement('h1');
    header.textContent = 'Political Quartett Test Suite';
    container.appendChild(header);

    // Create description
    const description = document.createElement('p');
    description.textContent = 'Run tests to verify the functionality of the Political Quartett game components.';
    container.appendChild(description);

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'test-controls';
    container.appendChild(buttonContainer);

    // Create run button
    const runButton = document.createElement('button');
    runButton.textContent = 'Run All Tests';
    runButton.style.padding = '10px 20px';
    runButton.style.margin = '10px 0';
    runButton.style.backgroundColor = '#4CAF50';
    runButton.style.color = 'white';
    runButton.style.border = 'none';
    runButton.style.borderRadius = '5px';
    runButton.style.cursor = 'pointer';
    runButton.onclick = runAllTests;
    buttonContainer.appendChild(runButton);

    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Output';
    clearButton.className = 'secondary-button';
    clearButton.onclick = () => {
        document.getElementById('test-output').innerHTML = '';
    };
    buttonContainer.appendChild(clearButton);

    // Create individual test buttons
    const testControls = document.createElement('div');
    testControls.className = 'test-controls';
    container.appendChild(testControls);

    // Individual module run functions
    const modules = [
        { name: 'GameEngine', fn: runGameEngineTests },
        { name: 'GameCommands', fn: runGameCommandsTests },
        { name: 'CardManager', fn: runCardManagerTests },
        { name: 'GameEvents', fn: runGameEventsTests },
        { name: 'NetworkManager', fn: runNetworkManagerTests }
    ];

    modules.forEach(module => {
        if (typeof module.fn === 'function') {
            const button = document.createElement('button');
            button.textContent = `Test ${ module.name }`;
            button.className = 'secondary-button';
            button.onclick = module.fn;
            testControls.appendChild(button);
        }
    });

    // Create output area
    const output = document.createElement('div');
    output.id = 'test-output';
    output.style.marginTop = '20px';
    output.style.padding = '15px';
    output.style.backgroundColor = '#f5f5f5';
    output.style.borderRadius = '5px';
    output.style.height = '400px';
    output.style.overflow = 'auto';
    output.style.fontFamily = 'monospace';
    container.appendChild(output);

    // Override console methods to output to our div
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };

    function logToOutput(message, type = 'log') {
        const entry = document.createElement('div');
        entry.textContent = message;

        switch (type) {
            case 'error':
                entry.style.color = '#FF0000';
                break;
            case 'warn':
                entry.style.color = '#FF9900';
                break;
            case 'info':
                entry.style.color = '#0099FF';
                break;
            case 'success':
                entry.style.color = '#00CC00';
                break;
        }

        document.getElementById('test-output').appendChild(entry);
        document.getElementById('test-output').scrollTop = document.getElementById('test-output').scrollHeight;

        // Also log to original console
        originalConsole[type] ? originalConsole[type](message) : originalConsole.log(message);
    }

    console.log = function (message) { logToOutput(message, 'log'); };
    console.error = function (message) { logToOutput(message, 'error'); };
    console.warn = function (message) { logToOutput(message, 'warn'); };
    console.info = function (message) { logToOutput(message, 'info'); };

    document.body.appendChild(container);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    importTests();
    createTestUI();
});