/**
 * Game Logic for Political Quartett
 */
class Game {
    constructor(isAIOpponent = false) {
        this.isAIOpponent = isAIOpponent;
        this.currentPlayer = null; // 'player' or 'opponent'
        this.playerCards = [];
        this.opponentCards = [];
        this.currentCategory = null;
        this.gameOver = false;
        this.winner = null;
        this.waitingForOpponent = false;
        this.isPlayerTurn = false;
        this.eventListeners = {};
        this.gameId = null;
        this.tieCards = [];
        this.isOnlineGame = false;
        this.reconnecting = false;
    }

    /**
     * Initialize game with deck and distribute cards
     */
    init() {
        // Reset game state
        this.playerCards = [];
        this.opponentCards = [];
        this.currentCategory = null;
        this.gameOver = false;
        this.winner = null;
        this.tieCards = [];

        // Deal cards (5 each)
        const shuffledDeck = this.shuffleDeck([...CARD_DATA]);

        this.playerCards = shuffledDeck.slice(0, 5);
        this.opponentCards = shuffledDeck.slice(5, 10);

        // Determine starting player randomly
        this.isPlayerTurn = Math.random() >= 0.5;
        this.currentPlayer = this.isPlayerTurn ? 'player' : 'opponent';

        // If AI opponent and AI starts, make AI move after a delay
        if (this.isAIOpponent && !this.isPlayerTurn) {
            setTimeout(() => this.makeAIMove(), 1500);
        }

        // Notify any listeners
        this.emitEvent('gameInitialized', {
            playerCards: this.playerCards,
            opponentCards: this.opponentCards,
            currentPlayer: this.currentPlayer,
            isPlayerTurn: this.isPlayerTurn
        });
    }

    /**
     * Shuffle a deck of cards
     */
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Handle player selecting a category
     */
    selectCategory(category) {
        if (!this.isPlayerTurn && !this.isAIOpponent) return false;

        this.currentCategory = category;
        this.emitEvent('categorySelected', { category });

        return true;
    }

    /**
     * Play a round
     */
    playRound() {
        if (this.gameOver) return;

        // Check if we have cards to play
        if (this.playerCards.length === 0 || this.opponentCards.length === 0) {
            this.gameOver = true;
            this.winner = this.playerCards.length > 0 ? 'player' : 'opponent';

            const roundData = {
                result: this.winner,
                playerCard: null,
                opponentCard: null,
                playerValue: 0,
                opponentValue: 0,
                category: this.currentCategory,
                nextTurn: this.currentPlayer,
                playerCardCount: this.playerCards.length,
                opponentCardCount: this.opponentCards.length,
                gameOver: true,
                winner: this.winner
            };

            this.emitEvent('roundPlayed', roundData);
            return roundData;
        }

        const playerCard = this.playerCards[0];
        const opponentCard = this.opponentCards[0];

        // Remove cards from hands
        this.playerCards.shift();
        this.opponentCards.shift();

        // Get values from pre-defined card stats
        const playerValue = playerCard.stats[this.currentCategory];
        const opponentValue = opponentCard.stats[this.currentCategory];

        let result;

        // Handle result
        if (playerValue > opponentValue) {
            result = 'player';
            // Player wins the round
            this.playerCards.push(playerCard, opponentCard, ...this.tieCards);
            this.tieCards = [];
            this.isPlayerTurn = true;
            this.currentPlayer = 'player';
        } else if (opponentValue > playerValue) {
            result = 'opponent';
            // Opponent wins the round
            this.opponentCards.push(playerCard, opponentCard, ...this.tieCards);
            this.tieCards = [];
            this.isPlayerTurn = false;
            this.currentPlayer = 'opponent';
        } else {
            result = 'tie';
            // It's a tie - collect tie cards
            this.tieCards.push(playerCard, opponentCard);
            // Keep the same player's turn
        }

        // Check for game over
        if (this.playerCards.length === 0) {
            this.gameOver = true;
            this.winner = 'opponent';
        } else if (this.opponentCards.length === 0) {
            this.gameOver = true;
            this.winner = 'player';
        }

        const roundData = {
            result,
            playerCard,
            opponentCard,
            playerValue,
            opponentValue,
            category: this.currentCategory,
            nextTurn: this.currentPlayer,
            playerCardCount: this.playerCards.length,
            opponentCardCount: this.opponentCards.length,
            gameOver: this.gameOver,
            winner: this.winner
        };

        this.emitEvent('roundPlayed', roundData);

        // If AI opponent and AI's turn, make AI move after a delay
        if (this.isAIOpponent && !this.isPlayerTurn && !this.gameOver) {
            setTimeout(() => this.makeAIMove(), 2000);
        }

        return roundData;
    }

