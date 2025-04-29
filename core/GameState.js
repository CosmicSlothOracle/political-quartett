/**
 * GameState.js - Manages the entire game state for Political Quartett
 */
export default class GameState {
    /**
     * Create a new game state
     * @param {Array} players - Array of player objects
     * @param {Array} deck - Card deck
     * @param {boolean} isAIOpponent - Whether opponent is AI
     */
    constructor(players, deck, isAIOpponent = false) {
        this.players = players; // Array of players
        this.deck = deck; // Card deck
        this.currentTurn = 0;
        this.tiePile = [];
        this.winner = null;
        this.isAIOpponent = isAIOpponent;
        this.selectedCategory = null;
        this.roundsPlayed = 0;
        this.gameId = null; // For online games
    }

    /**
     * Get the player whose turn it is
     * @return {Object} Current player
     */
    getCurrentPlayer() {
        return this.players[this.currentTurn % this.players.length];
    }

    /**
     * Get the opponent of the current player
     * @return {Object} Opponent player
     */
    getOpponentPlayer() {
        return this.players.find(p => p !== this.getCurrentPlayer());
    }

    /**
     * Advance to the next turn
     */
    nextTurn() {
        this.currentTurn++;
        this.roundsPlayed++;
    }

    /**
     * Check if any player has won the game
     */
    checkWinCondition() {
        const activePlayers = this.players.filter(p => p.hand.length > 0);
        if (activePlayers.length === 1) {
            this.winner = activePlayers[0];
            return true;
        }
        return false;
    }

    /**
     * Add cards to the tie pile
     * @param {Array} cards - Cards to add to the tie pile
     */
    addToTiePile(cards) {
        this.tiePile = [...this.tiePile, ...cards];
    }

    /**
     * Clear the tie pile
     */
    clearTiePile() {
        this.tiePile = [];
    }

    /**
     * Get current game state for serialization (network)
     * @return {Object} Serialized game state
     */
    toJSON() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                handCount: p.hand.length,
                topCard: p.hand.length > 0 ? p.hand[0] : null
            })),
            currentTurn: this.currentTurn,
            tiePileCount: this.tiePile.length,
            selectedCategory: this.selectedCategory,
            roundsPlayed: this.roundsPlayed,
            winner: this.winner ? this.winner.id : null,
            gameId: this.gameId
        };
    }

    /**
     * Update game state from server data
     * @param {Object} data - Game state data from server
     */
    updateFromServer(data) {
        this.currentTurn = data.currentTurn;
        this.selectedCategory = data.selectedCategory;
        this.roundsPlayed = data.roundsPlayed;

        // Update players
        for (const playerData of data.players) {
            const player = this.players.find(p => p.id === playerData.id);
            if (player) {
                player.hand = playerData.hand || [];
            }
        }

        // Update winner if exists
        if (data.winner) {
            this.winner = this.players.find(p => p.id === data.winner);
        }
    }
}