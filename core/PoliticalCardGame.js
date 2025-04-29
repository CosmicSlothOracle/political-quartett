/**
 * PoliticalCardGame.js - Specialized implementation for political card games
 */
import Card from './Card.js';
import Deck from './Deck.js';
import DeckFactory from './DeckFactory.js';
import Player from './Player.js';
import GameState from './GameState.js';
import GameRules from './GameRules.js';
import cardData from '../game_information_for_ai/cardData.js';

export default class PoliticalCardGame {
    /**
     * Create a new political card game
     * @param {Object} config - Game configuration
     */
    constructor(config = {}) {
        this.players = [];
        this.deck = null;
        this.gameState = null;
        this.gameRules = null;
        this.turnManager = new TurnManager(this);
        this.config = {
            initialHandSize: config.initialHandSize || -1, // -1 means split deck evenly
            winCondition: config.winCondition || 'allCards',
            selectedAttributes: config.selectedAttributes || [],
            ...config
        };
    }

    /**
     * Initialize the game with players and cards
     * @param {Array} playerNames - Array of player names
     * @param {Array} politicalCards - Array of political card data
     * @return {PoliticalCardGame} - This game instance for chaining
     */
    init(playerNames, politicalCards) {
        // Create deck from political cards
        this.deck = this.createPoliticalDeck(politicalCards);

        // Create players
        this.players = playerNames.map(name => new Player({ name }));

        // Deal cards to players
        this.dealCardsToPlayers();

        // Initialize game rules
        this.gameRules = new GameRules({
            winCondition: this.config.winCondition,
            availableAttributes: this.getAvailableAttributes()
        });

        // Set up game state
        this.gameState = new GameState(this.players, this.deck);

        // Initialize turn manager
        this.turnManager = new TurnManager(this.gameState);

        return this;
    }

    /**
     * Create a deck from political card data
     * @param {Array} cardData - Political card data
     * @return {Deck} - New deck with political cards
     */
    createPoliticalDeck(cardData) {
        return DeckFactory.createCustomDeck(
            { name: "Political Deck", shuffleOnCreate: true },
            cardData.map(data => ({
                type: 'political',
                name: data.name,
                description: data.quote || '',
                image: data.image || '',
                metadata: {
                    attributes: data.attributes || {}
                }
            }))
        );
    }

    /**
     * Deal cards to all players
     */
    dealCardsToPlayers() {
        if (this.config.initialHandSize === -1) {
            // Split deck evenly
            const hands = this.deck.deal(this.players.length,
                Math.floor(this.deck.getCardCount() / this.players.length),
                true);

            // Assign hands to players
            hands.forEach((hand, index) => {
                this.players[index].addToHand(hand);
            });
        } else {
            // Deal specified number of cards
            const hands = this.deck.deal(
                this.players.length,
                this.config.initialHandSize,
                true
            );

            // Assign hands to players
            hands.forEach((hand, index) => {
                this.players[index].addToHand(hand);
            });
        }
    }

    /**
     * Get all available attributes for cards
     * @return {Array} - Available attributes
     */
    getAvailableAttributes() {
        if (this.config.selectedAttributes.length > 0) {
            return this.config.selectedAttributes;
        }

        // Use the first player's top card to extract attributes
        if (this.players.length > 0 && this.players[0].hasCards()) {
            const firstCard = this.players[0].getHand()[0];

            if (firstCard && firstCard.metadata && firstCard.metadata.attributes) {
                return Object.keys(firstCard.metadata.attributes);
            }
        }

        // Fallback: if no player cards available, check the deck
        const card = this.deck.peek();
        if (card && card.metadata && card.metadata.attributes) {
            return Object.keys(card.metadata.attributes);
        }

        // If we still can't find attributes, provide default political attributes
        return ['leadership', 'diplomacy', 'popularity', 'experience', 'charisma'];
    }

