// Check for required dependencies
try {
    require('discord.js');
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        console.error('ERROR: Required dependencies are not installed.');
        console.error('Please run: npm install');
        process.exit(1);
    }
    throw e;
}

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();

// Load configuration
const { loadConfig } = require('./src/config/env');
const config = loadConfig();

// Load services
const CacheManager = require('./src/services/cacheManager');
const QueuePersistence = require('./src/services/queuePersistence');
const YTDLPManager = require('./src/services/ytdlpManager');
const { play } = require('./src/services/musicPlayer');

// Load core modules
const MusicQueue = require('./src/MusicQueue');
const Song = require('./src/Song');
const { toHms, parseTime } = require('./src/utils');
const RateLimiter = require('./src/utils/RateLimiter');
const { CACHE } = require('./src/config/constants');
const { INFO, ERRORS } = require('./src/constants/messages');

process.env['YTDL_NO_UPDATE'] = true;

// Initialize managers with configuration
const cacheManager = new CacheManager(config);
const queuePersistence = new QueuePersistence();
const ytdlpManager = new YTDLPManager();
const rateLimiter = new RateLimiter(5, 60000); // 5 commands per 60 seconds

// Initialize cache
cacheManager.initialize();

// Initialize client and queue
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});
const queue = new Map();

// Debounce map for voice state updates (guildId -> timeout)
const voiceStateDebounce = new Map();

// Load commands
const commands = new Map();
let commandList = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'src/Commands'))
    .filter(file => file.endsWith('.js') && file !== 'BaseCommand.js');

for (const file of commandFiles) {
    const CommandClass = require(`./src/Commands/${file}`);
    const command = new CommandClass();
    commands.set(command.data.name, command);
    commandList.push(command.data);
}

// Create context object (improved dependency injection)
const context = {
    queue,
    MusicQueue,
    Song,
    parseTime,
    toHms,
    musicInfoCache: cacheManager.cache,
    cacheEnabled: cacheManager.enabled,
    client,
    play: (guild, song, interaction = null, songcache = null) => {
        return play(guild, song, queue, client, interaction, songcache);
    }
};

// Initialize yt-dlp
(async () => {
    try {
        await ytdlpManager.initialize();
    } catch (error) {
        console.error('Failed to initialize yt-dlp:', error);
    }
})();

// Bot ready event
client.once('ready', async () => {
    console.log(`${client.user.username} is now online!`);
    client.application.commands.set(commandList);

    // Load cache
    cacheManager.load();

    // Load and restore queue
    const rebootFLG = await queuePersistence.load(client, queue);

    if (rebootFLG) {
        await queuePersistence.restorePlayback(queue, context.play, client);
    }
});

// Interaction handler with rate limiting and improved error handling
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // Rate limiting check
    if (!rateLimiter.take(interaction.user.id)) {
        const resetTime = Math.ceil(rateLimiter.getResetTime(interaction.user.id) / 1000);
        try {
            await interaction.reply({
                content: ERRORS.RATE_LIMIT_EXCEEDED(resetTime),
                ephemeral: true
            });
        } catch (error) {
            console.error('[Rate Limit] Failed to send rate limit message:', error.message);
        }
        return;
    }

    // Defer reply with timeout protection
    try {
        await interaction.deferReply();
    } catch (error) {
        console.error(`[Interaction] Failed to defer reply for ${interaction.commandName}:`, error.message);
        return; // Interaction already expired or responded
    }

    const command = commands.get(interaction.commandName);
    if (!command) return;

    // Execute command with timeout and comprehensive error handling
    try {
        // 14 second timeout (Discord allows 15s total, leaving 1s margin)
        await Promise.race([
            command.execute(interaction, context),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Command timeout')), 14000)
            )
        ]);
    } catch (error) {
        // Log error with context
        console.error(`[Command Error] Command: ${interaction.commandName}, User: ${interaction.user.id}, Guild: ${interaction.guildId || 'DM'}`);
        console.error(`[Command Error] Message: ${error.message}`);

        // Send user-friendly error message
        try {
            if (interaction.deferred && !interaction.replied) {
                await interaction.followUp({
                    content: ERRORS.COMMAND_EXECUTION_ERROR,
                    ephemeral: true
                });
            }
        } catch (followUpError) {
            console.error('[Command Error] Failed to send error message:', followUpError.message);
        }
    }
});

