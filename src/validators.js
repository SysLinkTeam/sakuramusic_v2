/**
 * Common validation functions for music bot commands
 */

const { ERRORS } = require('./constants/messages');

/**
 * Validates that the user is in a voice channel
 * @param {Object} interaction - Discord interaction object
 * @returns {string|null} Error message if validation fails, null otherwise
 */
function validateUserInVoiceChannel(interaction) {
    if (!interaction.member.voice.channel) {
        return ERRORS.NOT_IN_VOICE_CHANNEL;
    }
    return null;
}

/**
 * Validates that a queue exists for the guild
 * @param {Object} queue - The queue Map
 * @param {string} guildId - Guild ID
 * @param {string} customMessage - Optional custom error message
 * @returns {string|null} Error message if validation fails, null otherwise
 */
function validateQueueExists(queue, guildId, customMessage = null) {
    const serverQueue = queue.get(guildId);
    if (!serverQueue) {
        return customMessage || ERRORS.NO_SONG_IN_QUEUE;
    }
    return null;
}

/**
 * Combined validation for commands that require both voice channel and queue
 * @param {Object} interaction - Discord interaction object
 * @param {Object} queue - The queue Map
 * @param {string} customQueueMessage - Optional custom error message for queue validation
 * @returns {Object} Object with { error: string|null, serverQueue: Object|null }
 */
function validateMusicCommand(interaction, queue, customQueueMessage = null) {
    const voiceError = validateUserInVoiceChannel(interaction);
    if (voiceError) {
        return { error: voiceError, serverQueue: null };
    }

    const serverQueue = queue.get(interaction.guild.id);
    if (!serverQueue) {
        return {
            error: customQueueMessage || ERRORS.NO_SONG_IN_QUEUE,
            serverQueue: null
        };
    }

    return { error: null, serverQueue };
}

/**
 * Validates that a URL is a valid YouTube URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid YouTube URL, false otherwise
 */
function isValidYouTubeURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const urlObj = new URL(url);

        // Only allow YouTube domains
        const allowedDomains = [
            'www.youtube.com',
            'youtube.com',
            'youtu.be',
            'm.youtube.com',
            'music.youtube.com'
        ];

        // Check if hostname is in allowed list
        if (!allowedDomains.includes(urlObj.hostname)) {
            return false;
        }

        // Must use https protocol
        if (urlObj.protocol !== 'https:') {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Sanitizes a YouTube URL by validating and normalizing it
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
function sanitizeYouTubeURL(url) {
    if (!isValidYouTubeURL(url)) {
        return null;
    }

    try {
        const urlObj = new URL(url);
        // Return the validated URL
        return urlObj.href;
    } catch (error) {
        return null;
    }
}

/**
 * Extracts video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if extraction fails
 */
function getYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    try {
        const urlObj = new URL(url);

        // youtu.be format: https://youtu.be/VIDEO_ID
        if (urlObj.hostname === 'youtu.be') {
            const videoId = urlObj.pathname.slice(1);
            return videoId || null;
        }

        // youtube.com format: https://www.youtube.com/watch?v=VIDEO_ID
        if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v');
            return videoId || null;
        }

        return null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    validateUserInVoiceChannel,
    validateQueueExists,
    validateMusicCommand,
    isValidYouTubeURL,
    sanitizeYouTubeURL,
    getYouTubeVideoId
};
