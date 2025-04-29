/**
 * GameRules.js - Handles game rules and card comparison logic
 */
export default class GameRules {
    /**
     * Create a new game rules instance
     * @param {Object} options - Game rule options
     */
    constructor(options = {}) {
        this.options = {
            tieBreaker: 'retry', // 'retry' or 'random'
            maxRounds: options.maxRounds || 50,
            winCondition: options.winCondition || 'allCards', // 'allCards', 'mostCards', 'points'
            initialHandSize: options.initialHandSize || 15,
            ...options
        };
    }

    /**
     * Check if a category's ranking is higher-is-better or lower-is-better
     * @param {string} category - The category to check
     * @return {boolean} True if higher is better, false if lower is better
     */
    isHigherBetter(category) {
        // Categories where higher values are better
        const higherBetterCategories = [
            'wähleranteil', 'sitze', 'parteimitglieder', 'regierungsbeteiligungen',
            'regierteBundesländer', 'anzahlSozialeMedien'
        ];

        // Categories where lower values are better
        const lowerBetterCategories = [
            'alter', 'skandale', 'gründungsjahr'
        ];

        return !lowerBetterCategories.includes(category.toLowerCase());
    }

    /**
     * Compare cards based on a specific category
     * @param {Object} card1 - First card
     * @param {Object} card2 - Second card
     * @param {string} category - Category to compare
     * @return {number} 1 if card1 wins, -1 if card2 wins, 0 if tie
     */
    compareCards(card1, card2, category) {
        if (!card1 || !card2) {
            return card1 ? 1 : card2 ? -1 : 0;
        }

        if (!card1.data || !card2.data) {
            console.error('Invalid card data for comparison', card1, card2);
            return 0;
        }

        const value1 = parseFloat(card1.data[category]);
        const value2 = parseFloat(card2.data[category]);

        // Handle when values are not numbers
        if (isNaN(value1) || isNaN(value2)) {
            if (isNaN(value1) && isNaN(value2)) return 0;
            if (isNaN(value1)) return -1;
            if (isNaN(value2)) return 1;
        }

        // Handle missing values
        if (value1 === undefined && value2 === undefined) return 0;
        if (value1 === undefined) return -1;
        if (value2 === undefined) return 1;

        // Compare values based on whether higher is better
        const higherIsBetter = this.isHigherBetter(category);

        if (value1 === value2) return 0;
        if (higherIsBetter) {
            return value1 > value2 ? 1 : -1;
        } else {
            return value1 < value2 ? 1 : -1;
        }
    }

    /**
     * Handle a tie between cards
     * @param {Object} gameState - Current game state
     * @param {Array} cards - Tied cards
     * @return {Object} Object containing next action and winner if determined
     */
    handleTie(gameState, cards) {
        if (this.options.tieBreaker === 'random') {
            const randomWinner = Math.floor(Math.random() * gameState.players.length);
            return {
                action: 'giveCardsToPlayer',
                winner: gameState.players[randomWinner]
            };
        } else {
            // Default: Add cards to tie pile and continue
            gameState.addToTiePile(cards);
            return {
                action: 'nextRound',
                winner: null
            };
        }
    }

    /**
     * Check if game should end (e.g., max rounds reached)
     * @param {Object} gameState - Current game state
     * @return {boolean} True if game should end, false otherwise
     */
    shouldEndGame(gameState) {
        // Check for round limit
        if (this.options.maxRounds && gameState.roundsPlayed >= this.options.maxRounds) {
            // Determine winner by most cards if round limit is reached
            const playerWithMostCards = gameState.players.reduce((prev, current) => {
                return prev.hand.length > current.hand.length ? prev : current;
            });
            gameState.winner = playerWithMostCards;
            return true;
        }

        // Check if any player has all cards
        return gameState.checkWinCondition();
    }

    /**
     * Determine available categories for selection
     * @param {Object} card - Card to get categories from
     * @return {Array} Array of available categories
     */
    getAvailableCategories(card) {
        if (!card || !card.data) return [];

        // Filter out categories that shouldn't be compared
        const excludedFields = ['id', 'name', 'partei', 'farbe', 'image', 'logo'];
        return Object.keys(card.data).filter(key => !excludedFields.includes(key));
    }
}