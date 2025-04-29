/**
 * Server update to add validation to server.js
 *
 * This code shows how to integrate the validation into the existing server.js file.
 * You should copy the relevant parts into server.js.
 */
import { validateMove, processMove, createGameState, validateJoinGame, addPlayerToGame } from './server-validation.js';

// Example of how to modify the socket.on handler for 'select_category'
socket.on('select_category', (data) => {
    const { gameId, category } = data;
    const playerId = socket.id;

    if (!gameId || !category) {
        socket.emit('error', { message: 'Invalid request', critical: false });
        return;
    }

    // Get game state
    const gameData = games.get(gameId);
    if (!gameData) {
        socket.emit('error', { message: 'Game not found', critical: false });
        return;
    }

    // Create move object
    const move = {
        type: 'select_category',
        category
    };

    // Validate the move
    const validation = validateMove(gameData, playerId, move);
    if (!validation.valid) {
        socket.emit('error', { message: validation.reason, critical: false });
        return;
    }

    // Process the move
    const { gameState, roundResult, error } = processMove(gameData, playerId, move);

    if (error) {
        socket.emit('error', { message: error, critical: false });
        return;
    }

    // Update game state
    games.set(gameId, gameState);

    // Send result to both players
    io.to(gameId).emit('game_state', { gameState: gameState });

    // Send opponent move to the other player
    const opponentId = gameState.players.find(id => id !== playerId);
    if (opponentId) {
        io.to(opponentId).emit('opponent_move', {
            moveType: 'category_selection',
            category,
            playerId
        });
    }

    // Send round result to both players
    io.to(gameId).emit('round_result', roundResult);

    // If game is over, handle that
    if (gameState.gameOver) {
        handleGameOver(gameState);
    }
});

// Example of how to modify the game creation
socket.on('create_game', () => {
    // Generate a game ID
    const gameId = uuidv4();

    // Generate an invite code
    const inviteCode = generateInviteCode();

    // Create initial game state with one player
    const gameState = createGameState([socket.id], []);
    gameState.state = 'waiting'; // Set to waiting for second player

    // Store game data
    games.set(gameId, gameState);

    // Update player data
    const playerData = players.get(socket.id);
    if (playerData) {
        playerData.gameId = gameId;
        players.set(socket.id, playerData);
    }

    // Join the socket to the game room
    socket.join(gameId);

    // Notify player of game creation
    socket.emit('game_created', {
        gameId,
        inviteCode
    });
});

// Example of how to modify the join game handler
socket.on('join_game', (data) => {
    const { gameId } = data;
    const playerId = socket.id;

    if (!gameId) {
        socket.emit('error', { message: 'Invalid game ID', critical: false });
        return;
    }

    // Get game state
    const gameData = games.get(gameId);

    // Validate join request
    const validation = validateJoinGame(gameData, playerId);
    if (!validation.valid) {
        socket.emit('error', { message: validation.reason, critical: false });
        return;
    }

    // Add player to game
    const updatedGameState = addPlayerToGame(gameData, playerId);

    // Update game data
    games.set(gameId, updatedGameState);

    // Update player data
    const playerData = players.get(socket.id);
    if (playerData) {
        playerData.gameId = gameId;
        players.set(socket.id, playerData);
    }

    // Join the socket to the game room
    socket.join(gameId);

    // Notify players of join
    io.to(gameId).emit('player_joined', {
        gameId,
        playerId
    });

    // If game is now ready to start, initialize it
    if (updatedGameState.state === 'in_progress') {
        // Deal cards if needed (use the actual card data)
        if (!updatedGameState.playerCards.length) {
            const updatedWithCards = createGameState(updatedGameState.players, CARD_DATA);
            games.set(gameId, updatedWithCards);

            // Notify players of game start
            io.to(gameId).emit('game_started', {
                gameId,
                gameState: updatedWithCards
            });
        } else {
            // Just notify of game start with existing game state
            io.to(gameId).emit('game_started', {
                gameId,
                gameState: updatedGameState
            });
        }
    }
});

/**
 * Handle game over
 * @param {Object} gameState - Game state
 */
function handleGameOver(gameState) {
    // Notify players of game over
    io.to(gameState.id).emit('game_over', {
        gameId: gameState.id,
        winner: gameState.winner
    });

    // Update player records if needed

    // Save game data if needed

    // Remove game after some time
    setTimeout(() => {
        games.delete(gameState.id);
    }, 300000); // 5 minutes
}