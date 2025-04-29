/**
 * GameCommands.js - Command pattern implementation for game actions
 */
import GameEngine from './GameEngine.js';

class GameCommands {
    constructor(gameEngine, eventEmitter) {
        this.engine = gameEngine || new GameEngine();
        this.eventEmitter = eventEmitter;
        this.isAIOpponent = false;
        this.isOnlineGame = false;
    }

    /**
     * Initialize a new game
     * @param {Array} cardData - Card data to use for the game
     * @returns {Object} - Game state after initialization
     */
    initGame(cardData) {
        // Reset game state
        const shuffledDeck = this.engine.shuffleDeck([...cardData]);

        // Deal cards (5 each)
        const playerCards = shuffledDeck.slice(0, 5);
        const opponentCards = shuffledDeck.slice(5, 10);

        // Initialize the game state
        const gameState = this.engine.initializeState(playerCards, opponentCards);

        // Emit game initialized event
        this.emitEvent('gameInitialized', gameState);

        // If AI opponent and AI starts, make AI move after a delay
        if (this.isAIOpponent && !gameState.isPlayerTurn) {
            setTimeout(() => this.makeAIMove(), 1500);
        }

        return gameState;
    }

    /**
     * Handle player selecting a category
     * @param {String} category - Category selected by player
     * @returns {Boolean} - True if selection was valid
     */
    selectCategory(category) {
        // Only allow selection if it's player's turn (or AI game)
        if (!this.engine.isPlayerTurn && !this.isAIOpponent) {
            return false;
        }

        this.emitEvent('categorySelected', { category });
        return true;
    }

    /**
     * Play a round with the selected category
     * @param {String} category - Category to compare
     * @returns {Object|null} - Round result or null if invalid
     */
    playRound(category) {
        // Check if we can play
        if (!this.engine.canPlayRound()) {
            const gameState = this.engine.getState();
            this.emitEvent('roundPlayed', {
                result: gameState.winner,
                playerCard: null,
                opponentCard: null,
                playerValue: 0,
                opponentValue: 0,
                category: category,
                nextTurn: gameState.currentPlayer,
                playerCardCount: gameState.playerCards.length,
                opponentCardCount: gameState.opponentCards.length,
                gameOver: true,
                winner: gameState.winner
            });
            return null;
        }

        // Process the round
        const roundResult = this.engine.compareCards(category);

        // Emit the round played event
        this.emitEvent('roundPlayed', roundResult);

        // If AI opponent and AI's turn, make AI move after a delay
        if (this.isAIOpponent && !this.engine.isPlayerTurn && !this.engine.gameOver) {
            setTimeout(() => this.makeAIMove(), 2000);
        }

        return roundResult;
    }

    /**
     * Make AI opponent move
     */
    makeAIMove() {
        if (this.engine.gameOver || this.engine.isPlayerTurn) {
            return;
        }

        // Ensure opponent has cards
        if (this.engine.opponentCards.length === 0) {
            return;
        }

        // AI strategy: pick the highest stat from the current card
        const aiCard = this.engine.opponentCards[0];
        if (!aiCard || !aiCard.stats) return;

        const stats = Object.entries(aiCard.stats);
        stats.sort((a, b) => b[1] - a[1]); // Sort by value (highest first)
        const bestCategory = stats[0][0];

        // Select this category
        this.selectCategory(bestCategory);

        // Wait a bit before playing the round (for UI animation)
        setTimeout(() => this.playRound(bestCategory), 1000);
    }

    /**
     * Start an AI game
     * @param {Array} cardData - Card data to use
     * @returns {Object} - Game state
     */
    startAIGame(cardData) {
        this.isAIOpponent = true;
        this.isOnlineGame = false;
        const gameState = this.initGame(cardData);

        this.emitEvent('gameStarted', {
            isAIGame: true,
            gameState
        });

        return gameState;
    }

    /**
     * Start an online game
     * @param {String} gameId - Game ID
     * @returns {Object} - Game state
     */
    startOnlineGame(gameId) {
        this.isAIOpponent = false;
        this.isOnlineGame = true;
        this.engine.gameId = gameId;

        this.emitEvent('gameStarted', {
            isAIGame: false,
            gameId
        });

        return this.engine.getState();
    }

    /**
     * Create or join an online game
     * @param {String} gameId - Game ID (optional)
     */
    createOrJoinOnlineGame(gameId = null) {
        this.engine.gameId = gameId;

        this.emitEvent('waitingForOpponent', { gameId });
    }

    /**
     * Handle opponent joining the game
     * @param {String} gameId - Game ID
     * @param {Array} cardData - Card data to use
     */
    opponentJoined(gameId, cardData) {
        this.engine.gameId = gameId;
        this.isOnlineGame = true;

        // Initialize the game with the provided card data
        if (cardData) {
            this.initGame(cardData);
        }

        this.emitEvent('opponentJoined', { gameId });
    }

    /**
     * Sync game state (from network events, etc.)
     * @param {Object} state - Game state to sync
     */
    syncGameState(state) {
        this.engine.syncState(state);
        this.emitEvent('gameStateSynced', this.engine.getState());
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.engine = new GameEngine();
        this.isAIOpponent = false;
        this.isOnlineGame = false;
        this.emitEvent('gameReset', {});
    }

    /**
     * Emit an event via the event emitter
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    emitEvent(event, data) {
        if (this.eventEmitter && typeof this.eventEmitter.emit === 'function') {
            this.eventEmitter.emit(event, data);
        }
    }
}

export default GameCommands;