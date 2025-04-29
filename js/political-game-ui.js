/**
 * Political Game UI - A simple web interface for the political card game
 */
import PoliticalCardGame from '../core/PoliticalCardGame.js';

// Political cards data
const politicalCards = [
    {
        name: "Angela Merkel",
        quote: "Freedom is the very essence of our economy and society.",
        attributes: {
            leadership: 9,
            diplomacy: 8,
            popularity: 7,
            experience: 10,
            charisma: 6
        },
        image: "images/merkel.jpg"
    },
    {
        name: "Emmanuel Macron",
        quote: "We need Europe, not just a collection of national interests.",
        attributes: {
            leadership: 7,
            diplomacy: 8,
            popularity: 6,
            experience: 5,
            charisma: 8
        },
        image: "images/macron.jpg"
    },
    {
        name: "Boris Johnson",
        quote: "My chances of being PM are about as good as the chances of finding Elvis.",
        attributes: {
            leadership: 6,
            diplomacy: 5,
            popularity: 6,
            experience: 7,
            charisma: 8
        },
        image: "images/johnson.jpg"
    },
    {
        name: "Joe Biden",
        quote: "No fundamental social change occurs merely because government acts.",
        attributes: {
            leadership: 7,
            diplomacy: 8,
            popularity: 6,
            experience: 10,
            charisma: 7
        },
        image: "images/biden.jpg"
    },
    {
        name: "Vladimir Putin",
        quote: "The collapse of the Soviet Union was the greatest geopolitical catastrophe of the century.",
        attributes: {
            leadership: 8,
            diplomacy: 6,
            popularity: 7,
            experience: 9,
            charisma: 6
        },
        image: "images/putin.jpg"
    },
    {
        name: "Justin Trudeau",
        quote: "Diversity is Canada's strength.",
        attributes: {
            leadership: 7,
            diplomacy: 8,
            popularity: 7,
            experience: 6,
            charisma: 9
        },
        image: "images/trudeau.jpg"
    },
    {
        name: "Narendra Modi",
        quote: "India's youth can bring about change and contribute to nation-building in a big way.",
        attributes: {
            leadership: 8,
            diplomacy: 7,
            popularity: 9,
            experience: 8,
            charisma: 8
        },
        image: "images/modi.jpg"
    },
    {
        name: "Jacinda Ardern",
        quote: "I never, ever grew up as a young woman believing that my gender would stand in the way of doing anything I wanted.",
        attributes: {
            leadership: 8,
            diplomacy: 9,
            popularity: 8,
            experience: 6,
            charisma: 9
        },
        image: "images/ardern.jpg"
    }
];

// Game instance
let game = null;

// DOM elements
const gameBoard = document.getElementById('game-board');
const playerCard = document.getElementById('player-card');
const opponentCard = document.getElementById('opponent-card');
const playerCardCount = document.getElementById('player-card-count');
const opponentCardCount = document.getElementById('opponent-card-count');
const tiePileCount = document.getElementById('tie-pile-count');
const attributeButtons = document.getElementById('attribute-buttons');
const resultDisplay = document.getElementById('result-display');
const startButton = document.getElementById('start-game');
const gameStatus = document.getElementById('game-status');

// Initialize game
function initGame() {
    game = new PoliticalCardGame({
        initialHandSize: -1, // Split deck evenly
        winCondition: 'allCards'
    });

    game.init(['Player', 'Computer'], politicalCards);

    // Update UI
    updateGameBoard();

    // Show attribute buttons
    populateAttributeButtons();

    gameStatus.textContent = 'Game started! Select an attribute to compare.';
    startButton.disabled = true;
}

// Update game board display
function updateGameBoard() {
    // Get current state
    const state = game.getStateForUI();

    // Update card counts
    playerCardCount.textContent = state.players[0].cardCount;
    opponentCardCount.textContent = state.players[1].cardCount;
    tiePileCount.textContent = state.tiePileCount;

    // Update player's top card if available
    if (state.players[0].topCard) {
        const card = state.players[0].topCard;
        playerCard.innerHTML = generateCardHTML('player', card);
    } else {
        playerCard.innerHTML = '<div class="empty-card">No Cards</div>';
    }

    // Update opponent's top card if it's been revealed
    if (state.players[1].topCard && game.lastResult) {
        const card = state.players[1].topCard;
        opponentCard.innerHTML = generateCardHTML('opponent', card);
    } else {
        opponentCard.innerHTML = '<div class="card card-back">Computer\'s Card</div>';
    }

    // Check for game over
    if (state.isGameOver) {
        gameStatus.textContent = `Game over! ${ state.winner } wins!`;
        attributeButtons.innerHTML = '';
        startButton.disabled = false;
        startButton.textContent = 'Play Again';
    }
}

