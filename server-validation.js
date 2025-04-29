/**
 * Server-side validation utilities for Political Quartett game
 */

/**
 * Validate a player's move
 * @param {Object} game - Game object containing state
 * @param {String} playerId - Player's ID
 * @param {Object} move - Move data
 * @returns {Object} - Validation result {valid: Boolean, reason: String}
 */
export function validateMove(game, playerId, move) {
    // Check if game exists
    if (!game) {
        return { valid: false, reason: 'Game does not exist' };
    }

    // Check if game is active
    if (game.state !== 'in_progress') {
        return { valid: false, reason: 'Game is not in progress' };
    }

    // Check if player is in the game
    if (!game.players.includes(playerId)) {
        return { valid: false, reason: 'Player is not in this game' };
    }

    // Check if it's the player's turn
    const playerIndex = game.players.indexOf(playerId);
    const currentPlayer = game.currentPlayer;

    if (playerIndex !== currentPlayer) {
        return { valid: false, reason: 'Not your turn' };
    }

    // Validate specific move type
    switch (move.type) {
        case 'select_category':
            return validateCategorySelection(game, playerId, move);
        default:
            return { valid: false, reason: 'Unknown move type' };
    }
}

/**
 * Validate a category selection move
 * @param {Object} game - Game object containing state
 * @param {String} playerId - Player's ID
 * @param {Object} move - Move data
 * @returns {Object} - Validation result {valid: Boolean, reason: String}
 */
