/**
 * GameEngine.js - Core game logic for Political Quartett
 */
class GameEngine {
    constructor() {
        this.playerCards = [];
        this.opponentCards = [];
        this.tieCards = [];
        this.gameOver = false;
        this.winner = null;
        this.currentPlayer = null; // 'player' or 'opponent'
        this.isPlayerTurn = false;
        this.gameId = null;
    }

    /**
     * Initialize game state
     * @param {Array} playerCards - Initial cards for player
     * @param {Array} opponentCards - Initial cards for opponent
     * @param {Boolean} isPlayerTurn - Whether it's the player's turn
     * @returns {Object} - Game state
     */
    initializeState(playerCards, opponentCards, isPlayerTurn = null) {
        this.playerCards = playerCards || [];
        this.opponentCards = opponentCards || [];
        this.tieCards = [];
        this.gameOver = false;
        this.winner = null;

        // Determine starting player if not specified
        this.isPlayerTurn = isPlayerTurn !== null ? isPlayerTurn : Math.random() >= 0.5;
        this.currentPlayer = this.isPlayerTurn ? 'player' : 'opponent';

        return this.getState();
    }

    /**
     * Get current game state for sync/display
     * @returns {Object} - Game state
     */
    getState() {
        return {
            playerCards: this.playerCards,
            opponentCards: this.opponentCards,
            tieCards: this.tieCards,
            currentPlayer: this.currentPlayer,
            isPlayerTurn: this.isPlayerTurn,
            gameOver: this.gameOver,
            winner: this.winner,
            gameId: this.gameId
        };
    }

    /**
     * Shuffles a deck of cards
     * @param {Array} deck - Deck to shuffle
     * @returns {Array} - Shuffled deck
     */
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Check if both players have cards to play
     * @returns {Boolean} - True if both players have cards
     */
    canPlayRound() {
        return this.playerCards.length > 0 && this.opponentCards.length > 0 && !this.gameOver;
    }

    /**
     * Compare cards and determine winner for a round
     * @param {String} category - Category to compare
     * @returns {Object|null} - Round result or null if can't play
     */
    compareCards(category) {
        if (!this.canPlayRound() || !category) {
            return null;
        }

        // Get top cards from each player
        const playerCard = this.playerCards[0];
        const opponentCard = this.opponentCards[0];

        // Remove cards from hands
        this.playerCards.shift();
        this.opponentCards.shift();

        // Get values from pre-defined card stats
        const playerValue = playerCard.stats[category];
        const opponentValue = opponentCard.stats[category];

        let result;

        // Handle result
        if (playerValue > opponentValue) {
            result = 'player';
            // Player wins the round
            this.playerCards.push(playerCard, opponentCard, ...this.tieCards);
            this.tieCards = [];
            this.isPlayerTurn = true;
            this.currentPlayer = 'player';
        } else if (opponentValue > playerValue) {
            result = 'opponent';
            // Opponent wins the round
            this.opponentCards.push(playerCard, opponentCard, ...this.tieCards);
            this.tieCards = [];
            this.isPlayerTurn = false;
            this.currentPlayer = 'opponent';
        } else {
            result = 'tie';
            // It's a tie - collect tie cards
            this.tieCards.push(playerCard, opponentCard);
            // Keep the same player's turn
        }

        // Check for game over
        this.checkGameOver();

        return {
            result,
            playerCard,
            opponentCard,
            playerValue,
            opponentValue,
            category,
            nextTurn: this.currentPlayer,
            playerCardCount: this.playerCards.length,
            opponentCardCount: this.opponentCards.length,
            gameOver: this.gameOver,
            winner: this.winner
        };
    }

    /**
     * Check if the game is over
     * @returns {Boolean} - True if game is over
     */
    checkGameOver() {
        if (this.playerCards.length === 0) {
            this.gameOver = true;
            this.winner = 'opponent';
            return true;
        } else if (this.opponentCards.length === 0) {
            this.gameOver = true;
            this.winner = 'player';
            return true;
        }
        return false;
    }

    /**
     * Apply a state update from network or saved state
     * @param {Object} state - State to apply
     */
    syncState(state) {
        if (!state) return;

        this.playerCards = state.playerCards || this.playerCards;
        this.opponentCards = state.opponentCards || this.opponentCards;
        this.tieCards = state.tieCards || this.tieCards;
        this.currentPlayer = state.currentPlayer || this.currentPlayer;
        this.isPlayerTurn = state.isPlayerTurn !== undefined ? state.isPlayerTurn : this.isPlayerTurn;
        this.gameOver = state.gameOver !== undefined ? state.gameOver : this.gameOver;
        this.winner = state.winner || this.winner;
        this.gameId = state.gameId || this.gameId;
    }
}

export default GameEngine;