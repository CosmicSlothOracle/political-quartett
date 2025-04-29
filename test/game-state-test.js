/**
 * Game State Test Suite
 *
 * Tests the GameState class that manages game state and persistence
 */
import GameState from '../core/GameState.js';
import GameEvents from '../core/GameEvents.js';

/**
 * Run all GameState tests
 */
function runGameStateTests() {
    console.log('🧪 Starting GameState Tests');

    testStateInitialization();
    testStateUpdates();
    testStateEvents();
    testStateReset();
    testStatePersistence();
    testStateValidation();

    console.log('✅ GameState Tests Completed');
}

/**
 * Test state initialization
 */
function testStateInitialization() {
    console.log('  Testing state initialization...');

    // Test default initialization
    const events = new GameEvents();
    const gameState = new GameState(events);

    console.assert(gameState !== null, 'GameState should be initialized');
    console.assert(typeof gameState.getState() === 'object', 'State should be an object');
    console.assert(Object.keys(gameState.getState()).length > 0, 'Default state should have properties');

    // Test initialization with custom state
    const customState = {
        player: {
            name: 'TestPlayer',
            score: 100,
            cards: [1, 2, 3]
        },
        game: {
            round: 2,
            status: 'active'
        }
    };

    const gameStateCustom = new GameState(events, customState);
    console.assert(gameStateCustom.getState().player.name === 'TestPlayer', 'Custom state should be applied');
    console.assert(gameStateCustom.getState().player.score === 100, 'Custom state should be applied');

    console.log('  ✓ State initialization tests passed');
}

/**
 * Test state updates
 */
function testStateUpdates() {
    console.log('  Testing state updates...');

    const events = new GameEvents();
    const gameState = new GameState(events);

    // Test updating a simple property
    gameState.update('score', 100);
    console.assert(gameState.getState().score === 100, 'Simple update should work');

    // Test updating a nested property
    gameState.update('player.cards', [1, 2, 3]);
    console.assert(Array.isArray(gameState.getState().player.cards), 'Nested update should work');
    console.assert(gameState.getState().player.cards.length === 3, 'Array update should work');

    // Test updating with a function
    gameState.update('score', (score) => score + 50);
    console.assert(gameState.getState().score === 150, 'Function update should work');

    // Test updating multiple properties at once
    gameState.updateMultiple({
        'score': 200,
        'player.name': 'UpdatedPlayer',
        'game.round': 3
    });

    console.assert(gameState.getState().score === 200, 'Multiple update - score should be updated');
    console.assert(gameState.getState().player.name === 'UpdatedPlayer', 'Multiple update - name should be updated');
    console.assert(gameState.getState().game.round === 3, 'Multiple update - round should be updated');

    // Test that non-updated properties remain unchanged
    console.assert(gameState.getState().player.cards.length === 3, 'Non-updated properties should remain unchanged');

    console.log('  ✓ State update tests passed');
}

/**
 * Test state events
 */
function testStateEvents() {
    console.log('  Testing state events...');

    const events = new GameEvents();
    const gameState = new GameState(events);

    // Test state change events
    let stateChangeEventCount = 0;
    let lastChangedPath = null;
    let lastChangedValue = null;

    events.on('state:changed', (path, value) => {
        stateChangeEventCount++;
        lastChangedPath = path;
        lastChangedValue = value;
    });

    // Update a property and check event
    gameState.update('player.health', 100);
    console.assert(stateChangeEventCount === 1, 'State change event should fire once');
    console.assert(lastChangedPath === 'player.health', 'Path should be passed to event');
    console.assert(lastChangedValue === 100, 'New value should be passed to event');

    // Test specific path events
    let playerHealthChanged = false;
    events.on('state:changed:player.health', (value) => {
        playerHealthChanged = true;
        console.assert(value === 90, 'New value should be passed to specific path event');
    });

    gameState.update('player.health', 90);
    console.assert(playerHealthChanged === true, 'Specific path event should fire');

    // Test multiple updates event
    let multipleChangesEventFired = false;
    events.on('state:multipleChanges', (changes) => {
        multipleChangesEventFired = true;
        console.assert(Object.keys(changes).length === 2, 'Changes object should have 2 entries');
    });

    gameState.updateMultiple({
        'score': 150,
        'player.lives': 3
    });

    console.assert(multipleChangesEventFired === true, 'Multiple changes event should fire');

    console.log('  ✓ State events tests passed');
}

/**
 * Test state reset
 */