// Generate HTML for a card
function generateCardHTML(owner, card) {
    let html = `<div class="card ${ owner }-card">
        <h3>${ card.name }</h3>
        <div class="card-image">
            <img src="${ card.image || 'images/placeholder.jpg' }" alt="${ card.name }">
        </div>
        <div class="card-quote">"${ card.description }"</div>
        <ul class="attributes">`;

    // Add attributes
    for (const [attr, value] of Object.entries(card.attributes)) {
        html += `<li data-attribute="${ attr }">${ attr }: <span>${ value }</span></li>`;
    }

    html += `</ul></div>`;
    return html;
}

// Create attribute buttons
function populateAttributeButtons() {
    // Clear existing buttons
    attributeButtons.innerHTML = '';

    // Get attributes from game
    const attributes = game.getAvailableAttributes();

    // Create a button for each attribute
    attributes.forEach(attr => {
        const button = document.createElement('button');
        button.textContent = attr.charAt(0).toUpperCase() + attr.slice(1);
        button.dataset.attribute = attr;
        button.addEventListener('click', () => playTurn(attr));
        attributeButtons.appendChild(button);
    });
}

// Play a turn
function playTurn(attribute) {
    // Disable attribute buttons during turn
    const buttons = attributeButtons.querySelectorAll('button');
    buttons.forEach(button => button.disabled = true);

    // Play the turn
    const result = game.playTurn(attribute);
    game.lastResult = result;

    // Show opponent's card
    updateGameBoard();

    // Display result
    if (result.tie) {
        resultDisplay.textContent = "It's a tie! Cards go to the tie pile.";
    } else {
        resultDisplay.textContent = `${ result.winner } wins with ${ attribute } (${ result.playerValue } vs ${ result.opponentValue })`;
    }

    // Re-enable buttons after a delay if game not over
    setTimeout(() => {
        if (!game.isGameOver()) {
            buttons.forEach(button => button.disabled = false);
        }

        // Update game board again (to potentially hide opponent's card)
        if (!result.tie && !game.isGameOver()) {
            opponentCard.innerHTML = '<div class="card card-back">Computer\'s Card</div>';
        }
    }, 2000);
}

// Event listeners
startButton.addEventListener('click', initGame);

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    #game-board {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        font-family: Arial, sans-serif;
    }

    .cards-container {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-bottom: 20px;
    }

    .card {
        border: 2px solid #333;
        border-radius: 10px;
        padding: 15px;
        width: 250px;
        background-color: #f9f9f9;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .card-back {
        background-color: #2c3e50;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 350px;
        font-size: 18px;
        font-weight: bold;
    }

    .empty-card {
        border: 2px dashed #ccc;
        border-radius: 10px;
        padding: 15px;
        width: 250px;
        height: 350px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        color: #999;
    }

    .card h3 {
        text-align: center;
        margin-top: 0;
        border-bottom: 1px solid #ccc;
        padding-bottom: 10px;
    }

    .card-image {
        text-align: center;
        margin: 10px 0;
    }

    .card-image img {
        max-width: 100%;
        height: 120px;
        object-fit: cover;
    }

    .card-quote {
        font-style: italic;
        font-size: 14px;
        margin: 10px 0;
        padding: 5px;
        background-color: #f0f0f0;
        border-radius: 5px;
    }

    .attributes {
        list-style: none;
        padding: 0;
    }

    .attributes li {
        margin: 5px 0;
        padding: 3px 0;
        display: flex;
        justify-content: space-between;
    }

    #attribute-buttons {
        margin: 20px 0;
    }

    #attribute-buttons button {
        margin: 0 5px;
        padding: 8px 15px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    #attribute-buttons button:hover {
        background-color: #2980b9;
    }

    #attribute-buttons button:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
    }

    .game-info {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-bottom: 20px;
    }

    .game-info div {
        text-align: center;
    }

    #result-display {
        font-size: 18px;
        font-weight: bold;
        margin: 15px 0;
        padding: 10px;
        background-color: #f5f5f5;
        border-radius: 5px;
        text-align: center;
    }

    #start-game {
        padding: 10px 20px;
        background-color: #2ecc71;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 20px;
    }

    #start-game:hover {
        background-color: #27ae60;
    }

    #game-status {
        font-size: 16px;
        margin-top: 10px;
        color: #7f8c8d;
    }
`;
document.head.appendChild(style);