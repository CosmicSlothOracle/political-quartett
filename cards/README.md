# Card Game Framework

This directory contains the core components for a flexible card game framework that can be used to implement various card games.

## Core Components

### Card
`Card` represents a single playing card with properties like suit, rank, value, and state (played, face up/down).

### Deck
`Deck` manages a collection of cards with functionality for shuffling, drawing, discarding, and more.

### DeckFactory
`DeckFactory` provides utility methods to create different types of card decks:
- Standard 52-card deck
- Pinochle deck (48 cards)
- Euchre deck (24 cards)
- Custom decks

### Player
`Player` represents a game participant with a hand of cards, score tracking, and game statistics.

### GameState
`GameState` manages the overall state of a card game including players, decks, turns, and game progression.

### GameRules
`GameRules` implements game-specific rules and card comparison logic.

## Demo Scripts

Several demo scripts show how to use these components:

- `test/deck-demo.js`: Demonstrates basic card game mechanics
- `test/deck-factory-demo.js`: Shows how to create different types of card decks

Run the demos with:

```
npm run demo
```

## Implementation Examples

The framework is designed to be flexible enough to implement various card games:

1. **Standard Card Games**:
   - Poker, Blackjack, Solitaire, etc.

2. **Specialized Card Games**:
   - Pinochle, Euchre, Hearts, etc.

3. **Custom Card Games**:
   - Trading card games, collectible card games, etc.

## Creating a Custom Game

To create a custom card game:

1. Use `DeckFactory` to create appropriate deck(s)
2. Create `Player` instances for participants
3. Initialize `GameState` with players and deck(s)
4. Extend or customize `GameRules` for your specific game
5. Implement game-specific UI and interaction logic

## Serialization Support

All components support serialization to JSON for saving/loading games and network play.