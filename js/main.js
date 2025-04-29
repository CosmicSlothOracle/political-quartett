/**
 * Main application file for Political Quartett
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Running in offline mode by default');

    // Initialize game objects
    const game = new Game();
    const network = new Network(game);
    const lobbySystem = new LobbySystem(game, network);
    const ui = new UI();

    // UI Elements - Main Menu
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.getElementById('main-menu');
    const playButton = document.getElementById('play-button');
    const playAiButton = document.getElementById('play-ai-button');
    const lobbyButton = document.getElementById('lobby-button');
    const rulesButton = document.getElementById('rules-button');
    const playerCountElement = document.getElementById('player-count');

    // Toast container
    const toastContainer = document.getElementById('toast-container');

    // Initialize connection status
    let connectionStatus = false;

    // Initialize the game
    async function init() {
        try {
            // Try to connect to the server
            await network.init();

            // Update UI to reflect connection status
            connectionStatus = network.connected;
            if (connectionStatus) {
                document.getElementById('loading-message').textContent = 'Connected to server. Loading game...';
                showToast('Connected to server', 'success');
                // Set up UI for online mode
                playButton.disabled = false;
                lobbyButton.disabled = false;
            } else {
                document.getElementById('loading-message').textContent = 'Could not connect to server. Falling back to offline mode.';
                showToast('Running in offline mode', 'warning');
                // Disable online features
                playButton.disabled = true;
                lobbyButton.disabled = true;
            }

            // Initialize UI
            ui.init();

            // Setup game handlers with the UI
            ui.setupGameHandlers(game);

            // Check for invite code in URL (for direct game joining)
            handleDirectGameLink();

            // Show main menu after a short delay
            setTimeout(() => {
                loadingScreen.classList.remove('active');
                mainMenu.classList.add('active');
            }, 1000);
        } catch (error) {
            console.error('Failed to initialize:', error);
            document.getElementById('loading-message').textContent = 'Failed to connect. Playing in offline mode.';

            // Disable online features
            playButton.disabled = true;
            lobbyButton.disabled = true;

            // Initialize UI for offline mode
            ui.init();
            ui.setupGameHandlers(game);

            // Show main menu in offline mode
            setTimeout(() => {
                loadingScreen.classList.remove('active');
                mainMenu.classList.add('active');
            }, 1000);
        }
    }

    // Handle direct game links
    function handleDirectGameLink() {
        // Check if user was invited to a game
        document.addEventListener('network:inviteCodeFound', (event) => {
            const { inviteCode } = event.detail;
            if (inviteCode) {
                showToast(`Joining game with code: ${ inviteCode }`, 'info');
                setTimeout(() => {
                    network.joinGameByInvite(inviteCode);
                }, 1500);
            }
        });
    }

    // Show a toast notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${ type }`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    // Setup UI event handlers
    function setupEventListeners() {
        // Event listeners for main menu
        playButton.addEventListener('click', () => {
            if (connectionStatus) {
                network.createGame();
                showToast('Finding a match...', 'info');
            } else {
                showToast('Server not available. Try playing vs AI.', 'error');
            }
        });

        playAiButton.addEventListener('click', () => {
            // Start a game against AI
            const aiGame = new Game(true);
            aiGame.init();

            // Setup UI for AI game
            ui.setupGameHandlers(aiGame);
            ui.showScreen('game-screen');

            showToast('Starting game vs AI', 'success');
        });

        lobbyButton.addEventListener('click', () => {
            if (connectionStatus) {
                // Show the lobby screen
                lobbySystem.showLobbyScreen();
            } else {
                showToast('Cannot access lobbies: Server not available', 'error');
            }
        });

        rulesButton.addEventListener('click', () => {
            // Show game rules screen
            ui.showScreen('rules-screen');
            showToast('Viewing game rules', 'info');
        });

        // Network event listeners
        document.addEventListener('network:playersCount', (event) => {
            const count = event.detail.count;
            playerCountElement.textContent = `${ count } player${ count !== 1 ? 's' : '' } online`;
        });

        document.addEventListener('network:error', (event) => {
            const { message, critical } = event.detail;
            showToast(message, critical ? 'error' : 'warning');
        });

        document.addEventListener('network:disconnected', () => {
            connectionStatus = false;
            showToast('Disconnected from server', 'error');
        });

        document.addEventListener('network:reconnected', () => {
            connectionStatus = true;
            showToast('Reconnected to server', 'success');
        });

        // Add back-to-menu button handler for rules screen
        document.getElementById('back-to-menu').addEventListener('click', () => {
            ui.showScreen('main-menu');
        });
    }

    // Start the initialization process
    init().then(() => {
        setupEventListeners();
    });
});