function validateCategorySelection(game, playerId, move) {
    // Check if category is provided
    if (!move.category) {
        return { valid: false, reason: 'No category selected' };
    }

    // Get player's hand
    const playerIndex = game.players.indexOf(playerId);
    const playerHand = playerIndex === 0 ? game.playerCards : game.opponentCards;

    // Check if player has cards
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
 * Process a validated move and update game state
 * @param {Object} game - Game object containing state
 * @param {String} playerId - Player's ID
 * @param {Object} move - Move data
 * @returns {Object} - Updated game state and round results
 */
export function processMove(game, playerId, move) {
    // Validate move again to be sure
    const validation = validateMove(game, playerId, move);
    if (!validation.valid) {
        return {
            gameState: game,
            error: validation.reason
        };
    }

    // Clone game state to avoid mutations
    const gameState = JSON.parse(JSON.stringify(game));

    switch (move.type) {
        case 'select_category':
            return processCategorySelection(gameState, playerId, move);
        default:
            return {
                gameState,
                error: 'Unknown move type'
            };
    }
}

/**
 * Process a category selection move
 * @param {Object} game - Game object containing state
 * @param {String} playerId - Player's ID
 * @param {Object} move - Move data
 * @returns {Object} - Updated game state and round results
 */
function processCategorySelection(game, playerId, move) {
    // Set the selected category
    game.currentCategory = move.category;

    // Play the round and get results
    const roundResult = playRound(game, move.category);

    return {
        gameState: game,
        roundResult
    };
}

/**
 * Play a round with the selected category
 * @param {Object} game - Game object containing state
 * @param {String} category - Selected category
 * @returns {Object} - Round results
 */
function playRound(game, category) {
    // Make sure both players have cards
    if (game.playerCards.length === 0 || game.opponentCards.length === 0) {
        game.gameOver = true;
        game.winner = game.playerCards.length > 0 ? 'player' : 'opponent';

        return {
            result: game.winner,
            playerCard: null,
            opponentCard: null,
            playerValue: 0,
            opponentValue: 0,
            category: category,
            nextTurn: game.currentPlayer === 0 ? 'player' : 'opponent',
            playerCardCount: game.playerCards.length,
            opponentCardCount: game.opponentCards.length,
            gameOver: true,
            winner: game.winner
        };
    }

    // Get top cards from each player
    const playerCard = game.playerCards[0];
    const opponentCard = game.opponentCards[0];

    // Remove cards from hands
    game.playerCards.shift();
    game.opponentCards.shift();

    // Get values for comparison
    const playerValue = playerCard.stats[category];
    const opponentValue = opponentCard.stats[category];

    let result;

    // Determine winner
    if (playerValue > opponentValue) {
        result = 'player';
        // Player wins the round
        game.playerCards.push(playerCard, opponentCard, ...game.tieCards);
        game.tieCards = [];
        game.currentPlayer = 0; // Player's turn
    } else if (opponentValue > playerValue) {
        result = 'opponent';
        // Opponent wins the round
        game.opponentCards.push(playerCard, opponentCard, ...game.tieCards);
        game.tieCards = [];
        game.currentPlayer = 1; // Opponent's turn
    } else {
        result = 'tie';
        // It's a tie
        game.tieCards.push(playerCard, opponentCard);
        // Current player stays the same
    }

    // Check for game over
    if (game.playerCards.length === 0) {
        game.gameOver = true;
        game.winner = 'opponent';
    } else if (game.opponentCards.length === 0) {
        game.gameOver = true;
        game.winner = 'player';
    }

    // Return round results
    return {
        result,
        playerCard,
        opponentCard,
        playerValue,
        opponentValue,
        category,
        nextTurn: game.currentPlayer === 0 ? 'player' : 'opponent',
        playerCardCount: game.playerCards.length,
        opponentCardCount: game.opponentCards.length,
        gameOver: game.gameOver,
        winner: game.winner
    };
}

/**
 * Create a new game state
 * @param {Array} players - Player IDs
 * @param {Array} cards - Card data
 * @returns {Object} - Initial game state
 */
export function createGameState(players, cards) {
    // Shuffle deck
    const shuffledDeck = shuffleDeck([...cards]);

    // Calculate cards per player
    const cardsPerPlayer = Math.floor(shuffledDeck.length / 2);

    // Deal cards
    const playerCards = shuffledDeck.slice(0, cardsPerPlayer);
    const opponentCards = shuffledDeck.slice(cardsPerPlayer, cardsPerPlayer * 2);

    // Determine starting player randomly
    const startingPlayer = Math.random() >= 0.5 ? 0 : 1;

    return {
        id: generateGameId(),
        players,
        playerCards,
        opponentCards,
        tieCards: [],
        currentPlayer: startingPlayer,
        currentCategory: null,
        gameOver: false,
        winner: null,
        state: 'in_progress',
        createdAt: Date.now(),
        lastActionAt: Date.now()
    };
}

/**
 * Shuffle a deck of cards
 * @param {Array} deck - Deck to shuffle
 * @returns {Array} - Shuffled deck
 */
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate a unique game ID
 * @returns {String} - Game ID
 */
function generateGameId() {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Validate a join game request
 * @param {Object} game - Game object
 * @param {String} playerId - Player's ID
 * @returns {Object} - Validation result {valid: Boolean, reason: String}
 */
export function validateJoinGame(game, playerId) {
    // Check if game exists
    if (!game) {
        return { valid: false, reason: 'Game does not exist' };
    }

    // Check if game is joinable
    if (game.state !== 'waiting') {
        return { valid: false, reason: 'Game is not open for joining' };
    }

    // Check if player is already in the game
    if (game.players.includes(playerId)) {
        return { valid: true }; // Already joined, so valid
    }

    // Check if game is full
    if (game.players.length >= 2) {
        return { valid: false, reason: 'Game is full' };
    }

    return { valid: true };
}

/**
 * Add a player to a game
 * @param {Object} game - Game object
 * @param {String} playerId - Player's ID
 * @returns {Object} - Updated game state
 */
export function addPlayerToGame(game, playerId) {
    // Clone game state
    const gameState = JSON.parse(JSON.stringify(game));

    // Check if player is already in the game
    if (gameState.players.includes(playerId)) {
        return gameState;
    }

    // Add player to the game
    gameState.players.push(playerId);

    // Update game state if we now have 2 players
    if (gameState.players.length === 2) {
        gameState.state = 'in_progress';
    }

    return gameState;
}