function testStateReset() {
    console.log('  Testing state reset...');

    const events = new GameEvents();
    const initialState = {
        score: 0,
        player: {
            health: 100,
            name: 'Initial'
        }
    };

    const gameState = new GameState(events, initialState);

    // Make some changes
    gameState.update('score', 500);
    gameState.update('player.health', 50);
    gameState.update('player.name', 'Changed');

    // Check changes are applied
    console.assert(gameState.getState().score === 500, 'Changes should be applied');
    console.assert(gameState.getState().player.name === 'Changed', 'Nested changes should be applied');

    // Test reset event
    let resetEventFired = false;
    events.on('state:reset', () => {
        resetEventFired = true;
    });

    // Reset state
    gameState.reset();

    // Verify reset
    console.assert(resetEventFired === true, 'Reset event should fire');
    console.assert(gameState.getState().score === 0, 'Reset should restore initial values');
    console.assert(gameState.getState().player.health === 100, 'Reset should restore nested initial values');
    console.assert(gameState.getState().player.name === 'Initial', 'Reset should restore all initial values');

    // Test reset with new state
    const newState = {
        score: 1000,
        player: {
            health: 200,
            name: 'New'
        }
    };

    gameState.reset(newState);

    console.assert(gameState.getState().score === 1000, 'Reset with new state should use provided values');
    console.assert(gameState.getState().player.health === 200, 'Reset with new state should use nested provided values');

    console.log('  ✓ State reset tests passed');
}

/**
 * Test state persistence
 */
function testStatePersistence() {
    console.log('  Testing state persistence...');

    // Mock localStorage
    const originalLocalStorage = window.localStorage;
    const mockStorage = {
        data: {},
        getItem: function (key) {
            return this.data[key] || null;
        },
        setItem: function (key, value) {
            this.data[key] = value;
        },
        removeItem: function (key) {
            delete this.data[key];
        }
    };

    window.localStorage = mockStorage;

    // Create game state
    const events = new GameEvents();
    const gameState = new GameState(events);

    // Set some state
    gameState.update('player.name', 'SavedPlayer');
    gameState.update('score', 750);

    // Test saving state
    gameState.saveToLocalStorage('game_save');

    // Verify saved data
    const savedData = JSON.parse(mockStorage.getItem('game_save'));
    console.assert(savedData.player.name === 'SavedPlayer', 'Saved state should contain player name');
    console.assert(savedData.score === 750, 'Saved state should contain score');

    // Create a new game state and load from storage
    const newGameState = new GameState(events);
    newGameState.loadFromLocalStorage('game_save');

    // Verify loaded data
    console.assert(newGameState.getState().player.name === 'SavedPlayer', 'Loaded state should contain player name');
    console.assert(newGameState.getState().score === 750, 'Loaded state should contain score');

    // Test loading invalid data
    mockStorage.setItem('invalid_save', 'not valid JSON');

    let errorEventFired = false;
    events.on('state:error:load', () => {
        errorEventFired = true;
    });

    newGameState.loadFromLocalStorage('invalid_save');
    console.assert(errorEventFired === true, 'Error event should fire on invalid data');

    // Restore original localStorage
    window.localStorage = originalLocalStorage;

    console.log('  ✓ State persistence tests passed');
}

/**
 * Test state validation
 */
function testStateValidation() {
    console.log('  Testing state validation...');

    const events = new GameEvents();
    const gameState = new GameState(events);

    // Define a validator function
    gameState.setValidator((state) => {
        const errors = [];

        if (state.player && state.player.health < 0) {
            errors.push('Player health cannot be negative');
        }

        if (state.score < 0) {
            errors.push('Score cannot be negative');
        }

        return errors;
    });

    // Test valid state
    gameState.update('player.health', 50);
    gameState.update('score', 100);

    console.assert(gameState.validate().length === 0, 'Valid state should have no validation errors');

    // Test invalid state
    let validationEventFired = false;
    let validationErrors = [];

    events.on('state:invalid', (errors) => {
        validationEventFired = true;
        validationErrors = errors;
    });

    gameState.update('player.health', -10);

    const errors = gameState.validate();
    console.assert(errors.length > 0, 'Invalid state should have validation errors');
    console.assert(validationEventFired === true, 'Validation event should fire for invalid state');
    console.assert(validationErrors.length > 0, 'Validation errors should be passed to event');

    // Test validation during update
    let updateRejected = false;

    try {
        // Assuming validateOnUpdate is enabled
        gameState.enableValidateOnUpdate();
        gameState.update('score', -50);
    } catch (e) {
        updateRejected = true;
    }

    console.assert(updateRejected === true, 'Invalid update should be rejected when validation is enabled');

    console.log('  ✓ State validation tests passed');
}

// Export the test runner
export default runGameStateTests;