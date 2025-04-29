/**
 * DeckFactory.js - Utilities for creating different types of card decks
 */
import Card from './Card.js';
import Deck from './Deck.js';

export default class DeckFactory {
    /**
     * Generate a standard 52-card deck
     * @param {Object} options - Customization options
     * @return {Deck} - New deck instance with standard cards
     */
    static createStandardDeck(options = {}) {
        const suits = options.suits || ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = options.ranks || ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const values = options.values || {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        const deck = new Deck({
            id: options.id || `standard-deck-${ Date.now() }`,
            name: options.name || 'Standard Deck',
            metadata: options.metadata || { type: 'standard' }
        });

        const cards = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                const card = new Card({
                    type: 'standard',
                    suit: suit,
                    rank: rank,
                    value: values[rank],
                    image: options.cardImages ? options.cardImages[`${ rank }_${ suit }`] : '',
                    faceUp: false
                });
                cards.push(card);
            }
        }

        deck.addCards(cards);

        if (options.includeJokers) {
            const jokerCount = options.jokerCount || 2;
            const jokers = [];
            for (let i = 0; i < jokerCount; i++) {
                const joker = new Card({
                    type: 'joker',
                    suit: 'Joker',
                    rank: 'Joker',
                    value: options.jokerValue || 15,
                    name: i === 0 ? 'Red Joker' : 'Black Joker',
                    image: options.cardImages ? options.cardImages[`joker_${ i }`] : '',
                    faceUp: false
                });
                jokers.push(joker);
            }
            deck.addCards(jokers);
        }

        if (options.shuffleOnCreate) {
            deck.shuffle();
        }

        return deck;
    }

    /**
     * Create a pinochle deck (48 cards)
     * @param {Object} options - Customization options
     * @return {Deck} - New deck instance with pinochle cards
     */
    static createPinochleDeck(options = {}) {
        const suits = options.suits || ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = options.ranks || ['9', '10', 'J', 'Q', 'K', 'A'];
        const values = options.values || {
            '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        const deck = new Deck({
            id: options.id || `pinochle-deck-${ Date.now() }`,
            name: options.name || 'Pinochle Deck',
            metadata: options.metadata || { type: 'pinochle' }
        });

        // Add two of each card
        const cards = [];
        for (let i = 0; i < 2; i++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    const card = new Card({
                        type: 'pinochle',
                        suit: suit,
                        rank: rank,
                        value: values[rank],
                        image: options.cardImages ? options.cardImages[`${ rank }_${ suit }`] : '',
                        faceUp: false
                    });
                    cards.push(card);
                }
            }
        }

        deck.addCards(cards);

        if (options.shuffleOnCreate) {
            deck.shuffle();
        }

        return deck;
    }

    /**
     * Create a euchre deck (24 cards)
     * @param {Object} options - Customization options
     * @return {Deck} - New deck instance with euchre cards
     */
    static createEuchreDeck(options = {}) {
        const suits = options.suits || ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = options.ranks || ['9', '10', 'J', 'Q', 'K', 'A'];
        const values = options.values || {
            '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        const deck = new Deck({
            id: options.id || `euchre-deck-${ Date.now() }`,
            name: options.name || 'Euchre Deck',
            metadata: options.metadata || { type: 'euchre' }
        });

        const cards = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                const card = new Card({
                    type: 'euchre',
                    suit: suit,
                    rank: rank,
                    value: values[rank],
                    image: options.cardImages ? options.cardImages[`${ rank }_${ suit }`] : '',
                    faceUp: false
                });
                cards.push(card);
            }
        }

        deck.addCards(cards);

        if (options.shuffleOnCreate) {
            deck.shuffle();
        }

        return deck;
    }

    /**
     * Create a custom deck with specified cards
     * @param {Object} options - Deck configuration
     * @param {Array} cards - Array of card configs to add
     * @return {Deck} - New custom deck
     */
    static createCustomDeck(options = {}, cards = []) {
        const deck = new Deck({
            id: options.id || `custom-deck-${ Date.now() }`,
            name: options.name || 'Custom Deck',
            metadata: options.metadata || { type: 'custom' }
        });

        const cardObjects = [];
        for (const cardConfig of cards) {
            cardObjects.push(new Card(cardConfig));
        }

        deck.addCards(cardObjects);

        if (options.shuffleOnCreate) {
            deck.shuffle();
        }

        return deck;
    }
}