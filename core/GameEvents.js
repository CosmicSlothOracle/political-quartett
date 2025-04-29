/**
 * GameEvents.js - Event emitter for game events
 */
class GameEvents {
    constructor() {
        this.listeners = {};
    }

    /**
     * Register an event listener
     * @param {String} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);

        // Return an unsubscribe function
        return () => {
            this.off(event, callback);
        };
    }

    /**
     * Remove an event listener
     * @param {String} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.listeners[event]) return;

        this.listeners[event] = this.listeners[event].filter(
            listener => listener !== callback
        );
    }

    /**
     * Emit an event with data
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${ event }:`, error);
            }
        });
    }

    /**
     * Register for multiple events at once
     * @param {Object} eventMap - Map of event names to callbacks
     * @returns {Function} - Unsubscribe function for all events
     */
    onMultiple(eventMap) {
        const unsubscribers = [];

        for (const [event, callback] of Object.entries(eventMap)) {
            unsubscribers.push(this.on(event, callback));
        }

        // Return a function that unsubscribes from all events
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * Register a one-time event listener
     * @param {String} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    once(event, callback) {
        const onceCallback = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };

        return this.on(event, onceCallback);
    }

    /**
     * Clear all event listeners
     */
    clearAllListeners() {
        this.listeners = {};
    }

    /**
     * Clear listeners for a specific event
     * @param {String} event - Event name
     */
    clearEvent(event) {
        if (this.listeners[event]) {
            this.listeners[event] = [];
        }
    }
}

export default GameEvents;