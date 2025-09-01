const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const ytpl = require('ytpl');
const playdl = require('play-dl');
const ytdl = require('ytdl-core');

class Play extends BaseCommand {
    constructor() {
        super({
            name: 'play',
            description: 'Play music from Youtube or attachment',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'video_info',
                    description: 'Youtube URL or Search Query',
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: 'file',
                    description: 'Audio file attachment',
                    type: ApplicationCommandOptionType.Attachment,
                    required: false
                }
            ]
        });
    }

    async execute(interaction, context) {
        const { queue, MusicQueue, Song, musicInfoCache, cacheEnabled } = context;

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.followUp('You need to be in a voice channel to play music!');

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
            return interaction.followUp("I need the permissions to join and speak in your voice channel!");
        }

        let serverQueue = queue.get(interaction.guild.id);
        let url = interaction.options.getString('video_info');
        const attachment = interaction.options.getAttachment('file');
        if (!url && !attachment) {
            return interaction.followUp('You need to provide a URL/search query or attach an audio file.');
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
                expiresAt: Date.now() + 7200000
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
                    console.log(err);
                    queue.delete(interaction.guild.id);
                    return interaction.followUp(err);
                }
            } else {
                serverQueue.songs.push(song);
            }
            return interaction.followUp(`${song.title} has been added to the queue!`);
        }

        const musiclist = [];
        let totalTracks = 1;
        if (url.includes('list=') && !url.includes('watch?v=')) {
            const playlist = await ytpl(url, { limit: Infinity }).catch(error => {
                console.log(error);
                interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a Youtube URL?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");
            });
            if (!playlist) return;
            musiclist.push(...playlist.items.map(x => x.url.substring(0, x.url.indexOf("&list="))));
            totalTracks = playlist.items.length;
        } else {
            let errorFLG = false;
            if (!url.includes('youtube.com') && !url.includes('youtu.be/')) {
                const yt_info = await playdl.search(url, { limit: 1 }).catch(async error => {
                    errorFLG = true;
                    return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");
                });
                if (errorFLG) return;
                if (yt_info.length == 0) return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");
                url = yt_info[0].url;
            }
            musiclist.push(url);
        }

        let song;
        if (!musicInfoCache.has(musiclist[0])) {
            const songInfo = await ytdl.getInfo(musiclist.shift()).catch(async error => {});
            if (!songInfo) {
                return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");
            }
            song = new Song({
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                totalsec: songInfo.videoDetails.lengthSeconds,
                viewcount: songInfo.videoDetails.viewCount,
                author: {
                    name: songInfo.videoDetails.author.name,
                    url: songInfo.videoDetails.author.channel_url,
                    subscriber_count: songInfo.videoDetails.author.subscriber_count,
                    verified: songInfo.videoDetails.author.verified
                },
                thumbnail: songInfo.videoDetails.thumbnails[Object.keys(songInfo.videoDetails.thumbnails).length - 1].url
            });
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
                console.log(err);
                queue.delete(interaction.guild.id);
                return interaction.followUp(err);
            }
        } else {
            serverQueue.songs.push(song);
        }

        if (musiclist.length === 0) return interaction.followUp(`${song.title} has been added to the queue!`);
        interaction.followUp(`We are now adding ${musiclist.length} songs to the queue.\nPleas wait a moment...\nIt may take a while to add songs to the queue.`);

        const remaining = musiclist.length;
        const total = totalTracks;

        setImmediate(async () => {
            let processed = 1;
            const progressEmbeds = [];
            const batchEmbeds = [];
            const batchLimit = total < 300 ? Infinity : total < 1000 ? 5 : 10;

            for (const url of musiclist) {
                let info;
                if (musicInfoCache.has(url)) {
                    info = musicInfoCache.get(url);
                } else {
                    const songInfo = await ytdl.getInfo(url).catch(() => null);
                    if (songInfo) {
                        info = new Song({
                            title: songInfo.videoDetails.title,
                            url: songInfo.videoDetails.video_url,
                            totalsec: songInfo.videoDetails.lengthSeconds,
                            viewcount: songInfo.videoDetails.viewCount,
                            author: {
                                name: songInfo.videoDetails.author.name,
                                url: songInfo.videoDetails.author.channel_url,
                                subscriber_count: songInfo.videoDetails.author.subscriber_count,
                                verified: songInfo.videoDetails.author.verified
                            },
                            thumbnail: songInfo.videoDetails.thumbnails[Object.keys(songInfo.videoDetails.thumbnails).length - 1].url
                        });
                        if (cacheEnabled) musicInfoCache.set(info.url, info);
                    }
                }
                if (info) serverQueue.songs.push(info);
                processed++;
                if (processed % 100 === 0 || processed === total) {
                    const embed = new EmbedBuilder().setDescription(`Adding playlist... (${processed}/${total})`);
                    progressEmbeds.push(embed);
                    batchEmbeds.push(embed);
                    if (total >= 300 && (batchEmbeds.length === batchLimit || processed === total)) {
                        await interaction.channel.send({ embeds: batchEmbeds });
                        batchEmbeds.length = 0;
                    }
                }
                await new Promise(r => setImmediate(r));
            }

            if (total < 300 && progressEmbeds.length) {
                await interaction.channel.send({ embeds: progressEmbeds });
            } else if (batchEmbeds.length) {
                await interaction.channel.send({ embeds: batchEmbeds });
            }

            interaction.channel.send(`Added ${remaining} songs to the queue!`);
        });
    }
}

module.exports = Play;
