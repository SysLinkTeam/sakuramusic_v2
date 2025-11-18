const ytdl = require('ytdl-core');
const playdl = require('play-dl');
const { https } = require('follow-redirects');
const stream = require('stream');
const { createAudioResource, AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior, getVoiceConnection } = require('@discordjs/voice');
const Song = require('../Song');
const { toHms } = require('../utils');
const { AUDIO, SEARCH } = require('../config/constants');

/**
 * Picks a random song from array that is different from the played song
 * @param {Array} array - Array of song options
 * @param {Object} playedsong - Previously played song
 * @returns {Object|null} Next song or null if none available
 */
function pickNextSong(array, playedsong) {
    if (array.length == 0 || array.length == 1) return null;

    // Filter out the currently played song to avoid infinite recursion
    const availableSongs = array.filter(song => song.url !== playedsong.url);

    // If all songs have the same URL, return null
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
    const title = songcache.title.slice(0, songcache.title.length * SEARCH.TITLE_SEARCH_RATIO);
    let yt_info = await playdl.search(title, {
        limit: SEARCH.AUTO_PLAY_LIMIT
    });

    if (yt_info.length === 0) return null;

    return pickNextSong(yt_info, songcache);
}

/**
 * Fetches song information and creates a Song object
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object|null>} Song object or null if fetch fails
 */
async function fetchSongInfo(url) {
    try {
        const songInfo = await ytdl.getInfo(url);
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
    serverQueue.textChannel.send('Auto play is enabled, so I will search next song for you!');

    const nextSongInfo = await searchNextAutoplaySong(songcache);

    if (!nextSongInfo) {
        serverQueue.textChannel.send('I cannot find the next song, so I will stop playing music');
        if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    const song = await fetchSongInfo(nextSongInfo.url);

    if (!song) {
        serverQueue.textChannel.send('I find the next song, but I cannot play it, so I will stop playing music.\nPlease try again later.');
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
            "name": "channel",
            "value": song.author.name
        }, {
            "name": "Music length",
            "value": toHms(song.totalsec),
            "inline": true
        }, {
            "name": "viewCount",
            "value": song.viewcount,
            "inline": true
        }, {
            "name": "Channel:subscriber",
            "value": song.author.subscriber_count,
            "inline": true
        }, {
            "name": "Channel:verified",
            "value": song.author.verified,
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
            if (songcache) serverQueue.history.push(songcache);
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

        serverQueue.textChannel.send('Stop playing music because there is no song in the queue!');
        if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    // Handle expired attachments
    if (isAttachmentExpired(song)) {
        serverQueue.textChannel.send('Attachment link expired, skipping.');
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
