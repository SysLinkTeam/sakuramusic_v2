/**
 * Simple rate limiter for Discord commands
 * Implements token bucket algorithm per user
 */
class RateLimiter {
    /**
     * @param {number} maxRequests - Maximum requests allowed
     * @param {number} windowMs - Time window in milliseconds
     */
    constructor(maxRequests = 5, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.buckets = new Map(); // userId -> { count, resetTime }

        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if request should be allowed
     * @param {string} userId - Discord user ID
     * @returns {boolean} True if request is allowed, false if rate limited
     */
    take(userId) {
        const now = Date.now();
        const bucket = this.buckets.get(userId);

        // No existing bucket or expired - create new
        if (!bucket || now > bucket.resetTime) {
            this.buckets.set(userId, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return true;
        }

        // Within limit - allow and increment
        if (bucket.count < this.maxRequests) {
            bucket.count++;
            return true;
        }

        // Rate limited
        return false;
    }

    /**
     * Get remaining time until rate limit resets
     * @param {string} userId - Discord user ID
     * @returns {number} Milliseconds until reset, or 0 if not limited
     */
    getResetTime(userId) {
        const bucket = this.buckets.get(userId);
        if (!bucket) return 0;

        const remaining = bucket.resetTime - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Get remaining requests for user
     * @param {string} userId - Discord user ID
     * @returns {number} Number of remaining requests
     */
    getRemaining(userId) {
        const bucket = this.buckets.get(userId);
        if (!bucket || Date.now() > bucket.resetTime) {
            return this.maxRequests;
        }

        return Math.max(0, this.maxRequests - bucket.count);
    }

    /**
     * Cleanup expired entries to prevent memory leak
     */
    cleanup() {
        const now = Date.now();
        for (const [userId, bucket] of this.buckets.entries()) {
            if (now > bucket.resetTime) {
                this.buckets.delete(userId);
            }
        }
    }

    /**
     * Reset rate limit for a specific user (admin use)
     * @param {string} userId - Discord user ID
     */
    reset(userId) {
        this.buckets.delete(userId);
    }

    /**
     * Clear all rate limits (restart use)
     */
    clear() {
        this.buckets.clear();
    }
}

module.exports = RateLimiter;
