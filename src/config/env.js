/**
 * Environment configuration management with validation and defaults
 */

const { DEFAULT_USER_AGENT } = require('./constants');

/**
 * Parse boolean environment variable
 * @param {string|undefined} value - Environment variable value
 * @param {boolean} defaultValue - Default value if not set
 * @returns {boolean} Parsed boolean value
 */
function parseBooleanEnv(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    return value.toLowerCase() === 'true';
}

/**
 * Parse string environment variable with default
 * @param {string|undefined} value - Environment variable value
 * @param {string} defaultValue - Default value if not set
 * @returns {string} Parsed string value
 */
function parseStringEnv(value, defaultValue = '') {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    return value.trim();
}

/**
 * Load and validate environment configuration
 * @returns {Object} Configuration object
 */
function loadConfig() {
    const config = {
        // Discord bot token (required)
        token: process.env.token,

        // Cache configuration
        cacheEnabled: parseBooleanEnv(process.env.cacheEnabled, true),
        ramUsageReportEnabled: parseBooleanEnv(process.env.ramUsageReportEnabled, false),

        // User agent for external requests
        userAgent: parseStringEnv(process.env.userAgent, DEFAULT_USER_AGENT),
    };

    // Validate required fields
    if (!config.token || typeof config.token !== 'string' || config.token.trim().length === 0) {
        console.error('ERROR: Discord bot token is missing or invalid.');
        console.error('Please set the "token" variable in your .env file.');
        console.error('Example: token=YOUR_BOT_TOKEN_HERE');
        process.exit(1);
    }

    // Basic token format validation
    if (config.token.length < 50) {
        console.error('ERROR: Discord bot token appears to be invalid (too short).');
        console.error('Please check your .env file and ensure the token is correct.');
        process.exit(1);
    }

    return config;
}

module.exports = { loadConfig, parseBooleanEnv, parseStringEnv };
