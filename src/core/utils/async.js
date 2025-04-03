const { logger } = require('./logger');

/**
 * Utilities for handling asynchronous operations
 */

/**
 * Delay execution for a specified number of milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} - Promise that resolves after the delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @param {number} options.initialDelay - Initial delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @param {Function} options.shouldRetry - Function to determine if retry should happen
 * @returns {Promise<any>} - Result of the function call
 */
async function retry(fn, options = {}) {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        shouldRetry = (error) => true // Default to retry on any error
    } = options;

    let lastError;
    let attempt = 0;

    while (attempt < maxRetries + 1) {
        try {
            return await fn(attempt);
        } catch (error) {
            lastError = error;
            attempt++;

            // Check if we should retry
            if (attempt > maxRetries || !shouldRetry(error)) {
                break;
            }

            // Calculate delay with exponential backoff
            const backoffDelay = Math.min(
                initialDelay * Math.pow(2, attempt - 1),
                maxDelay
            );

            // Add some jitter to avoid thundering herd problem
            const jitter = Math.random() * 100;
            const delayMs = Math.floor(backoffDelay + jitter);

            logger.debug(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms`, {
                error: error.message,
                attempt,
                delay: delayMs
            });

            // Wait before retrying
            await delay(delayMs);
        }
    }

    // If we get here, all retries failed
    logger.error(`All retry attempts failed (${maxRetries})`, {
        error: lastError
    });

    throw lastError;
}

/**
 * Creates a queue for limiting concurrency of async operations
 * @param {number} concurrency - Maximum number of concurrent operations
 * @returns {Object} - Queue object with add method
 */
function createQueue(concurrency = 1) {
    const queue = [];
    let running = 0;
    let completed = 0;
    let failed = 0;

    // Process next item in the queue
    function processNext() {
        if (queue.length === 0 || running >= concurrency) {
            return;
        }

        // Get next task from queue
        const { fn, resolve, reject } = queue.shift();
        running++;

        // Execute the task
        Promise.resolve()
            .then(() => fn())
            .then(
                // Success handler
                result => {
                    running--;
                    completed++;
                    resolve(result);
                    processNext(); // Process next item in queue
                },
                // Error handler
                error => {
                    running--;
                    failed++;
                    reject(error);
                    processNext(); // Process next item in queue even after failure
                }
            );
    }

    return {
        /**
         * Add a task to the queue
         * @param {Function} fn - Async function to execute
         * @returns {Promise<any>} - Promise that resolves with task result
         */
        add(fn) {
            return new Promise((resolve, reject) => {
                // Add task to queue
                queue.push({ fn, resolve, reject });

                // Process next item if possible
                processNext();
            });
        },

        /**
         * Get current queue status
         * @returns {Object} - Queue status
         */
        status() {
            return {
                queued: queue.length,
                running,
                completed,
                failed,
                total: queue.length + running + completed + failed
            };
        },

        /**
         * Clear the queue, rejecting all pending tasks
         * @param {string} reason - Reason for cancellation
         */
        clear(reason = 'Queue cleared') {
            const currentQueue = [...queue];
            queue.length = 0;

            currentQueue.forEach(({ reject }) => {
                reject(new Error(reason));
            });

            return currentQueue.length;
        },

        /**
         * Wait for all currently running tasks to complete
         * @returns {Promise<void>} - Promise that resolves when all tasks complete
         */
        async waitForAll() {
            if (running === 0) {
                return;
            }

            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (running === 0) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
    };
}

/**
 * Debounce an async function
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
function debounce(fn, wait = 300) {
    let timeout;
    let pendingPromise = null;
    let pendingResolve = null;
    let pendingReject = null;

    return function debounced(...args) {
        // Clear existing timeout
        clearTimeout(timeout);

        // If there's no pending promise, create one
        if (!pendingPromise) {
            pendingPromise = new Promise((resolve, reject) => {
                pendingResolve = resolve;
                pendingReject = reject;
            });
        }

        // Set a new timeout
        timeout = setTimeout(() => {
            const promise = pendingPromise;
            const resolve = pendingResolve;
            const reject = pendingReject;

            // Reset pending promise
            pendingPromise = null;
            pendingResolve = null;
            pendingReject = null;

            // Execute the function
            try {
                const result = fn(...args);

                // Handle both synchronous and asynchronous results
                if (result && typeof result.then === 'function') {
                    result.then(resolve, reject);
                } else {
                    resolve(result);
                }
            } catch (error) {
                reject(error);
            }
        }, wait);

        return pendingPromise;
    };
}

/**
 * Throttle an async function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Milliseconds to limit invocations
 * @returns {Function} - Throttled function
 */
function throttle(fn, limit = 300) {
    let timeout;
    let lastRun = 0;
    let lastArgs = null;
    let pendingPromise = null;
    let pendingResolve = null;
    let pendingReject = null;

    return function throttled(...args) {
        const now = Date.now();
        lastArgs = args;

        // If there's no pending promise, create one
        if (!pendingPromise) {
            pendingPromise = new Promise((resolve, reject) => {
                pendingResolve = resolve;
                pendingReject = reject;
            });
        }

        // If we haven't run recently, run immediately
        if (now - lastRun >= limit) {
            lastRun = now;

            const promise = pendingPromise;
            const resolve = pendingResolve;
            const reject = pendingReject;

            // Reset pending promise
            pendingPromise = null;
            pendingResolve = null;
            pendingReject = null;

            // Execute the function
            try {
                const result = fn(...args);

                // Handle both synchronous and asynchronous results
                if (result && typeof result.then === 'function') {
                    result.then(resolve, reject);
                } else {
                    resolve(result);
                }
            } catch (error) {
                reject(error);
            }

            return promise;
        }

        // Otherwise, schedule a delayed run
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            lastRun = Date.now();

            const promise = pendingPromise;
            const resolve = pendingResolve;
            const reject = pendingReject;

            // Reset pending promise
            pendingPromise = null;
            pendingResolve = null;
            pendingReject = null;

            // Execute the function with the latest args
            try {
                const result = fn(...lastArgs);

                // Handle both synchronous and asynchronous results
                if (result && typeof result.then === 'function') {
                    result.then(resolve, reject);
                } else {
                    resolve(result);
                }
            } catch (error) {
                reject(error);
            }
        }, limit - (now - lastRun));

        return pendingPromise;
    };
}

/**
 * Run multiple async functions with concurrency limit
 * @param {Array<Function>} fns - Array of async functions to run
 * @param {number} concurrency - Maximum number of concurrent executions
 * @returns {Promise<Array<any>>} - Results in the same order as input functions
 */
async function runWithConcurrency(fns, concurrency = 2) {
    if (!fns.length) return [];

    const queue = createQueue(concurrency);
    const results = new Array(fns.length);
    const tasks = fns.map((fn, index) => {
        return queue.add(async () => {
            const result = await fn();
            results[index] = result;
            return result;
        });
    });

    await Promise.all(tasks);
    return results;
}

module.exports = {
    delay,
    retry,
    createQueue,
    debounce,
    throttle,
    runWithConcurrency
};