/**
 * GameUI.js - UI adapter for Political Quartett game
 *
 * This adapter decouples the UI from the game logic.
 * Instead of directly accessing game state, the UI subscribes
 * to events and renders based on those events.
 */
class GameUI {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.elements = {};
        this.animations = {};
        this.state = {
            playerCard: null,
            opponentCard: null,
            currentCategory: null,
            playerCardCount: 0,
            opponentCardCount: 0,
            tieCardCount: 0,
            isPlayerTurn: false,
            inAnimation: false
        };
    }

    /**
     * Initialize the UI
     * @param {Object} elements - DOM elements
     */
    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
        this.render();
    }

    /**
     * Set up event listeners for game events
     */
    setupEventListeners() {
        if (!this.eventEmitter) return;

        // Game state events
        this.eventEmitter.on('gameInitialized', (data) => {
            this.handleGameInitialized(data);
        });

        this.eventEmitter.on('gameStateSynced', (data) => {
            this.handleGameStateSynced(data);
        });

        this.eventEmitter.on('roundPlayed', (data) => {
            this.handleRoundPlayed(data);
        });

        this.eventEmitter.on('categorySelected', (data) => {
            this.handleCategorySelected(data);
        });

        this.eventEmitter.on('gameStarted', (data) => {
            this.handleGameStarted(data);
        });

        this.eventEmitter.on('waitingForOpponent', (data) => {
            this.handleWaitingForOpponent(data);
        });

        this.eventEmitter.on('opponentJoined', (data) => {
            this.handleOpponentJoined(data);
        });

        this.eventEmitter.on('gameReset', (data) => {
            this.handleGameReset(data);
        });
    }

    /**
     * Handle game initialized event
     * @param {Object} data - Game state data
     */
    handleGameInitialized(data) {
        this.state.playerCardCount = data.playerCards.length;
        this.state.opponentCardCount = data.opponentCards.length;
        this.state.tieCardCount = data.tieCards ? data.tieCards.length : 0;
        this.state.isPlayerTurn = data.isPlayerTurn;
        this.state.playerCard = data.playerCards[0] || null;
        this.state.opponentCard = null; // Don't show opponent card initially

        this.updateStatusMessage(
            data.isPlayerTurn
                ? "Your turn! Select a category from your card."
                : "Opponent's turn. Waiting for them to select a category..."
        );

        this.render();
    }

    /**
     * Handle game state synced event
     * @param {Object} data - Game state data
     */
    handleGameStateSynced(data) {
        this.state.playerCardCount = data.playerCards.length;
        this.state.opponentCardCount = data.opponentCards.length;
        this.state.tieCardCount = data.tieCards.length;
        this.state.isPlayerTurn = data.isPlayerTurn;
        this.state.playerCard = data.playerCards[0] || null;

        // Only show opponent card if it was revealed in a round
        if (this.state.opponentCard) {
            this.state.opponentCard = data.opponentCards[0] || null;
        }

        if (data.gameOver) {
            const winner = data.winner === 'player' ? 'You win!' : 'Opponent wins!';
            this.updateStatusMessage(`Game over! ${ winner }`);
        } else {
            this.updateStatusMessage(
                data.isPlayerTurn
                    ? "Your turn! Select a category from your card."
                    : "Opponent's turn. Waiting for them to select a category..."
            );
        }

        this.render();
    }

    /**
     * Handle round played event
     * @param {Object} data - Round result data
     */
    handleRoundPlayed(data) {
        // Update state with round results
        this.state.currentCategory = data.category;
        this.state.playerCard = data.playerCard;
        this.state.opponentCard = data.opponentCard;
        this.state.playerCardCount = data.playerCardCount;
        this.state.opponentCardCount = data.opponentCardCount;
        this.state.isPlayerTurn = data.nextTurn === 'player';

        // Start round result animation
        this.animateRoundResult(data);
    }

    /**
     * Handle category selected event
     * @param {Object} data - Category data
     */
    handleCategorySelected(data) {
        this.state.currentCategory = data.category;
        this.highlightSelectedCategory(data.category);
        this.updateStatusMessage(`Comparing ${ data.category }...`);
    }

    /**
     * Handle game started event
     * @param {Object} data - Game data
     */
    handleGameStarted(data) {
        const gameTypeMsg = data.isAIGame ? 'AI opponent' : 'online opponent';
        this.updateStatusMessage(`Game started with ${ gameTypeMsg }!`);

        if (this.elements.gameBoard) {
            this.elements.gameBoard.classList.remove('waiting');
        }

        this.render();
    }

    /**
     * Handle waiting for opponent event
     * @param {Object} data - Game data
     */
    handleWaitingForOpponent(data) {
        this.updateStatusMessage('Waiting for an opponent to join...');

        if (this.elements.gameBoard) {
            this.elements.gameBoard.classList.add('waiting');
        }

        if (this.elements.inviteCode && data.gameId) {
            this.elements.inviteCode.textContent = data.gameId;
        }

        this.render();
    }

    /**
     * Handle opponent joined event
     * @param {Object} data - Game data
     */
    handleOpponentJoined(data) {
        this.updateStatusMessage('Opponent joined! Game starting...');

        if (this.elements.gameBoard) {
            this.elements.gameBoard.classList.remove('waiting');
        }

        this.render();
    }

    /**
     * Handle game reset event
     */
    handleGameReset() {
        this.state = {
            playerCard: null,
            opponentCard: null,
            currentCategory: null,
            playerCardCount: 0,
            opponentCardCount: 0,
            tieCardCount: 0,
            isPlayerTurn: false,
            inAnimation: false
        };

        this.updateStatusMessage('Game reset. Start a new game!');
        this.render();
    }

    /**
     * Update the status message
     * @param {String} message - Status message
     */
    updateStatusMessage(message) {
        if (this.elements.statusMessage) {
            this.elements.statusMessage.textContent = message;
        }
    }

    /**
     * Highlight the selected category
     * @param {String} category - Selected category
     */
    highlightSelectedCategory(category) {
        if (!this.elements.playerCard) return;

        // Remove highlight from all categories
        const categories = this.elements.playerCard.querySelectorAll('.category');
        categories.forEach(cat => cat.classList.remove('selected'));

        // Add highlight to selected category
        const selectedCategory = this.elements.playerCard.querySelector(
            `.category[data-category="${ category }"]`
        );

        if (selectedCategory) {
            selectedCategory.classList.add('selected');
        }
    }

    /**
     * Animate round result
     * @param {Object} data - Round result data
     */
    animateRoundResult(data) {
        this.state.inAnimation = true;

        // 1. Show both cards
        this.renderCards();

        // 2. Highlight the compared category
        this.highlightSelectedCategory(data.category);

        // 3. Display round result
        setTimeout(() => {
            let resultMessage;

            if (data.result === 'player') {
                resultMessage = `You win the round with ${ data.category }!`;
                this.animateCardsToWinner('player');
            } else if (data.result === 'opponent') {
                resultMessage = `Opponent wins the round with ${ data.category }!`;
                this.animateCardsToWinner('opponent');
            } else {
                resultMessage = `Tie on ${ data.category }! Cards go to tie pile.`;
                this.animateCardsToTiePile();
            }

            this.updateStatusMessage(resultMessage);

            // 4. Update card counts
            setTimeout(() => {
                this.state.playerCardCount = data.playerCardCount;
                this.state.opponentCardCount = data.opponentCardCount;
                this.renderCardCounts();

                // 5. Hide opponent card again if game continues
                setTimeout(() => {
                    if (!data.gameOver) {
                        this.state.opponentCard = null;
                        this.renderOpponentCard();

                        // 6. Show turn information
                        const turnMessage = data.nextTurn === 'player'
                            ? "Your turn! Select a category from your card."
                            : "Opponent's turn. Waiting for them to select a category...";

                        this.updateStatusMessage(turnMessage);
                    } else {
                        // Game over message
                        const winnerMessage = data.winner === 'player'
                            ? "Game over! You win!"
                            : "Game over! Opponent wins!";

                        this.updateStatusMessage(winnerMessage);
                    }

                    this.state.inAnimation = false;
                }, 1000);
            }, 1000);
        }, 1000);
    }

    /**
     * Animate cards being moved to winner
     * @param {String} winner - 'player' or 'opponent'
     */
    animateCardsToWinner(winner) {
        // Implementation depends on the UI animation system
        // This is a simplified version
        if (winner === 'player' && this.elements.playerCard && this.elements.opponentCard) {
            this.elements.opponentCard.classList.add('move-to-player');
            setTimeout(() => {
                this.elements.opponentCard.classList.remove('move-to-player');
            }, 1000);
        } else if (winner === 'opponent' && this.elements.playerCard && this.elements.opponentCard) {
            this.elements.playerCard.classList.add('move-to-opponent');
            setTimeout(() => {
                this.elements.playerCard.classList.remove('move-to-opponent');
            }, 1000);
        }
    }

    /**
     * Animate cards being moved to tie pile
     */
    animateCardsToTiePile() {
        // Implementation depends on the UI animation system
        // This is a simplified version
        if (this.elements.playerCard && this.elements.opponentCard) {
            this.elements.playerCard.classList.add('move-to-tie');
            this.elements.opponentCard.classList.add('move-to-tie');
            setTimeout(() => {
                this.elements.playerCard.classList.remove('move-to-tie');
                this.elements.opponentCard.classList.remove('move-to-tie');
            }, 1000);
        }
    }

    /**
     * Render the UI
     */
    render() {
        this.renderCards();
        this.renderCardCounts();
        this.renderGameControls();
    }

    /**
     * Render player and opponent cards
     */
    renderCards() {
        this.renderPlayerCard();
        this.renderOpponentCard();
    }

    /**
     * Render player's card
     */
    renderPlayerCard() {
        if (!this.elements.playerCard) return;

        if (this.state.playerCard) {
            this.elements.playerCard.innerHTML = this.generateCardHTML(
                this.state.playerCard,
                'player'
            );
            this.elements.playerCard.classList.remove('empty-card');
        } else {
            this.elements.playerCard.innerHTML = '<div class="card-content">No Cards</div>';
            this.elements.playerCard.classList.add('empty-card');
        }
    }

    /**
     * Render opponent's card
     */
    renderOpponentCard() {
        if (!this.elements.opponentCard) return;

        if (this.state.opponentCard) {
            this.elements.opponentCard.innerHTML = this.generateCardHTML(
                this.state.opponentCard,
                'opponent'
            );
            this.elements.opponentCard.classList.remove('card-back', 'empty-card');
        } else if (this.state.opponentCardCount > 0) {
            this.elements.opponentCard.innerHTML = '<div class="card-content">Opponent\'s Card</div>';
            this.elements.opponentCard.classList.add('card-back');
            this.elements.opponentCard.classList.remove('empty-card');
        } else {
            this.elements.opponentCard.innerHTML = '<div class="card-content">No Cards</div>';
            this.elements.opponentCard.classList.add('empty-card');
            this.elements.opponentCard.classList.remove('card-back');
        }
    }

    /**
     * Render card counts
     */
    renderCardCounts() {
        if (this.elements.playerCardCount) {
            this.elements.playerCardCount.textContent = this.state.playerCardCount;
        }

        if (this.elements.opponentCardCount) {
            this.elements.opponentCardCount.textContent = this.state.opponentCardCount;
        }

        if (this.elements.tieCardCount) {
            this.elements.tieCardCount.textContent = this.state.tieCardCount;
        }
    }

    /**
     * Render game controls
     */
    renderGameControls() {
        if (!this.elements.categoryButtons) return;

        // Clear existing buttons
        this.elements.categoryButtons.innerHTML = '';

        if (!this.state.playerCard || !this.state.isPlayerTurn) {
            return;
        }

        // Create buttons for each category
        for (const category in this.state.playerCard.stats) {
            const button = document.createElement('button');
            button.textContent = this.formatCategoryName(category);
            button.dataset.category = category;
            button.disabled = this.state.inAnimation;

            // Add click event
            button.addEventListener('click', () => {
                this.handleCategoryButtonClick(category);
            });

            this.elements.categoryButtons.appendChild(button);
        }
    }

    /**
     * Format category name
     * @param {String} category - Category name
     * @returns {String} - Formatted category name
     */
    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
    }

    /**
     * Handle category button click
     * @param {String} category - Selected category
     */
    handleCategoryButtonClick(category) {
        // Disable all buttons during animation
        if (this.elements.categoryButtons) {
            const buttons = this.elements.categoryButtons.querySelectorAll('button');
            buttons.forEach(button => button.disabled = true);
        }

        // Emit event to notify game logic
        if (this.eventEmitter) {
            this.eventEmitter.emit('ui:categorySelected', { category });
        }
    }

    /**
     * Generate HTML for a card
     * @param {Object} card - Card data
     * @param {String} owner - 'player' or 'opponent'
     * @returns {String} - Card HTML
     */
    generateCardHTML(card, owner) {
        let html = `<div class="card-content">
            <div class="card-header">
                <h3>${ card.name }</h3>
            </div>
            <div class="card-image">
                <img src="${ card.image || 'images/placeholder.jpg' }" alt="${ card.name }">
            </div>`;

        if (card.description) {
            html += `<div class="card-quote">"${ card.description }"</div>`;
        }

        html += '<ul class="card-stats">';

        // Add stats
        for (const [category, value] of Object.entries(card.stats)) {
            const isHighlighted = category === this.state.currentCategory ? 'highlighted' : '';
            const isClickable = owner === 'player' && this.state.isPlayerTurn ? 'clickable' : '';

            html += `<li class="category ${ isHighlighted } ${ isClickable }" data-category="${ category }">${ this.formatCategoryName(category) }: <span>${ value }</span></li>`;
        }

        html += `</ul></div>`;
        return html;
    }
}

export default GameUI;