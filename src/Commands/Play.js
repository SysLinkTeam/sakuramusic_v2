const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const ytpl = require('ytpl');
const playdl = require('play-dl');
const ytdl = require('ytdl-core');
const { ERRORS, INFO } = require('../constants/messages');
const { ATTACHMENT, PLAYLIST } = require('../config/constants');
const { isValidYouTubeURL, sanitizeYouTubeURL } = require('../validators');

class Play extends BaseCommand {
    constructor() {
        super({
            name: 'play',
            description: 'Play music from Youtube or attachment',
            name_localizations: {
                ja: '再生',
                ko: '재생',
            },
            description_localizations: {
                ja: 'Youtubeまたは添付ファイルから音楽を再生',
                ko: 'YouTube 또는 첨부 파일에서 음악 재생',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'video_info',
                    description: 'Youtube URL or Search Query',
                    name_localizations: {
                        ja: '動画情報',
                        ko: '비디오정보',
                    },
                    description_localizations: {
                        ja: 'YoutubeのURLまたは検索クエリ',
                        ko: 'YouTube URL 또는 검색어',
                    },
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: 'file',
                    description: 'Audio file attachment',
                    name_localizations: {
                        ja: 'ファイル',
                        ko: '파일',
                    },
                    description_localizations: {
                        ja: '音声ファイルの添付',
                        ko: '오디오 파일 첨부',
                    },
                    type: ApplicationCommandOptionType.Attachment,
                    required: false
                }
            ]
        });
    }

    async execute(interaction, context) {
        const { queue, MusicQueue, Song, musicInfoCache, cacheEnabled } = context;

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.followUp(ERRORS.NOT_IN_VOICE_CHANNEL);

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
            return interaction.followUp(ERRORS.BOT_NO_PERMISSION);
        }

        let serverQueue = queue.get(interaction.guild.id);
        let url = interaction.options.getString('video_info');
        const attachment = interaction.options.getAttachment('file');
        if (!url && !attachment) {
            return interaction.followUp(ERRORS.NEED_URL_OR_FILE);
        }

        if (attachment) {
            const song = new Song({
                title: attachment.name,
                url: attachment.url,
                totalsec: 0,
                viewcount: 0,
                author: { name: interaction.user.username, url: null },
                thumbnail: interaction.user.displayAvatarURL(),
                type: 'attachment',
                expiresAt: Date.now() + ATTACHMENT.EXPIRY_TIME
            });

            if (!serverQueue) {
                const queueContruct = new MusicQueue(interaction.channel, voiceChannel);
                queue.set(interaction.guild.id, queueContruct);
                queueContruct.songs.push(song);
                try {
                    const connection = await joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator
                    });
                    queueContruct.connection = connection;
                    context.play(interaction.guild, queueContruct.songs[0], interaction);
                } catch (err) {
                    console.error(err);
                    queue.delete(interaction.guild.id);
                    return interaction.followUp(err.message || ERRORS.COMMAND_EXECUTION_ERROR);
                }
            } else {
                serverQueue.songs.push(song);
            }
            return interaction.followUp(INFO.SONG_ADDED(song.title));
        }

        const musiclist = [];
        let totalTracks = 1;

        // Handle playlists
        if (url.includes('list=') && !url.includes('watch?v=')) {
            // Validate URL before processing
            if (!isValidYouTubeURL(url)) {
                return interaction.followUp(ERRORS.INVALID_URL);
            }

            const sanitizedUrl = sanitizeYouTubeURL(url);
            if (!sanitizedUrl) {
                return interaction.followUp(ERRORS.INVALID_URL);
            }

            // Fetch playlist with size limit to prevent DoS
            const playlist = await ytpl(sanitizedUrl, { limit: PLAYLIST.MAX_SIZE }).catch(error => {
                console.error(error);
                interaction.followUp(ERRORS.YOUTUBE_FETCH_FAILED);
            });
            if (!playlist) return;

            // Check if playlist exceeds max size
            if (playlist.items.length > PLAYLIST.MAX_SIZE) {
                return interaction.followUp(ERRORS.PLAYLIST_TOO_LARGE(PLAYLIST.MAX_SIZE));
            }

            // Validate and sanitize each URL in the playlist
            for (const item of playlist.items) {
                const itemUrl = item.url.substring(0, item.url.indexOf("&list="));
                if (isValidYouTubeURL(itemUrl)) {
                    musiclist.push(itemUrl);
                }
            }
            totalTracks = musiclist.length;
        } else {
            // Handle single video or search query
            let errorFLG = false;

            // If it's not a YouTube URL, treat it as a search query
            if (!url.includes('youtube.com') && !url.includes('youtu.be/')) {
                const yt_info = await playdl.search(url, { limit: 1 }).catch(async error => {
                    errorFLG = true;
                    return interaction.followUp(ERRORS.YOUTUBE_FETCH_FAILED);
                });
                if (errorFLG) return;
                if (yt_info.length == 0) return interaction.followUp(ERRORS.YOUTUBE_FETCH_FAILED);
                url = yt_info[0].url;
            }

            // Validate the final URL
            if (!isValidYouTubeURL(url)) {
                return interaction.followUp(ERRORS.INVALID_URL);
            }

            const sanitizedUrl = sanitizeYouTubeURL(url);
            if (!sanitizedUrl) {
                return interaction.followUp(ERRORS.INVALID_URL);
            }

            musiclist.push(sanitizedUrl);
        }

        let song;
        if (!musicInfoCache.has(musiclist[0])) {
            const songInfo = await ytdl.getInfo(musiclist.shift()).catch(async error => {
                console.error(error);
                await interaction.followUp(ERRORS.YOUTUBE_FETCH_FAILED);
                return null;
            });
            if (!songInfo) {
                return;
            }
            song = Song.fromYouTubeInfo(songInfo);
            if (cacheEnabled) musicInfoCache.set(songInfo.videoDetails.video_url, song);
        } else {
            song = musicInfoCache.get(musiclist.shift());
        }

        if (!serverQueue) {
            const queueContruct = new MusicQueue(interaction.channel, voiceChannel);
            queue.set(interaction.guild.id, queueContruct);
            queueContruct.songs.push(song);
            try {
                const connection = await joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator
                });
                queueContruct.connection = connection;
                context.play(interaction.guild, queueContruct.songs[0], interaction);
            } catch (err) {
                console.error(err);
                queue.delete(interaction.guild.id);
                return interaction.followUp(err.message || ERRORS.COMMAND_EXECUTION_ERROR);
            }
        } else {
            serverQueue.songs.push(song);
        }

        if (musiclist.length === 0) return interaction.followUp(INFO.SONG_ADDED(song.title));
        interaction.followUp(INFO.BULK_SONGS_ADDING(musiclist.length));

        const remaining = musiclist.length;
        const total = totalTracks;

        // Process playlist in parallel with cancellation support
        (async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 300000); // 5 min timeout

            try {
                let processed = 1; // First song already processed
                let failedCount = 0;
                const PARALLEL_BATCH_SIZE = 5; // Process 5 songs at a time

                // Dynamic progress report interval based on playlist size
                const reportInterval = total < 50 ? 10 : total < 200 ? 25 : PLAYLIST.PROGRESS_REPORT_INTERVAL;

                for (let i = 0; i < musiclist.length; i += PARALLEL_BATCH_SIZE) {
                    if (controller.signal.aborted) {
                        interaction.channel.send(`Playlist processing cancelled. Added ${processed - 1 - failedCount} songs.`);
                        break;
                    }

                    const batch = musiclist.slice(i, i + PARALLEL_BATCH_SIZE);

                    // Process batch in parallel
                    const results = await Promise.allSettled(
                        batch.map(async (url) => {
                            // Check cache first
                            if (musicInfoCache.has(url)) {
                                return musicInfoCache.get(url);
                            }

                            // Fetch from YouTube
                            const songInfo = await ytdl.getInfo(url);
                            const info = Song.fromYouTubeInfo(songInfo);
                            if (cacheEnabled) musicInfoCache.set(info.url, info);
                            return info;
                        })
                    );

                    // Add successful results to queue
                    for (const result of results) {
                        if (result.status === 'fulfilled' && result.value) {
                            serverQueue.songs.push(result.value);
                        } else {
                            failedCount++;
                            console.error(`[Playlist] Failed to fetch song:`, result.reason?.message);
                        }
                    }

                    processed += batch.length;

                    // Report progress
                    if (processed % reportInterval === 0 || processed >= total || i === 0) {
                        const percent = Math.floor((processed / total) * 100);
                        const successCount = processed - 1 - failedCount;
                        const embed = new EmbedBuilder()
                            .setDescription(`Adding playlist... ${successCount}/${total} (${percent}%)${failedCount > 0 ? ` | ${failedCount} failed` : ''}`);
                        await interaction.channel.send({ embeds: [embed] });
                    }
                }

                clearTimeout(timeout);

                // Final report
                const successCount = processed - 1 - failedCount;
                const message = `✅ Added ${successCount} songs to the queue!${failedCount > 0 ? ` (${failedCount} songs failed to load)` : ''}`;
                interaction.channel.send(message);

            } catch (error) {
                clearTimeout(timeout);
                console.error('[Playlist] Error processing playlist:', error);
                interaction.channel.send(`Error processing playlist. Some songs may not have been added.`);
            }
        })();
    }
}

module.exports = Play;
