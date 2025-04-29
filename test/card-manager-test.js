/**
 * Card Manager Test Suite
 *
 * Tests the CardManager class that handles card operations
 */
import CardManager from '../core/CardManager.js';

/**
 * Run all CardManager tests
 */
function runCardManagerTests() {
    console.log("📋 Running CardManager tests...");

    // Create a mock events system
    const events = {
        listeners: {},
        emit: function (event, ...args) {
            console.log(`[EVENT] ${ event }`, ...args);
            if (this.listeners[event]) {
                this.listeners[event].forEach(listener => listener(...args));
            }
        },
        on: function (event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
            return this;
        }
    };

    // Sample card data for testing
    const sampleCards = [
        { id: "card1", name: "Card 1", type: "political", values: { intelligence: 80, charisma: 70 } },
        { id: "card2", name: "Card 2", type: "political", values: { intelligence: 60, charisma: 90 } },
        { id: "card3", name: "Card 3", type: "economic", values: { growth: 75, stability: 65 } },
        { id: "card4", name: "Card 4", type: "economic", values: { growth: 85, stability: 55 } },
        {
            id: "card5", name: "Card 5", type: "political", values: { intelligence: 75, charisma: 65 },
            effect: { type: "boost", stat: "intelligence", value: 10 }
        }
    ];

    try {
        // Create a new CardManager instance
        const cardManager = new CardManager(events);

        // Load cards
        console.log("Testing: Loading cards");
        cardManager.loadCards(sampleCards);

        // Test basic card operations
        testBasicOperations(cardManager);

        // Test hand operations
        testHandOperations(cardManager);

        // Test card effects
        testCardEffects(cardManager);

        console.log("✅ CardManager tests completed successfully");
    } catch (error) {
        console.error("❌ CardManager tests failed:", error);
        throw error;
    }

    function testBasicOperations(cardManager) {
        console.log("Testing: Basic card operations");

        // Test getAllCards
        const allCards = cardManager.getAllCards();
        assert(allCards.length === 5, "Should have 5 cards loaded");

        // Test getCardById
        const card1 = cardManager.getCardById("card1");
        assert(card1 && card1.id === "card1", "Should retrieve card by id");
        assert(cardManager.getCardById("nonexistent") === undefined, "Should return undefined for nonexistent card");

        // Test getCardsByType
        const politicalCards = cardManager.getCardsByType("political");
        assert(politicalCards.length === 3, "Should retrieve 3 political cards");

        // Test createDeck
        const standardDeck = cardManager.createDeck("standard");
        assert(standardDeck.length === 5, "Standard deck should contain all cards");

        const economicDeck = cardManager.createDeck("economic");
        assert(economicDeck.length === 2, "Economic deck should contain only economic cards");

        // Test deck shuffle
        const deckToShuffle = [...standardDeck];
        const originalFirstCard = deckToShuffle[0];

        // Override Math.random to ensure predictable shuffle
        const originalRandom = Math.random;
        Math.random = () => 0.9;

        cardManager.shuffleDeck(deckToShuffle);

        // Restore original Math.random
        Math.random = originalRandom;

        assert(deckToShuffle[0] !== originalFirstCard, "Deck should be shuffled");

        // Test dealCard
        const copyDeck = [...standardDeck];
        const initialSize = copyDeck.length;
        const dealtCard = cardManager.dealCard(copyDeck);

        assert(dealtCard !== undefined, "Should deal a card");
        assert(copyDeck.length === initialSize - 1, "Deck size should decrease after dealing");

        console.log("✓ Basic operations tests passed");
    }

    function testHandOperations(cardManager) {
        console.log("Testing: Hand operations");

        // Create test players
        const player1 = "player1";
        const player2 = "player2";

        // Test createHand
        cardManager.createHand(player1);
        assert(cardManager.getHand(player1).length === 0, "New hand should be empty");

        // Create a fresh deck with 5 cards for dealing
        const deck = [...cardManager.getAllCards()];

        // Test dealToHand with 2 cards
        cardManager.dealToHand(player1, deck, 2);
        assert(cardManager.getHand(player1).length === 2, "Player should have 2 cards");
        assert(deck.length === 3, "Deck should have 3 cards left");

        // Deal 2 more cards to second player
        cardManager.dealToHand(player2, deck, 2);
        assert(cardManager.getHand(player2).length === 2, "Second player should have 2 cards");
        assert(deck.length === 1, "Deck should have 1 card left");

        // Test playCard
        const player1Cards = cardManager.getHand(player1);
        const cardToPlay = player1Cards[0];

        const playedCard = cardManager.playCard(player1, cardToPlay.id);
        assert(playedCard && playedCard.id === cardToPlay.id, "Should return the played card");
        assert(cardManager.getHand(player1).length === 1, "Hand size should decrease after playing");

        // Test discardCard
        const player2Cards = cardManager.getHand(player2);
        const cardToDiscard = player2Cards[0];

        const discardedCard = cardManager.discardCard(player2, cardToDiscard.id);
        assert(discardedCard && discardedCard.id === cardToDiscard.id, "Should return the discarded card");
        assert(cardManager.getHand(player2).length === 1, "Hand size should decrease after discarding");

        // Test clearHand
        cardManager.clearHand(player1);
        assert(cardManager.getHand(player1).length === 0, "Hand should be empty after clearing");

        console.log("✓ Hand operations tests passed");
    }

    function testCardEffects(cardManager) {
        console.log("Testing: Card effects");

        // Get a card with effect
        const effectCard = cardManager.getCardById("card5");
        assert(effectCard && effectCard.effect, "Should have a card with effect");

        // Create a player and game state
        const player = "effectPlayer";
        const gameState = {
            players: {
                [player]: {
                    stats: { intelligence: 70 }
                }
            }
        };

        // Register an effect handler
        let effectApplied = false;
        cardManager.registerEffectHandler("boost", (card, target, state) => {
            effectApplied = true;
            state.players[target].stats[card.effect.stat] += card.effect.value;
            return `Boosted ${ card.effect.stat } by ${ card.effect.value }`;
        });

        // Apply the effect
        const result = cardManager.applyCardEffect(effectCard, player, gameState);
        assert(effectApplied, "Effect handler should be called");
        assert(gameState.players[player].stats.intelligence === 80, "Effect should increase intelligence");

        // Test serialization/deserialization
        const serializedCard = cardManager.serializeCard(effectCard);
        assert(typeof serializedCard === "string", "Card should be serialized to string");

        const deserializedCard = cardManager.deserializeCard(serializedCard);
        assert(deserializedCard.id === effectCard.id, "Card should be properly deserialized");

        console.log("✓ Card effects tests passed");
    }

    function assert(condition, message) {
        if (!condition) {
            console.error(`❌ Assertion failed: ${ message }`);
            throw new Error(`Test assertion failed: ${ message }`);
        }
    }
}

// Check if we're in a browser or Node.js environment
const isBrowser = typeof window !== 'undefined';

// If in browser and the test runner is available, register this test module
if (isBrowser) {
    if (typeof window.testModules === 'undefined') {
        window.testModules = [];
    }
    window.testModules.push(runCardManagerTests);
} else {
    // In Node.js, run the tests directly
    runCardManagerTests();
}

// Export the test runner
export default runCardManagerTests;