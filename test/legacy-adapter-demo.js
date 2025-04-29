/**
 * Legacy Adapter Demo - Shows how to use the original code with the framework adapter
 */

// Import legacy classes (from your original code)
// We're defining them inline for the demo
class OriginalPlayer {
    constructor(name, hand = []) {
        this.name = name;
        this.hand = hand; // Array von Card-Objekten
    }

    topCard() {
        return this.hand.length > 0 ? this.hand[0] : null;
    }

    removeTopCard() {
        if (this.hand.length > 0) {
            this.hand.shift();
        }
    }

    collectCards(cards) {
        this.hand.push(...cards);
    }
}

class OriginalCard {
    constructor({ name, quote, attributes, image }) {
        this.name = name;         // Name der politischen Figur
        this.quote = quote;       // Kurzes Zitat
        this.attributes = attributes; // { charisma: 7, leadership: 8, ... }
        this.image = image;       // Bild-URL oder Pfad
    }
}

class OriginalGameState {
    constructor(players, tiePile = []) {
        this.players = players; // Array von Player-Objekten
        this.currentPlayerIndex = 0;
        this.tiePile = tiePile; // Karten aus unentschiedenen Runden
        this.winner = null;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getOpponent() {
        return this.players.find((_, i) => i !== this.currentPlayerIndex);
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    isGameOver() {
        const activePlayers = this.players.filter(p => p.hand.length > 0);
        return activePlayers.length === 1;
    }

    getWinner() {
        if (this.isGameOver()) {
            return this.players.find(p => p.hand.length > 0);
        }
        return null;
    }
}

class OriginalGameRules {
    static resolveRound(playerCard, opponentCard, attribute, tiePile = []) {
        if (!playerCard || !opponentCard) {
            return { winner: null, cards: [], tie: false };
        }

        const playerValue = playerCard.attributes[attribute] || 0;
        const opponentValue = opponentCard.attributes[attribute] || 0;

        const cardsInPlay = [playerCard, opponentCard, ...tiePile];

        if (playerValue > opponentValue) {
            return { winner: 'player', cards: cardsInPlay, tie: false };
        } else if (opponentValue > playerValue) {
            return { winner: 'opponent', cards: cardsInPlay, tie: false };
        } else {
            return { winner: null, cards: cardsInPlay, tie: true };
        }
    }
}

class OriginalTurnManager {
    constructor(gameState) {
        this.gameState = gameState;
    }

    playTurn(attribute) {
        const player = this.gameState.getCurrentPlayer();
        const opponent = this.gameState.getOpponent();

        const playerCard = player.topCard();
        const opponentCard = opponent.topCard();

        const result = OriginalGameRules.resolveRound(playerCard, opponentCard, attribute, this.gameState.tiePile);

        // Karten aus den Decks entfernen
        player.removeTopCard();
        opponent.removeTopCard();

        if (result.tie) {
            this.gameState.tiePile = result.cards;
        } else if (result.winner === 'player') {
            player.collectCards(result.cards);
            this.gameState.tiePile = [];
        } else if (result.winner === 'opponent') {
            opponent.collectCards(result.cards);
            this.gameState.tiePile = [];
        }

        this.gameState.nextTurn();
        return result;
    }
}

// Import our adapter
import { LegacyPlayerAdapter, LegacyGameStateAdapter, LegacyTurnManagerAdapter } from '../core/LegacyAdapter.js';

console.log("=== Legacy Adapter Demo ===");

// Create sample political cards
const politicalCards = [
    new OriginalCard({
        name: "Angela Merkel",
        quote: "Freedom is the very essence of our economy and society.",
        attributes: {
            leadership: 9,
            diplomacy: 8,
            popularity: 7
        },
        image: "merkel.jpg"
    }),
    new OriginalCard({
        name: "Emmanuel Macron",
        quote: "We need Europe, not just a collection of national interests.",
        attributes: {
            leadership: 7,
            diplomacy: 8,
            popularity: 6
        },
        image: "macron.jpg"
    }),
    new OriginalCard({
        name: "Boris Johnson",
        quote: "My chances of being PM are about as good as the chances of finding Elvis.",
        attributes: {
            leadership: 6,
            diplomacy: 5,
            popularity: 6
        },
        image: "johnson.jpg"
    }),
    new OriginalCard({
        name: "Vladimir Putin",
        quote: "The collapse of the Soviet Union was the greatest geopolitical catastrophe of the century.",
        attributes: {
            leadership: 8,
            diplomacy: 6,
            popularity: 7
        },
        image: "putin.jpg"
    })
];

// Distribute cards to players
const player1Cards = [politicalCards[0], politicalCards[1]];
const player2Cards = [politicalCards[2], politicalCards[3]];

// Create original players and game components
const player1 = new OriginalPlayer("Player 1", player1Cards);
const player2 = new OriginalPlayer("Player 2", player2Cards);
const originalGameState = new OriginalGameState([player1, player2]);
const originalTurnManager = new OriginalTurnManager(originalGameState);

console.log("Original objects created:");
console.log(`- Player 1: ${ player1.name } with ${ player1.hand.length } cards`);
console.log(`- Player 2: ${ player2.name } with ${ player2.hand.length } cards`);

// Create adapters
console.log("\nCreating adapters...");
const player1Adapter = new LegacyPlayerAdapter(player1);
const player2Adapter = new LegacyPlayerAdapter(player2);
const gameStateAdapter = new LegacyGameStateAdapter(originalGameState);
const turnManagerAdapter = new LegacyTurnManagerAdapter(originalTurnManager);

console.log("Adapters created successfully");

// Get framework players
const frameworkPlayer1 = player1Adapter.getFrameworkPlayer();
const frameworkPlayer2 = player2Adapter.getFrameworkPlayer();

console.log(`Framework Player 1: ${ frameworkPlayer1.name } with ${ frameworkPlayer1.getCardCount() } cards`);
console.log(`Framework Player 2: ${ frameworkPlayer2.name } with ${ frameworkPlayer2.getCardCount() } cards`);

// Simulate a few rounds
const attributes = ["leadership", "diplomacy", "popularity"];
const maxRounds = 3;

console.log(`\n--- Simulating ${ maxRounds } rounds ---`);
for (let round = 1; round <= maxRounds; round++) {
    if (originalGameState.isGameOver()) {
        console.log(`Game over after ${ round - 1 } rounds!`);
        break;
    }

    // Pick an attribute for this round (rotating)
    const attribute = attributes[(round - 1) % attributes.length];
    console.log(`\n--- Round ${ round }: Comparing "${ attribute }" ---`);

    // Original player's top cards (before playing)
    const origPlayer1Card = player1.topCard();
    const origPlayer2Card = player2.topCard();

    console.log(`Original Player 1 top card: ${ origPlayer1Card ? origPlayer1Card.name : 'none' }`);
    console.log(`Original Player 2 top card: ${ origPlayer2Card ? origPlayer2Card.name : 'none' }`);

    // Adapter players' top cards (should match original)
    const adaptedPlayer1Card = player1Adapter.topCard();
    const adaptedPlayer2Card = player2Adapter.topCard();

    console.log(`Adapted Player 1 top card: ${ adaptedPlayer1Card ? adaptedPlayer1Card.name : 'none' }`);
    console.log(`Adapted Player 2 top card: ${ adaptedPlayer2Card ? adaptedPlayer2Card.name : 'none' }`);

    // Play turn using the adapter
    console.log(`Playing turn with attribute: ${ attribute }`);
    const result = originalTurnManager.playTurn(attribute);

    // Show result
    if (result.tie) {
        console.log("It's a tie! Cards go to the tie pile.");
        console.log(`Tie pile now has ${ originalGameState.tiePile.length } cards`);
    } else {
        console.log(`${ result.winner } wins the round!`);
        console.log(`Player 1 now has ${ player1.hand.length } cards`);
        console.log(`Player 2 now has ${ player2.hand.length } cards`);
    }

    // Verify adapter state matches original state
    console.log("\nVerifying state synchronization:");
    console.log(`Original Player 1 cards: ${ player1.hand.length }`);
    console.log(`Adapted Player 1 cards: ${ frameworkPlayer1.getCardCount() }`);
    console.log(`Original Player 2 cards: ${ player2.hand.length }`);
    console.log(`Adapted Player 2 cards: ${ frameworkPlayer2.getCardCount() }`);
}

console.log("\n--- Final Game State ---");
console.log(`Original Player 1: ${ player1.hand.length } cards`);
console.log(`Original Player 2: ${ player2.hand.length } cards`);
console.log(`Tie pile: ${ originalGameState.tiePile.length } cards`);

// Check if game is over
if (originalGameState.isGameOver()) {
    const winner = originalGameState.getWinner();
    console.log(`\nGame over! ${ winner.name } wins!`);
} else {
    console.log("\nGame still in progress...");
}