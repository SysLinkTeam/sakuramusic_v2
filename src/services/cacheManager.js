const fs = require('fs');
const os = require('os');
const { CACHE } = require('../config/constants');

/**
 * Cache Manager - Handles music info caching
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.enabled = true;
        this.ramUsageReportEnabled = false;
        this.cacheFilePath = './cache.json';
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
     * Load cache from file
     */
    load() {
        if (!this.enabled) return;

        if (!fs.existsSync(this.cacheFilePath)) {
            fs.writeFileSync(this.cacheFilePath, JSON.stringify(new Map(), this.replacer));
        }

        try {
            this.cache = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'), this.reviver);
        } catch (error) {
            console.error('Error loading cache:', error);
            this.cache = new Map();
        }
    }

    /**
     * Save cache to file
     */
    save() {
        if (!this.enabled) return;

        fs.writeFile(this.cacheFilePath, JSON.stringify(this.cache, this.replacer), (err) => {
            if (err) console.error('Error saving cache:', err);
        });
    }

    /**
     * Get item from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Set item in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    set(key, value) {
        if (this.enabled) {
            this.cache.set(key, value);
        }
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
