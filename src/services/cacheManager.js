const fs = require('fs');
const os = require('os');
const { CACHE } = require('../config/constants');

/**
 * Cache Manager - Handles music info caching
 */
class CacheManager {
    constructor() {
        this.cache = new Map(); // Map<videoId, { data: Song, expires: timestamp }>
        this.enabled = true;
        this.ramUsageReportEnabled = false;
        this.cacheFilePath = './cache.json';
        this.ttl = CACHE.TTL; // 7 days
    }

    /**
     * Initialize cache from environment and load from file
     */
    initialize() {
        // Check if cache should be enabled
        if (process.env.cacheEnabled === "false") {
            this.enabled = false;
            console.log("-------Cache is disabled-------");
            console.log("Cache will not be saved");
            console.log("Cache will not be loaded on startup");
            console.log("It may increase response time and Network usage but it will reduce RAM usage");
            console.log("If you want to enable cache, set cacheEnabled to true in .env");
            console.log("-------------------------------");
        } else {
            console.log("-------Cache is enabled-------");
            console.log("Cache will be saved every 5 seconds");
            console.log("Cache will be loaded on startup");
            console.log("It may use a lot of RAM if you have a lot of servers or users but it will reduce response time and reduce Network usage");

            if (process.env.ramUsageReportEnabled === "true") {
                console.log("ramUsageReportEnabled is enabled. It will show RAM usage report every 5 seconds.");
                this.ramUsageReportEnabled = true;
            } else {
                console.log("if you want to show RAM usage report, set ramUsageReportEnabled to true in .env");
            }

            console.log("If you want to disable cache, set cacheEnabled to false in .env");
            console.log("-------------------------------");
        }
    }

    /**
     * Load cache from file with backup recovery
     */
    load() {
        if (!this.enabled) return;

        if (!fs.existsSync(this.cacheFilePath)) {
            fs.writeFileSync(this.cacheFilePath, JSON.stringify(new Map(), this.replacer));
        }

        try {
            const fileContent = fs.readFileSync(this.cacheFilePath, 'utf8');
            this.cache = JSON.parse(fileContent, this.reviver);

            // Validate that cache is a Map
            if (!(this.cache instanceof Map)) {
                throw new Error('Cache is not a Map instance');
            }
        } catch (error) {
            console.error('Error loading cache:', error);

            // Try to load from backup
            const backupFile = this.cacheFilePath + '.backup';
            if (fs.existsSync(backupFile)) {
                console.log('Attempting to restore cache from backup...');
                try {
                    const backupContent = fs.readFileSync(backupFile, 'utf8');
                    this.cache = JSON.parse(backupContent, this.reviver);

                    if (!(this.cache instanceof Map)) {
                        throw new Error('Backup cache is not a Map instance');
                    }

                    console.log('Cache successfully restored from backup');

                    // Restore the main file from backup
                    fs.copyFileSync(backupFile, this.cacheFilePath);
                } catch (backupError) {
                    console.error('Error loading from backup:', backupError);
                    this.cache = new Map();
                }
            } else {
                this.cache = new Map();
            }
        }
    }

    /**
     * Save cache to file using atomic write
     */
    save() {
        if (!this.enabled) return;

        try {
            const jsonData = JSON.stringify(this.cache, this.replacer, 2);

            // Atomic write: write to temp file, then rename
            const tempFile = this.cacheFilePath + '.tmp';
            const backupFile = this.cacheFilePath + '.backup';

            // Create backup of existing file if it exists
            if (fs.existsSync(this.cacheFilePath)) {
                try {
                    fs.copyFileSync(this.cacheFilePath, backupFile);
                } catch (backupErr) {
                    console.error('Error creating cache backup:', backupErr);
                    // Continue anyway - backup is best effort
                }
            }

            // Write to temp file
            fs.writeFileSync(tempFile, jsonData, 'utf8');

            // Atomic rename
            fs.renameSync(tempFile, this.cacheFilePath);

            // Clean up old backup after successful write
            if (fs.existsSync(backupFile)) {
                try {
                    fs.unlinkSync(backupFile);
                } catch (cleanupErr) {
                    // Ignore cleanup errors
                }
            }
        } catch (err) {
            console.error('Error saving cache:', err);

            // Try to restore from backup if available
            const backupFile = this.cacheFilePath + '.backup';
            if (fs.existsSync(backupFile)) {
                try {
                    fs.copyFileSync(backupFile, this.cacheFilePath);
                    console.log('Cache restored from backup after save failure');
                } catch (restoreErr) {
                    console.error('Error restoring cache from backup:', restoreErr);
                }
            }
        }
    }

    /**
     * Get item from cache with TTL check
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined (if expired or not found)
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // Check if expired
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.data;
    }

    /**
     * Check if key exists in cache and is not expired
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;

        // Check if expired
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Set item in cache with TTL
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    set(key, value) {
        if (this.enabled) {
            this.cache.set(key, {
                data: value,
                expires: Date.now() + this.ttl
            });
        }
    }

    /**
     * Clean expired entries from cache
     * @returns {number} Number of entries removed
     */
    cleanExpired() {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expires) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`[Cache] Cleaned ${removed} expired entries`);
        }

        return removed;
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache = new Map();
        console.log('Cache cleared');
    }

    /**
     * Check memory usage and clear cache if threshold exceeded
     */
    checkMemoryAndClear() {
        const totalmemory = os.totalmem();
        const usedmemory = os.totalmem() - os.freemem();
        const usageRatio = usedmemory / totalmemory;

        if (usageRatio > CACHE.MEMORY_THRESHOLD) {
            this.clear();
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("Cleared cache because of memory usage being too high.");
            console.error(`Total memory: ${Math.floor(totalmemory / 1024 / 1024 / 1024)} GB`);
            console.error(`Used memory: ${Math.floor(usedmemory / 1024 / 1024 / 1024)} GB`);
            console.error(`Percentage: ${Math.floor(usageRatio * 100)}%`);
            console.error(`Caching has been disabled.`);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            this.enabled = false;
        }
    }

    /**
     * Report RAM usage (if enabled)
     */
    reportRAMUsage() {
        if (!this.ramUsageReportEnabled) return;

        const totalmemory = os.totalmem();
        const usedmemory = os.totalmem() - os.freemem();
        const ramUsage = process.memoryUsage().heapUsed / 1024 / 1024;

        console.log("--------------------ram usage report--------------------");
        console.log("time: " + new Date().toLocaleString());
        console.log(`Total memory(machine): ${Math.floor(totalmemory / 1024 / 1024 / 1024)} GB`);
        console.log(`Used memory(machine): ${Math.floor(usedmemory / 1024 / 1024 / 1024)} GB`);
        console.log(`RAM Used Percentage(machine): ${Math.floor((usedmemory / totalmemory) * 100)}%`);
        console.log(`RAM usage(SakuraMusic v2): ${Math.floor(ramUsage)} MB`);
        console.log("--------------------ram usage report--------------------");
    }

    /**
     * Replacer function for JSON.stringify to handle Maps
     */
    replacer(k, v) {
        if (v instanceof Map) {
            return {
                dataType: "Map",
                value: [...v]
            };
        }
        return v;
    }

    /**
     * Reviver function for JSON.parse to restore Maps
     */
    reviver(k, v) {
        if (typeof v === "object" && v !== null) {
            if (v.dataType === "Map") {
                return new Map(v.value);
            }
        } else if (v === undefined || v === null) {
            return new Map();
        }
        return v;
    }
}

module.exports = CacheManager;
