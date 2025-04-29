/**
 * Deck.js - Represents a collection of cards with shuffle and draw functionality
 */
export default class Deck {
    /**
     * Create a new deck
     * @param {Object} config - Deck configuration
     */
    constructor(config = {}) {
        this.id = config.id || `deck-${ Date.now() }-${ Math.floor(Math.random() * 1000) }`;
        this.name = config.name || 'Default Deck';
        this.cards = config.cards || [];
        this.discardPile = config.discardPile || [];
        this.metadata = config.metadata || {};
    }

    /**
     * Add cards to the deck
     * @param {Card|Array} cards - Card(s) to add to the deck
     * @return {Deck} - This deck instance for chaining
     */
    addCards(cards) {
        if (Array.isArray(cards)) {
            this.cards = [...this.cards, ...cards];
        } else if (cards) {
            this.cards.push(cards);
        }
        return this;
    }

    /**
     * Get the number of cards in the deck
     * @return {number} - Card count
     */
    getCardCount() {
        return this.cards.length;
    }

    /**
     * Get the number of cards in the discard pile
     * @return {number} - Discard pile count
     */
    getDiscardCount() {
        return this.discardPile.length;
    }

    /**
     * Shuffle the deck using Fisher-Yates algorithm
     * @return {Deck} - This deck instance for chaining
     */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this;
    }

    /**
     * Draw a card from the top of the deck
     * @return {Card|null} - The drawn card or null if deck is empty
     */
    draw() {
        if (this.cards.length === 0) {
            return null;
        }
        return this.cards.shift();
    }

    /**
     * Draw multiple cards from the top of the deck
     * @param {number} count - Number of cards to draw
     * @return {Array} - Array of drawn cards
     */
    drawMultiple(count) {
        if (count <= 0) {
            return [];
        }

        const drawnCards = [];
        for (let i = 0; i < count && this.cards.length > 0; i++) {
            drawnCards.push(this.draw());
        }
        return drawnCards;
    }

    /**
     * Draw a specific card from the deck by its ID
     * @param {string} cardId - ID of the card to draw
     * @return {Card|null} - The drawn card or null if not found
     */
    drawById(cardId) {
        if (!cardId) return null;

        const index = this.cards.findIndex(card => card.id === cardId);
        if (index === -1) return null;

        return this.cards.splice(index, 1)[0];
    }

    /**
     * Look at the top card without removing it
     * @return {Card|null} - The top card or null if deck is empty
     */
    peek() {
        return this.cards.length > 0 ? this.cards[0] : null;
    }

    /**
     * Look at the top N cards without removing them
     * @param {number} count - Number of cards to peek
     * @return {Array} - Array of top N cards
     */
    peekMultiple(count) {
        if (count <= 0) {
            return [];
        }
        return this.cards.slice(0, count);
    }

    /**
     * Add a card to the discard pile
     * @param {Card} card - Card to discard
     * @return {Deck} - This deck instance for chaining
     */
    discard(card) {
        if (card) {
            card.markAsPlayed();
            this.discardPile.push(card);
        }
        return this;
    }

    /**
     * Add multiple cards to the discard pile
     * @param {Array} cards - Cards to discard
     * @return {Deck} - This deck instance for chaining
     */
    discardMultiple(cards) {
        if (Array.isArray(cards)) {
            cards.forEach(card => {
                if (card) {
                    card.markAsPlayed();
                    this.discardPile.push(card);
                }
            });
        }
        return this;
    }

    /**
     * Shuffle discard pile back into the deck
     * @return {Deck} - This deck instance for chaining
     */
    recycleDiscardPile() {
        if (this.discardPile.length === 0) {
            return this;
        }

        // Reset all cards as not played
        this.discardPile.forEach(card => card.resetPlayed());

        // Add discard pile to deck and clear discard pile
        this.cards = [...this.cards, ...this.discardPile];
        this.discardPile = [];

        // Shuffle the deck
        return this.shuffle();
    }

    /**
     * Check if the deck is empty
     * @return {boolean} - True if the deck has no cards
     */
    isEmpty() {
        return this.cards.length === 0;
    }

    /**
     * Get all cards in the deck
     * @return {Array} - All cards
     */
    getAllCards() {
        return [...this.cards];
    }

    /**
     * Get all cards in the discard pile
     * @return {Array} - All discarded cards
     */
    getDiscardPile() {
        return [...this.discardPile];
    }

    /**
     * Convert deck to a plain object for serialization
     * @return {Object} - Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            cards: this.cards.map(card => card.toJSON ? card.toJSON() : card),
            discardPile: this.discardPile.map(card => card.toJSON ? card.toJSON() : card)
        };
    }

    /**
     * Create a Deck instance from a plain object
     * @param {Object} data - Plain object data
     * @param {Function} cardFactory - Function to create Card instances from data
     * @return {Deck} - New Deck instance
     */
    static fromJSON(data, cardFactory) {
        if (!data) return null;

        const deck = new Deck({
            ...data,
            cards: [],
            discardPile: []
        });

        // Convert raw card data to Card instances
        if (Array.isArray(data.cards) && typeof cardFactory === 'function') {
            deck.cards = data.cards.map(cardData => cardFactory(cardData));
        }

        if (Array.isArray(data.discardPile) && typeof cardFactory === 'function') {
            deck.discardPile = data.discardPile.map(cardData => cardFactory(cardData));
        }

        return deck;
    }

    /**
     * Deal cards to multiple players
     * @param {number} playerCount - Number of players to deal to
     * @param {number} cardsPerPlayer - Number of cards per player
     * @param {boolean} dealOne - Deal one card to each player at a time (default: true)
     * @return {Array} - Array of card arrays, one per player
     */
    deal(playerCount, cardsPerPlayer, dealOne = true) {
        if (playerCount <= 0 || cardsPerPlayer <= 0) {
            return [];
        }

        const hands = Array.from({ length: playerCount }, () => []);

        if (dealOne) {
            // Deal one card at a time to each player
            for (let c = 0; c < cardsPerPlayer; c++) {
                for (let p = 0; p < playerCount; p++) {
                    const card = this.draw();
                    if (card) {
                        hands[p].push(card);
                    }
                }
            }
        } else {
            // Deal all cards to one player at a time
            for (let p = 0; p < playerCount; p++) {
                hands[p] = this.drawMultiple(cardsPerPlayer);
            }
        }

        return hands;
    }
}