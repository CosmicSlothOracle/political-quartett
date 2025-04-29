/**
 * Test Runner for Political Card Game
 *
 * This file runs all test suites for the Political Card Game.
 */

// Import all test suites
import runGameEngineTests from './game-engine-test.js';
import runGameCommandsTests from './game-commands-test.js';
import runGameEventsTests from './game-events-test.js';
import runGameStateTests from './game-state-test.js';
import runNetworkManagerTests from './network-manager-test.js';
import runCardManagerTests from './card-manager-test.js';
import runUIAdapterTests from './ui-adapter-test.js';

// Run all tests sequentially
async function runAllTests() {
    console.log('🧪🧪🧪 STARTING ALL TESTS 🧪🧪🧪');
    console.log('=================================');

    try {
        // Core component tests
        console.log('\n📋 TESTING CORE COMPONENTS');
        console.log('---------------------------------');

        // GameEvents tests
        await runTest(runGameEventsTests, 'GameEvents');

        // GameState tests
        await runTest(runGameStateTests, 'GameState');

        // GameEngine tests
        await runTest(runGameEngineTests, 'GameEngine');

        // GameCommands tests
        await runTest(runGameCommandsTests, 'GameCommands');

        // Feature components tests
        console.log('\n📋 TESTING FEATURE COMPONENTS');
        console.log('---------------------------------');

        // CardManager tests
        await runTest(runCardManagerTests, 'CardManager');

        // NetworkManager tests
        await runTest(runNetworkManagerTests, 'NetworkManager');

        // UI Adapter tests
        await runTest(runUIAdapterTests, 'UI Adapter');

        // All tests complete
        console.log('\n=================================');
        console.log('✅✅✅ ALL TESTS COMPLETED SUCCESSFULLY ✅✅✅');

    } catch (error) {
        console.error('\n❌❌❌ TESTS FAILED ❌❌❌');
        console.error(`Error: ${ error.message }`);
        console.error(error.stack);
    }
}

/**
 * Run a single test suite with proper error handling
 * @param {Function} testFunction - The test suite function to run
 * @param {String} testName - The name of the test suite
 */
async function runTest(testFunction, testName) {
    console.log(`\nRunning ${ testName } Tests...`);

    try {
        // If the test function returns a promise, await it
        const result = testFunction();
        if (result instanceof Promise) {
            await result;
        }
        console.log(`✅ ${ testName } Tests Completed Successfully`);
    } catch (error) {
        console.error(`❌ ${ testName } Tests Failed:`);
        console.error(`   ${ error.message }`);
        throw error; // Rethrow to stop all tests
    }
}

// Check if this file is being run directly (not imported)
if (typeof window !== 'undefined') {
    // Browser environment
    window.addEventListener('DOMContentLoaded', () => {
        // Create test UI container if it doesn't exist
        let testContainer = document.getElementById('test-container');
        if (!testContainer) {
            testContainer = document.createElement('div');
            testContainer.id = 'test-container';
            testContainer.style.fontFamily = 'monospace';
            testContainer.style.padding = '20px';
            testContainer.style.backgroundColor = '#f5f5f5';
            testContainer.style.border = '1px solid #ddd';
            testContainer.style.borderRadius = '5px';
            testContainer.style.margin = '20px';
            testContainer.style.maxWidth = '800px';
            document.body.appendChild(testContainer);

            // Override console methods to also output to the test container
            const originalLog = console.log;
            const originalError = console.error;
            const originalAssert = console.assert;

            console.log = function (...args) {
                originalLog.apply(console, args);
                const message = args.join(' ');
                appendToTestOutput(message);
            };

            console.error = function (...args) {
                originalError.apply(console, args);
                const message = args.join(' ');
                appendToTestOutput(`<span style="color: red;">${ message }</span>`);
            };

            console.assert = function (condition, ...args) {
                originalAssert.apply(console, [condition, ...args]);
                if (!condition) {
                    const message = args.join(' ');
                    appendToTestOutput(`<span style="color: red;">Assertion failed: ${ message }</span>`);
                }
            };
        }

        // Clear test output
        testContainer.innerHTML = '<h2>Political Card Game Test Suite</h2>';
        testContainer.innerHTML += '<button id="run-tests">Run All Tests</button>';
        testContainer.innerHTML += '<div id="test-output"></div>';

        // Setup run tests button
        document.getElementById('run-tests').addEventListener('click', runAllTests);
    });

    /**
     * Append message to test output
     * @param {String} message - Message to append
     */
    function appendToTestOutput(message) {
        const testOutput = document.getElementById('test-output');
        if (testOutput) {
            // Format message
            if (message.includes('STARTING ALL TESTS')) {
                message = `<h3>${ message }</h3>`;
            } else if (message.includes('TESTING')) {
                message = `<h4>${ message }</h4>`;
            } else if (message.includes('✅')) {
                message = `<p style="color: green;">${ message }</p>`;
            } else if (message.includes('❌')) {
                message = `<p style="color: red; font-weight: bold;">${ message }</p>`;
            } else if (message.includes('🧪 Starting')) {
                message = `<p style="color: blue; font-weight: bold;">${ message }</p>`;
            } else if (message.includes('Testing ')) {
                message = `<p style="color: purple;">${ message }</p>`;
            } else {
                message = `<p>${ message }</p>`;
            }

            testOutput.innerHTML += message;
        }
    }
} else {
    // Node.js environment
    runAllTests();
}

export default runAllTests;