    /**
     * Play a turn with the selected attribute
     * @param {string} attribute - Attribute to compare
     * @return {Object} - Turn result
     */
    playTurn(attribute) {
        return this.turnManager.playTurn(attribute);
    }

    /**
     * Check if the game is over
     * @return {boolean} - True if game is over
     */
    isGameOver() {
        return this.gameState.checkWinCondition();
    }

    /**
     * Get the winning player
     * @return {Player|null} - Winning player or null if no winner
     */
    getWinner() {
        return this.gameState.winner;
    }

    /**
     * Get game state for UI
     * @return {Object} - Game state for UI
     */
    getStateForUI() {
        return {
            players: this.players.map(p => ({
                name: p.name,
                cardCount: p.getCardCount(),
                topCard: p.hasCards() ? this.formatCardForUI(p.getHand()[0]) : null
            })),
            currentPlayer: this.gameState.getCurrentPlayer().name,
            opponent: this.gameState.getOpponentPlayer().name,
            tiePileCount: this.gameState.tiePile.length,
            isGameOver: this.isGameOver(),
            winner: this.isGameOver() ? this.getWinner().name : null,
            availableAttributes: this.getAvailableAttributes()
        };
    }

    /**
     * Format a card for UI display
     * @param {Card} card - Card to format
     * @return {Object} - Formatted card
     */
    formatCardForUI(card) {
        if (!card) return null;

        return {
            name: card.name,
            description: card.description,
            image: card.image,
            attributes: card.metadata.attributes || {}
        };
    }
}

/**
 * TurnManager - Manages game turns and card comparisons
 */
class TurnManager {
    /**
     * Create a new turn manager
     * @param {GameState} gameState - Game state to manage
     */
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Play a turn with the selected attribute
     * @param {string} attribute - Attribute to compare
     * @return {Object} - Turn result
     */
    playTurn(attribute) {
        const player = this.gameState.getCurrentPlayer();
        const opponent = this.gameState.getOpponentPlayer();

        if (!player.hasCards() || !opponent.hasCards()) {
            return { error: "Cannot play turn - player has no cards" };
        }

        // Get top cards
        const playerCard = player.playCard(0);
        const opponentCard = opponent.playCard(0);

        // Cards in play (including any cards in the tie pile)
        const cardsInPlay = [playerCard, opponentCard, ...this.gameState.tiePile];

        // Compare cards
        const playerValue = this.getCardAttributeValue(playerCard, attribute);
        const opponentValue = this.getCardAttributeValue(opponentCard, attribute);

        let result = {
            playerCard: this.formatCardForResult(playerCard),
            opponentCard: this.formatCardForResult(opponentCard),
            attribute: attribute,
            playerValue: playerValue,
            opponentValue: opponentValue,
            cardsInPlay: cardsInPlay.length,
            tie: false,
            winner: null
        };

        // Determine winner
        if (playerValue > opponentValue) {
            // Player wins
            player.addToHand(cardsInPlay);
            this.gameState.clearTiePile();
            result.winner = player.name;
        } else if (opponentValue > playerValue) {
            // Opponent wins
            opponent.addToHand(cardsInPlay);
            this.gameState.clearTiePile();
            result.winner = opponent.name;
        } else {
            // Tie - add cards to tie pile
            this.gameState.addToTiePile(cardsInPlay);
            result.tie = true;
        }

        // Advance to next turn if not a tie
        if (!result.tie) {
            this.gameState.nextTurn();
        }

        return result;
    }

    /**
     * Get attribute value from a card
     * @param {Card} card - Card to get value from
     * @param {string} attribute - Attribute to get
     * @return {number} - Attribute value
     */
    getCardAttributeValue(card, attribute) {
        if (!card || !card.metadata || !card.metadata.attributes) return 0;
        return card.metadata.attributes[attribute] || 0;
    }

    /**
     * Format card for result output
     * @param {Card} card - Card to format
     * @return {Object} - Formatted card
     */
    formatCardForResult(card) {
        return {
            name: card.name,
            image: card.image
        };
    }
}