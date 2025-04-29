/**
 * Game Commands Test Suite
 *
 * Tests the GameCommands class for handling game actions
 */
import GameCommands from '../core/GameCommands.js';
import GameEngine from '../core/GameEngine.js';
import CardManager from '../core/CardManager.js';
import GameEvents from '../core/GameEvents.js';

// Sample card data for testing
const testCards = [
    { id: 'card1', name: 'Card 1', values: { power: 10, intelligence: 5, charisma: 7 } },
    { id: 'card2', name: 'Card 2', values: { power: 7, intelligence: 9, charisma: 6 } },
    { id: 'card3', name: 'Card 3', values: { power: 6, intelligence: 7, charisma: 8 } },
    { id: 'card4', name: 'Card 4', values: { power: 8, intelligence: 6, charisma: 9 } }
];

// Mock event emitter for testing
class MockEventEmitter {
    constructor() {
        this.events = [];
        this.handlers = {};
    }

    emit(event, data) {
        this.events.push({ event, data });
    }

    on(event, handler) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }

    getEvent(event) {
        return this.events.find(e => e.event === event);
    }

    clearEvents() {
        this.events = [];
    }
}

/**
 * Run all GameCommands tests
 */
function runGameCommandsTests() {
    console.log("🧪 Starting GameCommands Tests");

    testInitGame();
    testSelectCategory();
    testPlayRound();
    testMakeAIMove();
    testStartAIGame();
    testStartOnlineGame();
    testSyncGameState();
    testResetGame();

    console.log("✅ GameCommands Tests Completed");
}

/**
 * Test initializing a game
 */
