const fs = require('fs');
const { joinVoiceChannel } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const MusicQueue = require('../MusicQueue');

/**
 * Queue Persistence Manager - Handles saving and loading queue data
 */
class QueuePersistence {
    constructor(queueFilePath = './queue.json') {
        this.queueFilePath = queueFilePath;
    }

    /**
     * Convert queue Map to serializable array
     * @param {Map} queue - Queue map
     * @returns {Array} Serialized queue data
     */
    serializeQueue(queue) {
        const data = [];
        let i = 0;

        queue.forEach((value, key) => {
            data[i] = {
                key: key,
                textChannel: value.textChannel.id,
                voiceChannel: value.voiceChannel.id,
                songs: value.songs,
                playing: value.playing,
                loop: value.loop,
                queueloop: value.queueloop,
                starttimestamp: value.starttimestamp,
                autoPlay: value.autoPlay,
                autoPlayPosition: value.autoPlayPosition,
                paused: value.paused,
                volume: value.resource && value.resource.volume ? value.resource.volume.volume : 0.2
            };
            i++;
        });

        return data;
    }

    /**
     * Save queue to file
     * @param {Map} queue - Queue map
     */
    save(queue) {
        const data = this.serializeQueue(queue);
        fs.writeFile(this.queueFilePath, JSON.stringify(data), (err) => {
            if (err) console.error('Error saving queue:', err);
        });
    }

    /**
     * Load queue from file and restore
     * @param {Object} client - Discord client
     * @param {Map} queue - Queue map to populate
     * @returns {Promise<boolean>} True if queues were loaded (reboot flag)
     */
    async load(client, queue) {
        // Ensure queue file exists
        if (!fs.existsSync(this.queueFilePath)) {
            fs.writeFileSync(this.queueFilePath, JSON.stringify([]));
        }

        try {
            const queuedata = JSON.parse(fs.readFileSync(this.queueFilePath, 'utf8'));

            if (queuedata.length === 0) return false;

            for (const value of queuedata) {
                const textChannel = client.channels.cache.get(value.textChannel);
                const voiceChannel = client.channels.cache.get(value.voiceChannel);

                // Skip if channels don't exist or no songs
                if (!textChannel || !voiceChannel || value.songs.length === 0) {
                    continue;
                }

                const queueConstruct = new MusicQueue(textChannel, voiceChannel);
                queueConstruct.songs = value.songs;
                queueConstruct.playing = value.playing;
                queueConstruct.loop = value.loop;
                queueConstruct.queueloop = value.queueloop;
                queueConstruct.player = null;
                queueConstruct.resource = null;
                queueConstruct.paused = value.paused;
                queueConstruct.autoPlay = value.autoPlay;
                queueConstruct.autoPlayPosition = value.autoPlayPosition;
                queueConstruct.starttimestamp = value.starttimestamp;

                queue.set(value.key, queueConstruct);
            }

            return queue.size > 0;
        } catch (error) {
            console.error('Error loading queue:', error);
            return false;
        }
    }

    /**
     * Restore connections and resume playback after bot restart
     * @param {Map} queue - Queue map
     * @param {Function} play - Play function
     * @param {Object} client - Discord client
     */
    async restorePlayback(queue, play, client) {
        const rebootEmbed = new EmbedBuilder()
            .setTitle("Sorry for the inconvenience...")
            .setDescription("We are sorry that you had to restart the bot while using our service.\nWe are always working to fix bugs, add new features and improve stability.\nPlease be assured that we will be restarting soon, and that your queue and other data will be preserved after the restart.")
            .setColor("#ff0000")
            .setFooter({ text: "SakuraMusic v2", iconURL: client.user.displayAvatarURL() });

        for (const [key, value] of queue) {
            if (value.songs.length === 0) continue;

            // Send reboot notification
            await value.textChannel.send({ embeds: [rebootEmbed] });

            // Reconnect to voice channel
            value.connection = await joinVoiceChannel({
                channelId: value.voiceChannel.id,
                guildId: value.voiceChannel.guild.id,
                adapterCreator: value.voiceChannel.guild.voiceAdapterCreator
            });

            // Resume playback
            play(value.voiceChannel.guild, value.songs[0], queue, client);
        }
    }
}

module.exports = QueuePersistence;
