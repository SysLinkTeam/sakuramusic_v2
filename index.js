var { Client, GatewayIntentBits, EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
var { joinVoiceChannel, createAudioResource, playAudioResource, AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
var ytdl = require('ytdl-core');
var ytpl = require('ytpl');
require('dotenv').config();

var client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

var token = process.env.token
var queue = new Map();

var commandList = [
    {
        name: 'play',
        description: 'Play music from Youtube',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'url',
                description: 'Youtube URL',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'skip',
        description: 'Skip the music',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'stop',
        description: 'Stop the music',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'queue',
        description: 'Show the queue',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'nowplaying',
        description: 'Show the song you are playing',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'loop',
        description: 'Loop the song',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'queueloop',
        description: 'Loop the queue',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'pause',
        description: 'Pause the music',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'resume',
        description: 'Resume the music',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'volume',
        description: 'Change the volume',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'volume',
                description: 'Volume',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'remove',
        description: 'Remove the song from the queue',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'songnumber',
                description: 'Index',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'shuffle',
        description: 'Shuffle the queue',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'clear',
        description: 'Clear the queue',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'skipto',
        description: 'Skip to the song',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'songnumber',
                description: 'Index',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'help',
        description: 'Show the help',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'ping',
        description: 'Show the ping',
        type: ApplicationCommandType.ChatInput,
    },
    {
        name: 'invite',
        description: 'Invite SakuraMusicV2 to your server',
        type: ApplicationCommandType.ChatInput,
    }
];


process.on('uncaughtException', async function (err) {
    console.error(err);
});

client.once('ready', () => {
    console.log('SakuraMusic v2 is now online!');
    client.user.setActivity('SakuraMusic v2 | /help', { type: 'LISTENING' });
    client.application.commands.set(commandList);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    await interaction.deferReply();

    switch (interaction.commandName) {
        case 'play':

            var voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) return interaction.followUp('You need to be in a voice channel to play music!');

            var permissions = voiceChannel.permissionsFor(interaction.client.user);

            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return interaction.followUp("I need the permissions to join and speak in your voice channel!");
            }

            var musiclist = [];


            if (interaction.options.getString('url').includes('list=')) {
                var playlist = await ytpl(interaction.options.getString('url')).catch(error => {
                    interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.")
                });

                if (!playlist) return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");

                musiclist.push(playlist.items.map(x => x.url))
                
            } else {
                musiclist.push(interaction.options.getString('url'))
            }
            var songs = [];
            for (var i = 0; i < musiclist.length; i++) {
                var songInfo = await ytdl.getInfo(musiclist[i]).catch(error => {
                    interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.")
                });

                if (!songInfo) return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");

                var song = {
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
                };

                var queueContruct = {
                    textChannel: interaction.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    playing: true,
                    loop: false,
                    queueloop: false,
                    starttimestamp: 0,
                    player: null,
                    resource: null,
                    paused: false
                };

                var serverQueue = queue.get(interaction.guild.id);

                if (!serverQueue) {
                    queue.set(interaction.guild.id, queueContruct);
                    queueContruct.songs.push(song);
                    try {
                        var connection = await joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: voiceChannel.guild.id,
                            adapterCreator: voiceChannel.guild.voiceAdapterCreator
                        });
                        queueContruct.connection = connection;
                        play(interaction.guild, queueContruct.songs[0], interaction);
                        if(musiclist.length > 1) interaction.followUp(`adding ${musiclist.length} songs to the queue!`);
                    } catch (err) {
                        console.log(err);
                        queue.delete(interaction.guild.id);
                        return interaction.followUp(err);
                    }
                } else {
                    serverQueue.songs.push(song);
                    songs.push(song.title);
                }
            }
            if (musiclist.length == 1) return interaction.followUp(`${song.title} has been added to the queue!`);
            interaction.followUp(`${songs.length} songs have been added to the queue!`);
            break;

        case 'skip':
            var serverQueue = queue.get(interaction.guild.id);
            if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to skip the music!');
            if (!serverQueue) return interaction.followUp('There is no song that I could skip!');
            serverQueue.player.stop();
            interaction.followUp('Skipped the song!');
            break;

        case 'stop':
            var serverQueue = queue.get(interaction.guild.id);
            if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to stop the music!');
            serverQueue.songs = [];
            serverQueue.player.stop();
            interaction.followUp('Stopped the music!');
            break;

        case 'queue':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could tell you the queue!');
            var embed = new EmbedBuilder()
                .setTitle('Queue')
                .setDescription(`Now Playing: ${serverQueue.songs[0].title}\n\n${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}`)
                .setFooter({
                    text: "SakuraMusic V2",
                    iconURL: client.user.displayAvatarURL(),
                }
                )
                .setColor('#ff0000')
            interaction.followUp({ embeds: [embed] });
            break;

        case 'nowplaying':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could tell you about the song you are playing!');
            var timestamp = Date.now();
            var playsec = Math.floor(timestamp / 1000) - Math.floor(serverQueue.starttimestamp / 1000);

            function toHms(t) {
                var hms = "";
                var h = t / 3600 | 0;
                var m = t % 3600 / 60 | 0;
                var s = t % 60;

                if (h != 0) {
                    hms = h + ":" + padZero(m) + ":" + padZero(s);
                } else if (m != 0) {
                    hms = m + ":" + padZero(s);
                } else {
                    hms = "0:" + padZero(s);
                }

                return hms;

                function padZero(v) {
                    if (v < 10) {
                        return "0" + v;
                    } else {
                        return v;
                    }
                }
            }

            var playtimetext = toHms(playsec);

            var musicplaytimetext = toHms(serverQueue.songs[0].totalsec)

            function getprogress(nowsec, allsec) {
                var oneblockamount = allsec / 20;
                var nowblock = Math.floor(nowsec / oneblockamount);
                var playblock = "■";
                var noplayblock = "□";
                var progresstext = "[" + playblock.repeat(((nowblock - 1) < 0) ? "0" : nowblock - 1) + "☆" + noplayblock.repeat(20 - nowblock) + "]";
                return progresstext;
            }

            var nowprogresstext = getprogress(playsec, serverQueue.songs[0].totalsec);

            var embed = {
                "title": serverQueue.songs[0].title,
                "url": serverQueue.songs[0].url,
                "color": Math.floor(Math.random() * 16777214) + 1,
                "thumbnail": {
                    "url": serverQueue.songs[0].thumbnail
                },
                "footer": {
                    text: "SakuraMusic V2",
                    iconURL: client.user.displayAvatarURL(),
                },
                "author": {
                    "name": serverQueue.songs[0].author.name,
                    "url": serverQueue.songs[0].author.url
                },
                "fields": [{
                    "name": "channel",
                    "value": serverQueue.songs[0].author.name
                }, {
                    "name": "Play time",
                    "value": playtimetext,
                    "inline": true
                }, {
                    "name": "Music length",
                    "value": musicplaytimetext,
                    "inline": true
                }, {
                    "name": "Progress",
                    "value": nowprogresstext
                }, {
                    "name": "viewCount",
                    "value": serverQueue.songs[0].viewcount,
                    "inline": true
                }, {
                    "name": "Channel:subscriber",
                    "value": serverQueue.songs[0].author.subscriber_count,
                    "inline": true
                }, {
                    "name": "Channel:verified",
                    "value": serverQueue.songs[0].author.verified,
                    "inline": true
                }]
            };

            interaction.followUp({ embeds: [embed] });
            break;

        case 'loop':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could set up loop mode!');
            if (serverQueue.loop === false) {
                serverQueue.loop = true;
                interaction.followUp('Looping the queue!');
            } else {
                serverQueue.loop = false;
                interaction.followUp('Stopped looping the queue!');
            }
            break;

        case 'queueloop':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could set up queue loop mode!');
            if (serverQueue.queueloop === false) {
                serverQueue.queueloop = true;
                interaction.followUp('Looping the queue!');
            } else {
                serverQueue.queueloop = false;
                interaction.followUp('Stopped looping the queue!');
            }
            break;

        case 'volume':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could change volume!');
            if (!interaction.options.getString('volume')) return interaction.followUp(`The current volume is: **${serverQueue.volume}**`);
            if (interaction.options.getString('volume') > 10 || interaction.options.getString('volume') < 1) return interaction.followUp('Please enter a number between 1 and 10!');
            serverQueue.resource.volume.setVolume(interaction.options.getString('volume') / 10);
            interaction.followUp(`I set the volume to: **${interaction.options.getString('volume')}**`);
            break;

        case 'pause':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could pause!');
            if (serverQueue.paused) return interaction.followUp('The song is already paused!');
            serverQueue.paused = true;
            serverQueue.player.pause();
            interaction.followUp('Paused the song!');
            break;

        case 'resume':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could resume!');
            if (!serverQueue.paused) return interaction.followUp('The song is already playing!');
            serverQueue.paused = false;
            serverQueue.player.unpause();
            interaction.followUp('Resumed the song!');
            break;

        case 'remove':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could remove!');
            if (!interaction.options.getString('songnumber')) return interaction.followUp('Please enter a song number!');
            if (interaction.options.getString('songnumber') > serverQueue.songs.length || interaction.options.getString('songnumber') < 1) return interaction.followUp('Please enter a valid song number!');
            serverQueue.songs.splice(interaction.options.getString('songnumber') - 1, 1);
            interaction.followUp(`I removed the song number: **${interaction.options.getString('songnumber')}**`);
            break;

        case 'shuffle':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could shuffle!');
            if (serverQueue.songs.length < 3) return interaction.followUp('There must be at least 3 songs in the queue to shuffle it!');
            for (let i = serverQueue.songs.length - 1; i > 1; i--) {
                const j = 1 + Math.floor(Math.random() * i);
                [serverQueue.songs[i], serverQueue.songs[j]] = [serverQueue.songs[j], serverQueue.songs[i]];
            }
            interaction.followUp('Shuffled the queue!');
            break;

        case 'skipto':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could skip to!');
            if (!interaction.options.getString('songnumber')) return interaction.followUp('Please enter a song number!');
            if (interaction.options.getString('songnumber') > serverQueue.songs.length || interaction.options.getString('songnumber') < 1) return interaction.followUp('Please enter a valid song number!');
            var removed = serverQueue.songs.splice(0, interaction.options.getString('songnumber') - 1);
            if (serverQueue.queueloop === true) serverQueue.push(removed);
            serverQueue.player.stop();
            interaction.followUp(`I skipped to the song number: **${interaction.options.getString('songnumber')}**`);
            break;

        case 'help':
            var embed = new EmbedBuilder()
                .setTitle('Help')
                .setDescription('**play** - Plays a song\n**skip** - Skips a song\n**stop** - Stops the music\n**queue** - Shows the queue\n**nowplaying** - Shows the song that is playing\n**loop** - Loops the queue\n**queueloop** - Loops the queue\n**volume** - Changes the volume\n**pause** - Pauses the song\n**resume** - Resumes the song\n**remove** - Removes a song from the queue\n**shuffle** - Shuffles the queue\n**skipto** - Skips to a song in the queue\n**help** - Shows this message')
                .setFooter({
                    text: "SakuraMusic v2",
                    iconURL: client.user.displayAvatarURL(),
                })
                .setColor('#ff0000')
            interaction.followUp({ embeds: [embed] });
            break;

        case 'ping':
            var embed = new EmbedBuilder()
                .setTitle('Pong!')
                .setDescription(`Latency: **${Date.now() - interaction.createdTimestamp}ms**\nAPI Latency: **${Math.round(client.ws.ping)}ms**`)
                .setFooter({
                    text: "SakuraMusic v2",
                    iconURL: client.user.displayAvatarURL(),
                })
                .setColor('#ff0000')
            interaction.followUp({ embeds: [embed] });
            break;

        case 'clear':
            var serverQueue = queue.get(interaction.guild.id);
            if (!serverQueue) return interaction.followUp('There is no song that I could clear!');
            serverQueue.songs = [];
            serverQueue.player.stop();
            interaction.followUp('Cleared the queue!');
            break;

        case 'invite':
            var embed = new EmbedBuilder()
                .setTitle('Invite')
                .setDescription(`[Click here to invite SakuraMusic v2](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`)
                .setFooter({
                    text: "SakuraMusic v2",
                    iconURL: client.user.displayAvatarURL(),
                })
                .setColor('#ff0000')
            interaction.followUp({ embeds: [embed] });
            break;
    }
});

async function play(guild, song, interaction = null) {
    var serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    var stream = ytdl(song.url, {
        quality: 'highestaudio'
    });

    var player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Stop,
        },
    });

    var resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(0.2);
    await player.play(resource);
    serverQueue.player = player;
    serverQueue.resource = resource;
    serverQueue.connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        if (serverQueue.loop === false) {
            if (serverQueue.queueloop === true) {
                serverQueue.songs.push(serverQueue.songs[0]);
            }
            serverQueue.songs.shift();
        }
        play(guild, serverQueue.songs[0], interaction);
    })
        .on('error', error => {
            console.error(error)
        });

    var embed = new EmbedBuilder()
        .setTitle('Now Playing')
        .setDescription(`[${song.title}](${song.url})`)
        .setFooter({
            text: "SakuraMusic v2",
            iconURL: client.user.displayAvatarURL(),
        })
        .setColor('#ff0000')
    interaction.followUp({ embeds: [embed] });
    serverQueue.starttimestamp = Date.now();
}

client.login(token);
