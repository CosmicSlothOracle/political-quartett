/**
 * Main Application for Political Quartett
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize core components
    const ui = new UI();
    const game = new Game();
    let network = null;
    let onlineMode = false;

    // Set up UI first
    ui.init();
    ui.setupGameHandlers(game);

    // Try to initialize network
    try {
        ui.updateLoadingMessage("Checking network connection...");
        console.log('Running in offline mode by default');

        /*
        // Code to enable online mode if needed in future
        network = new Network(game);
        const canConnect = await network.canConnect();
        if (canConnect) {
            try {
                ui.updateLoadingMessage("Connecting to game server...");
                await network.init();
                onlineMode = true;
                console.log('Online mode available');
            } catch (err) {
                ui.updateLoadingMessage("Connection failed, using offline mode");
                console.warn('Failed to connect:', err);
            }
        }
        */
    } catch (error) {
        ui.updateLoadingMessage("Network error, using offline mode");
        console.warn('Network initialization failed:', error);
        console.log('Running in offline mode');
    }

    // Set up UI event listeners
    document.addEventListener('ui:playOnline', async (event) => {
        if (onlineMode && network && network.connected) {
            network.createGame();
        } else {
            // Fallback to AI
            ui.updateLoadingMessage("Online mode not available, playing against AI");
            alert('Online mode is currently not available. Playing against AI instead.');
            startAIGame();
        }
    });

    document.addEventListener('ui:playAI', (event) => {
        startAIGame();
    });

    // Function to start a game against AI
    function startAIGame() {
        const aiGame = new Game(true);

        // Re-setup handlers with AI game
        ui.setupGameHandlers(aiGame);

        // Initialize the game
        aiGame.init();
    }

    document.addEventListener('ui:categorySelected', (event) => {
        const category = event.detail.category;

        if (onlineMode && network && network.connected) {
            network.sendCategorySelection(category);
        } else {
            game.selectCategory(category);

            // Add a slight delay before playing the round
            setTimeout(() => {
                try {
                    game.playRound();
                } catch (error) {
                    console.error('Error playing round:', error);
                    // Attempt recovery
                    if (!game.isAIOpponent) {
                        startAIGame();
                    }
                }
            }, 500);
        }
    });

    document.addEventListener('ui:getNextCards', (event) => {
        try {
            if (onlineMode && network && network.connected) {
                network.requestNextCards();
            } else {
                // Local game - update the UI with the current top cards
                if (game.playerCards && game.playerCards.length > 0) {
                    ui.displayCard(game.playerCards[0], ui.elements.playerCard, true);
                }

                if (game.opponentCards && game.opponentCards.length > 0) {
                    ui.displayCard(game.opponentCards[0], ui.elements.opponentCard, !game.isPlayerTurn);
                }
            }
        } catch (error) {
            console.error('Error getting next cards:', error);
        }
    });

    document.addEventListener('ui:cancelMatchmaking', (event) => {
        if (network && network.connected) {
            network.leaveGame();
        }
        ui.showScreen('mainMenu');
    });

    document.addEventListener('ui:playAgain', (event) => {
        if (onlineMode && network && network.connected) {
            ui.showScreen('matchmaking');
            network.createGame();
        } else {
            startAIGame();
        }
    });

    document.addEventListener('ui:backToMenu', (event) => {
        if (network && network.connected) {
            network.leaveGame();
        }
    });

    // Network event listeners
    document.addEventListener('network:playersCount', (event) => {
        ui.updatePlayersCount(event.detail);
    });

    document.addEventListener('network:nextCards', (event) => {
        const data = event.detail;

        if (data && data.playerCard) {
            ui.displayCard(data.playerCard, ui.elements.playerCard, true);
        }

        if (data && data.opponentCard) {
            ui.displayCard(data.opponentCard, ui.elements.opponentCard, false);
        }
    });

    document.addEventListener('network:error', (event) => {
        const error = event.detail;
        console.error('Game error:', error);

        if (error.critical) {
            alert(`Game error: ${ error.message }`);
            ui.showScreen('mainMenu');
        }
    });

    // Join game by URL parameter if present
    const urlParams = new URLSearchParams(window.location.search);
    const joinGameId = urlParams.get('join');

    if (joinGameId && onlineMode && network && network.connected) {
        network.joinGame(joinGameId);
        ui.showScreen('matchmaking');
    }

    // Handle browser navigation and tab closing
    window.addEventListener('beforeunload', () => {
        if (network && network.connected) {
            network.leaveGame();
            network.disconnect();
        }
    });
});