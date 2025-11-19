const ytdl = require('ytdl-core');
const playdl = require('play-dl');
const { https } = require('follow-redirects');
const stream = require('stream');
const { createAudioResource, AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior, getVoiceConnection } = require('@discordjs/voice');
const Song = require('../Song');
const { toHms, formatNumber } = require('../utils');
const { AUDIO, SEARCH, QUEUE } = require('../config/constants');
const { ERRORS, INFO } = require('../constants/messages');

/**
 * Picks a random song from array that is different from the played song
 * @param {Array} array - Array of song options
 * @param {Object} playedsong - Previously played song
 * @returns {Object|null} Next song or null if none available
 */
function pickNextSong(array, playedsong) {
    // Validate input
    if (!Array.isArray(array) || array.length === 0 || array.length === 1) {
        return null;
    }

    if (!playedsong || !playedsong.url) {
        return null;
    }

    // Filter out invalid songs and the currently played song
    const availableSongs = array.filter(song => {
        return song &&
               typeof song === 'object' &&
               song.url &&
               typeof song.url === 'string' &&
               song.url !== playedsong.url;
    });

    // If no valid alternative songs available, return null
    if (availableSongs.length === 0) return null;

    // Pick a random song from the available songs
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    return availableSongs[randomIndex];
}

/**
 * Searches for the next song when autoplay is enabled
 * @param {Object} songcache - Previously played song for reference
 * @returns {Promise<Object|null>} Song info or null if not found
 */
async function searchNextAutoplaySong(songcache) {
    try {
        // Validate songcache
        if (!songcache || !songcache.title || typeof songcache.title !== 'string') {
            console.error('Invalid songcache provided to searchNextAutoplaySong');
            return null;
        }

        // Build search query: artist name + partial title for better results
        let searchQuery = '';

        // Include artist name if available (improves search accuracy)
        if (songcache.author && songcache.author.name && typeof songcache.author.name === 'string') {
            searchQuery = songcache.author.name.trim() + ' ';
        }

        // Add partial title (first 50% to avoid overly specific searches)
        const title = songcache.title.slice(0, Math.floor(songcache.title.length * SEARCH.TITLE_SEARCH_RATIO));

        // Validate title is not empty after slicing
        if (!title || title.trim().length === 0) {
            console.error('Empty title after slicing');
            return null;
        }

        searchQuery += title.trim();

        let yt_info = await playdl.search(searchQuery, {
            limit: SEARCH.AUTO_PLAY_LIMIT
        });

        // Validate search results
        if (!Array.isArray(yt_info)) {
            console.error('Invalid search results from play-dl');
            return null;
        }

        if (yt_info.length === 0) return null;

        // Filter out invalid results
        yt_info = yt_info.filter(item => {
            return item &&
                   typeof item === 'object' &&
                   item.url &&
                   typeof item.url === 'string' &&
                   item.url.length > 0;
        });

        if (yt_info.length === 0) return null;

        return pickNextSong(yt_info, songcache);
    } catch (error) {
        console.error('Error in searchNextAutoplaySong:', error);
        return null;
    }
}

/**
 * Fetches song information and creates a Song object
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object|null>} Song object or null if fetch fails
 */
async function fetchSongInfo(url) {
    try {
        // Validate URL
        if (!url || typeof url !== 'string' || url.trim().length === 0) {
            console.error('Invalid URL provided to fetchSongInfo');
            return null;
        }

        const songInfo = await ytdl.getInfo(url);

        // Validate songInfo before creating Song
        if (!songInfo || typeof songInfo !== 'object') {
            console.error('Invalid songInfo received from ytdl');
            return null;
        }

        return Song.fromYouTubeInfo(songInfo);
    } catch (error) {
        console.error('Error fetching song info:', error);
        return null;
    }
}

/**
 * Handles autoplay logic when queue is empty
 * @param {Object} guild - Discord guild
 * @param {Object} serverQueue - Server queue object
 * @param {Object} songcache - Previously played song
 * @param {Function} play - Play function reference
 * @param {Map} queue - Queue map
 * @returns {Promise<void>}
 */
async function handleAutoplay(guild, serverQueue, songcache, play, queue) {
    serverQueue.textChannel.send(INFO.AUTOPLAY_SEARCHING);

    const nextSongInfo = await searchNextAutoplaySong(songcache);

    if (!nextSongInfo) {
        serverQueue.textChannel.send(ERRORS.AUTOPLAY_NO_NEXT_SONG);
        if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    const song = await fetchSongInfo(nextSongInfo.url);

    if (!song) {
        serverQueue.textChannel.send(ERRORS.AUTOPLAY_CANNOT_PLAY);
        if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    serverQueue.songs.push(song);
    serverQueue.autoPlayPosition++;
    return play(guild, serverQueue.songs[0]);
}

/**
 * Checks if attachment has expired
 * @param {Object} song - Song object
 * @returns {boolean} True if expired
 */
function isAttachmentExpired(song) {
    return song.type === 'attachment' && song.expiresAt && Date.now() > song.expiresAt;
}

/**
 * Creates audio resource from attachment URL
 * @param {string} url - Attachment URL
 * @returns {Promise<Object>} Audio resource
 */
async function createAttachmentResource(url) {
    const streamAttachment = await new Promise((resolve, reject) => {
        https.get(url, res => resolve(res)).on('error', reject);
    });
    return createAudioResource(streamAttachment, { inlineVolume: true });
}

/**
 * Creates audio resource from YouTube URL
 * @param {string} url - YouTube video URL
 * @returns {Object} Audio resource
 */
function createYouTubeResource(url) {
    const stream_ytdl = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: AUDIO.HIGH_WATER_MARK
    });
    return createAudioResource(stream_ytdl, { inlineVolume: true, inputType: stream.type });
}

