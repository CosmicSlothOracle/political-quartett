/**
 * DeckFactory Demo - Demonstrates different ways to create card decks
 */
import Card from '../core/Card.js';
import Deck from '../core/Deck.js';
import DeckFactory from '../core/DeckFactory.js';

console.log("=== DeckFactory Demo ===");

// 1. Standard Deck
console.log("\n--- Standard 52-Card Deck ---");
const standardDeck = DeckFactory.createStandardDeck();
console.log(`Created standard deck with ${ standardDeck.getCardCount() } cards`);

// Show some cards from the deck
console.log("Card samples:");
const cardSamples = standardDeck.peekMultiple(3);
cardSamples.forEach(card => {
    console.log(`- ${ card.name } (${ card.suit }, ${ card.rank }, value: ${ card.value })`);
});

// 2. Pinochle Deck
console.log("\n--- Pinochle Deck (48 cards) ---");
const pinochleDeck = DeckFactory.createPinochleDeck();
console.log(`Created pinochle deck with ${ pinochleDeck.getCardCount() } cards`);

// Show distribution of cards
const pinochleSuits = {};
const pinochleRanks = {};
pinochleDeck.getAllCards().forEach(card => {
    pinochleSuits[card.suit] = (pinochleSuits[card.suit] || 0) + 1;
    pinochleRanks[card.rank] = (pinochleRanks[card.rank] || 0) + 1;
});
console.log("Suit distribution:", pinochleSuits);
console.log("Rank distribution:", pinochleRanks);

// 3. Euchre Deck
console.log("\n--- Euchre Deck (24 cards) ---");
const euchreDeck = DeckFactory.createEuchreDeck();
console.log(`Created euchre deck with ${ euchreDeck.getCardCount() } cards`);

// List all cards in the euchre deck
console.log("Cards in euchre deck:");
const euchreCards = euchreDeck.getAllCards().map(card => card.name);
console.log(euchreCards.join(", "));

// 4. Custom Deck
console.log("\n--- Custom Deck ---");
const customDeck = DeckFactory.createCustomDeck(
    { name: "Tarot Deck" },
    [
        { type: "major_arcana", rank: "0", name: "The Fool", value: 0, description: "New beginnings" },
        { type: "major_arcana", rank: "I", name: "The Magician", value: 1, description: "Creation, manifestation" },
        { type: "major_arcana", rank: "II", name: "The High Priestess", value: 2, description: "Intuition, wisdom" },
        { type: "major_arcana", rank: "III", name: "The Empress", value: 3, description: "Abundance, nurturing" },
        { type: "major_arcana", rank: "IV", name: "The Emperor", value: 4, description: "Authority, structure" }
    ]
);
console.log(`Created custom tarot deck with ${ customDeck.getCardCount() } cards`);

// Show all cards in the custom deck
console.log("Cards in custom deck:");
customDeck.getAllCards().forEach(card => {
    console.log(`- ${ card.name } (${ card.type }, value: ${ card.value }, desc: ${ card.description })`);
});

// 5. Standard deck with custom options
console.log("\n--- Customized Standard Deck ---");
const customStandardDeck = DeckFactory.createStandardDeck({
    suits: ['Stars', 'Moons', 'Suns', 'Planets'],
    ranks: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    values: { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10 },
    name: 'Space Deck',
    includeJokers: true,
    jokerCount: 3,
    shuffleOnCreate: true
});
console.log(`Created custom space deck with ${ customStandardDeck.getCardCount() } cards`);

// Draw some random cards
console.log("Random cards from space deck:");
for (let i = 0; i < 5; i++) {
    const randomCard = customStandardDeck.draw();
    if (randomCard) {
        console.log(`- ${ randomCard.name } (${ randomCard.suit }, ${ randomCard.rank }, value: ${ randomCard.value })`);
    }
}

// 6. Clone deck demo
console.log("\n--- Deck Cloning Demo ---");
const originalDeck = DeckFactory.createStandardDeck({
    name: "Original Deck",
    shuffleOnCreate: true
});
console.log(`Original deck: "${ originalDeck.name }" with ${ originalDeck.getCardCount() } cards`);

const clonedDeck = originalDeck.clone();
console.log(`Cloned deck: "${ clonedDeck.name }" with ${ clonedDeck.getCardCount() } cards`);

// Modify the original deck
const drawnCards = originalDeck.drawMultiple(10);
console.log(`Drew ${ drawnCards.length } cards from original deck, now has ${ originalDeck.getCardCount() } cards`);
console.log(`Cloned deck still has ${ clonedDeck.getCardCount() } cards`);

// 7. Serialization
console.log("\n--- Serialization Demo ---");
const deckToSerialize = DeckFactory.createStandardDeck({ shuffleOnCreate: true });
const serialized = JSON.stringify(deckToSerialize.toJSON());
console.log(`Serialized deck (${ serialized.length } characters)`);

// Deserialize
const deserializedData = JSON.parse(serialized);
const restoredDeck = Deck.fromJSON(deserializedData, Card.fromJSON);
console.log(`Restored deck with ${ restoredDeck.getCardCount() } cards`);

// Verify cards are properly restored
const sampleCard = restoredDeck.draw();
console.log(`Sample card from restored deck: ${ sampleCard.name } (${ sampleCard.suit }, ${ sampleCard.rank })`);