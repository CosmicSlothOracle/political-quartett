import PoliticalCardGame from '../core/PoliticalCardGame.js';
import cardData from '../game_information_for_ai/cardData.js';

document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameContainer = document.getElementById('game-container');
    const playerHandsContainer = document.getElementById('player-hands');
    const battlefieldContainer = document.getElementById('battlefield');
    const gameStatusContainer = document.getElementById('game-status');
    const startGameBtn = document.getElementById('start-game');
    const playerSetupContainer = document.getElementById('player-setup');
    const playerCountSelect = document.getElementById('player-count');

    let game = null;
    let currentPlayerNumber = 0;

    // Initialize player setup
    function initPlayerSetup() {
        startGameBtn.addEventListener('click', setupGame);
    }

    // Set up the game with selected number of players
    function setupGame() {
        const playerCount = parseInt(playerCountSelect.value);

        if (isNaN(playerCount) || playerCount < 2 || playerCount > 4) {
            alert('Please select a valid number of players (2-4)');
            return;
        }

        // Create player names array
        const playerNames = [];
        for (let i = 0; i < playerCount; i++) {
            playerNames.push(`Player ${ i + 1 }`);
        }

        // Initialize game
        game = new PoliticalCardGame({
            initialHandSize: -1,  // Split deck evenly
            winCondition: 'mostCards'
        });
        game.init(playerNames, cardData);

        // Hide setup, show game
        playerSetupContainer.style.display = 'none';
        gameContainer.style.display = 'block';

        renderGameState();
    }

    // Render the current game state
    function renderGameState() {
        const gameState = game.getStateForUI();

        // Clear containers
        playerHandsContainer.innerHTML = '';
        battlefieldContainer.innerHTML = '';

        // Render player hands
        gameState.players.forEach((player, index) => {
            const playerHand = document.createElement('div');
            playerHand.className = 'player-hand';
            playerHand.innerHTML = `
                <h3>${ player.name } (${ player.cardCount } cards)</h3>
                <div class="cards-container" id="player-${ index }-cards"></div>
            `;

            if (player.topCard && index === currentPlayerNumber && !gameState.isGameOver) {
                const cardElement = createCardElement(player.topCard, index);
                playerHand.querySelector('.cards-container').appendChild(cardElement);
            } else if (player.cardCount > 0) {
                // Show card back
                const cardBack = document.createElement('div');
                cardBack.className = 'card card-back';
                cardBack.textContent = player.cardCount;
                playerHand.querySelector('.cards-container').appendChild(cardBack);
            }

            playerHandsContainer.appendChild(playerHand);
        });

        // Update game status
        updateGameStatus(gameState);
    }

    // Create a card element with attributes
    function createCardElement(card, playerIndex) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';

        // Create card content
        let attributesHTML = '';
        for (const [attr, value] of Object.entries(card.attributes)) {
            attributesHTML += `
                <div class="card-attribute" data-attribute="${ attr }">
                    <span class="attribute-name">${ attr }</span>:
                    <span class="attribute-value">${ value }</span>
                </div>
            `;
        }

        cardElement.innerHTML = `
            <div class="card-header">
                <h4 class="card-name">${ card.name }</h4>
            </div>
            <div class="card-image">
                <img src="${ card.image || '../images/profile-placeholder.png' }" alt="${ card.name }">
            </div>
            <div class="card-description">
                <p>${ card.description || '' }</p>
            </div>
            <div class="card-attributes">
                ${ attributesHTML }
            </div>
        `;

        // Add event listeners to attributes
        const attributeElements = cardElement.querySelectorAll('.card-attribute');
        attributeElements.forEach(attrEl => {
            attrEl.addEventListener('click', () => {
                const attribute = attrEl.dataset.attribute;
                playTurn(attribute);
            });
        });

        return cardElement;
    }

    // Play a turn with the selected attribute
    function playTurn(attribute) {
        const result = game.playTurn(attribute);

        // Display turn result in battlefield
        displayTurnResult(result);

        // Check if game is over
        if (game.isGameOver()) {
            const winner = game.getWinner();
            gameStatusContainer.innerHTML = `
                <h2>Game Over!</h2>
                <p>${ winner.name } wins the game!</p>
                <button id="new-game-btn">New Game</button>
            `;
            document.getElementById('new-game-btn').addEventListener('click', resetGame);
        } else {
            // Update current player
            currentPlayerNumber = game.gameState.players.indexOf(game.gameState.getCurrentPlayer());
            // Wait 2 seconds before updating the UI
            setTimeout(() => {
                battlefieldContainer.innerHTML = '';
                renderGameState();
            }, 2000);
        }
    }

    // Display turn result in battlefield
    function displayTurnResult(result) {
        battlefieldContainer.innerHTML = '';

        if (result.error) {
            battlefieldContainer.innerHTML = `<p class="error">${ result.error }</p>`;
            return;
        }

        const resultElement = document.createElement('div');
        resultElement.className = 'turn-result';

        // Create player and opponent card displays
        const playerCardDisplay = document.createElement('div');
        playerCardDisplay.className = 'battlefield-card';
        playerCardDisplay.innerHTML = `
            <h4>${ result.playerCard.name }</h4>
            <img src="${ result.playerCard.image || '../images/profile-placeholder.png' }" alt="${ result.playerCard.name }">
            <p>${ result.attribute }: ${ result.playerValue }</p>
        `;

        const opponentCardDisplay = document.createElement('div');
        opponentCardDisplay.className = 'battlefield-card';
        opponentCardDisplay.innerHTML = `
            <h4>${ result.opponentCard.name }</h4>
            <img src="${ result.opponentCard.image || '../images/profile-placeholder.png' }" alt="${ result.opponentCard.name }">
            <p>${ result.attribute }: ${ result.opponentValue }</p>
        `;

        // Create result indicator
        const resultIndicator = document.createElement('div');
        resultIndicator.className = 'result-indicator';

        if (result.tie) {
            resultIndicator.innerHTML = `<h3>Tie!</h3><p>${ result.cardsInPlay } cards in tie pile</p>`;
        } else {
            resultIndicator.innerHTML = `<h3>${ result.winner } wins this round!</h3>`;
        }

        // Add to battlefield
        resultElement.appendChild(playerCardDisplay);
        resultElement.appendChild(resultIndicator);
        resultElement.appendChild(opponentCardDisplay);
        battlefieldContainer.appendChild(resultElement);
    }

    // Update game status
    function updateGameStatus(gameState) {
        if (gameState.isGameOver) {
            gameStatusContainer.innerHTML = `
                <h2>Game Over!</h2>
                <p>${ gameState.winner } wins the game!</p>
                <button id="new-game-btn">New Game</button>
            `;
            document.getElementById('new-game-btn').addEventListener('click', resetGame);
        } else {
            gameStatusContainer.innerHTML = `
                <h2>Current Turn: ${ gameState.currentPlayer }</h2>
                <p>Select an attribute from your card to play</p>
                ${ gameState.tiePileCount > 0 ? `<p>Tie pile: ${ gameState.tiePileCount } cards</p>` : '' }
            `;
        }
    }

    // Reset game
    function resetGame() {
        gameContainer.style.display = 'none';
        playerSetupContainer.style.display = 'block';
        battlefieldContainer.innerHTML = '';
        gameStatusContainer.innerHTML = '';
        game = null;
    }

    // Initialize the game setup
    initPlayerSetup();
});