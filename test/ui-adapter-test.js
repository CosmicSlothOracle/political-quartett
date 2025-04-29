/**
 * UI Adapter Test Suite
 *
 * Tests the adapter between game logic and UI components
 */
import GameEvents from '../core/GameEvents.js';
import GameState from '../core/GameState.js';
import Card from '../core/Card.js';
import Player from '../core/Player.js';

/**
 * Run all UI adapter tests
 */
function runUIAdapterTests() {
    console.log('🧪 Starting UI Adapter Tests');

    testElementMapping();
    testEventHandling();
    testCardRendering();
    testStateSync();
    testUIUpdates();

    console.log('✅ UI Adapter Tests Completed');
}

/**
 * Mock DOM elements for testing
 */
class MockDOM {
    constructor() {
        this.elements = {};
        this.eventListeners = {};
    }

    createElement(id) {
        this.elements[id] = {
            id: id,
            innerHTML: '',
            className: '',
            style: {
                display: 'block'
            },
            dataset: {},
            children: []
        };
        return this.elements[id];
    }

    getElementById(id) {
        if (!this.elements[id]) {
            this.createElement(id);
        }
        return this.elements[id];
    }

    addEventListener(element, event, callback) {
        if (!this.eventListeners[element.id]) {
            this.eventListeners[element.id] = {};
        }
        if (!this.eventListeners[element.id][event]) {
            this.eventListeners[element.id][event] = [];
        }
        this.eventListeners[element.id][event].push(callback);
    }

    triggerEvent(elementId, event, data = {}) {
        if (this.eventListeners[elementId] && this.eventListeners[elementId][event]) {
            this.eventListeners[elementId][event].forEach(callback => {
                callback(data);
            });
        }
    }
}

/**
 * Mock UI Adapter for testing
 */
class UIAdapter {
    constructor(gameEvents, dom) {
        this.events = gameEvents;
        this.dom = dom;
        this.elements = {
            playerCard: dom.getElementById('player-card'),
            opponentCard: dom.getElementById('opponent-card'),
            playerCardsCount: dom.getElementById('player-cards-count'),
            opponentCardsCount: dom.getElementById('opponent-cards-count'),
            turnIndicator: dom.getElementById('turn-indicator'),
            battleResult: dom.getElementById('battle-result'),
            categorySelection: dom.getElementById('category-selection')
        };

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.events.on('game:stateChanged', (state) => this.updateUI(state));
        this.events.on('game:cardPlayed', (data) => this.showPlayedCard(data));
        this.events.on('game:roundResult', (result) => this.showRoundResult(result));
        this.events.on('game:gameOver', (winner) => this.showGameOver(winner));
    }

    updateUI(state) {
        // Update card counts
        this.elements.playerCardsCount.innerHTML = state.playerCardCount;
        this.elements.opponentCardsCount.innerHTML = state.opponentCardCount;

        // Update turn indicator
        this.elements.turnIndicator.innerHTML = state.isPlayerTurn ? 'Your Turn' : 'Opponent\'s Turn';

        // Enable/disable category selection based on turn
        if (state.isPlayerTurn) {
            this.elements.categorySelection.style.display = 'block';
        } else {
            this.elements.categorySelection.style.display = 'none';
        }
    }

    showPlayedCard(data) {
        const { player, card } = data;
        const element = player === 'player' ? this.elements.playerCard : this.elements.opponentCard;

        // Render card
        element.innerHTML = this.renderCard(card);
    }

    renderCard(card) {
        if (!card) return '';

        let attributesHTML = '';
        for (const [attr, value] of Object.entries(card.stats || {})) {
            attributesHTML += `
        <div class="card-attribute" data-attribute="${ attr }">
          <span class="attribute-name">${ attr }</span>:
          <span class="attribute-value">${ value }</span>
        </div>
      `;
        }

        return `
      <div class="card-header">
        <h4 class="card-name">${ card.name }</h4>
      </div>
      <div class="card-image">
        <img src="${ card.image || '../images/profile-placeholder.png' }" alt="${ card.name }">
      </div>
      <div class="card-description">
        <p>${ card.quote || '' }</p>
      </div>
      <div class="card-attributes">
        ${ attributesHTML }
      </div>
    `;
    }

    showRoundResult(result) {
        let resultHTML = '';

        if (result.tie) {
            resultHTML = `<h3>It's a tie!</h3><p>Cards in tie pile: ${ result.tieCards }</p>`;
        } else {
            resultHTML = `<h3>${ result.winner } wins this round!</h3>
                    <p>Attribute: ${ result.attribute }</p>
                    <p>${ result.playerName }: ${ result.playerValue }</p>
                    <p>${ result.opponentName }: ${ result.opponentValue }</p>`;
        }

        this.elements.battleResult.innerHTML = resultHTML;
    }

