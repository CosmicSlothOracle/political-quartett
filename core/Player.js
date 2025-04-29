/**
 * Player.js - Represents a player in the card game
 */
export default class Player {
    /**
     * Create a new player
     * @param {Object} config - Player configuration
     */
    constructor(config = {}) {
        this.id = config.id || `player-${ Date.now() }-${ Math.floor(Math.random() * 1000) }`;
        this.name = config.name || 'Player';
        this.hand = config.hand || [];
        this.score = config.score || 0;
        this.isActive = config.isActive !== undefined ? config.isActive : true;
        this.stats = config.stats || {
            wins: 0,
            losses: 0,
            draws: 0,
            cardsPlayed: 0,
            roundsWon: 0
        };
        this.avatar = config.avatar || 'default_avatar.png';
        this.metadata = config.metadata || {};
    }

    /**
     * Add a card to the player's hand
     * @param {Card|Array} card - Card(s) to add to the hand
     * @return {Player} - This player instance for chaining
     */
    addToHand(card) {
        if (Array.isArray(card)) {
            this.hand = [...this.hand, ...card];
        } else if (card) {
            this.hand.push(card);
        }
        return this;
    }

    /**
     * Get the player's entire hand
     * @return {Array} - Array of cards in hand
     */
    getHand() {
        return this.hand;
    }

    /**
     * Play a card from the player's hand
     * @param {number} index - Index of the card to play (default: 0)
     * @return {Card|null} - The played card or null if invalid index
     */
    playCard(index = 0) {
        if (index < 0 || index >= this.hand.length) {
            return null;
        }

        const card = this.hand.splice(index, 1)[0];
        if (card) {
            card.markAsPlayed();
            this.stats.cardsPlayed++;
        }
        return card;
    }

    /**
     * Play a card by its ID
     * @param {string} cardId - ID of the card to play
     * @return {Card|null} - The played card or null if not found
     */
    playCardById(cardId) {
        if (!cardId) return null;

        const index = this.hand.findIndex(card => card.id === cardId);
        if (index === -1) return null;

        return this.playCard(index);
    }

    /**
     * Check if player has any cards
     * @return {boolean} - True if player has at least one card
     */
    hasCards() {
        return this.hand.length > 0;
    }

    /**
     * Get the number of cards in the player's hand
     * @return {number} - Card count
     */
    getCardCount() {
        return this.hand.length;
    }

    /**
     * Add points to the player's score
     * @param {number} points - Points to add
     * @return {Player} - This player instance for chaining
     */
    addScore(points) {
        this.score += points;
        return this;
    }

    /**
     * Reset the player's score
     * @return {Player} - This player instance for chaining
     */
    resetScore() {
        this.score = 0;
        return this;
    }

    /**
     * Get the player's current score
     * @return {number} - Current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Record a win for this player
     * @return {Player} - This player instance for chaining
     */
    recordWin() {
        this.stats.wins++;
        return this;
    }

    /**
     * Record a loss for this player
     * @return {Player} - This player instance for chaining
     */
    recordLoss() {
        this.stats.losses++;
        return this;
    }

    /**
     * Record a draw for this player
     * @return {Player} - This player instance for chaining
     */
    recordDraw() {
        this.stats.draws++;
        return this;
    }

    /**
     * Record a round win for this player
     * @return {Player} - This player instance for chaining
     */
    recordRoundWin() {
        this.stats.roundsWon++;
        return this;
    }

    /**
     * Get player stats
     * @return {Object} - Player statistics
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Clear all cards from player's hand
     * @return {Array} - The cards that were in the hand
     */
    clearHand() {
        const oldHand = [...this.hand];
        this.hand = [];
        return oldHand;
    }

    /**
     * Set player's active status
     * @param {boolean} status - Whether player is active
     * @return {Player} - This player instance for chaining
     */
    setActive(status) {
        this.isActive = !!status;
        return this;
    }

    /**
     * Convert player to a plain object for serialization
     * @return {Object} - Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            hand: this.hand.map(card => card.toJSON ? card.toJSON() : card),
            score: this.score,
            isActive: this.isActive,
            stats: { ...this.stats },
            avatar: this.avatar
        };
    }

    /**
     * Create a Player instance from a plain object
     * @param {Object} data - Plain object data
     * @param {Function} cardFactory - Function to create Card instances from data
     * @return {Player} - New Player instance
     */
    static fromJSON(data, cardFactory) {
        if (!data) return null;

        const player = new Player({
            ...data,
            hand: [] // Initialize with empty hand, will populate below
        });

        // Populate hand if card factory is provided
        if (Array.isArray(data.hand) && typeof cardFactory === 'function') {
            player.hand = data.hand.map(cardData => cardFactory(cardData));
        }

        return player;
    }
}