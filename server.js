const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import game logic from client-side
const { Game } = require('./js/game');
const { CARD_DATA } = require('./js/card-data');

// Setup express app
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '/')));

// Create HTTP server
const server = http.createServer(app);

// Create socket.io server
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Game state storage
const games = new Map();
const players = new Map();
const waitingPlayers = [];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Socket.io handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${ socket.id }`);

    // Track connected players
    players.set(socket.id, { id: socket.id, gameId: null });

    // Update player count
    updatePlayerCount();

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${ socket.id }`);
        handlePlayerDisconnect(socket.id);
        updatePlayerCount();
    });

    // Create a new game
    socket.on('create_game', () => {
        // Remove from waiting queue if already there
        const waitingIndex = waitingPlayers.findIndex(id => id === socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Create new game ID and add to waiting queue
        const gameId = uuidv4();
        waitingPlayers.push(socket.id);

        // Update player data
        const playerData = players.get(socket.id);
        playerData.gameId = gameId;
        players.set(socket.id, playerData);

        // Create new game instance
        const game = new Game();
        games.set(gameId, {
            id: gameId,
            players: [socket.id],
            game: game,
            state: 'waiting' // waiting, active, completed
        });

        // Notify player
        socket.emit('game_created', { gameId });

        // Try to match with another player
        matchPlayers();
    });

    // Join an existing game
    socket.on('join_game', (data) => {
        const { gameId } = data;

        if (!gameId || !games.has(gameId)) {
            socket.emit('error', { message: 'Game not found', critical: true });
            return;
        }

        const gameData = games.get(gameId);

        // Check if game is joinable
        if (gameData.state !== 'waiting' || gameData.players.length >= 2) {
            socket.emit('error', { message: 'Game is not joinable', critical: true });
            return;
        }

        // Join the game
        gameData.players.push(socket.id);
        games.set(gameId, gameData);

        // Update player data
        const playerData = players.get(socket.id);
        playerData.gameId = gameId;
        players.set(socket.id, playerData);

        // Initialize the game
        gameData.game.init();
        gameData.state = 'active';

        // Notify both players
        io.to(gameData.players[0]).emit('player_joined', { gameId });
        socket.emit('player_joined', { gameId });

        // Send initial game state to both players
        sendGameState(gameId);
    });

    // Handle category selection
    socket.on('select_category', (data) => {
        const { gameId, category } = data;

        if (!gameId || !games.has(gameId)) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        const gameData = games.get(gameId);

        // Verify it's the player's turn
        const playerIndex = gameData.players.indexOf(socket.id);
        if (playerIndex === -1) {
            socket.emit('error', { message: 'You are not in this game' });
            return;
        }

        const isPlayerTurn = (playerIndex === 0 && gameData.game.isPlayerTurn) ||
            (playerIndex === 1 && !gameData.game.isPlayerTurn);

        if (!isPlayerTurn) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        // Apply the move
        gameData.game.selectCategory(category);

        // Notify the other player
        const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
        if (gameData.players[otherPlayerIndex]) {
            io.to(gameData.players[otherPlayerIndex]).emit('opponent_move', { category });
        }

        // Play the round after a short delay
        setTimeout(() => {
            playRound(gameId);
        }, 1000);
    });

    // Get next cards
    socket.on('get_next_cards', (data) => {
        const { gameId } = data;

        if (!gameId || !games.has(gameId)) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        const gameData = games.get(gameId);
        const playerIndex = gameData.players.indexOf(socket.id);

        if (playerIndex === -1) {
            socket.emit('error', { message: 'You are not in this game' });
            return;
        }

        // Get the top cards
        const isPlayer1 = playerIndex === 0;
        const playerCard = isPlayer1 ? gameData.game.playerCards[0] : gameData.game.opponentCards[0];
        const opponentCard = isPlayer1 ? gameData.game.opponentCards[0] : gameData.game.playerCards[0];

        // Send cards to the requesting player
        socket.emit('next_cards', {
            playerCard,
            opponentCard: { ...opponentCard, stats: null } // Hide opponent stats
        });
    });

    // Leave game
    socket.on('leave_game', (data) => {
        const { gameId } = data;

        if (gameId && games.has(gameId)) {
            handlePlayerLeaveGame(socket.id, gameId);
        }
    });
});

/**
 * Play a round in the game
 */
function playRound(gameId) {
    if (!games.has(gameId)) return;

    const gameData = games.get(gameId);

    // Play the round
    const roundResult = gameData.game.playRound();

    // Update players
    sendRoundResult(gameId, roundResult);

    // Check if game is over
    if (roundResult.gameOver) {
        gameData.state = 'completed';
        games.set(gameId, gameData);

        // Schedule game cleanup
        setTimeout(() => {
            if (games.has(gameId)) {
                games.delete(gameId);
            }
        }, 60000); // Clean up after 1 minute
    }
}

