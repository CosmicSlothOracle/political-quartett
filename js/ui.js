/**
 * UI Handler for Political Quartett
 */
class UI {
    constructor() {
        // Screen elements
        this.screens = {
            loading: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            matchmaking: document.getElementById('matchmaking-screen'),
            game: document.getElementById('game-screen'),
            rules: document.getElementById('rules-screen'),
            gameOver: document.getElementById('game-over-screen')
        };

        // Game elements
        this.elements = {
            playerCard: document.getElementById('player-card'),
            opponentCard: document.getElementById('opponent-card'),
            categorySelection: document.getElementById('category-selection'),
            battleResult: document.getElementById('battle-result'),
            turnIndicator: document.getElementById('turn-indicator'),
            playerCardsCount: document.getElementById('player-cards-count'),
            opponentCardsCount: document.getElementById('opponent-cards-count'),
            opponentName: document.getElementById('opponent-name'),
            playersCount: document.getElementById('players-count'),
            resultMessage: document.getElementById('result-message'),
            resultDetails: document.getElementById('result-details')
        };

        // Buttons
        this.buttons = {
            playButton: document.getElementById('play-button'),
            playAIButton: document.getElementById('play-ai-button'),
            rulesButton: document.getElementById('rules-button'),
            backToMenu: document.getElementById('back-to-menu'),
            cancelMatchmaking: document.getElementById('cancel-matchmaking'),
            playAgain: document.getElementById('play-again'),
            backToMenuEnd: document.getElementById('back-to-menu-end')
        };

        // Category buttons (will be created dynamically)
        this.categoryButtons = {};

        // UI state
        this.currentScreen = 'loading';
        this.selectedCategory = null;
        this.roundInProgress = false;
    }

    /**
     * Initialize the UI
     */
    init() {
        // Setup event listeners for buttons
        this.setupButtonListeners();

        // Switch to main menu after loading
        setTimeout(() => this.showScreen('mainMenu'), 1500);
    }

    /**
     * Setup button event listeners
     */
    setupButtonListeners() {
        // Main menu buttons
        this.buttons.playButton.addEventListener('click', () => this.handlePlayOnline());
        this.buttons.playAIButton.addEventListener('click', () => this.handlePlayAI());
        this.buttons.rulesButton.addEventListener('click', () => this.showScreen('rules'));

        // Rules screen
        this.buttons.backToMenu.addEventListener('click', () => this.showScreen('mainMenu'));

        // Matchmaking screen
        this.buttons.cancelMatchmaking.addEventListener('click', () => {
            this.emitEvent('cancelMatchmaking');
            this.showScreen('mainMenu');
        });

        // Game over screen
        this.buttons.playAgain.addEventListener('click', () => {
            this.emitEvent('playAgain');
        });
        this.buttons.backToMenuEnd.addEventListener('click', () => {
            this.emitEvent('backToMenu');
            this.showScreen('mainMenu');
        });
    }

    /**
     * Set up handlers for game events
     * @param {Game} game - Game instance
     */
    setupGameHandlers(game) {
        // Set up category selection
        this.createCategoryButtons();

        // Game event listeners
        game.on('gameInitialized', (data) => this.handleGameInitialized(data));
        game.on('categorySelected', (data) => this.handleCategorySelected(data));
        game.on('roundPlayed', (data) => this.handleRoundPlayed(data));
        game.on('waitingForOpponent', (data) => this.handleWaitingForOpponent(data));
        game.on('opponentJoined', (data) => this.handleOpponentJoined(data));
        game.on('gameStateUpdated', (data) => this.updateGameUI(data));
    }