    showGameOver(winner) {
        this.elements.battleResult.innerHTML = `<h2>Game Over!</h2><p>${ winner } wins the game!</p>`;
    }

    bindCategorySelection(callback) {
        // Simulate click events on category elements
        const categories = ['charisma', 'leadership', 'influence', 'integrity', 'trickery', 'wealth'];

        categories.forEach(category => {
            const categoryElement = this.dom.createElement(`category-${ category }`);
            categoryElement.dataset.attribute = category;
            this.elements.categorySelection.children.push(categoryElement);

            this.dom.addEventListener(categoryElement, 'click', () => {
                callback(category);
            });
        });
    }
}

/**
 * Test element mapping
 */
function testElementMapping() {
    console.log('  Testing element mapping...');

    const events = new GameEvents();
    const mockDOM = new MockDOM();

    // Create test elements
    const playerCard = mockDOM.createElement('player-card');
    const opponentCard = mockDOM.createElement('opponent-card');
    const playerCardsCount = mockDOM.createElement('player-cards-count');
    const opponentCardsCount = mockDOM.createElement('opponent-cards-count');

    // Create adapter
    const adapter = new UIAdapter(events, mockDOM);

    // Verify elements are mapped correctly
    console.assert(adapter.elements.playerCard === playerCard, 'Player card element should be mapped');
    console.assert(adapter.elements.opponentCard === opponentCard, 'Opponent card element should be mapped');
    console.assert(adapter.elements.playerCardsCount === playerCardsCount, 'Player cards count element should be mapped');
    console.assert(adapter.elements.opponentCardsCount === opponentCardsCount, 'Opponent cards count element should be mapped');

    console.log('  ✓ Element mapping tests passed');
}

/**
 * Test event handling
 */
function testEventHandling() {
    console.log('  Testing event handling...');

    const events = new GameEvents();
    const mockDOM = new MockDOM();
    const adapter = new UIAdapter(events, mockDOM);

    // Mock game state
    const gameState = {
        playerCardCount: 5,
        opponentCardCount: 5,
        isPlayerTurn: true
    };

    // Track UI updates
    let playerCountUpdated = false;
    let opponentCountUpdated = false;
    let turnIndicatorUpdated = false;

    // Override updateUI to track calls
    const originalUpdateUI = adapter.updateUI;
    adapter.updateUI = (state) => {
        playerCountUpdated = state.playerCardCount === gameState.playerCardCount;
        opponentCountUpdated = state.opponentCardCount === gameState.opponentCardCount;
        turnIndicatorUpdated = true;
        originalUpdateUI.call(adapter, state);
    };

    // Emit state changed event
    events.emit('game:stateChanged', gameState);

    // Verify UI updates were triggered
    console.assert(playerCountUpdated, 'Player count should be updated');
    console.assert(opponentCountUpdated, 'Opponent count should be updated');
    console.assert(turnIndicatorUpdated, 'Turn indicator should be updated');
    console.assert(adapter.elements.turnIndicator.innerHTML === 'Your Turn', 'Turn indicator should show correct text');

    // Test card played event
    const card = {
        name: 'Test Card',
        image: 'test.png',
        stats: {
            charisma: 7,
            leadership: 8
        }
    };

    events.emit('game:cardPlayed', { player: 'player', card });

    // Verify card was rendered
    console.assert(adapter.elements.playerCard.innerHTML.includes('Test Card'), 'Card name should be rendered');
    console.assert(adapter.elements.playerCard.innerHTML.includes('charisma'), 'Card attributes should be rendered');

    console.log('  ✓ Event handling tests passed');
}

/**
 * Test card rendering
 */
