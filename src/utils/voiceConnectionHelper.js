const { VoiceConnectionStatus, entersState } = require('@discordjs/voice');

/**
 * Setup voice connection error handlers with automatic reconnection
 * @param {VoiceConnection} connection - Voice connection
 * @param {string} guildId - Guild ID
 * @param {Map} queue - Queue map
 */
function setupVoiceConnectionHandlers(connection, guildId, queue) {
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            // Try to reconnect within 5 seconds
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
            // Connection recovered
            console.log(`[Voice] Connection recovered for guild ${guildId}`);
        } catch (error) {
            // Connection failed to recover, destroy it
            console.error(`[Voice] Connection disconnected for guild ${guildId}, destroying...`);
            connection.destroy();
            queue.delete(guildId);
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
        console.log(`[Voice] Connection destroyed for guild ${guildId}`);
        queue.delete(guildId);
    });

    connection.on('error', error => {
        console.error(`[Voice] Connection error for guild ${guildId}:`, error.message);
    });
}

module.exports = { setupVoiceConnectionHandlers };