    /**
     * Make AI opponent move
     */
    makeAIMove() {
        if (this.gameOver || this.isPlayerTurn || this.opponentCards.length === 0) return;

        // AI strategy: pick the highest stat from the current card
        const aiCard = this.opponentCards[0];
        if (!aiCard || !aiCard.stats) return;

        const stats = Object.entries(aiCard.stats);
        stats.sort((a, b) => b[1] - a[1]); // Sort by value (highest first)
        const bestCategory = stats[0][0];

        // Select this category
        this.selectCategory(bestCategory);

        // Wait a bit before playing the round (for UI animation)
        setTimeout(() => this.playRound(), 1000);
    }

    /**
     * Start an AI game
     */
    startAIGame() {
        this.isAIOpponent = true;
        this.isOnlineGame = false;
        this.init();

        this.emitEvent('gameStarted', {
            isAIGame: true
        });
    }

    /**
     * Start an online game
     */
    startOnlineGame(gameId) {
        this.isAIOpponent = false;
        this.isOnlineGame = true;
        this.gameId = gameId;

        this.emitEvent('gameStarted', {
            isAIGame: false,
            gameId
        });
    }

    /**
     * Create a new online game or join existing one
     */
    createOrJoinOnlineGame(gameId = null) {
        this.waitingForOpponent = true;
        this.gameId = gameId;

        this.emitEvent('waitingForOpponent', { gameId });
    }

    /**
     * Handle opponent joining the game
     */
    opponentJoined(gameId) {
        this.waitingForOpponent = false;
        this.gameId = gameId;
        this.isOnlineGame = true;

        // Initialize the game
        this.init();

        this.emitEvent('opponentJoined', { gameId });
    }

    /**
     * Handle opponent reconnecting
     */
    opponentReconnected(gameId) {
        this.emitEvent('opponentReconnected', { gameId });
    }

    /**
     * Handle opponent move in online game
     */
    handleOpponentMove(data) {
        if (data.category) {
            this.currentCategory = data.category;
            this.emitEvent('categorySelected', { category: data.category });

            setTimeout(() => this.playRound(), 1000);
        }
    }

    /**
     * Handle game update from server (sync game state)
     */
    syncGameState(data) {
        if (!data) return;

        this.playerCards = data.playerCards || this.playerCards;
        this.opponentCards = data.opponentCards || this.opponentCards;
        this.currentPlayer = data.currentPlayer || this.currentPlayer;
        this.isPlayerTurn = data.isPlayerTurn;
        this.gameOver = data.gameOver;
        this.winner = data.winner;
        this.currentCategory = data.currentCategory || this.currentCategory;

        if (this.reconnecting) {
            this.reconnecting = false;
            this.emitEvent('gameReconnected', data);
        } else {
            this.emitEvent('gameStateUpdated', data);
        }
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.isAIOpponent = false;
        this.isOnlineGame = false;
        this.currentPlayer = null;
        this.playerCards = [];
        this.opponentCards = [];
        this.currentCategory = null;
        this.gameOver = false;
        this.winner = null;
        this.waitingForOpponent = false;
        this.isPlayerTurn = false;
        this.gameId = null;
        this.tieCards = [];

        this.emitEvent('gameReset', {});
    }

    /**
     * Event system for game updates
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Emit event to all listeners
     */
    emitEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
}

// If Node.js environment, export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}