function testCardRendering() {
    console.log('  Testing card rendering...');

    const events = new GameEvents();
    const mockDOM = new MockDOM();
    const adapter = new UIAdapter(events, mockDOM);

    // Test cards with different data
    const cards = [
        {
            name: 'Donald Trump',
            image: 'cards/card_Trump.png',
            stats: {
                charisma: 9,
                leadership: 6,
                influence: 9,
                integrity: 2,
                trickery: 10,
                wealth: 9
            },
            quote: "My fingers are long and beautiful, as, it has been well documented, are various other parts of my body."
        },
        {
            name: 'Angela Merkel',
            image: 'cards/card_Merkel.png',
            stats: {
                charisma: 6,
                leadership: 8,
                influence: 8,
                integrity: 7,
                trickery: 4,
                wealth: 6
            },
            quote: "Wir schaffen das."
        }
    ];

    // Render each card
    cards.forEach(card => {
        const html = adapter.renderCard(card);

        // Verify card content
        console.assert(html.includes(card.name), 'Card name should be rendered');
        console.assert(html.includes(card.image), 'Card image should be rendered');
        console.assert(html.includes(card.quote), 'Card quote should be rendered');

        // Verify all attributes are rendered
        Object.entries(card.stats).forEach(([attr, value]) => {
            console.assert(html.includes(`data-attribute="${ attr }"`), `Attribute ${ attr } should be rendered`);
            console.assert(html.includes(`<span class="attribute-value">${ value }</span>`), `Value ${ value } should be rendered`);
        });
    });

    // Test empty card
    const emptyHtml = adapter.renderCard(null);
    console.assert(emptyHtml === '', 'Empty card should render empty string');

    console.log('  ✓ Card rendering tests passed');
}

/**
 * Test state synchronization
 */
function testStateSync() {
    console.log('  Testing state synchronization...');

    const events = new GameEvents();
    const mockDOM = new MockDOM();
    const adapter = new UIAdapter(events, mockDOM);

    // Test different game states
    const gameStates = [
        {
            playerCardCount: 7,
            opponentCardCount: 3,
            isPlayerTurn: true
        },
        {
            playerCardCount: 4,
            opponentCardCount: 6,
            isPlayerTurn: false
        }
    ];

    // Apply each state and verify UI updates
    gameStates.forEach(state => {
        adapter.updateUI(state);

        // Verify UI elements updated correctly
        console.assert(adapter.elements.playerCardsCount.innerHTML == state.playerCardCount, 'Player card count should be updated');
        console.assert(adapter.elements.opponentCardsCount.innerHTML == state.opponentCardCount, 'Opponent card count should be updated');

        if (state.isPlayerTurn) {
            console.assert(adapter.elements.turnIndicator.innerHTML === 'Your Turn', 'Turn indicator should show player turn');
            console.assert(adapter.elements.categorySelection.style.display === 'block', 'Category selection should be visible on player turn');
        } else {
            console.assert(adapter.elements.turnIndicator.innerHTML === 'Opponent\'s Turn', 'Turn indicator should show opponent turn');
            console.assert(adapter.elements.categorySelection.style.display === 'none', 'Category selection should be hidden on opponent turn');
        }
    });

    console.log('  ✓ State synchronization tests passed');
}

/**
 * Test UI updates
 */
function testUIUpdates() {
    console.log('  Testing UI updates...');

    const events = new GameEvents();
    const mockDOM = new MockDOM();
    const adapter = new UIAdapter(events, mockDOM);

    // Test round result display
    const results = [
        {
            tie: true,
            tieCards: 4
        },
        {
            tie: false,
            winner: 'Player',
            attribute: 'charisma',
            playerName: 'Player',
            opponentName: 'AI',
            playerValue: 8,
            opponentValue: 6
        }
    ];

    // Verify tie result
    adapter.showRoundResult(results[0]);
    console.assert(adapter.elements.battleResult.innerHTML.includes('It\'s a tie!'), 'Tie result should be displayed');
    console.assert(adapter.elements.battleResult.innerHTML.includes('Cards in tie pile: 4'), 'Tie pile count should be displayed');

    // Verify win result
    adapter.showRoundResult(results[1]);
    console.assert(adapter.elements.battleResult.innerHTML.includes('Player wins this round!'), 'Winner should be displayed');
    console.assert(adapter.elements.battleResult.innerHTML.includes('Attribute: charisma'), 'Attribute should be displayed');
    console.assert(adapter.elements.battleResult.innerHTML.includes('Player: 8'), 'Player value should be displayed');
    console.assert(adapter.elements.battleResult.innerHTML.includes('AI: 6'), 'Opponent value should be displayed');

    // Test game over display
    adapter.showGameOver('Player');
    console.assert(adapter.elements.battleResult.innerHTML.includes('Game Over!'), 'Game over message should be displayed');
    console.assert(adapter.elements.battleResult.innerHTML.includes('Player wins the game!'), 'Winner should be displayed');

    // Test category selection binding
    let selectedCategory = null;
    adapter.bindCategorySelection(category => {
        selectedCategory = category;
    });

    // Trigger click on leadership category
    mockDOM.triggerEvent('category-leadership', 'click');
    console.assert(selectedCategory === 'leadership', 'Category selection should trigger callback with correct category');

    console.log('  ✓ UI updates tests passed');
}

// Export the test runner
export default runUIAdapterTests;