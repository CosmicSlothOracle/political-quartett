/**
 * Network Manager Test Suite
 *
 * Tests the NetworkManager class for handling game network operations
 */
import NetworkManager from '../core/NetworkManager.js';
import GameEvents from '../core/GameEvents.js';

/**
 * Run all NetworkManager tests
 */
function runNetworkManagerTests() {
    console.log("🌐 Running NetworkManager tests...");

    // Helper assertion function
    function assert(condition, message) {
        if (!condition) {
            console.error(`❌ Assertion failed: ${ message }`);
            throw new Error(message);
        } else {
            console.log(`✅ ${ message }`);
        }
    }

    // Mock socket.io
    class MockSocketIO {
        constructor() {
            this.handlers = {};
            this.emitted = [];
            this.connected = true;
            this.id = "socket-" + Math.floor(Math.random() * 10000);
        }

        on(event, callback) {
            if (!this.handlers[event]) {
                this.handlers[event] = [];
            }
            this.handlers[event].push(callback);
        }

        emit(event, data) {
            this.emitted.push({ event, data });
        }

        // Simulate receiving an event
        receiveEvent(event, data) {
            if (this.handlers[event]) {
                this.handlers[event].forEach(handler => handler(data));
            }
        }

        // Utility to check if an event was emitted
        wasEmitted(event) {
            return this.emitted.some(e => e.event === event);
        }

        // Get emitted event data
        getEmittedData(event) {
            const found = this.emitted.find(e => e.event === event);
            return found ? found.data : null;
        }
    }

    // Create mock game events system
    class MockGameEvents {
        constructor() {
            this.handlers = {};
            this.published = [];
        }

        subscribe(event, callback) {
            if (!this.handlers[event]) {
                this.handlers[event] = [];
            }
            this.handlers[event].push(callback);
        }

        publish(event, data) {
            this.published.push({ event, data });
            if (this.handlers[event]) {
                this.handlers[event].forEach(handler => handler(data));
            }
        }

        // Utility to check if an event was published
        wasPublished(event) {
            return this.published.some(e => e.event === event);
        }

        // Get published event data
        getPublishedData(event) {
            const found = this.published.find(e => e.event === event);
            return found ? found.data : null;
        }
    }

    // Test connection initialization
    function testConnectionInitialization() {
        console.log("Testing connection initialization...");

        const socket = new MockSocketIO();
        const events = new MockGameEvents();

        // Create network manager with mocks
        const network = new NetworkManager(socket, events);

        assert(network.isConnected(), "NetworkManager should be connected initially");
        assert(network.getSocketId() === socket.id, "Socket ID should be correctly retrieved");
    }

    // Test socket event handling
    function testSocketEvents() {
        console.log("Testing socket event handling...");

        const socket = new MockSocketIO();
        const events = new MockGameEvents();

        // Create network manager with mocks
        const network = new NetworkManager(socket, events);

        // Simulate receiving game state from server
        const gameState = {
            players: [{ id: "player1", cards: 5 }, { id: "player2", cards: 3 }],
            currentPlayer: "player1"
        };

        socket.receiveEvent("gameState", gameState);

        // Check if game event was published
        assert(events.wasPublished("GAME_STATE_UPDATED"), "Game state update event should be published");
        assert(events.getPublishedData("GAME_STATE_UPDATED") === gameState, "Game state should be passed correctly");
    }

    // Test sending game actions
    function testSendingGameActions() {
        console.log("Testing sending game actions...");

        const socket = new MockSocketIO();
        const events = new MockGameEvents();

        // Create network manager with mocks
        const network = new NetworkManager(socket, events);

        // Send a game action
        const action = { type: "SELECT_CATEGORY", category: "population" };
        network.sendGameAction(action);

        // Check if action was emitted to server
        assert(socket.wasEmitted("gameAction"), "Game action should be emitted");
        assert(socket.getEmittedData("gameAction").type === action.type, "Action type should match");
        assert(socket.getEmittedData("gameAction").category === action.category, "Action data should match");
    }

    // Test connection status events
    function testConnectionStatus() {
        console.log("Testing connection status events...");

        const socket = new MockSocketIO();
        const events = new MockGameEvents();

        // Create network manager with mocks
        const network = new NetworkManager(socket, events);

        // Simulate disconnect
        socket.connected = false;
        socket.receiveEvent("disconnect", {});

        assert(events.wasPublished("CONNECTION_LOST"), "Connection lost event should be published");
        assert(!network.isConnected(), "NetworkManager should report disconnected status");

        // Simulate reconnect
        socket.connected = true;
        socket.receiveEvent("connect", {});

        assert(events.wasPublished("CONNECTION_RESTORED"), "Connection restored event should be published");
        assert(network.isConnected(), "NetworkManager should report connected status");
    }

    // Test error handling
    function testErrorHandling() {
        console.log("Testing error handling...");

        const socket = new MockSocketIO();
        const events = new MockGameEvents();

        // Create network manager with mocks
        const network = new NetworkManager(socket, events);

        // Simulate server error
        const error = { code: "INVALID_MOVE", message: "Invalid move" };
        socket.receiveEvent("gameError", error);

        // Check if error event was published
        assert(events.wasPublished("GAME_ERROR"), "Game error event should be published");
        assert(events.getPublishedData("GAME_ERROR").code === error.code, "Error code should match");
    }

    // Test matchmaking functions
    function testMatchmaking() {
        console.log("Testing matchmaking functions...");

        const socket = new MockSocketIO();
        const events = new MockGameEvents();

        // Create network manager with mocks
        const network = new NetworkManager(socket, events);

        // Test joining queue
        network.joinMatchmaking();
        assert(socket.wasEmitted("joinQueue"), "Join queue event should be emitted");

        // Test receiving match found
        const matchData = { roomId: "room123", opponent: "player2" };
        socket.receiveEvent("matchFound", matchData);

        assert(events.wasPublished("MATCH_FOUND"), "Match found event should be published");
        assert(events.getPublishedData("MATCH_FOUND").roomId === matchData.roomId, "Match room ID should match");

        // Test leaving queue
        network.leaveMatchmaking();
        assert(socket.wasEmitted("leaveQueue"), "Leave queue event should be emitted");
    }

    // Run all tests
    try {
        testConnectionInitialization();
        testSocketEvents();
        testSendingGameActions();
        testConnectionStatus();
        testErrorHandling();
        testMatchmaking();

        console.log("✅ All NetworkManager tests passed!");
    } catch (error) {
        console.error("❌ NetworkManager tests failed:", error.message);
    }
}

// Check if we're in a browser or Node.js environment
const isBrowser = typeof window !== 'undefined';

// If in browser and the test runner is available, register this test module
if (isBrowser) {
    if (typeof window.testModules === 'undefined') {
        window.testModules = [];
    }
    window.testModules.push(runNetworkManagerTests);
} else {
    // In Node.js, run the tests directly
    runNetworkManagerTests();
}

export default runNetworkManagerTests;