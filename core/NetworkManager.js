/**
 * NetworkManager.js - Handles all network communication for the Political Quartett game
 */
class NetworkManager {
    constructor(eventEmitter) {
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.gameId = null;
        this.username = null;
        this.inviteCode = null;
        this.inLobby = false;
        this.reconnecting = false;
        this.eventEmitter = eventEmitter;

        const protocol = window.location.protocol;
        const host = window.location.hostname;
        this.serverUrl = host === 'localhost' ? `${ protocol }//${ host }:3000` : window.location.origin;
    }

    /**
     * Initialize socket connection
     * @returns {Promise} - Resolves when connected
     */
    async init() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to server at ${ this.serverUrl }`);
                this.socket = io(this.serverUrl, {
                    reconnectionAttempts: 3,
                    timeout: 10000
                });

                this.setupSocketListeners(resolve, reject);
            } catch (error) {
                console.error('Failed to connect to server:', error);
                this.connected = false;
                reject(error);
            }
        });
    }

    /**
     * Set up socket event listeners
     * @param {Function} resolveConnection - Resolve function for connection promise
     * @param {Function} rejectConnection - Reject function for connection promise
     */
    setupSocketListeners(resolveConnection, rejectConnection) {
        if (!this.socket) return;

        // Connection events
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
            resolveConnection();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.connected = false;
            rejectConnection(error);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;

            if (this.gameId) {
                this.reconnecting = true;
            }

            this.emitEvent('networkDisconnected');
        });

        this.socket.on('reconnect', () => {
            console.log('Reconnected to server');
            this.connected = true;
            this.emitEvent('networkReconnected');
        });

        // Game creation and matchmaking events
        this.setupGameEvents();

        // Lobby system events
        this.setupLobbyEvents();

        // Game state events
        this.setupGameStateEvents();

        // Error handling
        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);
            this.emitEvent('networkError', data);
        });
    }

    /**
     * Set up game creation and matchmaking events
     */
    setupGameEvents() {
        this.socket.on('game_created', (data) => {
            this.gameId = data.gameId;
            this.inviteCode = data.inviteCode;
            this.emitEvent('gameCreated', data);
        });

        this.socket.on('player_joined', (data) => {
            this.emitEvent('playerJoined', data);
        });

        this.socket.on('players_count', (data) => {
            this.emitEvent('playersCount', { count: data.count });
        });

        this.socket.on('game_started', (data) => {
            this.inLobby = false;
            this.gameId = data.gameId;
            this.emitEvent('gameStarted', data);
        });
    }

    /**
     * Set up lobby system events
     */
    setupLobbyEvents() {
        this.socket.on('lobby_list', (data) => {
            const lobbies = data?.lobbies || [];
            this.emitEvent('lobbyList', { lobbies });
        });

        this.socket.on('lobby_created', (data) => {
            this.gameId = data.gameId;
            this.inviteCode = data.inviteCode;
            this.inLobby = true;
            this.emitEvent('lobbyCreated', data);
        });

        this.socket.on('joined_lobby', (data) => {
            this.inLobby = true;
            this.inviteCode = data.lobbyId;
            this.gameId = data.gameId;
            this.emitEvent('joinedLobby', data);
        });

        this.socket.on('player_joined_lobby', (data) => {
            this.emitEvent('playerJoinedLobby', data);
        });
    }

    /**
     * Set up game state events
     */
    setupGameStateEvents() {
        // Using a single game state event to sync game state
        this.socket.on('game_state', (data) => {
            this.emitEvent('gameState', data);
        });

        this.socket.on('next_cards', (data) => {
            this.emitEvent('nextCards', data);
        });

        this.socket.on('reconnect_state', (data) => {
            this.gameId = data.gameId;
            this.emitEvent('reconnectState', data);
        });

        // We specifically handle opponent moves separately from general game state
        // to allow for animations and UX
        this.socket.on('opponent_move', (data) => {
            this.emitEvent('opponentMove', data);
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
            this.emitEvent('inviteCodeFound', { inviteCode });
        }
    }

    /**
     * Set username
     * @param {String} username - Username to set
     * @returns {Boolean} - Success status
     */
    setUsername(username) {
        if (!this.connected || !username) return false;

        this.username = username;
        this.socket.emit('set_username', { username });

        return true;
    }

    /**
     * Access the lobby system
     * @returns {Promise<Boolean>} - Success status
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
     * @returns {Promise<Boolean>} - Success status
     */
    async leaveCurrentGame() {
        if (this.inLobby) {
            return await this.leaveLobby();
        } else if (this.gameId) {
            return await this.leaveGame();
        }

        return true;
    }

    /**
     * Leave the lobby
     * @returns {Promise<Boolean>} - Success status
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
     * @param {String} name - Lobby name
     * @param {String} password - Lobby password (optional)
     * @returns {Boolean} - Success status
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
     * @param {String} inviteCode - Invite code
     * @param {String} password - Lobby password (optional)
     * @returns {Boolean} - Success status
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
     * @returns {Boolean} - Success status
     */
    startGameFromLobby() {
        if (!this.connected || !this.inLobby) {
            console.warn('Not connected or not in a lobby');
            return false;
        }

        this.socket.emit('start_game_from_lobby', { lobbyId: this.inviteCode });
        return true;
    }

    /**
     * Create a new game
     * @returns {Boolean} - Success status
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
     * Join a game by ID
     * @param {String} gameId - Game ID
     * @returns {Boolean} - Success status
     */
    joinGame(gameId) {
        if (!this.connected || !gameId) {
            console.warn('Not connected to server or no game ID');
            return false;
        }

        this.socket.emit('join_game', { gameId });
        return true;
    }

    /**
     * Rejoin a game after disconnection
     * @param {String} gameId - Game ID
     * @returns {Boolean} - Success status
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
     * @param {String} category - Selected category
     * @returns {Boolean} - Success status
     */
    sendCategorySelection(category) {
        if (!this.connected || !this.gameId) {
            console.warn('Not connected to server or no active game');
            return false;
        }

        this.socket.emit('select_category', {
            gameId: this.gameId,
            category
        });

        return true;
    }

    /**
     * Request the next cards from the server
     * @returns {Boolean} - Success status
     */
    requestNextCards() {
        if (!this.connected || !this.gameId) {
            console.warn('Not connected to server or no active game');
            return false;
        }

        this.socket.emit('request_next_cards', {
            gameId: this.gameId
        });

        return true;
    }

    /**
     * Leave the current game
     * @returns {Promise<Boolean>} - Success status
     */
    leaveGame() {
        return new Promise((resolve) => {
            if (!this.connected || !this.gameId) {
                this.gameId = null;
                return resolve(false);
            }

            this.socket.emit('leave_game', { gameId: this.gameId }, () => {
                this.gameId = null;
                resolve(true);
            });
        });
    }

    /**
     * Get an invite link for the current game
     * @returns {String|null} - Invite link or null if not in a game
     */
    getInviteLink() {
        if (!this.inviteCode) return null;

        return `${ window.location.origin }/game/${ this.inviteCode }`;
    }

    /**
     * Check if the server is available
     * @returns {Promise<Boolean>} - True if server is available
     */
    async canConnect() {
        try {
            const response = await fetch(`${ this.serverUrl }/health`);
            return response.status === 200;
        } catch (error) {
            console.error('Server health check failed:', error);
            return false;
        }
    }

    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            this.socket = null;
        }
    }

    /**
     * Request the current lobby list
     * @returns {Boolean} - Success status
     */
    getLobbyList() {
        if (!this.connected) {
            console.warn('Not connected to server');
            return false;
        }

        this.socket.emit('get_lobby_list');
        return true;
    }

    /**
     * Emit an event via the event emitter
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    emitEvent(event, data) {
        if (this.eventEmitter && typeof this.eventEmitter.emit === 'function') {
            this.eventEmitter.emit(event, data);
        }
    }
}

export default NetworkManager;