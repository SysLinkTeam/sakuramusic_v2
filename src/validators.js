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

module.exports = {
    validateUserInVoiceChannel,
    validateQueueExists,
    validateMusicCommand
};