/**
 * Creates appropriate audio resource based on song type
 * @param {Object} song - Song object
 * @returns {Promise<Object>} Audio resource
 */
async function createAudioResourceForSong(song) {
    if (song.type === 'attachment') {
        return await createAttachmentResource(song.url);
    } else {
        return createYouTubeResource(song.url);
    }
}

/**
 * Creates and sends the "Now Playing" embed message
 * @param {Object} serverQueue - Server queue object
 * @param {Object} song - Current song
 * @param {Object} client - Discord client
 */
function sendNowPlayingEmbed(serverQueue, song, client) {
    const embed = {
        "title": "Now Playing...♬",
        "description": `[${song.title}](${song.url})`,
        "color": Math.floor(Math.random() * 16777214) + 1,
        "thumbnail": {
            "url": song.thumbnail
        },
        "footer": {
            text: "SakuraMusic V2",
            iconURL: client.user.displayAvatarURL(),
        },
        "author": {
            "name": song.author.name,
            "url": song.author.url
        },
        "fields": [{
            "name": "Channel",
            "value": song.author.name
        }, {
            "name": "Music length",
            "value": toHms(song.totalsec),
            "inline": true
        }, {
            "name": "View Count",
            "value": formatNumber(song.viewcount),
            "inline": true
        }, {
            "name": "Subscribers",
            "value": formatNumber(song.author.subscriber_count),
            "inline": true
        }, {
            "name": "Verified",
            "value": song.author.verified ? '✓' : '✗',
            "inline": true
        }]
    };
    serverQueue.textChannel.send({ embeds: [embed] });
}

/**
 * Sets up player event handlers
 * @param {Object} player - Audio player
 * @param {Object} guild - Discord guild
 * @param {Object} serverQueue - Server queue object
 * @param {Function} play - Play function reference
 */
function setupPlayerHandlers(player, guild, serverQueue, play) {
    player.on(AudioPlayerStatus.Idle, () => {
        let songcache;

        if (serverQueue.loop === false) {
            if (serverQueue.queueloop === true) {
                serverQueue.songs.push(serverQueue.songs[0]);
            }
            songcache = serverQueue.songs.shift();

            // Add to history with size limit to prevent memory leak
            if (songcache) {
                serverQueue.history.push(songcache);

                // Keep only last MAX_HISTORY entries
                if (serverQueue.history.length > QUEUE.MAX_HISTORY) {
                    serverQueue.history.shift(); // Remove oldest entry
                }
            }
        }

        play(guild, serverQueue.songs[0], null, songcache);
    }).on('error', error => {
        console.error('Player error:', error);
    });
}

/**
 * Main play function - plays music in the voice channel
 * @param {Object} guild - Discord guild
 * @param {Object} song - Song to play
 * @param {Object} queue - Queue map
 * @param {Object} client - Discord client
 * @param {Object|null} interaction - Interaction object (optional)
 * @param {Object|null} songcache - Previously played song (optional)
 * @returns {Promise<void>}
 */
async function play(guild, song, queue, client, interaction = null, songcache = null) {
    const serverQueue = queue.get(guild.id);
    if (!serverQueue) return;

    // Handle empty queue
    if (!song) {
        if (serverQueue.autoPlay === true) {
            return await handleAutoplay(guild, serverQueue, songcache, play, queue);
        }

        serverQueue.textChannel.send(INFO.QUEUE_EMPTY_STOP);
        if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    // Handle expired attachments
    if (isAttachmentExpired(song)) {
        serverQueue.textChannel.send(ERRORS.ATTACHMENT_EXPIRED);
        serverQueue.songs.shift();
        return play(guild, serverQueue.songs[0], queue, client, interaction);
    }

    // Create player and resource
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Stop,
        },
    });

    const resource = await createAudioResourceForSong(song);
    resource.volume.setVolume(AUDIO.DEFAULT_VOLUME);

    await player.play(resource);
    serverQueue.player = player;
    serverQueue.resource = resource;
    serverQueue.connection.subscribe(player);

    // Set up event handlers
    setupPlayerHandlers(player, guild, serverQueue, play);

    // Send now playing message
    sendNowPlayingEmbed(serverQueue, song, client);
    serverQueue.starttimestamp = Date.now();
}

module.exports = {
    play,
    pickNextSong,
    searchNextAutoplaySong,
    fetchSongInfo
};
