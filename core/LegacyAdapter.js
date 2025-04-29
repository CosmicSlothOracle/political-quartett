/**
 * LegacyAdapter.js - Adapts the original simplified code to work with the framework
 */
import Card from './Card.js';
import Deck from './Deck.js';
import Player from './Player.js';
import GameState from './GameState.js';
import DeckFactory from './DeckFactory.js';

/**
 * Adapter for original Player class
 */
export class LegacyPlayerAdapter {
    /**
     * Create a new legacy player adapter
     * @param {Object} originalPlayer - Original player instance
     */
    constructor(originalPlayer) {
        this.originalPlayer = originalPlayer;
        this.frameworkPlayer = new Player({
            name: originalPlayer.name,
            hand: []
        });

        // Convert original hand to framework cards
        if (originalPlayer.hand && Array.isArray(originalPlayer.hand)) {
            originalPlayer.hand.forEach(card => {
                this.frameworkPlayer.addToHand(this.convertCard(card));
            });
        }
    }

    /**
     * Convert an original card to a framework card
     * @param {Object} originalCard - Original card instance
     * @return {Card} - Framework card instance
     */
    convertCard(originalCard) {
        return new Card({
            name: originalCard.name,
            description: originalCard.quote || '',
            image: originalCard.image || '',
            metadata: { attributes: originalCard.attributes || {} }
        });
    }

    /**
     * Get the top card in the player's hand
     * @return {Card|null} - Top card or null
     */
    topCard() {
        return this.frameworkPlayer.getHand()[0] || null;
    }

    /**
     * Remove the top card from the player's hand
     */
    removeTopCard() {
        this.frameworkPlayer.playCard(0);
    }

    /**
     * Add cards to the player's hand
     * @param {Array} cards - Cards to add
     */
    collectCards(cards) {
        this.frameworkPlayer.addToHand(cards);
    }

    /**
     * Get the framework player instance
     * @return {Player} - Framework player
     */
    getFrameworkPlayer() {
        return this.frameworkPlayer;
    }
}

/**
 * Adapter for original GameState class
 */
export class LegacyGameStateAdapter {
    /**
     * Create a new legacy game state adapter
     * @param {Object} originalGameState - Original game state instance
     */
    constructor(originalGameState) {
        // Convert players
        this.playerAdapters = originalGameState.players.map(p => new LegacyPlayerAdapter(p));
        this.frameworkPlayers = this.playerAdapters.map(adapter => adapter.getFrameworkPlayer());

        // Create a deck (though original game state doesn't have one)
        this.deck = new Deck({ name: 'Adapted Deck' });

        // Create framework game state
        this.frameworkGameState = new GameState(
            this.frameworkPlayers,
            this.deck,
            false
        );

        // Copy tie pile
        if (originalGameState.tiePile && Array.isArray(originalGameState.tiePile)) {
            originalGameState.tiePile.forEach(card => {
                this.frameworkGameState.addToTiePile([this.convertCard(card)]);
            });
        }

        // Set current player index
        this.frameworkGameState.currentTurn = originalGameState.currentPlayerIndex || 0;
    }

    /**
     * Convert an original card to a framework card
     * @param {Object} originalCard - Original card instance
     * @return {Card} - Framework card instance
     */
    convertCard(originalCard) {
        return new Card({
            name: originalCard.name,
            description: originalCard.quote || '',
            image: originalCard.image || '',
            metadata: { attributes: originalCard.attributes || {} }
        });
    }

    /**
     * Get the current player
     * @return {Player} - Current player
     */
    getCurrentPlayer() {
        return this.frameworkGameState.getCurrentPlayer();
    }

    /**
     * Get the opponent player
     * @return {Player} - Opponent player
     */
    getOpponent() {
        return this.frameworkGameState.getOpponentPlayer();
    }

    /**
     * Move to the next turn
     */
    nextTurn() {
        this.frameworkGameState.nextTurn();
    }

    /**
     * Check if the game is over
     * @return {boolean} - True if game is over
     */
    isGameOver() {
        return this.frameworkGameState.checkWinCondition();
    }

    /**
     * Get the winner of the game
     * @return {Player|null} - Winning player or null
     */
    getWinner() {
        return this.frameworkGameState.winner;
    }

    /**
     * Get the framework game state
     * @return {GameState} - Framework game state
     */
    getFrameworkGameState() {
        return this.frameworkGameState;
    }
}

/**
 * Adapter for original TurnManager class
 */
export class LegacyTurnManagerAdapter {
    /**
     * Create a new legacy turn manager adapter
     * @param {Object} originalTurnManager - Original turn manager instance
     */
    constructor(originalTurnManager) {
        this.originalTurnManager = originalTurnManager;
        this.gameStateAdapter = new LegacyGameStateAdapter(originalTurnManager.gameState);
    }

    /**
     * Play a turn with the selected attribute
     * @param {string} attribute - Attribute to compare
     * @return {Object} - Turn result
     */
    playTurn(attribute) {
        // Get players
        const player = this.gameStateAdapter.getCurrentPlayer();
        const opponent = this.gameStateAdapter.getOpponent();

        // Get top cards
        const playerCard = player.getHand()[0];
        const opponentCard = opponent.getHand()[0];

        if (!playerCard || !opponentCard) {
            return { error: "Cannot play turn - player has no cards" };
        }

        // Create result object
        const result = {
            playerCard: {
                name: playerCard.name,
                image: playerCard.image
            },
            opponentCard: {
                name: opponentCard.name,
                image: opponentCard.image
            },
            attribute: attribute,
            playerValue: this.getCardAttributeValue(playerCard, attribute),
            opponentValue: this.getCardAttributeValue(opponentCard, attribute),
            tie: false,
            winner: null
        };

        // Original method call
        this.originalTurnManager.playTurn(attribute);

        // Update result based on what happened in original method
        if (this.gameStateAdapter.frameworkGameState.tiePile.length > 0) {
            result.tie = true;
        } else if (player.getCardCount() > opponent.getCardCount()) {
            result.winner = player.name;
        } else {
            result.winner = opponent.name;
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
}