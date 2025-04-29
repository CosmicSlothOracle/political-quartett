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
        // Use local server instead of Heroku
        this.serverUrl = window.location.hostname === 'localhost'
            ? `http://${ window.location.hostname }:3000`
            : window.location.origin;
    }

    /**
     * Initialize socket connection
     */
    init() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to server at ${ this.serverUrl }`);
                this.socket = io(this.serverUrl);

                this.socket.on('connect', () => {
                    console.log('Connected to server');
                    this.connected = true;
                    this.playerId = this.socket.id;
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    console.error('Connection error:', error);
                    this.connected = false;
                    reject(error);
                });

                this.setupSocketListeners();
            } catch (error) {
                console.error('Failed to connect to server:', error);
                // Fallback to local mode or AI mode
                this.connected = false;
                reject(error);
            }
        });
    }

    /**
     * Set up socket event listeners
     */
    setupSocketListeners() {
        if (!this.socket) return;

        // Game creation and matchmaking
        this.socket.on('game_created', (data) => {
            this.gameId = data.gameId;
            this.game.createOrJoinOnlineGame(data.gameId);
        });

        this.socket.on('player_joined', (data) => {
            this.game.opponentJoined(data.gameId);
        });

        this.socket.on('players_count', (data) => {
            document.dispatchEvent(new CustomEvent('network:playersCount', {
                detail: data.count
            }));
        });

        // Game state and moves
        this.socket.on('opponent_move', (data) => {
            this.game.handleOpponentMove(data);
        });

        this.socket.on('game_state', (data) => {
            this.game.syncGameState(data.gameState);
        });

        this.socket.on('next_cards', (data) => {
            document.dispatchEvent(new CustomEvent('network:nextCards', {
                detail: data
            }));
        });

        // Error handling
        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);

            document.dispatchEvent(new CustomEvent('network:error', {
                detail: data
            }));
        });
    }

    /**
     * Create a new game
     */
    createGame() {
        if (!this.connected) {
            console.warn('Not connected to server');
            return false;
        }

        this.socket.emit('create_game');
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
        if (!this.connected || !this.gameId) return;

        this.socket.emit('leave_game', {
            gameId: this.gameId
        });

        this.gameId = null;
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
        }
    }
}

// If Node.js environment, export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Network };
}