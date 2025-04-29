/**
 * CardManager.js
 *
 * Manages the card operations including loading, creating decks,
 * dealing cards, managing hands, and applying card effects.
 */

class CardManager {
    /**
     * Creates a new CardManager instance
     * @param {GameEvents} events - Game events system for emitting card events
     */
    constructor(events) {
        this.events = events;
        this.cards = [];
        this.hands = new Map();
        this.effectHandlers = new Map();
    }

    /**
     * Loads cards from data array
     * @param {Array} cardsData - Array of card data objects
     */
    loadCards(cardsData) {
        this.cards = [...this.cards, ...cardsData];
    }

    /**
     * Loads cards from a URL
     * @param {string} url - URL to fetch cards from
     * @returns {Promise} - Promise that resolves when cards are loaded
     */
    async loadCardsFromUrl(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.cards && Array.isArray(data.cards)) {
                this.loadCards(data.cards);
            }

            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Gets all loaded cards
     * @returns {Array} - All cards
     */
    getAllCards() {
        return [...this.cards];
    }

    /**
     * Gets a card by its ID
     * @param {string} id - Card ID to find
     * @returns {Object|undefined} - The found card or undefined
     */
    getCardById(id) {
        return this.cards.find(card => card.id === id);
    }

    /**
     * Gets cards by type
     * @param {string} type - Card type to filter by
     * @returns {Array} - Cards of the specified type
     */
    getCardsByType(type) {
        return this.cards.filter(card => card.type === type);
    }

    /**
     * Creates a deck based on type
     * @param {string} deckType - Type of deck to create ('standard' or a card type)
     * @returns {Array} - The created deck
     */
    createDeck(deckType) {
        if (deckType === 'standard') {
            return [...this.cards];
        } else {
            return this.getCardsByType(deckType);
        }
    }

    /**
     * Creates a custom deck from specified card IDs
     * @param {Array} cardIds - Array of card IDs to include in the deck
     * @returns {Array} - The created custom deck
     */
    createCustomDeck(cardIds) {
        return cardIds.map(id => this.getCardById(id)).filter(card => card !== undefined);
    }

    /**
     * Shuffles a deck
     * @param {Array} deck - Deck to shuffle
     */
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    /**
     * Deals a card from a deck
     * @param {Array} deck - Deck to deal from
     * @returns {Object|undefined} - The dealt card or undefined if deck is empty
     */
    dealCard(deck) {
        if (deck.length === 0) {
            return undefined;
        }
        return deck.pop();
    }

    /**
     * Deals multiple cards from a deck
     * @param {Array} deck - Deck to deal from
     * @param {number} count - Number of cards to deal
     * @returns {Array} - The dealt cards
     */
    dealCards(deck, count) {
        const actualCount = Math.min(count, deck.length);
        const cards = [];

        for (let i = 0; i < actualCount; i++) {
            cards.push(this.dealCard(deck));
        }

        return cards;
    }

    /**
     * Creates an empty hand for a player
     * @param {string} playerId - Player ID
     */
    createHand(playerId) {
        this.hands.set(playerId, []);
    }

    /**
     * Gets a player's hand
     * @param {string} playerId - Player ID
     * @returns {Array} - Player's hand
     */
    getHand(playerId) {
        return this.hands.get(playerId) || [];
    }

    /**
     * Deals cards from a deck to a player's hand
     * @param {string} playerId - Player ID
     * @param {Array} deck - Deck to deal from
     * @param {number} count - Number of cards to deal
     */
    dealToHand(playerId, deck, count) {
        const hand = this.getHand(playerId);
        const cards = this.dealCards(deck, count);

        hand.push(...cards);
    }

    /**
     * Plays a card from a player's hand
     * @param {string} playerId - Player ID
     * @param {string} cardId - Card ID to play
     * @returns {Object|undefined} - The played card or undefined
     */
    playCard(playerId, cardId) {
        const hand = this.getHand(playerId);
        const cardIndex = hand.findIndex(card => card.id === cardId);

        if (cardIndex === -1) {
            return undefined;
        }

        const [card] = hand.splice(cardIndex, 1);
        this.events.emit('card:played', playerId, card);

        return card;
    }

    /**
     * Discards a card from a player's hand
     * @param {string} playerId - Player ID
     * @param {string} cardId - Card ID to discard
     * @returns {Object|undefined} - The discarded card or undefined
     */
    discardCard(playerId, cardId) {
        const hand = this.getHand(playerId);
        const cardIndex = hand.findIndex(card => card.id === cardId);

        if (cardIndex === -1) {
            return undefined;
        }

        const [card] = hand.splice(cardIndex, 1);
        this.events.emit('card:discarded', playerId, card);

        return card;
    }

    /**
     * Clears a player's hand
     * @param {string} playerId - Player ID
     */
    clearHand(playerId) {
        this.hands.set(playerId, []);
    }

    /**
     * Registers a handler for a card effect type
     * @param {string} effectType - Effect type to register
     * @param {Function} handler - Handler function
     */
    registerEffectHandler(effectType, handler) {
        this.effectHandlers.set(effectType, handler);
    }

    /**
     * Applies a card effect
     * @param {Object} card - Card with effect to apply
     * @param {string} target - Target for the effect
     * @param {Object} gameState - Game state object
     * @returns {string} - Result message
     */
    applyCardEffect(card, target, gameState) {
        if (!card.effect || !card.effect.type) {
            throw new Error(`Card ${ card.id } has no effect`);
        }

        const handler = this.effectHandlers.get(card.effect.type);

        if (!handler) {
            throw new Error(`No handler registered for effect type: ${ card.effect.type }`);
        }

        return handler(card, target, gameState);
    }

    /**
     * Serializes a card to string
     * @param {Object} card - Card to serialize
     * @returns {string} - Serialized card
     */
    serializeCard(card) {
        return JSON.stringify(card);
    }

    /**
     * Deserializes a card from string
     * @param {string} serializedCard - Serialized card
     * @returns {Object} - Deserialized card
     */
    deserializeCard(serializedCard) {
        return JSON.parse(serializedCard);
    }

    /**
     * Serializes a hand to string
     * @param {string} playerId - Player ID
     * @returns {string} - Serialized hand
     */
    serializeHand(playerId) {
        const hand = this.getHand(playerId);
        return JSON.stringify(hand);
    }

    /**
     * Deserializes a hand from string
     * @param {string} playerId - Player ID
     * @param {string} serializedHand - Serialized hand
     */
    deserializeHand(playerId, serializedHand) {
        const hand = JSON.parse(serializedHand);
        this.hands.set(playerId, hand);
    }

    /**
     * Serializes a deck to string
     * @param {Array} deck - Deck to serialize
     * @returns {string} - Serialized deck
     */
    serializeDeck(deck) {
        return JSON.stringify(deck);
    }

    /**
     * Deserializes a deck from string
     * @param {string} serializedDeck - Serialized deck
     * @returns {Array} - Deserialized deck
     */
    deserializeDeck(serializedDeck) {
        return JSON.parse(serializedDeck);
    }
}

export default CardManager;