/**
 * Send round result to players
 */
function sendRoundResult(gameId, roundResult) {
    if (!games.has(gameId)) return;

    const gameData = games.get(gameId);

    // Adjust result data for each player
    gameData.players.forEach((playerId, index) => {
        const isPlayer1 = index === 0;
        const adjustedResult = {
            ...roundResult,
            // Swap perspective for player 2
            result: isPlayer1 ? roundResult.result : (roundResult.result === 'player' ? 'opponent' :
                (roundResult.result === 'opponent' ? 'player' : roundResult.result)),
            playerValue: isPlayer1 ? roundResult.playerValue : roundResult.opponentValue,
            opponentValue: isPlayer1 ? roundResult.opponentValue : roundResult.playerValue,
            playerCardCount: isPlayer1 ? roundResult.playerCardCount : roundResult.opponentCardCount,
            opponentCardCount: isPlayer1 ? roundResult.opponentCardCount : roundResult.playerCardCount,
            winner: roundResult.winner === 'player' ? (isPlayer1 ? 'player' : 'opponent') :
                (isPlayer1 ? 'opponent' : 'player')
        };

        io.to(playerId).emit('roundPlayed', adjustedResult);
    });
}

/**
 * Send current game state to both players
 */
function sendGameState(gameId) {
    if (!games.has(gameId)) return;

    const gameData = games.get(gameId);

    gameData.players.forEach((playerId, index) => {
        const isPlayer1 = index === 0;
        const gameState = {
            playerCards: isPlayer1 ? gameData.game.playerCards : gameData.game.opponentCards,
            opponentCards: isPlayer1 ? gameData.game.opponentCards.map(card => ({ ...card, stats: null })) :
                gameData.game.playerCards.map(card => ({ ...card, stats: null })),
            currentPlayer: gameData.game.currentPlayer,
            isPlayerTurn: isPlayer1 ? gameData.game.isPlayerTurn : !gameData.game.isPlayerTurn,
            gameOver: gameData.game.gameOver,
            winner: gameData.game.winner === 'player' ? (isPlayer1 ? 'player' : 'opponent') :
                (isPlayer1 ? 'opponent' : 'player'),
            playerCardCount: isPlayer1 ? gameData.game.playerCards.length : gameData.game.opponentCards.length,
            opponentCardCount: isPlayer1 ? gameData.game.opponentCards.length : gameData.game.playerCards.length,
            revealOpponentCard: false
        };

        io.to(playerId).emit('game_state', { gameState });
    });
}

/**
 * Match waiting players
 */
function matchPlayers() {
    while (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();

        const player1Data = players.get(player1);
        const player2Data = players.get(player2);

        if (!player1Data || !player2Data) {
            continue;
        }

        // Use the game ID from player 1
        const gameId = player1Data.gameId;

        if (!gameId || !games.has(gameId)) {
            continue;
        }

        const gameData = games.get(gameId);

        // Add player 2 to the game
        gameData.players.push(player2);
        player2Data.gameId = gameId;
        players.set(player2, player2Data);

        // Initialize the game
        gameData.game.init();
        gameData.state = 'active';

        // Notify both players
        io.to(player1).emit('player_joined', { gameId });
        io.to(player2).emit('player_joined', { gameId });

        // Send initial game state
        sendGameState(gameId);
    }
}

/**
 * Handle player disconnect
 */
function handlePlayerDisconnect(playerId) {
    // Remove from players map
    if (players.has(playerId)) {
        const playerData = players.get(playerId);
        const gameId = playerData.gameId;

        players.delete(playerId);

        // Remove from waiting players
        const waitingIndex = waitingPlayers.indexOf(playerId);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Handle active game
        if (gameId && games.has(gameId)) {
            handlePlayerLeaveGame(playerId, gameId);
        }
    }
}

/**
 * Handle player leaving a game
 */
function handlePlayerLeaveGame(playerId, gameId) {
    if (!games.has(gameId)) return;

    const gameData = games.get(gameId);
    const playerIndex = gameData.players.indexOf(playerId);

    if (playerIndex === -1) return;

    // Remove player from game
    gameData.players.splice(playerIndex, 1);

    // If there's still one player, notify them
    if (gameData.players.length > 0) {
        io.to(gameData.players[0]).emit('error', {
            message: 'Opponent has left the game',
            critical: true
        });
    }

    // If no players left, delete the game
    if (gameData.players.length === 0) {
        games.delete(gameId);
    } else {
        // Otherwise update game state
        gameData.state = 'completed';
        games.set(gameId, gameData);
    }
}

/**
 * Update player count for all clients
 */
function updatePlayerCount() {
    const count = players.size;
    io.emit('players_count', { count });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${ PORT }`);
});