/**
 * ServerValidator.js - Enforces game rules on the server-side
 *
 * This ensures that clients cannot cheat by validating all moves
 * before they are applied to the game state.
 */
class ServerValidator {
    /**
     * Validate a player's move
     * @param {Object} gameState - Current game state
     * @param {String} playerId - ID of the player making the move
     * @param {Object} move - The move to validate
     * @returns {Object} - Validation result {valid: boolean, reason: string}
     */
    static validateMove(gameState, playerId, move) {
        // Check if game exists
        if (!gameState) {
            return { valid: false, reason: 'Game does not exist' };
        }

        // Check if game is in progress
        if (gameState.state !== 'in_progress') {
            return { valid: false, reason: 'Game is not in progress' };
        }

        // Check if player is in the game
        if (!gameState.players.includes(playerId)) {
            return { valid: false, reason: 'Player is not in this game' };
        }

        // Check if it's the player's turn
        const playerIndex = gameState.players.indexOf(playerId);
        if (gameState.currentPlayerIndex !== playerIndex) {
            return { valid: false, reason: 'Not your turn' };
        }

        // Validate the specific move type
        switch (move.type) {
            case 'category_selection':
                return this.validateCategorySelection(gameState, playerId, move);
            default:
                return { valid: false, reason: 'Unknown move type' };
        }
    }

    /**
     * Validate a category selection move
     * @param {Object} gameState - Current game state
     * @param {String} playerId - ID of the player making the move
     * @param {Object} move - The move to validate
     * @returns {Object} - Validation result {valid: boolean, reason: string}
     */
    static validateCategorySelection(gameState, playerId, move) {
        // Check if category is provided
        if (!move.category) {
            return { valid: false, reason: 'No category selected' };
        }

        // Check if player has cards
        const playerIndex = gameState.players.indexOf(playerId);
        const playerHand = gameState.playerHands[playerIndex];
        if (!playerHand || playerHand.length === 0) {
            return { valid: false, reason: 'Player has no cards' };
        }

        // Check if category exists on the player's top card
        const topCard = playerHand[0];
        if (!topCard || !topCard.stats || topCard.stats[move.category] === undefined) {
            return { valid: false, reason: 'Invalid category' };
        }

        return { valid: true };
    }

    /**
     * Validate game state consistency
     * @param {Object} gameState - Game state to validate
     * @returns {Object} - Validation result {valid: boolean, issues: Array}
     */
    static validateGameState(gameState) {
        const issues = [];

        // Check if game state exists
        if (!gameState) {
            return { valid: false, issues: ['Game state is null or undefined'] };
        }

        // Check players and hands consistency
        if (!gameState.players || !Array.isArray(gameState.players)) {
            issues.push('Players array is missing or invalid');
        } else if (!gameState.playerHands || !Array.isArray(gameState.playerHands)) {
            issues.push('Player hands are missing or invalid');
        } else if (gameState.players.length !== gameState.playerHands.length) {
            issues.push('Number of players does not match number of hands');
        }

        // Check current player index is valid
        if (gameState.currentPlayerIndex === undefined ||
            gameState.currentPlayerIndex < 0 ||
            (gameState.players && gameState.currentPlayerIndex >= gameState.players.length)) {
            issues.push('Current player index is invalid');
        }

        // Check that all cards have the required properties
        if (gameState.playerHands) {
            for (let i = 0; i < gameState.playerHands.length; i++) {
                const hand = gameState.playerHands[i];
                if (hand && Array.isArray(hand)) {
                    for (let j = 0; j < hand.length; j++) {
                        const card = hand[j];
                        if (!card || !card.stats) {
                            issues.push(`Card at index ${ j } in player ${ i }'s hand is invalid`);
                        }
                    }
                }
            }
        }

        return { valid: issues.length === 0, issues };
    }

    /**
     * Process a player move and update game state
     * @param {Object} gameState - Current game state
     * @param {String} playerId - ID of the player making the move
     * @param {Object} move - The validated move to process
     * @returns {Object} - Updated game state
     */
    static processMove(gameState, playerId, move) {
        // First, validate the move again to be sure
        const validation = this.validateMove(gameState, playerId, move);
        if (!validation.valid) {
            return gameState;
        }

        const newState = { ...gameState };

        switch (move.type) {
            case 'category_selection':
                return this.processCategorySelection(newState, playerId, move);
            default:
                return newState;
        }
    }

    /**
     * Process a category selection move
     * @param {Object} gameState - Current game state
     * @param {String} playerId - ID of the player making the move
     * @param {Object} move - The move to process
     * @returns {Object} - Updated game state
     */
    static processCategorySelection(gameState, playerId, move) {
        // Set the selected category
        gameState.selectedCategory = move.category;
        gameState.lastMoveBy = playerId;

        // Now play the round with this category
        return this.playRound(gameState);
    }

    /**
     * Play a round with the selected category
     * @param {Object} gameState - Current game state
     * @returns {Object} - Updated game state with round results
     */
    static playRound(gameState) {
        const category = gameState.selectedCategory;
        if (!category) return gameState;

        // Get cards from both players
        const player1Hand = gameState.playerHands[0];
        const player2Hand = gameState.playerHands[1];

        // Check if both players have cards
        if (!player1Hand.length || !player2Hand.length) {
            gameState.gameOver = true;
            gameState.winner = player1Hand.length ? 0 : 1;
            gameState.state = 'completed';
            return gameState;
        }

        // Get top cards
        const player1Card = player1Hand.shift();
        const player2Card = player2Hand.shift();

        // Compare values
        const player1Value = player1Card.stats[category];
        const player2Value = player2Card.stats[category];

        let result;

        // Determine winner
        if (player1Value > player2Value) {
            // Player 1 wins
            result = 'player1';
            player1Hand.push(player1Card, player2Card, ...gameState.tiePile);
            gameState.tiePile = [];
            gameState.currentPlayerIndex = 0;
        } else if (player2Value > player1Value) {
            // Player 2 wins
            result = 'player2';
            player2Hand.push(player1Card, player2Card, ...gameState.tiePile);
            gameState.tiePile = [];
            gameState.currentPlayerIndex = 1;
        } else {
            // Tie
            result = 'tie';
            gameState.tiePile.push(player1Card, player2Card);
            // Current player stays the same
        }

        // Store round result
        gameState.lastRoundResult = {
            category,
            player1Card,
            player2Card,
            player1Value,
            player2Value,
            result,
            player1CardCount: player1Hand.length,
            player2CardCount: player2Hand.length,
            tieCardCount: gameState.tiePile.length,
            nextPlayerIndex: gameState.currentPlayerIndex
        };

        // Check for game over
        if (player1Hand.length === 0) {
            gameState.gameOver = true;
            gameState.winner = 1;
            gameState.state = 'completed';
        } else if (player2Hand.length === 0) {
            gameState.gameOver = true;
            gameState.winner = 0;
            gameState.state = 'completed';
        }

        return gameState;
    }
}

export default ServerValidator;