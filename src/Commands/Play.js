const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const ytpl = require('ytpl');
const playdl = require('play-dl');
const ytdl = require('ytdl-core');
const { ERRORS, INFO } = require('../constants/messages');
const { ATTACHMENT, PLAYLIST } = require('../config/constants');

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
        if (url.includes('list=') && !url.includes('watch?v=')) {
            const playlist = await ytpl(url, { limit: Infinity }).catch(error => {
                console.error(error);
                interaction.followUp(ERRORS.YOUTUBE_FETCH_FAILED);
            });
            if (!playlist) return;
            musiclist.push(...playlist.items.map(x => x.url.substring(0, x.url.indexOf("&list="))));
            totalTracks = playlist.items.length;
        } else {
            let errorFLG = false;
            if (!url.includes('youtube.com') && !url.includes('youtu.be/')) {
                const yt_info = await playdl.search(url, { limit: 1 }).catch(async error => {
                    errorFLG = true;
                    return interaction.followUp(ERRORS.YOUTUBE_FETCH_FAILED);
                });
                if (errorFLG) return;
                if (yt_info.length == 0) return interaction.followUp(ERRORS.YOUTUBE_FETCH_FAILED);
                url = yt_info[0].url;
            }
            musiclist.push(url);
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

        setImmediate(async () => {
            let processed = 1;
            const progressEmbeds = [];
            const batchEmbeds = [];
            const batchLimit = total < PLAYLIST.BATCH_LIMIT_SMALL ? Infinity
                             : total < PLAYLIST.BATCH_LIMIT_MEDIUM ? PLAYLIST.BATCH_SIZE_MEDIUM
                             : PLAYLIST.BATCH_SIZE_LARGE;

            for (const url of musiclist) {
                let info;
                if (musicInfoCache.has(url)) {
                    info = musicInfoCache.get(url);
                } else {
                    const songInfo = await ytdl.getInfo(url).catch(() => null);
                    if (songInfo) {
                        info = Song.fromYouTubeInfo(songInfo);
                        if (cacheEnabled) musicInfoCache.set(info.url, info);
                    }
                }
                if (info) serverQueue.songs.push(info);
                processed++;
                if (processed % PLAYLIST.PROGRESS_REPORT_INTERVAL === 0 || processed === total) {
                    const embed = new EmbedBuilder().setDescription(`Adding playlist... (${processed}/${total})`);
                    progressEmbeds.push(embed);
                    batchEmbeds.push(embed);
                    if (total >= PLAYLIST.BATCH_LIMIT_SMALL && (batchEmbeds.length === batchLimit || processed === total)) {
                        await interaction.channel.send({ embeds: batchEmbeds });
                        batchEmbeds.length = 0;
                    }
                }
                await new Promise(r => setImmediate(r));
            }

            if (total < PLAYLIST.BATCH_LIMIT_SMALL && progressEmbeds.length) {
                await interaction.channel.send({ embeds: progressEmbeds });
            } else if (batchEmbeds.length) {
                await interaction.channel.send({ embeds: batchEmbeds });
            }

            interaction.channel.send(`Added ${remaining} songs to the queue!`);
        });
    }
}

module.exports = Play;
