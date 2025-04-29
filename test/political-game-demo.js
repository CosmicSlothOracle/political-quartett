/**
 * Political Card Game Demo
 */
import PoliticalCardGame from '../core/PoliticalCardGame.js';

console.log("=== Political Card Game Demo ===");

// Sample political cards
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
        image: "merkel.jpg"
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
        image: "macron.jpg"
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
        image: "johnson.jpg"
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
        image: "biden.jpg"
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
        image: "putin.jpg"
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
        image: "trudeau.jpg"
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
        image: "modi.jpg"
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
        image: "ardern.jpg"
    }
];

// Create a new political card game
const game = new PoliticalCardGame({
    initialHandSize: -1, // Split deck evenly
    winCondition: 'allCards'
});

// Initialize the game with players and cards
game.init(['Player 1', 'Player 2'], politicalCards);

console.log("\n--- Game Initialized ---");
console.log(`Player 1 has ${ game.players[0].getCardCount() } cards`);
console.log(`Player 2 has ${ game.players[1].getCardCount() } cards`);

// Show available attributes
console.log("\nAvailable attributes for comparison:", game.getAvailableAttributes());

// Simulate a few rounds
const attributes = game.getAvailableAttributes();
const maxRounds = 5;

console.log(`\n--- Simulating ${ maxRounds } rounds ---`);
for (let round = 1; round <= maxRounds; round++) {
    if (game.isGameOver()) {
        console.log(`Game over after ${ round - 1 } rounds!`);
        break;
    }

    // Pick a random attribute for this round
    const attribute = attributes[Math.floor(Math.random() * attributes.length)];
    console.log(`\n--- Round ${ round }: Comparing "${ attribute }" ---`);

    // Play the turn
    const result = game.playTurn(attribute);

    // Handle error case
    if (result.error) {
        console.log(`Error: ${ result.error }`);
        break;
    }

    // Display the result with error checking
    if (result.playerCard && result.opponentCard) {
        console.log(`${ result.playerCard.name } (${ result.playerValue }) vs ${ result.opponentCard.name } (${ result.opponentValue })`);
    } else {
        console.log("Unable to display card comparison - missing card data");
    }

    if (result.tie) {
        console.log("It's a tie! Cards go to the tie pile.");
        console.log(`Tie pile now has ${ game.gameState.tiePile.length } cards`);
    } else if (result.winner) {
        console.log(`${ result.winner } wins the round!`);
        console.log(`Player 1 now has ${ game.players[0].getCardCount() } cards`);
        console.log(`Player 2 now has ${ game.players[1].getCardCount() } cards`);
    } else {
        console.log("No clear outcome determined.");
    }
}

// Show final game state
console.log("\n--- Game State ---");
const gameState = game.getStateForUI();
console.log(`Current player: ${ gameState.currentPlayer }`);
console.log(`Tie pile: ${ gameState.tiePileCount } cards`);
console.log(`Player 1: ${ game.players[0].getCardCount() } cards`);
console.log(`Player 2: ${ game.players[1].getCardCount() } cards`);

if (game.isGameOver()) {
    console.log(`\nGame over! ${ game.getWinner().name } wins!`);
} else {
    console.log("\nGame still in progress...");
}