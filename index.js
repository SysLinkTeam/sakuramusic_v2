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

// Load services
const CacheManager = require('./src/services/cacheManager');
const QueuePersistence = require('./src/services/queuePersistence');
const YTDLPManager = require('./src/services/ytdlpManager');
const { play } = require('./src/services/musicPlayer');

// Load core modules
const MusicQueue = require('./src/MusicQueue');
const Song = require('./src/Song');
const { toHms, parseTime } = require('./src/utils');
const { CACHE } = require('./src/config/constants');
const { INFO } = require('./src/constants/messages');

process.env['YTDL_NO_UPDATE'] = true;

// Initialize managers
const cacheManager = new CacheManager();
const queuePersistence = new QueuePersistence();
const ytdlpManager = new YTDLPManager();

// Initialize cache
cacheManager.initialize();

// Initialize client and queue
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});
const queue = new Map();

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

// Global error handler
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
    if (client && client.destroy) {
        try {
            client.destroy();
        } catch (e) {
            console.error('Failed to destroy client:', e);
        }
    }
    process.exit(1);
});

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

// Interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    await interaction.deferReply();
    const command = commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, context);
    } catch (error) {
        console.error(error);
        interaction.followUp('There was an error executing that command!');
    }
});

// Voice state update handler
client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        // Check if user left channel and bot is alone
        if (!oldState.member || oldState.member.user.bot) return;
        if (oldState.channelId == null || newState.channelId !== null) return;
        if (!oldState.channel || oldState.channel.members.size !== 1) return;

        const serverQueue = queue.get(oldState.guild.id);
        if (!serverQueue) return;

        // Null checks for player and connection
        if (serverQueue.player) {
            serverQueue.songs = [];
            serverQueue.autoPlay = false;
            serverQueue.player.stop();
        }

        if (serverQueue.connection) {
            serverQueue.connection.destroy();
        }

        if (serverQueue.textChannel) {
            serverQueue.textChannel.send(INFO.EVERYONE_LEFT);
        }
    } catch (error) {
        console.error('Error in voiceStateUpdate handler:', error);
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
