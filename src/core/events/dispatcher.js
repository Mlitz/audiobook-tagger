const { logger } = require('../utils/logger');
const { validateNotEmpty, validateFunction } = require('../utils/validation');

/**
 * EventDispatcher class for pub/sub pattern
 * Manages event subscriptions and dispatching
 */
class EventDispatcher {
    /**
     * Create a new EventDispatcher
     */
    constructor() {
        // Map of event names to arrays of handlers
        this.handlers = new Map();

        // Map of event names to keep track of the last event data
        this.lastEvents = new Map();

        // Map to track subscription IDs to their event names and handlers
        this.subscriptions = new Map();

        // Counter for generating unique subscription IDs
        this.subscriptionCounter = 0;

        logger.debug('EventDispatcher initialized');
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to subscribe to
     * @param {Function} handler - Event handler function
     * @param {Object} [options={}] - Subscription options
     * @param {boolean} [options.once=false] - Whether to handle event only once
     * @param {boolean} [options.immediate=false] - Whether to immediately call handler with last event
     * @returns {string} - Subscription ID that can be used to unsubscribe
     */
    subscribe(eventName, handler, options = {}) {
        validateNotEmpty(eventName, 'Event name');
        validateFunction(handler, 'Event handler');

        const { once = false, immediate = false } = options;

        // Generate a unique subscription ID
        const subscriptionId = `sub_${++this.subscriptionCounter}`;

        // Get or create the handlers array for this event
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, []);
        }

        // Add the handler to the array
        this.handlers.get(eventName).push({
            handler,
            once,
            subscriptionId
        });

        // Track the subscription
        this.subscriptions.set(subscriptionId, {
            eventName,
            handler
        });

        logger.debug(`Subscribed to event: ${eventName}`, {
            subscriptionId,
            options
        });

        // If immediate option is true and we have a last event, trigger the handler
        if (immediate && this.lastEvents.has(eventName)) {
            const lastEvent = this.lastEvents.get(eventName);

            // Execute handler asynchronously to avoid issues with subscription timing
            setTimeout(() => {
                try {
                    handler(lastEvent);

                    // If this is a once subscription, remove it after immediate execution
                    if (once) {
                        this.unsubscribe(subscriptionId);
                    }
                } catch (error) {
                    logger.error(`Error in immediate event handler for ${eventName}`, {
                        error,
                        subscriptionId
                    });
                }
            }, 0);
        }

        return subscriptionId;
    }

    /**
     * Subscribe to an event and handle it only once
     * @param {string} eventName - Name of the event to subscribe to
     * @param {Function} handler - Event handler function
     * @param {Object} [options={}] - Subscription options
     * @param {boolean} [options.immediate=false] - Whether to immediately call handler with last event
     * @returns {string} - Subscription ID that can be used to unsubscribe
     */
    subscribeOnce(eventName, handler, options = {}) {
        return this.subscribe(eventName, handler, {
            ...options,
            once: true
        });
    }

    /**
     * Unsubscribe from an event
     * @param {string} subscriptionId - Subscription ID returned from subscribe
     * @returns {boolean} - Whether the unsubscription was successful
     */
    unsubscribe(subscriptionId) {
        if (!this.subscriptions.has(subscriptionId)) {
            logger.warn(`Attempted to unsubscribe unknown subscription: ${subscriptionId}`);
            return false;
        }

        const { eventName, handler } = this.subscriptions.get(subscriptionId);

        // Get the handlers for this event
        const eventHandlers = this.handlers.get(eventName);
        if (!eventHandlers) {
            logger.warn(`Event handlers not found for ${eventName}`);
            return false;
        }

        // Find and remove the handler
        const index = eventHandlers.findIndex(h => h.subscriptionId === subscriptionId);
        if (index !== -1) {
            eventHandlers.splice(index, 1);

            // If no handlers left for this event, clean up
            if (eventHandlers.length === 0) {
                this.handlers.delete(eventName);
            }

            // Remove from subscriptions map
            this.subscriptions.delete(subscriptionId);

            logger.debug(`Unsubscribed from event: ${eventName}`, { subscriptionId });
            return true;
        }

        return false;
    }

    /**
     * Emit an event
     * @param {string} eventName - Name of the event to emit
     * @param {any} data - Event data to pass to handlers
     * @returns {number} - Number of handlers that processed the event
     */
    emit(eventName, data) {
        validateNotEmpty(eventName, 'Event name');

        // Store this event as the last occurrence
        this.lastEvents.set(eventName, data);

        // If no handlers for this event, return early
        if (!this.handlers.has(eventName)) {
            logger.debug(`Event emitted with no subscribers: ${eventName}`);
            return 0;
        }

        const eventHandlers = this.handlers.get(eventName);
        const handlerCount = eventHandlers.length;

        logger.debug(`Emitting event: ${eventName}`, {
            handlerCount,
            data: typeof data === 'object' ? '[object]' : data
        });

        // Track "once" handlers to remove
        const handlersToRemove = [];

        // Call each handler
        eventHandlers.forEach(({ handler, once, subscriptionId }) => {
            try {
                handler(data);

                // If this is a "once" handler, mark for removal
                if (once) {
                    handlersToRemove.push(subscriptionId);
                }
            } catch (error) {
                logger.error(`Error in event handler for ${eventName}`, {
                    error,
                    subscriptionId
                });
            }
        });

        // Remove "once" handlers
        handlersToRemove.forEach(id => this.unsubscribe(id));

        return handlerCount;
    }

    /**
     * Get the last emitted data for an event
     * @param {string} eventName - Name of the event
     * @returns {any} - Last event data or undefined if none
     */
    getLastEvent(eventName) {
        return this.lastEvents.get(eventName);
    }

    /**
     * Check if an event has subscribers
     * @param {string} eventName - Name of the event
     * @returns {boolean} - Whether the event has subscribers
     */
    hasSubscribers(eventName) {
        return this.handlers.has(eventName) &&
            this.handlers.get(eventName).length > 0;
    }

    /**
     * Get the number of subscribers for an event
     * @param {string} eventName - Name of the event
     * @returns {number} - Number of subscribers
     */
    subscriberCount(eventName) {
        if (!this.handlers.has(eventName)) {
            return 0;
        }

        return this.handlers.get(eventName).length;
    }

    /**
     * Remove all subscribers for a specific event
     * @param {string} eventName - Name of the event
     * @returns {number} - Number of subscribers removed
     */
    clearEvent(eventName) {
        if (!this.handlers.has(eventName)) {
            return 0;
        }

        const handlers = this.handlers.get(eventName);
        const count = handlers.length;

        // Remove all subscriptions for this event
        handlers.forEach(({ subscriptionId }) => {
            this.subscriptions.delete(subscriptionId);
        });

        // Clear the handlers
        this.handlers.delete(eventName);

        logger.debug(`Cleared all subscribers for event: ${eventName}`, { count });

        return count;
    }

    /**
     * Remove all event subscribers
     * @returns {number} - Total number of subscribers removed
     */
    clearAllEvents() {
        let totalCount = 0;

        // Count all handlers
        for (const handlers of this.handlers.values()) {
            totalCount += handlers.length;
        }

        // Clear all maps
        this.handlers.clear();
        this.subscriptions.clear();

        logger.debug('Cleared all event subscribers', { count: totalCount });

        return totalCount;
    }

    /**
     * Perform cleanup when shutting down
     */
    shutdown() {
        this.clearAllEvents();
        this.lastEvents.clear();
        logger.info('EventDispatcher shut down');
    }
}

module.exports = { EventDispatcher };