function testInitGame() {
    console.log("  Testing initGame...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Load cards
    cardManager.loadCards(testCards);

    // Init game
    commands.initGame(['player', 'opponent'], testCards, 'player');

    // Check game state
    const state = engine.getState();
    console.assert(state.players.length === 2, 'Should have 2 players');
    console.assert(state.players[0].id === 'player', 'First player should be player');
    console.assert(state.players[1].id === 'opponent', 'Second player should be opponent');

    // Check player cards
    console.assert(state.players[0].cards.length > 0, 'Player should have cards');
    console.assert(state.players[1].cards.length > 0, 'Opponent should have cards');

    // Check event emission
    const gameInitEvent = eventEmitter.getEvent('gameInitialized');
    console.assert(gameInitEvent !== undefined, 'Game initialized event should be emitted');

    console.log("  ✓ initGame tests passed");
}

/**
 * Test category selection
 */
function testSelectCategory() {
    console.log("  Testing selectCategory...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Load cards
    cardManager.loadCards(testCards);

    // Init game
    commands.initGame(['player', 'opponent'], testCards, 'player');

    // Reset events
    eventEmitter.clearEvents();

    // Select category
    const result = commands.selectCategory('power');

    // Check result
    console.assert(result.success === true, 'Category selection should succeed');

    // Check event emission
    const categoryEvent = eventEmitter.getEvent('categorySelected');
    console.assert(categoryEvent !== undefined, 'Category selected event should be emitted');
    console.assert(categoryEvent.data.category === 'power', 'Selected category should be power');

    // Check invalid category
    const invalidResult = commands.selectCategory('invalid');
    console.assert(invalidResult.success === false, 'Invalid category should fail');
    console.assert(invalidResult.error !== undefined, 'Error should be provided for invalid category');

    console.log("  ✓ selectCategory tests passed");
}

/**
 * Test playing a round
 */
function testPlayRound() {
    console.log("  Testing playRound...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Load cards
    cardManager.loadCards(testCards);

    // Init game with 2 cards per player
    commands.initGame(['player', 'opponent'], testCards, 'player');

    // Reset events
    eventEmitter.clearEvents();

    // Play a round
    const result = commands.playRound('power');

    // Check result
    console.assert(result.success === true, 'Playing a round should succeed');
    console.assert(result.roundResult !== undefined, 'Round result should be provided');

    // Check event emission
    const roundEvent = eventEmitter.getEvent('roundPlayed');
    console.assert(roundEvent !== undefined, 'Round played event should be emitted');
    console.assert(roundEvent.data.category === 'power', 'Played category should be power');
    console.assert(roundEvent.data.result !== undefined, 'Round result should be in event data');

    // Reset events
    eventEmitter.clearEvents();

    // Try to play a round with invalid category
    const invalidResult = commands.playRound('invalid');
    console.assert(invalidResult.success === false, 'Playing with invalid category should fail');
    console.assert(invalidResult.error !== undefined, 'Error should be provided for invalid category');

    console.log("  ✓ playRound tests passed");
}

/**
 * Test AI move generation
 */
function testMakeAIMove() {
    console.log("  Testing makeAIMove...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Create test cards with predictable values for AI
    const aiTestCards = [
        { id: 'card1', name: 'Card 1', values: { power: 10, intelligence: 5, charisma: 7 } },
        { id: 'card2', name: 'Card 2', values: { power: 3, intelligence: 4, charisma: 6 } }
    ];

    // Load cards
    cardManager.loadCards(aiTestCards);

    // Init game
    commands.initGame(['player', 'ai'], aiTestCards, 'ai');

    // Reset events
    eventEmitter.clearEvents();

    // Make AI move
    const result = commands.makeAIMove();

    // Check result
    console.assert(result.success === true, 'AI move should succeed');
    console.assert(result.category !== undefined, 'Category should be selected by AI');

    // Check event emission
    const categoryEvent = eventEmitter.getEvent('categorySelected');
    console.assert(categoryEvent !== undefined, 'Category selected event should be emitted');

    // If the event exists, check the category
    if (categoryEvent) {
        // In this case, power should be highest on AI card
        console.assert(categoryEvent.data.category === 'power', 'AI should select highest stat (power)');
    } else {
        console.warn('⚠️ Category event not found, skipping category assertion');
    }

    // Reset events
    eventEmitter.clearEvents();

    // Now switch to player turn and try AI move
    engine.getState().currentPlayer = 'player';
    const invalidResult = commands.makeAIMove();
    console.assert(invalidResult.success === false, "AI move should fail when it's not AI's turn");

    console.log("  ✓ makeAIMove tests passed");
}

/**
 * Test starting AI game
 */
function testStartAIGame() {
    console.log("  Testing startAIGame...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Load cards
    cardManager.loadCards(testCards);

    // Reset events
    eventEmitter.clearEvents();

    // Start AI game
    const result = commands.startAIGame(testCards);

    // Check result
    console.assert(result.success === true, 'Starting AI game should succeed');

    // Check event emission
    const gameStartEvent = eventEmitter.getEvent('gameStarted');
    console.assert(gameStartEvent !== undefined, 'Game started event should be emitted');
    console.assert(gameStartEvent.data.gameType === 'ai', 'Game type should be AI');

    // Check game state
    const state = engine.getState();
    console.assert(state.players.length === 2, 'Should have 2 players');
    console.assert(state.players[0].id === 'player', 'First player should be player');
    console.assert(state.players[1].id === 'ai', 'Second player should be AI');

    console.log("  ✓ startAIGame tests passed");
}

/**
 * Test starting online game
 */
function testStartOnlineGame() {
    console.log("  Testing startOnlineGame...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Load cards
    cardManager.loadCards(testCards);

    // Reset events
    eventEmitter.clearEvents();

    // Start online game
    const result = commands.startOnlineGame('player1', 'player2', testCards);

    // Check result
    console.assert(result.success === true, 'Starting online game should succeed');

    // Check event emission
    const gameStartEvent = eventEmitter.getEvent('gameStarted');
    console.assert(gameStartEvent !== undefined, 'Game started event should be emitted');
    console.assert(gameStartEvent.data.gameType === 'online', 'Game type should be online');

    // Check game state
    const state = engine.getState();
    console.assert(state.players.length === 2, 'Should have 2 players');
    console.assert(state.players[0].id === 'player1', 'First player should be player1');
    console.assert(state.players[1].id === 'player2', 'Second player should be player2');

    console.log("  ✓ startOnlineGame tests passed");
}

/**
 * Test synchronizing game state
 */
function testSyncGameState() {
    console.log("  Testing syncGameState...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Load cards
    cardManager.loadCards(testCards);

    // Init game
    commands.initGame(['player', 'opponent'], testCards, 'player');

    // Get initial state
    const initialState = engine.getState();

    // Create modified state
    const modifiedState = {
        ...initialState,
        currentPlayer: 'opponent',
        round: 5,
        lastCategory: 'intelligence',
        tiePile: [testCards[0], testCards[1]]
    };

    // Reset events
    eventEmitter.clearEvents();

    // Sync state
    const result = commands.syncGameState(modifiedState);

    // Check result
    console.assert(result.success === true, 'Syncing game state should succeed');

    // Check event emission
    const syncEvent = eventEmitter.getEvent('gameStateSynced');
    console.assert(syncEvent !== undefined, 'Game state synced event should be emitted');

    // Check game state was updated
    const newState = engine.getState();
    console.assert(newState.currentPlayer === 'opponent', 'Current player should be updated');
    console.assert(newState.round === 5, 'Round should be updated');
    console.assert(newState.lastCategory === 'intelligence', 'Last category should be updated');
    console.assert(newState.tiePile.length === 2, 'Tie pile should be updated');

    console.log("  ✓ syncGameState tests passed");
}

/**
 * Test resetting the game
 */
function testResetGame() {
    console.log("  Testing resetGame...");

    // Create dependencies
    const events = new GameEvents();
    const cardManager = new CardManager(events);
    const engine = new GameEngine(events, cardManager);
    const eventEmitter = new MockEventEmitter();

    // Create commands
    const commands = new GameCommands(engine, eventEmitter);

    // Load cards
    cardManager.loadCards(testCards);

    // Init game
    commands.initGame(['player', 'opponent'], testCards, 'player');

    // Make some changes to the game state
    engine.getState().round = 10;
    engine.getState().tiePile.push(testCards[0]);

    // Reset events
    eventEmitter.clearEvents();

    // Reset game
    const result = commands.resetGame();

    // Check result
    console.assert(result.success === true, 'Resetting game should succeed');

    // Check event emission
    const resetEvent = eventEmitter.getEvent('gameReset');
    console.assert(resetEvent !== undefined, 'Game reset event should be emitted');

    // Check game state was reset
    const state = engine.getState();
    console.assert(state.round === 1, 'Round should be reset to 1');
    console.assert(state.tiePile.length === 0, 'Tie pile should be empty');

    console.log("  ✓ resetGame tests passed");
}

// Check if we're in a browser or Node.js environment
const isBrowser = typeof window !== 'undefined';

// If in browser and the test runner is available, register this test module
if (isBrowser) {
    if (typeof window.testModules === 'undefined') {
        window.testModules = [];
    }
    window.testModules.push(runGameCommandsTests);
} else {
    // In Node.js, run the tests directly
    runGameCommandsTests();
}

export default runGameCommandsTests;