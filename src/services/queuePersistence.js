const fs = require('fs');
const path = require('path');
const { joinVoiceChannel } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const MusicQueue = require('../MusicQueue');
const { AUDIO } = require('../config/constants');
const { INFO, BOT_NAME_DISPLAY } = require('../constants/messages');

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
                volume: value.resource && value.resource.volume ? value.resource.volume.volume : AUDIO.DEFAULT_VOLUME
            };
            i++;
        });

        return data;
    }

    /**
     * Save queue to file using atomic write
     * @param {Map} queue - Queue map
     */
    save(queue) {
        try {
            const data = this.serializeQueue(queue);
            const jsonData = JSON.stringify(data, null, 2);

            // Atomic write: write to temp file, then rename
            const tempFile = this.queueFilePath + '.tmp';
            const backupFile = this.queueFilePath + '.backup';

            // Create backup of existing file if it exists
            if (fs.existsSync(this.queueFilePath)) {
                try {
                    fs.copyFileSync(this.queueFilePath, backupFile);
                } catch (backupErr) {
                    console.error('Error creating backup:', backupErr);
                    // Continue anyway - backup is best effort
                }
            }

            // Write to temp file
            fs.writeFileSync(tempFile, jsonData, 'utf8');

            // Atomic rename
            fs.renameSync(tempFile, this.queueFilePath);

            // Clean up old backup after successful write
            if (fs.existsSync(backupFile)) {
                try {
                    fs.unlinkSync(backupFile);
                } catch (cleanupErr) {
                    // Ignore cleanup errors
                }
            }
        } catch (err) {
            console.error('Error saving queue:', err);

            // Try to restore from backup if available
            const backupFile = this.queueFilePath + '.backup';
            if (fs.existsSync(backupFile)) {
                try {
                    fs.copyFileSync(backupFile, this.queueFilePath);
                    console.log('Queue restored from backup after save failure');
                } catch (restoreErr) {
                    console.error('Error restoring from backup:', restoreErr);
                }
            }
        }
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
            let queuedata;
            let fileContent = fs.readFileSync(this.queueFilePath, 'utf8');

            try {
                queuedata = JSON.parse(fileContent);
            } catch (parseError) {
                console.error('Error parsing queue file:', parseError);

                // Try to load from backup
                const backupFile = this.queueFilePath + '.backup';
                if (fs.existsSync(backupFile)) {
                    console.log('Attempting to restore queue from backup...');
                    try {
                        fileContent = fs.readFileSync(backupFile, 'utf8');
                        queuedata = JSON.parse(fileContent);
                        console.log('Queue successfully restored from backup');

                        // Restore the main file from backup
                        fs.copyFileSync(backupFile, this.queueFilePath);
                    } catch (backupError) {
                        console.error('Error loading from backup:', backupError);
                        queuedata = [];
                    }
                } else {
                    queuedata = [];
                }
            }

            // Validate queuedata is an array
            if (!Array.isArray(queuedata)) {
                console.error('Queue data is not an array, resetting to empty');
                queuedata = [];
            }

            if (queuedata.length === 0) return false;

            for (const value of queuedata) {
                // Validate queue entry structure
                if (!value || typeof value !== 'object') {
                    console.warn('Invalid queue entry, skipping');
                    continue;
                }

                const textChannel = client.channels.cache.get(value.textChannel);
                const voiceChannel = client.channels.cache.get(value.voiceChannel);

                // Skip if channels don't exist or no songs
                if (!textChannel || !voiceChannel || !Array.isArray(value.songs) || value.songs.length === 0) {
                    continue;
                }

                const queueConstruct = new MusicQueue(textChannel, voiceChannel);
                queueConstruct.songs = value.songs;
                queueConstruct.playing = value.playing || false;
                queueConstruct.loop = value.loop || false;
                queueConstruct.queueloop = value.queueloop || false;
                queueConstruct.player = null;
                queueConstruct.resource = null;
                queueConstruct.paused = value.paused || false;
                queueConstruct.autoPlay = value.autoPlay || false;
                queueConstruct.autoPlayPosition = value.autoPlayPosition || 1;
                queueConstruct.starttimestamp = value.starttimestamp || 0;

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
            .setTitle(INFO.REBOOT_MESSAGE.title)
            .setDescription(INFO.REBOOT_MESSAGE.description)
            .setColor("#ff0000")
            .setFooter({ text: BOT_NAME_DISPLAY, iconURL: client.user.displayAvatarURL() });

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
