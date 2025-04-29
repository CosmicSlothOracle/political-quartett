/**
 * game-new.js - Political Quartett Game Main Class
 *
 * This file ties together all the modular components for the game:
 * - Game engine (core logic)
 * - Game commands (player actions)
 * - Game events (event system)
 * - Network manager (communication)
 * - Game UI (user interface adapter)
 */
import GameEngine from '../core/GameEngine.js';
import GameCommands from '../core/GameCommands.js';
import GameEvents from '../core/GameEvents.js';
import NetworkManager from '../core/NetworkManager.js';
import GameUI from '../core/GameUI.js';

// Import card data
import { CARD_DATA } from './card-data.js';

/**
 * Main Game class for Political Quartett
 */
class PoliticalQuartett {
    constructor() {
        // Create the event system first, as it's needed by other components
        this.events = new GameEvents();

        // Create core game components
        this.engine = new GameEngine();
        this.commands = new GameCommands(this.engine, this.events);
        this.network = new NetworkManager(this.events);
        this.ui = new GameUI(this.events);

        // Set up UI->Commands binding
        this.setupUIEventListeners();

        // Set up Network->Commands binding
        this.setupNetworkEventListeners();
    }

    /**
     * Initialize the game system
     * @param {Object} uiElements - DOM elements for the UI
     */
    async init(uiElements) {
        // Initialize UI
        this.ui.init(uiElements);

        // Initialize network connection
        try {
            await this.network.init();
            console.log('Network initialized successfully');
        } catch (error) {
            console.error('Failed to initialize network:', error);
            // Continue in offline mode
        }

        // Check URL for invite code
        this.checkInviteCodeInURL();
    }

    /**
     * Set up event listeners for UI events
     */
    setupUIEventListeners() {
        this.events.on('ui:categorySelected', (data) => {
            const { category } = data;

            if (this.commands.selectCategory(category)) {
                // If online game, send to server
                if (this.commands.isOnlineGame) {
                    this.network.sendCategorySelection(category);
                } else {
                    // In local game, play the round immediately
                    this.commands.playRound(category);
                }
            }
        });

        this.events.on('ui:startAIGame', () => {
            this.startAIGame();
        });

        this.events.on('ui:startOnlineGame', () => {
            this.createGame();
        });

        this.events.on('ui:joinGame', (data) => {
            this.joinGame(data.gameId);
        });

        this.events.on('ui:resetGame', () => {
            this.resetGame();
        });
    }

    /**
     * Set up event listeners for network events
     */
    setupNetworkEventListeners() {
        // Game creation/joining events
        this.events.on('gameCreated', (data) => {
            console.log('Game created:', data);
        });

        this.events.on('playerJoined', (data) => {
            this.commands.opponentJoined(data.gameId, CARD_DATA);
        });

        this.events.on('gameStarted', (data) => {
            if (data.gameState) {
                this.commands.syncGameState(data.gameState);
            }
        });

        // Game state events
        this.events.on('gameState', (data) => {
            this.commands.syncGameState(data.gameState);
        });

        this.events.on('opponentMove', (data) => {
            if (data.moveType === 'category_selection') {
                this.commands.selectCategory(data.category);
                this.commands.playRound(data.category);
            }
        });

        this.events.on('reconnectState', (data) => {
            this.commands.syncGameState(data.gameState);
        });

        // Connection events
        this.events.on('networkDisconnected', () => {
            // Handle disconnect UI updates
            console.log('Disconnected from server');
        });

        this.events.on('networkReconnected', () => {
            console.log('Reconnected to server');
        });

        this.events.on('inviteCodeFound', (data) => {
            this.joinGameByInvite(data.inviteCode);
        });
    }

    /**
     * Check for invite code in URL
     */
    checkInviteCodeInURL() {
        // The network manager already checks this, we just need to ensure
        // it's called during initialization
    }

    /**
     * Start a game against the AI
     */
    startAIGame() {
        this.commands.startAIGame(CARD_DATA);
    }

    /**
     * Create a new online game
     */
    createGame() {
        this.network.createGame();
    }

    /**
     * Join an existing game
     * @param {String} gameId - Game ID to join
     */
    joinGame(gameId) {
        this.network.joinGame(gameId);
    }

    /**
     * Join a game by invite code
     * @param {String} inviteCode - Invite code
     */
    joinGameByInvite(inviteCode) {
        this.network.joinLobbyByCode(inviteCode);
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.commands.resetGame();
    }

    /**
     * Get a shareable invite link
     * @returns {String|null} - Invite link or null
     */
    getInviteLink() {
        return this.network.getInviteLink();
    }
}

// Create global instance
window.Game = new PoliticalQuartett();

// Export for ES modules
export default window.Game;