// Voice state update handler with debounce
client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        const guildId = oldState.guild.id;

        // Check if user left channel
        if (!oldState.member || oldState.member.user.bot) return;
        if (oldState.channelId == null || newState.channelId !== null) return;
        if (!oldState.channel) return;

        const serverQueue = queue.get(guildId);
        if (!serverQueue) return;

        // Clear any existing debounce timeout
        if (voiceStateDebounce.has(guildId)) {
            clearTimeout(voiceStateDebounce.get(guildId));
        }

        // Set debounce timeout (5 seconds)
        const timeout = setTimeout(async () => {
            try {
                // Re-check if bot is still alone after delay
                const voiceChannel = client.channels.cache.get(serverQueue.voiceChannel.id);
                if (!voiceChannel || voiceChannel.members.size !== 1) {
                    voiceStateDebounce.delete(guildId);
                    return;
                }

                console.log(`[Voice] Everyone left in guild ${guildId}, disconnecting...`);

                // Stop playback and cleanup
                if (serverQueue.player) {
                    serverQueue.songs = [];
                    serverQueue.autoPlay = false;
                    serverQueue.player.stop();
                }

                if (serverQueue.connection) {
                    serverQueue.connection.destroy();
                }

                if (serverQueue.textChannel) {
                    await serverQueue.textChannel.send(INFO.EVERYONE_LEFT).catch(err => {
                        console.error(`[Voice] Failed to send leave message:`, err.message);
                    });
                }

                voiceStateDebounce.delete(guildId);
            } catch (error) {
                console.error(`[Voice] Error in debounced disconnect for guild ${guildId}:`, error.message);
                voiceStateDebounce.delete(guildId);
            }
        }, 5000);

        voiceStateDebounce.set(guildId, timeout);
    } catch (error) {
        console.error('[Voice] Error in voiceStateUpdate handler:', error.message);
    }
});

// Periodic tasks (cache/queue saving, presence update, memory check)
cron.schedule(CACHE.AUTO_SAVE_INTERVAL, async () => {
    // Update bot presence
    client.user.setPresence({
        activities: [{
            name: ` /help | ${queue.size} vc & ${client.guilds.cache.size} servers`,
            type: ActivityType.Streaming,
        }]
    });

    // Save queue
    queuePersistence.save(queue);

    // Save cache
    cacheManager.save();

    // Report RAM usage if enabled
    cacheManager.reportRAMUsage();

    // Check memory and clear cache if needed
    cacheManager.checkMemoryAndClear();

    // Update context if cache was disabled
    context.cacheEnabled = cacheManager.enabled;
});

// Cleanup expired cache entries every 6 hours
cron.schedule(CACHE.CLEANUP_INTERVAL, () => {
    console.log('[Cron] Running cache cleanup...');
    cacheManager.cleanExpired();
});

// Login with token validation
const token = process.env.token;

if (!token || typeof token !== 'string' || token.trim().length === 0) {
    console.error('ERROR: Discord bot token is missing or invalid.');
    console.error('Please set the "token" variable in your .env file.');
    console.error('Example: token=YOUR_BOT_TOKEN_HERE');
    process.exit(1);
}

// Basic token format validation (Discord tokens are typically 59-72 characters)
if (token.length < 50) {
    console.error('ERROR: Discord bot token appears to be invalid (too short).');
    console.error('Please check your .env file and ensure the token is correct.');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('ERROR: Failed to login to Discord.');
    console.error('This usually means your bot token is invalid.');
    console.error('Error details:', error.message);
    process.exit(1);
});

// ================================
// Graceful Shutdown Handlers
// ================================

let isShuttingDown = false;

/**
 * Gracefully shutdown the bot
 * @param {string} signal - Signal name (SIGTERM, SIGINT, etc.)
 */
async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[Shutdown] ${signal} received. Starting graceful shutdown...`);

    try {
        // 1. Stop accepting new commands
        console.log('[Shutdown] Removing command listeners...');
        client.removeAllListeners('interactionCreate');

        // 2. Save all queue data
        console.log('[Shutdown] Saving queue data...');
        queuePersistence.save(queue);

        // 3. Save cache data
        console.log('[Shutdown] Saving cache data...');
        cacheManager.save();

        // 4. Disconnect from all voice channels
        console.log('[Shutdown] Disconnecting from voice channels...');
        for (const [guildId, serverQueue] of queue) {
            try {
                if (serverQueue.player) {
                    serverQueue.player.stop();
                }
                if (serverQueue.connection) {
                    serverQueue.connection.destroy();
                }
            } catch (error) {
                console.error(`[Shutdown] Error disconnecting from guild ${guildId}:`, error.message);
            }
        }

        // 5. Clear cron jobs
        console.log('[Shutdown] Stopping cron jobs...');
        cron.getTasks().forEach(task => task.stop());

        // 6. Disconnect from Discord (with timeout)
        console.log('[Shutdown] Logging out from Discord...');
        await Promise.race([
            client.destroy(),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);

        console.log('[Shutdown] Graceful shutdown completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('[Shutdown] Error during graceful shutdown:', error);
        process.exit(1);
    }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions with graceful shutdown
process.on('uncaughtException', async (error) => {
    console.error('[FATAL] Uncaught Exception:', error);

    try {
        // Try to save data before exiting
        queuePersistence.save(queue);
        cacheManager.save();
    } catch (saveError) {
        console.error('[FATAL] Failed to save data during crash:', saveError);
    }

    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Promise Rejection at:', promise);
    console.error('[ERROR] Reason:', reason);
    // Don't exit on unhandled rejection, just log it
});