    /**
     * Create category selection buttons
     */
    createCategoryButtons() {
        // Clear existing buttons
        this.elements.categorySelection.innerHTML = '';
        this.categoryButtons = {};

        // Category names
        const categories = ['charisma', 'leadership', 'influence', 'integrity', 'trickery', 'wealth'];

        // Create a button for each category
        categories.forEach(category => {
            const button = document.createElement('button');
            button.classList.add('category-button');
            button.dataset.category = category;

            // Capitalize first letter for display
            const displayName = category.charAt(0).toUpperCase() + category.slice(1);
            button.textContent = displayName;

            // Add click handler
            button.addEventListener('click', () => {
                if (this.roundInProgress) return;

                this.selectedCategory = category;
                this.emitEvent('categorySelected', { category });
            });

            this.elements.categorySelection.appendChild(button);
            this.categoryButtons[category] = button;
        });
    }

    /**
     * Display a card on the UI
     */
    displayCard(card, cardElement, showStats = true) {
        if (!card) {
            cardElement.innerHTML = '<div class="empty-card">No card</div>';
            return;
        }

        // Use the pre-rendered card image with values already displayed on it
        cardElement.innerHTML = `
            <div class="card-header">${ card.name }</div>
            <div class="card-image" style="background-image: url('${ card.image }'); background-size: contain; background-repeat: no-repeat;"></div>
            <div class="card-controls">
                ${ showStats ? this.renderCategoryButtons(card) : '<div class="hidden-stats">?</div>' }
            </div>
            <div class="card-quote">"${ card.quote }"</div>
        `;
    }

    /**
     * Render category buttons for the player's card
     */
    renderCategoryButtons(card) {
        if (!card || !card.stats) return '';

        let buttonsHTML = '';
        const categories = Object.keys(card.stats);

        for (const category of categories) {
            const isSelected = this.selectedCategory === category;

            buttonsHTML += `
                <button class="category-button ${isSelected ? 'selected' : ''}" data-category="${category}">
                    ${category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
            `;
        }

        return buttonsHTML;
    }

    /**
     * Highlight the selected category
     */
    highlightSelectedCategory(category) {
        // Reset all buttons
        Object.values(this.categoryButtons).forEach(button => {
            button.classList.remove('selected');
        });

        // Highlight the selected one
        if (category && this.categoryButtons[category]) {
            this.categoryButtons[category].classList.add('selected');
        }
    }

    /**
     * Handle "Play Online" button click
     */
    handlePlayOnline() {
        this.showScreen('matchmaking');
        this.emitEvent('playOnline');
    }

    /**
     * Handle "Play vs AI" button click
     */
    handlePlayAI() {
        this.showScreen('game');
        this.emitEvent('playAI');
    }

    /**
     * Handle game initialization
     */
    handleGameInitialized(data) {
        this.showScreen('game');
        this.roundInProgress = false;
        this.selectedCategory = null;

        // Update card counts
        this.elements.playerCardsCount.textContent = data.playerCards.length;
        this.elements.opponentCardsCount.textContent = data.opponentCards.length;

        // Display player's top card
        this.displayCard(data.playerCards[0], this.elements.playerCard, true);

        // Display opponent's card (hidden stats)
        this.displayCard(data.opponentCards[0], this.elements.opponentCard, false);

        // Update turn indicator
        this.updateTurnIndicator(data.isPlayerTurn);

        // Enable/disable category buttons based on turn
        this.updateCategoryButtons(data.isPlayerTurn);

        // Clear battle result
        this.elements.battleResult.innerHTML = '';
    }

    /**
     * Handle category selection event
     */
    handleCategorySelected(data) {
        this.selectedCategory = data.category;
        this.highlightSelectedCategory(data.category);

        // Disable all category buttons during the round
        this.roundInProgress = true;
        this.updateCategoryButtons(false);
    }

