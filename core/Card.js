/**
 * Card.js - Represents a single card in the game
 */
export default class Card {
    /**
     * Create a new card
     * @param {Object} config - Card configuration
     */
    constructor(config = {}) {
        this.id = config.id || `card-${ Date.now() }-${ Math.floor(Math.random() * 1000) }`;
        this.type = config.type || 'standard';
        this.suit = config.suit || '';
        this.rank = config.rank || '';
        this.value = config.value !== undefined ? config.value : 0;
        this.name = config.name || this.generateName();
        this.image = config.image || '';
        this.description = config.description || '';
        this.played = config.played || false;
        this.faceUp = config.faceUp !== undefined ? config.faceUp : false;
        this.metadata = config.metadata || {};
        this.effects = config.effects || [];
    }

    /**
     * Generate a display name for the card
     * @return {string} - Generated name
     */
    generateName() {
        if (this.rank && this.suit) {
            return `${ this.rank } of ${ this.suit }`;
        }
        return `Card ${ this.id.split('-').pop() }`;
    }

    /**
     * Get the card's value
     * @return {number} - The card's value
     */
    getValue() {
        return this.value;
    }

    /**
     * Set the card's value
     * @param {number} value - The new value
     * @return {Card} - This card instance for chaining
     */
    setValue(value) {
        this.value = value;
        return this;
    }

    /**
     * Mark the card as played
     * @return {Card} - This card instance for chaining
     */
    markAsPlayed() {
        this.played = true;
        return this;
    }

    /**
     * Reset the played state
     * @return {Card} - This card instance for chaining
     */
    resetPlayed() {
        this.played = false;
        return this;
    }

    /**
     * Check if the card has been played
     * @return {boolean} - True if the card has been played
     */
    isPlayed() {
        return this.played;
    }

    /**
     * Flip the card face up
     * @return {Card} - This card instance for chaining
     */
    flipFaceUp() {
        this.faceUp = true;
        return this;
    }

    /**
     * Flip the card face down
     * @return {Card} - This card instance for chaining
     */
    flipFaceDown() {
        this.faceUp = false;
        return this;
    }

    /**
     * Toggle the card's face
     * @return {Card} - This card instance for chaining
     */
    toggleFace() {
        this.faceUp = !this.faceUp;
        return this;
    }

    /**
     * Check if card is face up
     * @return {boolean} - True if the card is face up
     */
    isFaceUp() {
        return this.faceUp;
    }

    /**
     * Add an effect to the card
     * @param {Object} effect - Effect to add
     * @return {Card} - This card instance for chaining
     */
    addEffect(effect) {
        if (effect && typeof effect === 'object') {
            this.effects.push(effect);
        }
        return this;
    }

    /**
     * Get all effects on the card
     * @return {Array} - All effects
     */
    getEffects() {
        return [...this.effects];
    }

    /**
     * Clear all effects from the card
     * @return {Card} - This card instance for chaining
     */
    clearEffects() {
        this.effects = [];
        return this;
    }

    /**
     * Compare this card with another
     * @param {Card} otherCard - Card to compare with
     * @param {string} compareBy - Property to compare by (value, rank, etc.)
     * @return {number} - -1 if less, 0 if equal, 1 if greater
     */
    compareTo(otherCard, compareBy = 'value') {
        if (!otherCard) return 1;

        switch (compareBy) {
            case 'value':
                return this.value - otherCard.value;
            case 'rank':
                // Custom rank comparison logic could go here
                return this.value - otherCard.value;
            case 'name':
                return this.name.localeCompare(otherCard.name);
            default:
                return 0;
        }
    }

    /**
     * Check if this card matches another by specified criteria
     * @param {Card} otherCard - Card to check against
     * @param {Array} criteria - Array of properties to check
     * @return {boolean} - True if cards match on all criteria
     */
    matches(otherCard, criteria = ['suit']) {
        if (!otherCard) return false;

        return criteria.every(criterion => {
            return this[criterion] === otherCard[criterion];
        });
    }

    /**
     * Clone this card
     * @return {Card} - A new card instance with the same properties
     */
    clone() {
        return new Card({
            id: `card-${ Date.now() }-${ Math.floor(Math.random() * 1000) }`, // Generate new ID
            type: this.type,
            suit: this.suit,
            rank: this.rank,
            value: this.value,
            name: this.name,
            image: this.image,
            description: this.description,
            played: this.played,
            faceUp: this.faceUp,
            metadata: { ...this.metadata },
            effects: [...this.effects]
        });
    }

    /**
     * Convert card to a plain object for serialization
     * @return {Object} - Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            suit: this.suit,
            rank: this.rank,
            value: this.value,
            name: this.name,
            image: this.image,
            description: this.description,
            played: this.played,
            faceUp: this.faceUp,
            metadata: this.metadata,
            effects: this.effects
        };
    }

    /**
     * Create a Card instance from a plain object
     * @param {Object} data - Plain object data
     * @return {Card} - New Card instance
     */
    static fromJSON(data) {
        if (!data) return null;
        return new Card(data);
    }
}