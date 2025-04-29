/**
 * Network Handler for Political Quartett
 */
class Network {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.gameId = null;
        this.username = null;
        this.inviteCode = null;
        this.inLobby = false;
        this.reconnecting = false;

        const protocol = window.location.protocol;
        const host = window.location.hostname;
        this.serverUrl = host === 'localhost' ? `${ protocol }//${ host }:3000` : window.location.origin;
    }

    /**
     * Initialize socket connection
     */
    async init() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to server at ${ this.serverUrl }`);
                this.socket = io(this.serverUrl, {
                    reconnectionAttempts: 3,
                    timeout: 10000
                });

                this.socket.on('connect', () => {
                    console.log('Connected to server');
                    this.connected = true;
                    this.playerId = this.socket.id;
                    this.setUsername(`Player-${ this.playerId.slice(0, 5) }`);
                    if (this.reconnecting && this.gameId) {
                        this.rejoinGame(this.gameId);
                        this.reconnecting = false;
                    }
                    this.checkInviteCodeInURL();
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    console.error('Connection error:', error);
                    this.connected = false;
                    reject(error);
                });

                this.socket.on('disconnect', () => {
                    console.log('Disconnected from server');
                    this.connected = false;
                    if (this.gameId) {
                        this.reconnecting = true;
                    }
                    document.dispatchEvent(new CustomEvent('network:disconnected'));
                });

                this.socket.on('reconnect', () => {
                    console.log('Reconnected to server');
                    this.connected = true;
                    document.dispatchEvent(new CustomEvent('network:reconnected'));
                });

                this.setupSocketListeners();
            } catch (error) {
                console.error('Failed to connect to server:', error);
                this.connected = false;
                reject(error);
            }
        });
    }

    /**
     * Check for invite code in URL
     */
    checkInviteCodeInURL() {
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length > 2 && urlParts[1] === 'game') {
            const inviteCode = urlParts[2];
            console.log(`Found invite code in URL: ${ inviteCode }`);
            this.inviteCode = inviteCode;
            document.dispatchEvent(new CustomEvent('network:inviteCodeFound', { detail: { inviteCode } }));
        }
    }

    /**
     * Set up socket event listeners
     */
    setupSocketListeners() {
        if (!this.socket) return;

        // Game creation and matchmaking
        this.socket.on('game_created', (data) => {
            this.gameId = data.gameId;
            this.inviteCode = data.inviteCode;
            this.game.createOrJoinOnlineGame(data.gameId);
            document.dispatchEvent(new CustomEvent('network:gameCreated', { detail: data }));
        });

        this.socket.on('player_joined', (data) => {
            this.game.opponentJoined(data.gameId);
        });

        this.socket.on('players_count', (data) => {
            document.dispatchEvent(new CustomEvent('network:playersCount', { detail: data.count }));
        });

        // Lobby system
        this.socket.on('lobby_list', (data) => {
            const lobbies = data?.lobbies || [];
            document.dispatchEvent(new CustomEvent('network:lobbyList', { detail: { lobbies } }));
        });

        this.socket.on('lobby_created', (data) => {
            this.gameId = data.gameId;
            this.inviteCode = data.inviteCode;
            this.inLobby = true;
            document.dispatchEvent(new CustomEvent('network:lobbyCreated', { detail: data }));
        });

        this.socket.on('joined_lobby', (data) => {
            this.inLobby = true;
            this.inviteCode = data.lobbyId;
            this.gameId = data.gameId;
            document.dispatchEvent(new CustomEvent('network:joinedLobby', { detail: data }));
        });

        this.socket.on('player_joined_lobby', (data) => {
            document.dispatchEvent(new CustomEvent('network:playerJoinedLobby', { detail: data }));
        });

        this.socket.on('game_started', (data) => {
            this.inLobby = false;
            this.gameId = data.gameId;
            document.dispatchEvent(new CustomEvent('network:gameStarted', { detail: data }));
        });

        // Game state and moves
        this.socket.on('opponent_move', (data) => {
            this.game.handleOpponentMove(data);
        });

        this.socket.on('game_state', (data) => {
            this.game.syncGameState(data.gameState);
        });

        this.socket.on('next_cards', (data) => {
            document.dispatchEvent(new CustomEvent('network:nextCards', { detail: data }));
        });

        this.socket.on('reconnect_state', (data) => {
            this.gameId = data.gameId;
            this.game.syncGameState(data.gameState);
            document.dispatchEvent(new CustomEvent('network:reconnected', { detail: data }));
        });

        // Error handling
        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);
            document.dispatchEvent(new CustomEvent('network:error', { detail: data }));
        });
    }

    /**
     * Set username
     */
    setUsername(username) {
        if (!this.connected || !username) return false;
        this.username = username;
        this.socket.emit('set_username', { username });
        return true;
    }

    /**
     * Access the lobby system
     */
    async accessLobbySystem() {
        if (!this.connected) {
            console.warn('Not connected to server');
            return false;
        }
        await this.leaveCurrentGame();
        this.socket.emit('access_lobby_system');
        return true;
    }

    /**
     * Leave the current lobby or game
     */
    async leaveCurrentGame() {
        if (this.inLobby) {
            await this.leaveLobby();
        } else if (this.gameId) {
            await this.leaveGame();
        }
    }

    /**
     * Leave the lobby
     */
    leaveLobby() {
        return new Promise((resolve) => {
            if (!this.connected) return resolve(false);
            this.socket.emit('leave_lobby', () => {
                this.inLobby = false;
                this.inviteCode = null;
                resolve(true);
            });
        });
    }

    /**
     * Create a custom lobby
     */
    createLobby(name, password) {
        if (!this.connected) {
            console.warn('Not connected to server');
            return false;
        }
        this.leaveCurrentGame().then(() => {
            this.socket.emit('create_lobby', {
                name: name || `${ this.username }'s Game`,
                password: password || null
            });
        });
        return true;
    }

    /**
     * Join a lobby by invite code
     */
    joinLobbyByCode(inviteCode, password) {
        if (!this.connected || !inviteCode) {
            console.warn('Not connected to server or no invite code');
            return false;
        }
        this.leaveCurrentGame().then(() => {
            this.socket.emit('join_lobby_by_code', {
                inviteCode,
                password: password || null
            });
        });
        return true;
    }

    /**
     * Start a game from within a lobby
     */
    startGameFromLobby() {
        if (!this.connected || !this.inviteCode) {
            console.warn('Not connected to server or not in a lobby');
            return false;
        }
        this.socket.emit('start_game_from_lobby', { inviteCode: this.inviteCode });
        return true;
    }

    /**
     * Join a game by invite code
     */
    joinGameByInvite(inviteCode) {
        if (!this.connected || !inviteCode) {
            console.warn('Not connected to server or no invite code');
            return false;
        }
        this.leaveCurrentGame().then(() => {
            this.socket.emit('join_game_by_invite', { inviteCode });
        });
        return true;
    }

    /**
     * Create a new game for matchmaking
     */
    createGame() {
        if (!this.connected) {
            console.warn('Not connected to server');
            return false;
        }
        this.leaveCurrentGame().then(() => {
            this.socket.emit('create_game');
        });
        return true;
    }

    /**
     * Join an existing game
     */
    joinGame(gameId) {
        if (!this.connected) {
            console.warn('Not connected to server');
            return false;
        }
        this.gameId = gameId;
        this.socket.emit('join_game', { gameId });
        return true;
    }

    /**
     * Attempt to rejoin a game after disconnection
     */
    rejoinGame(gameId) {
        if (!this.connected || !gameId) {
            console.warn('Not connected to server or no game ID');
            return false;
        }
        this.socket.emit('rejoin_game', { gameId });
        return true;
    }

    /**
     * Send a category selection to the server
     */
    sendCategorySelection(category) {
        if (!this.connected || !this.gameId) {
            console.warn('Not connected or no active game');
            return false;
        }
        this.socket.emit('select_category', {
            gameId: this.gameId,
            category: category
        });
        return true;
    }

    /**
     * Request next cards
     */
    requestNextCards() {
        if (!this.connected || !this.gameId) {
            console.warn('Not connected or no active game');
            return false;
        }
        this.socket.emit('get_next_cards', {
            gameId: this.gameId
        });
        return true;
    }

    /**
     * Leave the current game
     */
    leaveGame() {
        return new Promise((resolve) => {
            if (!this.connected || !this.gameId) return resolve(false);
            this.socket.emit('leave_game', { gameId: this.gameId }, () => {
                this.gameId = null;
                this.inviteCode = null;
                resolve(true);
            });
        });
    }

    /**
     * Get shareable invite link
     */
    getInviteLink() {
        if (!this.inviteCode) return null;
        const baseUrl = window.location.origin;
        return `${ baseUrl }/game/${ this.inviteCode }`;
    }

    /**
     * Check if we can connect to the server
     */
    async canConnect() {
        try {
            const response = await fetch(`${ this.serverUrl }/health`);
            return response.ok;
        } catch (error) {
            console.error('Server not reachable:', error);
            return false;
        }
    }

    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.socket && this.connected) {
            this.socket.disconnect();
            this.connected = false;
            this.gameId = null;
            this.inviteCode = null;
            this.inLobby = false;
            document.dispatchEvent(new CustomEvent('network:disconnected'));
        }
    }

    /**
     * Get lobby list
     */
    getLobbyList() {
        if (!this.connected) {
            console.warn('Not connected to server');
            return false;
        }
        this.socket.emit('get_lobby_list');
        return true;
    }
}

// If Node.js environment, export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Network };
}