    /**
     * Handle round played event
     */
    handleRoundPlayed(data) {
        // Show opponent's card stats
        this.displayCard(data.opponentCard, this.elements.opponentCard, true);

        // Update counts
        this.elements.playerCardsCount.textContent = data.playerCardCount;
        this.elements.opponentCardsCount.textContent = data.opponentCardCount;

        // Display result
        let resultText;
        let resultClass;

        if (data.result === 'player') {
            resultText = 'You Win!';
            resultClass = 'win';
        } else if (data.result === 'opponent') {
            resultText = 'Opponent Wins!';
            resultClass = 'lose';
        } else {
            resultText = 'Tie!';
            resultClass = 'tie';
        }

        this.elements.battleResult.innerHTML = `
            <div class="result ${ resultClass }">
                ${ resultText }<br>
                <span class="result-details">
                    ${ data.category }: ${ data.playerValue } vs ${ data.opponentValue }
                </span>
            </div>
        `;

        // If game over, show game over screen after a delay
        if (data.gameOver) {
            setTimeout(() => {
                this.showGameOverScreen(data);
            }, 2000);
            return;
        }

        // After a delay, prepare for next round
        setTimeout(() => {
            this.prepareNextRound(data);
        }, 2000);
    }

    /**
     * Prepare UI for next round
     */
    prepareNextRound(data) {
        this.roundInProgress = false;
        this.selectedCategory = null;

        // Clear highlight
        this.highlightSelectedCategory(null);

        // Update turn indicator
        const isPlayerTurn = data.nextTurn === 'player';
        this.updateTurnIndicator(isPlayerTurn);

        // Enable/disable category buttons
        this.updateCategoryButtons(isPlayerTurn);

        // Clear battle result
        this.elements.battleResult.innerHTML = '';

        // Show next cards
        if (data.playerCardCount > 0) {
            this.emitEvent('getNextCards');
        }
    }

    /**
     * Update turn indicator
     */
    updateTurnIndicator(isPlayerTurn) {
        this.elements.turnIndicator.textContent = isPlayerTurn ? 'Your Turn' : 'Opponent\'s Turn';
        this.elements.turnIndicator.className = isPlayerTurn ? 'player-turn' : 'opponent-turn';
    }

    /**
     * Enable/disable category buttons based on turn
     */
    updateCategoryButtons(enabled) {
        Object.values(this.categoryButtons).forEach(button => {
            button.disabled = !enabled;
            button.style.opacity = enabled ? '1' : '0.5';
        });
    }

    /**
     * Handle waiting for opponent
     */
    handleWaitingForOpponent(data) {
        this.showScreen('matchmaking');
        if (data.gameId) {
            console.log(`Game ID: ${ data.gameId }`);
        }
    }

    /**
     * Handle opponent joined event
     */
    handleOpponentJoined(data) {
        this.elements.opponentName.textContent = 'Opponent';
        this.showScreen('game');
    }

    /**
     * Update the game UI with new state
     */
    updateGameUI(data) {
        // Update card counts
        if (data.playerCardCount !== undefined) {
            this.elements.playerCardsCount.textContent = data.playerCardCount;
        }

        if (data.opponentCardCount !== undefined) {
            this.elements.opponentCardsCount.textContent = data.opponentCardCount;
        }

        // Update cards if provided
        if (data.playerTopCard) {
            this.displayCard(data.playerTopCard, this.elements.playerCard, true);
        }

        if (data.opponentTopCard) {
            this.displayCard(data.opponentTopCard, this.elements.opponentCard,
                data.revealOpponentCard || false);
        }

        // Update turn indicator
        if (data.isPlayerTurn !== undefined) {
            this.updateTurnIndicator(data.isPlayerTurn);
            this.updateCategoryButtons(data.isPlayerTurn && !this.roundInProgress);
        }
    }

    /**
     * Show game over screen
     */
    showGameOverScreen(data) {
        this.elements.resultMessage.textContent = data.winner === 'player' ? 'You Win!' : 'You Lose!';
        this.elements.resultDetails.textContent = `Final score: You ${ data.playerCardCount } - Opponent ${ data.opponentCardCount }`;

        this.showScreen('gameOver');
    }

    /**
     * Update players in queue count
     */
    updatePlayersCount(count) {
        this.elements.playersCount.textContent = count;
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }

    /**
     * Event emitter for UI actions
     */
    emitEvent(event, data = {}) {
        const customEvent = new CustomEvent(`ui:${ event }`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }

    /**
     * Update loading message
     */
    updateLoadingMessage(message) {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }
}

// If Node.js environment, export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI };
}