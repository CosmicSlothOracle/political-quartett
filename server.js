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
const lobbies = new Map();

// Random name generator
const adjectives = ['Red', 'Blue', 'Green', 'Brave', 'Swift', 'Smart', 'Proud', 'Bold', 'Calm', 'Eager', 'Fancy', 'Happy', 'Jolly', 'Lucky', 'Mighty'];
const nouns = ['Lion', 'Tiger', 'Bear', 'Eagle', 'Wolf', 'Hawk', 'Dragon', 'Knight', 'Wizard', 'Warrior', 'Champion', 'Hero', 'Phoenix', 'Falcon', 'Panther'];

function generateRandomName() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${ adjective } ${ noun }`;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Get game by invite code
app.get('/game/:inviteCode', (req, res) => {
    const { inviteCode } = req.params;
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${ socket.id }`);

    // Generate a random name for the player
    const randomName = generateRandomName();

    // Track connected players
    players.set(socket.id, {
        id: socket.id,
        gameId: null,
        username: randomName,
        inLobby: false,
        lastGameId: null,
        lastDisconnect: null
    });

    // Update player count
    updatePlayerCount();

    // Send initial list of lobbies to the player
    sendLobbyList(socket.id);

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${ socket.id }`);
        // Store the time of disconnection and save game ID for potential reconnection
        const playerData = players.get(socket.id);
        if (playerData) {
            playerData.lastDisconnect = Date.now();
            playerData.lastGameId = playerData.gameId;
            players.set(socket.id, playerData);

            // Wait 30 seconds before removing the player and game completely
            setTimeout(() => {
                handlePlayerDisconnect(socket.id);
                updatePlayerCount();
            }, 30000);
        } else {
            handlePlayerDisconnect(socket.id);
            updatePlayerCount();
        }
    });

    // Set username (still allow custom ones if wanted)
    socket.on('set_username', (data) => {
        const { username } = data;
        if (username && username.trim().length > 0) {
            const playerData = players.get(socket.id);
            if (playerData) {
                playerData.username = username.trim();
                players.set(socket.id, playerData);
            }
        }
    });

    // Create a new lobby
    socket.on('create_lobby', (data) => {
        // Remove player from any existing game or lobby
        const playerData = players.get(socket.id);
        if (!playerData) return;

        if (playerData.gameId) {
            handlePlayerLeaveGame(socket.id, playerData.gameId);
        }

        // Create a new game ID
        const gameId = uuidv4();

        // Generate a lobby name (use provided name or default to username's game)
        const lobbyName = data.name || `${ playerData.username }'s Game`;

        // Generate an invite code
        const inviteCode = generateInviteCode();

        // Create lobby
        lobbies.set(inviteCode, {
            id: inviteCode,
            name: lobbyName,
            creator: socket.id,
            gameId: gameId,
            password: data.password || null,
            players: [socket.id],
            maxPlayers: 2,
            isPrivate: !!data.password
        });

        // Update player data
        playerData.gameId = gameId;
        playerData.inLobby = true;
        players.set(socket.id, playerData);

        // Create new game instance
        const game = new Game();
        games.set(gameId, {
            id: gameId,
            players: [socket.id],
            game: game,
            state: 'waiting',
            inviteCode: inviteCode,
            createdAt: Date.now()
        });

        // Notify player
        socket.emit('lobby_created', {
            gameId,
            inviteCode,
            lobbyInfo: {
                name: lobbyName,
                players: [playerData.username]
            }
        });

        // Update lobby list for all players
        updateLobbyList();
    });

    // Get lobby list
    socket.on('get_lobby_list', () => {
        sendLobbyList(socket.id);
    });

    // Access lobby system
    socket.on('access_lobby_system', () => {
        const playerData = players.get(socket.id);
        if (!playerData) return;

        // Clean up any existing game or lobby associations
        if (playerData.gameId) {
            handlePlayerLeaveGame(socket.id, playerData.gameId);
        }

        // Mark player as in lobby browser mode
        playerData.inLobby = true;
        players.set(socket.id, playerData);

        // Send current lobby list
        sendLobbyList(socket.id);
    });

    // Join a lobby by code
    socket.on('join_lobby_by_code', (data) => {
        const { inviteCode, password } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;

        if (!inviteCode || !lobbies.has(inviteCode)) {
            socket.emit('error', { message: 'Lobby not found', critical: false });
            return;
        }

        const lobby = lobbies.get(inviteCode);

        // Check if lobby requires password
        if (lobby.password && lobby.password !== password) {
            socket.emit('error', { message: 'Incorrect password', critical: false });
            return;
        }

        // Check if lobby is full
        if (lobby.players.length >= lobby.maxPlayers) {
            socket.emit('error', { message: 'Lobby is full', critical: false });
            return;
        }

        // Remove player from any existing game
        if (playerData.gameId) {
            handlePlayerLeaveGame(socket.id, playerData.gameId);
        }

        // Add player to lobby
        lobby.players.push(socket.id);
        lobbies.set(inviteCode, lobby);

        // Update player data
        playerData.gameId = lobby.gameId;
        playerData.inLobby = true;
        players.set(socket.id, playerData);

        // Add player to game
        const gameData = games.get(lobby.gameId);
        if (gameData) {
            gameData.players.push(socket.id);
            games.set(lobby.gameId, gameData);
        }

        // Get player names for lobby info
        const lobbyInfo = getLobbyInfo(inviteCode);

        // Notify joining player
        socket.emit('joined_lobby', {
            lobbyId: inviteCode,
            gameId: lobby.gameId,
            lobbyInfo
        });

        // Notify other players in the lobby
        lobby.players.forEach(playerId => {
            if (playerId !== socket.id) {
                io.to(playerId).emit('player_joined_lobby', {
                    playerId: socket.id,
                    playerName: playerData.username,
                    players: lobbyInfo.players
                });
            }
        });

        // If lobby is now full, start the game automatically
        if (lobby.players.length >= lobby.maxPlayers) {
            startGameFromLobby(inviteCode);
        }

        // Update lobby list for everyone
        updateLobbyList();
    });

    // Start game from lobby
    socket.on('start_game_from_lobby', (data) => {
        const { inviteCode } = data;
        if (!inviteCode || !lobbies.has(inviteCode)) {
            socket.emit('error', { message: 'Lobby not found', critical: false });
            return;
        }

        const lobby = lobbies.get(inviteCode);

        // Only creator can start the game
        if (lobby.creator !== socket.id) {
            socket.emit('error', { message: 'Only the lobby creator can start the game', critical: false });
            return;
        }

        startGameFromLobby(inviteCode);
    });

    // Create a new game for matchmaking
    socket.on('create_game', () => {
        // Remove from waiting queue if already there
        const waitingIndex = waitingPlayers.findIndex(id => id === socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Remove player from any existing game or lobby
        const playerData = players.get(socket.id);
        if (!playerData) return;

        if (playerData.gameId) {
            handlePlayerLeaveGame(socket.id, playerData.gameId);
        }

        // Create new game ID and add to waiting queue
        const gameId = uuidv4();
        waitingPlayers.push(socket.id);

        // Update player data
        playerData.gameId = gameId;
        playerData.inLobby = false;
        players.set(socket.id, playerData);

        // Create new game instance
        const game = new Game();
        games.set(gameId, {
            id: gameId,
            players: [socket.id],
            game: game,
            state: 'waiting', // waiting, active, completed
            inviteCode: generateInviteCode(),
            createdAt: Date.now()
        });

        // Notify player
        socket.emit('game_created', {
            gameId,
            inviteCode: games.get(gameId).inviteCode
        });

        // Try to match with another player
        matchPlayers();
    });

    // Leave lobby
    socket.on('leave_lobby', () => {
        const playerData = players.get(socket.id);
        if (!playerData) return;

        if (playerData.gameId) {
            // Check if this is a lobby
            let foundLobby = null;
            for (const [inviteCode, lobby] of lobbies.entries()) {
                if (lobby.gameId === playerData.gameId) {
                    foundLobby = { inviteCode, lobby };
                    break;
                }
            }

            if (foundLobby) {
                const { inviteCode, lobby } = foundLobby;

                // Remove player from lobby
                const playerIndex = lobby.players.indexOf(socket.id);
                if (playerIndex !== -1) {
                    lobby.players.splice(playerIndex, 1);
                }

                // If this was the creator, assign a new one or delete the lobby
                if (socket.id === lobby.creator && lobby.players.length > 0) {
                    lobby.creator = lobby.players[0];
                }

                // Update or remove lobby
                if (lobby.players.length === 0) {
                    lobbies.delete(inviteCode);
                } else {
                    lobbies.set(inviteCode, lobby);

                    // Notify remaining players
                    const lobbyInfo = getLobbyInfo(inviteCode);
                    lobby.players.forEach(playerId => {
                        io.to(playerId).emit('player_left_lobby', {
                            playerId: socket.id,
                            players: lobbyInfo.players
                        });
                    });
                }

                // Update lobby list
                updateLobbyList();
            }

            // Remove from game
            handlePlayerLeaveGame(socket.id, playerData.gameId);
        }

        // Update player data
        playerData.inLobby = false;
        playerData.gameId = null;
        players.set(socket.id, playerData);
    });

    // Join a game by invite code
    socket.on('join_game_by_invite', (data) => {
        const { inviteCode } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;

        // Find game with this invite code
        let foundGameId = null;
        let gameData = null;

        for (const [gameId, game] of games.entries()) {
            if (game.inviteCode === inviteCode && game.state === 'waiting') {
                foundGameId = gameId;
                gameData = game;
                break;
            }
        }

        if (!foundGameId || !gameData) {
            socket.emit('error', { message: 'Game not found or already started', critical: false });
            return;
        }

        // Cleanup any existing game
        if (playerData.gameId) {
            handlePlayerLeaveGame(socket.id, playerData.gameId);
        }

        // Update player data
        playerData.gameId = foundGameId;
        playerData.inLobby = false;
        players.set(socket.id, playerData);

        // Add player to game
        gameData.players.push(socket.id);
        games.set(foundGameId, gameData);

        // Notify both players
        io.to(gameData.players[0]).emit('player_joined', { gameId: foundGameId });
        socket.emit('player_joined', { gameId: foundGameId });

        // Initialize the game
        gameData.game.init();
        gameData.state = 'active';

        // Send initial game state to both players
        sendGameState(foundGameId);
    });

    // Join an existing game
    socket.on('join_game', (data) => {
        const { gameId } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;

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

        // Cleanup any existing game
        if (playerData.gameId && playerData.gameId !== gameId) {
            handlePlayerLeaveGame(socket.id, playerData.gameId);
        }

        // Join the game
        gameData.players.push(socket.id);
        games.set(gameId, gameData);

        // Update player data
        playerData.gameId = gameId;
        playerData.inLobby = false;
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

    // Attempt to rejoin a game
    socket.on('rejoin_game', (data) => {
        const { gameId } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;

        // Check if the game exists
        if (!gameId || !games.has(gameId)) {
            // Check if the player has a lastGameId saved
            if (playerData.lastGameId && games.has(playerData.lastGameId)) {
                playerData.gameId = playerData.lastGameId;
                playerData.lastGameId = null;
                players.set(socket.id, playerData);

                const gameData = games.get(playerData.gameId);

                // Replace the old socket ID with the new one
                const oldPlayerIndex = gameData.players.findIndex(id =>
                    id !== socket.id && !players.has(id));
                if (oldPlayerIndex !== -1) {
                    gameData.players[oldPlayerIndex] = socket.id;
                } else {
                    gameData.players.push(socket.id);
                }

                games.set(playerData.gameId, gameData);

                // Notify the other player
                gameData.players.forEach(id => {
                    if (id !== socket.id && players.has(id)) {
                        io.to(id).emit('player_reconnected', {
                            gameId: playerData.gameId,
                            playerId: socket.id
                        });
                    }
                });

                // Send game state to the reconnected player
                socket.emit('reconnect_state', {
                    gameId: playerData.gameId,
                    gameState: buildGameStateForPlayer(playerData.gameId, socket.id)
                });
            } else {
                socket.emit('error', { message: 'Game no longer exists', critical: true });
            }
            return;
        }

        const gameData = games.get(gameId);

        // Check if player was part of this game
        if (!gameData.players.includes(socket.id)) {
            const hasDisconnectedPlayer = gameData.players.some(id => !players.has(id));

            if (hasDisconnectedPlayer && gameData.players.length < 2) {
                // Replace the disconnected player
                const activePlayerIndex = gameData.players.findIndex(id => players.has(id));
                const activePlayerId = activePlayerIndex !== -1 ? gameData.players[activePlayerIndex] : null;

                // Remove any disconnected players
                gameData.players = gameData.players.filter(id => players.has(id) || id === socket.id);

                // Add this player if needed
                if (!gameData.players.includes(socket.id)) {
                    gameData.players.push(socket.id);
                }

                // Update player data
                playerData.gameId = gameId;
                playerData.inLobby = false;
                players.set(socket.id, playerData);

                games.set(gameId, gameData);

                // Notify the other player
                if (activePlayerId) {
                    io.to(activePlayerId).emit('player_reconnected', {
                        gameId,
                        playerId: socket.id
                    });
                }

                // Send game state to the reconnected player
                socket.emit('reconnect_state', {
                    gameId,
                    gameState: buildGameStateForPlayer(gameId, socket.id)
                });
            } else {
                socket.emit('error', { message: 'You are not part of this game', critical: true });
            }
            return;
        }

        // Update player data
        playerData.gameId = gameId;
        playerData.inLobby = false;
        playerData.lastGameId = null;
        players.set(socket.id, playerData);

        // Notify the other player
        gameData.players.forEach(id => {
            if (id !== socket.id && players.has(id)) {
                io.to(id).emit('player_reconnected', {
                    gameId,
                    playerId: socket.id
                });
            }
        });

        // Send game state to the reconnected player
        socket.emit('reconnect_state', {
            gameId,
            gameState: buildGameStateForPlayer(gameId, socket.id)
        });
    });

    // Handle category selection
    socket.on('select_category', (data) => {
        const { gameId, category } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;

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
        gameData.players.forEach(playerId => {
            if (playerId !== socket.id && players.has(playerId)) {
                io.to(playerId).emit('opponent_move', { category });
            }
        });

        // Play the round after a short delay
        setTimeout(() => {
            playRound(gameId);
        }, 1000);
    });

    // Get next cards
    socket.on('get_next_cards', (data) => {
        const { gameId } = data;
        const playerData = players.get(socket.id);
        if (!playerData) return;

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
        const playerData = players.get(socket.id);
        if (!playerData) return;

        if (gameId && games.has(gameId)) {
            handlePlayerLeaveGame(socket.id, gameId);

            // Update player data
            playerData.gameId = null;
            playerData.inLobby = false;
            players.set(socket.id, playerData);
        }
    });
});

/**
 * Start a game from a lobby
 */
function startGameFromLobby(lobbyId) {
    if (!lobbies.has(lobbyId)) return;

    const lobby = lobbies.get(lobbyId);
    const gameId = lobby.gameId;

    if (!games.has(gameId)) return;

    const gameData = games.get(gameId);

    // Initialize the game
    gameData.game.init();
    gameData.state = 'active';

    // Notify all players in the lobby
    lobby.players.forEach(playerId => {
        io.to(playerId).emit('game_started', { gameId });
    });

    // Send initial game state
    sendGameState(gameId);

    // Remove the lobby
    // lobbies.delete(lobbyId); // Keep it for reference, will be cleaned up when game ends
}

/**
 * Generate a 6-character invite code
 */
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Get public lobby information
 */
function getLobbyInfo(inviteCode) {
    if (!lobbies.has(inviteCode)) return null;

    const lobby = lobbies.get(inviteCode);
    return {
        id: lobby.id,
        name: lobby.name,
        playerCount: lobby.players.length,
        maxPlayers: lobby.maxPlayers,
        hasPassword: !!lobby.password,
        players: lobby.players.map(playerId => {
            const player = players.get(playerId);
            return {
                id: playerId,
                username: player ? player.username : 'Unknown Player',
                isCreator: playerId === lobby.creator
            };
        })
    };
}

/**
 * Send lobby list to a player
 */
function sendLobbyList(playerId) {
    const lobbyList = [];

    for (const [id, lobby] of lobbies.entries()) {
        // Only include lobbies that are not full and not private
        if (lobby.players.length < lobby.maxPlayers && !lobby.isPrivate) {
            lobbyList.push({
                id: id,
                name: lobby.name,
                players: lobby.players.length,
                maxPlayers: lobby.maxPlayers
            });
        }
    }

    io.to(playerId).emit('lobby_list', { lobbies: lobbyList });
}

/**
 * Update lobby list for all players in lobby
 */
function updateLobbyList() {
    const lobbyList = [];

    for (const [id, lobby] of lobbies.entries()) {
        // Only include lobbies that are not full and not private
        if (lobby.players.length < lobby.maxPlayers && !lobby.isPrivate) {
            lobbyList.push({
                id: id,
                name: lobby.name,
                players: lobby.players.length,
                maxPlayers: lobby.maxPlayers
            });
        }
    }

    // Send to all connected players
    io.emit('lobby_list', { lobbies: lobbyList });
}

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

        // Remove from lobbies
        for (const [inviteCode, lobby] of lobbies.entries()) {
            const playerIndex = lobby.players.indexOf(playerId);
            if (playerIndex !== -1) {
                lobby.players.splice(playerIndex, 1);

                // If this was the creator, assign a new one or delete the lobby
                if (playerId === lobby.creator) {
                    if (lobby.players.length > 0) {
                        lobby.creator = lobby.players[0];
                    } else {
                        lobbies.delete(inviteCode);
                    }
                }

                // Update lobbies or remove if empty
                if (lobby.players.length === 0) {
                    lobbies.delete(inviteCode);
                } else {
                    lobbies.set(inviteCode, lobby);
                }

                updateLobbyList();
                break;
            }
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

/**
 * Build game state data specific to a player
 */
function buildGameStateForPlayer(gameId, playerId) {
    if (!games.has(gameId)) return null;

    const gameData = games.get(gameId);
    const playerIndex = gameData.players.indexOf(playerId);
    if (playerIndex === -1) return null;

    const isPlayer1 = playerIndex === 0;
    return {
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
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${ PORT }`);
});