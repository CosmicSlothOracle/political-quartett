/**
 * Game Events Test Suite
 *
 * Tests the event emitter system for game events
 */
import GameEvents from '../core/GameEvents.js';

/**
 * Run all GameEvents tests
 */
function runGameEventsTests() {
    console.log("🔔 Running GameEvents tests...");

    // Helper assertion function
    function assert(condition, message) {
        if (!condition) {
            console.error(`❌ Assertion failed: ${ message }`);
            throw new Error(message);
        } else {
            console.log(`✅ ${ message }`);
        }
    }

    // Test event subscription and emission
    function testEventSubscription() {
        console.log("Testing event subscription...");

        // Create event system
        const events = new GameEvents();
        let received = false;
        let payloadReceived = null;

        // Subscribe to test event
        events.on("TEST_EVENT", (payload) => {
            received = true;
            payloadReceived = payload;
        });

        // Emit event
        const testPayload = { test: "data" };
        events.emit("TEST_EVENT", testPayload);

        // Assert event was received
        assert(received, "Event handler was called");
        assert(payloadReceived === testPayload, "Event payload was correctly passed");
    }

    // Test unsubscription
    function testEventUnsubscription() {
        console.log("Testing event unsubscription...");

        // Create event system
        const events = new GameEvents();
        let callCount = 0;

        // Subscribe with handler that can be unsubscribed
        const handler = () => { callCount++; };
        events.on("TEST_EVENT", handler);

        // Emit once, should be received
        events.emit("TEST_EVENT");
        assert(callCount === 1, "Event was received before unsubscribing");

        // Unsubscribe and emit again
        events.off("TEST_EVENT", handler);
        events.emit("TEST_EVENT");
        assert(callCount === 1, "Event was not received after unsubscribing");
    }

    // Test multiple subscribers
    function testMultipleSubscribers() {
        console.log("Testing multiple subscribers...");

        // Create event system
        const events = new GameEvents();
        let callCount1 = 0;
        let callCount2 = 0;

        // Subscribe multiple handlers
        events.on("TEST_EVENT", () => { callCount1++; });
        events.on("TEST_EVENT", () => { callCount2++; });

        // Emit event
        events.emit("TEST_EVENT");

        // Assert both were called
        assert(callCount1 === 1, "First subscriber was called");
        assert(callCount2 === 1, "Second subscriber was called");
    }

    // Test one-time subscription
    function testOneTimeSubscription() {
        console.log("Testing one-time subscription...");

        // Create event system
        const events = new GameEvents();
        let callCount = 0;

        // Subscribe for one time only
        events.once("TEST_EVENT", () => { callCount++; });

        // Emit twice
        events.emit("TEST_EVENT");
        events.emit("TEST_EVENT");

        // Assert handler was only called once
        assert(callCount === 1, "One-time subscriber was called exactly once");
    }

    // Test onMultiple
    function testOnMultiple() {
        console.log("Testing onMultiple subscription...");

        // Create event system
        const events = new GameEvents();
        let event1Count = 0;
        let event2Count = 0;

        // Subscribe to multiple events at once
        const unsubscribe = events.onMultiple({
            'EVENT_1': () => { event1Count++; },
            'EVENT_2': () => { event2Count++; }
        });

        // Emit events
        events.emit("EVENT_1");
        events.emit("EVENT_2");

        // Assert events were received
        assert(event1Count === 1, "EVENT_1 handler was called");
        assert(event2Count === 1, "EVENT_2 handler was called");

        // Unsubscribe from all
        unsubscribe();

        // Emit events again
        events.emit("EVENT_1");
        events.emit("EVENT_2");

        // Assert no additional calls
        assert(event1Count === 1, "EVENT_1 handler was not called after unsubscribe");
        assert(event2Count === 1, "EVENT_2 handler was not called after unsubscribe");
    }

    // Test clearing events
    function testClearEvents() {
        console.log("Testing clear events...");

        // Create event system
        const events = new GameEvents();
        let callCount1 = 0;
        let callCount2 = 0;

        // Subscribe to events
        events.on("EVENT_1", () => { callCount1++; });
        events.on("EVENT_2", () => { callCount2++; });

        // Clear specific event
        events.clearEvent("EVENT_1");

        // Emit both events
        events.emit("EVENT_1");
        events.emit("EVENT_2");

        // EVENT_1 should not be received, EVENT_2 should be
        assert(callCount1 === 0, "EVENT_1 handler was not called after clearEvent");
        assert(callCount2 === 1, "EVENT_2 handler was called");

        // Clear all events
        events.clearAllListeners();

        // Emit again
        events.emit("EVENT_2");

        // No new calls should happen
        assert(callCount2 === 1, "EVENT_2 handler was not called after clearAllListeners");
    }

    // Test error handling in event handlers
    function testErrorHandling() {
        console.log("Testing error handling in event handlers...");

        // Create event system
        const events = new GameEvents();
        let secondHandlerCalled = false;

        // First handler throws an error
        events.on("ERROR_EVENT", () => {
            throw new Error("Test error");
        });

        // Second handler should still be called
        events.on("ERROR_EVENT", () => {
            secondHandlerCalled = true;
        });

        // Capture console.error
        const originalConsoleError = console.error;
        let errorCaught = false;
        console.error = () => { errorCaught = true; };

        // Emit event - should not throw to caller
        try {
            events.emit("ERROR_EVENT");
            assert(true, "Error in handler did not break event emission");
        } catch (e) {
            assert(false, "Error should not propagate to caller");
        }

        // Restore console.error
        console.error = originalConsoleError;

        // Check that error was logged and second handler was called
        assert(errorCaught, "Error was logged to console");
        assert(secondHandlerCalled, "Second handler was still called despite first handler error");
    }

    // Run all tests
    try {
        testEventSubscription();
        testEventUnsubscription();
        testMultipleSubscribers();
        testOneTimeSubscription();
        testOnMultiple();
        testClearEvents();
        testErrorHandling();

        console.log("✅ All GameEvents tests passed!");
    } catch (error) {
        console.error("❌ GameEvents tests failed:", error.message);
    }
}

// Check if we're in a browser or Node.js environment
const isBrowser = typeof window !== 'undefined';

// If in browser and the test runner is available, register this test module
if (isBrowser) {
    if (typeof window.testModules === 'undefined') {
        window.testModules = [];
    }
    window.testModules.push(runGameEventsTests);
} else {
    // In Node.js, run the tests directly
    runGameEventsTests();
}

export default runGameEventsTests;