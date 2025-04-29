/**
 * Deck Demo - Example script to demonstrate Card Game core components
 */
import Card from '../core/Card.js';
import Deck from '../core/Deck.js';
import DeckFactory from '../core/DeckFactory.js';
import Player from '../core/Player.js';
import GameState from '../core/GameState.js';
import GameRules from '../core/GameRules.js';

// Create players
const player1 = new Player({ name: 'Player 1' });
const player2 = new Player({ name: 'Player 2' });
console.log(`Created players: ${ player1.name } and ${ player2.name }`);

// Create a standard deck
const standardDeck = DeckFactory.createStandardDeck({
    shuffleOnCreate: true,
    name: 'Demo Standard Deck'
});
console.log(`Created deck: ${ standardDeck.name } with ${ standardDeck.getCardCount() } cards`);

// Deal cards to players
const hands = standardDeck.deal(2, 26, true);
player1.addToHand(hands[0]);
player2.addToHand(hands[1]);

console.log(`Dealt cards: ${ player1.name } has ${ player1.getCardCount() } cards, ${ player2.name } has ${ player2.getCardCount() } cards`);

// Setup game rules
const rules = new GameRules({
    tieBreaker: 'retry',
    maxRounds: 100,
    winCondition: 'allCards'
});

// Setup game state
const gameState = new GameState([player1, player2], standardDeck);

// Simulate a few rounds of "War" card game
console.log("\nSimulating a few rounds of 'War' card game:");

for (let round = 1; round <= 5; round++) {
    if (player1.hasCards() && player2.hasCards()) {
        console.log(`\n--- Round ${ round } ---`);

        const currentPlayer = gameState.getCurrentPlayer();
        console.log(`Current player: ${ currentPlayer.name }`);

        // Both players play a card
        const card1 = player1.playCard(0);
        const card2 = player2.playCard(0);

        console.log(`${ player1.name } plays: ${ card1.name } (${ card1.value })`);
        console.log(`${ player2.name } plays: ${ card2.name } (${ card2.value })`);

        // Compare cards by value
        const result = card1.compareTo(card2, 'value');

        if (result > 0) {
            // Player 1 wins
            console.log(`${ player1.name } wins the round!`);
            player1.addToHand([card1, card2]);
            player1.recordRoundWin();
        } else if (result < 0) {
            // Player 2 wins
            console.log(`${ player2.name } wins the round!`);
            player2.addToHand([card1, card2]);
            player2.recordRoundWin();
        } else {
            // Tie - both cards go to tie pile
            console.log("It's a tie!");
            gameState.addToTiePile([card1, card2]);
        }

        // Show card counts
        console.log(`Cards: ${ player1.name } (${ player1.getCardCount() }), ${ player2.name } (${ player2.getCardCount() }), Tie pile: ${ gameState.tiePile.length }`);

        // Advance to next turn
        gameState.nextTurn();
    } else {
        break;
    }
}

// Show final stats
console.log("\n--- Game Stats ---");
console.log(`${ player1.name }: ${ player1.getCardCount() } cards, ${ player1.getStats().roundsWon } rounds won`);
console.log(`${ player2.name }: ${ player2.getCardCount() } cards, ${ player2.getStats().roundsWon } rounds won`);
console.log(`Tie pile: ${ gameState.tiePile.length } cards`);

// Create other deck types
console.log("\n--- Other Deck Types ---");

const pinochleDeck = DeckFactory.createPinochleDeck({ shuffleOnCreate: true });
console.log(`Pinochle deck: ${ pinochleDeck.getCardCount() } cards`);

const euchreDeck = DeckFactory.createEuchreDeck({ shuffleOnCreate: true });
console.log(`Euchre deck: ${ euchreDeck.getCardCount() } cards`);

const customDeck = DeckFactory.createCustomDeck(
    { name: "Custom Poker Deck" },
    [
        { rank: "A", suit: "Spades", value: 14, name: "Ace of Spades" },
        { rank: "K", suit: "Spades", value: 13, name: "King of Spades" },
        { rank: "Q", suit: "Spades", value: 12, name: "Queen of Spades" },
        { rank: "J", suit: "Spades", value: 11, name: "Jack of Spades" },
        { rank: "10", suit: "Spades", value: 10, name: "10 of Spades" }
    ]
);
console.log(`Custom deck: ${ customDeck.name } with ${ customDeck.getCardCount() } cards`);

// Serialization demo
console.log("\n--- Serialization Demo ---");
const serializationDeck = DeckFactory.createStandardDeck({ shuffleOnCreate: true });
const deckJson = serializationDeck.toJSON();
console.log(`Serialized deck to JSON with ${ deckJson.cards.length } cards`);

const restoredDeck = Deck.fromJSON(deckJson, Card.fromJSON);
console.log(`Restored deck from JSON with ${ restoredDeck.getCardCount() } cards`);