const { Client, GatewayIntentBits, EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { joinVoiceChannel, createAudioResource, playAudioResource, AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const playdl = require("play-dl")
const cluster = require('cluster');
const { cpus } = require('os');
const { count } = require('console');
const events = require('events');
const EventEmitter = events.EventEmitter;
const ee = new EventEmitter();
const numCPUs = cpus().length;
require('dotenv').config();
process.env['YTDL_NO_UPDATE'] = true;


if (cluster.isPrimary) {
    let temp = {};
    let Index = {};
    let active = {};
    let count = {};
    client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

    token = process.env.token
    queue = new Map();

    commandList = [
        {
            name: 'play',
            description: 'Play music from Youtube',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'video_info',
                    description: 'Youtube URL or Search Query',
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

                voiceChannel = interaction.member.voice.channel;

                if (!voiceChannel) return interaction.followUp('You need to be in a voice channel to play music!');

                permissions = voiceChannel.permissionsFor(interaction.client.user);

                if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                    return interaction.followUp("I need the permissions to join and speak in your voice channel!");
                }

                var musiclist = [];
                serverQueue = queue.get(interaction.guild.id);
                url = interaction.options.getString('video_info');
                if (url.includes('list=')) {
                    playlist = await ytpl(url).catch(error => {
                        console.log(error)
                        interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a Youtube URL?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.")
                    });

                    if (!playlist) return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a Youtube URL?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");

                    musiclist.push(...playlist.items.map(x => x.url))

                } else {
                    if (!url.includes('youtube.com') || !url.includes('youtu.be/')) {
                        let yt_info = await playdl.search(url, {
                            limit: 1
                        })
                        if (yt_info.length = 1) url = yt_info[0].url
                    }
                    musiclist.push(url)
                }
                songs = [];
                if (!serverQueue) {

                    songInfo = await ytdl.getInfo(musiclist.shift()).catch(async error => {

                    });

                    if (!songInfo) {
                        return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.")
                    }

                    song = {
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

                    queueContruct = {
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



                    queue.set(interaction.guild.id, queueContruct);
                    queueContruct.songs.push(song);
                    try {
                        connection = await joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: voiceChannel.guild.id,
                            adapterCreator: voiceChannel.guild.voiceAdapterCreator
                        });
                        queueContruct.connection = connection;
                        play(interaction.guild, queueContruct.songs[0], interaction);
                    } catch (err) {
                        console.log(err);
                        queue.delete(interaction.guild.id);
                        return interaction.followUp(err);
                    }
                } else {
                    serverQueue.songs.push(song);
                    songs.push(song.title);
                }
                if (musiclist.length == 0) return interaction.followUp(`${song.title} has been added to the queue!`);

                let token = Math.random().toString(36).slice(-8);

                Index[token] = 0;
                active[token] = 0;
                count[token] = 0;
                temp[token] = [];
                let next = [musiclist.shift(), Index[token], token];

                let followUped = false;

                const online_handler = (worker) => {
                    if (musiclist.length <= 0) return;
                    worker.send(next);
                    active[token]++;
                    Index[token]++;
                    next = [musiclist.shift(), Index[token], token];
                }
                const message_handler = async (worker, message) => {
                    if (message.type == "end") {
                        if (message.token != token) return;
                        temp[message.token].push({ song: message.song, index: message.index });
                        count[message.token]++;

                        if (musiclist.length <= 0) {
                            active[message.token]--;
                            if (active[message.token] != 0) return;
                            followUped = true;
                            serverQueue.songs.push(...temp[message.token].sort((a, b) => ((a.index > b.index) ? -1 : 1)).map(x => x.song));
                            interaction.followUp(`Added ${count[message.token]} songs to the queue!`);
                            delete active[message.token];
                            delete Index[message.token];
                            delete count[message.token];
                            delete temp[message.token];
                            return
                        } else {
                            worker.send(next);
                            Index[message.token]++;
                            next = [musiclist.shift(), Index[message.token], message.token];
                        }

                    } else if (message.type == "error") {
                        if (musiclist.length == 0) {
                            active[message.token]--;
                            if (active[message.token] != 0) return;
                            followUped = true;
                            serverQueue.songs.push(...temp[message.token].sort((a, b) => ((a.index > b.index) ? -1 : 1)).map(x => x.song));
                            interaction.followUp(`Added ${count[message.token]} songs to the queue!`);
                            delete active[message.token];
                            delete Index[message.token];
                            delete count[message.token];
                            delete temp[message.token];
                            return
                        } else {
                            worker.send(next);
                            Index[message.token]++;
                            next = [musiclist.shift(), Index[token], token];
                        }
                    }
                }
                if (Object.keys(cluster.workers).length == 0) {
                    for (i = 0; i < numCPUs; i++) {
                        cluster.fork();
                    }
                } else {
                    for (const worker in cluster.workers) {
                        online_handler(cluster.workers[worker]);
                    }
                }
                cluster.on('online', online_handler);
                cluster.on('message', message_handler);

                break;

            case 'skip':
                serverQueue = queue.get(interaction.guild.id);
                if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to skip the music!');
                if (!serverQueue) return interaction.followUp('There is no song that I could skip!');
                serverQueue.player.stop();
                interaction.followUp('Skipped the song!');
                break;

            case 'stop':
                serverQueue = queue.get(interaction.guild.id);
                if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to stop the music!');
                serverQueue.songs = [];
                serverQueue.player.stop();
                interaction.followUp('Stopped the music!');
                break;

            case 'queue':
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could tell you the queue!');
                var songlist = serverQueue.songs.map(song => `**-** ${song.title}`).join('\n');
                if (songlist.length > 1500) {
                    songlist = songlist.slice(0, 1500).split('\n').slice(0, -1).join('\n') + `\n...and more ${serverQueue.songs.map(song => `**-** ${song.title}`).length - songlist.slice(0, 1500).split('\n').slice(0, -1).length} songs in queue!`;
                }
                embed = new EmbedBuilder()
                    .setTitle('Queue')
                    .setDescription(`Now Playing: ${serverQueue.songs[0].title}\n\n${songlist}`)
                    .setFooter({
                        text: "SakuraMusic V2",
                        iconURL: client.user.displayAvatarURL(),
                    }
                    )
                    .setColor('#ff0000')
                interaction.followUp({ embeds: [embed] });
                break;

            case 'nowplaying':
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could tell you about the song you are playing!');
                timestamp = Date.now();
                playsec = Math.floor(timestamp / 1000) - Math.floor(serverQueue.starttimestamp / 1000);

                function toHms(t) {
                    hms = "";
                    h = t / 3600 | 0;
                    m = t % 3600 / 60 | 0;
                    s = t % 60;

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

                playtimetext = toHms(playsec);

                musicplaytimetext = toHms(serverQueue.songs[0].totalsec)

                function getprogress(nowsec, allsec) {
                    oneblockamount = allsec / 20;
                    nowblock = Math.floor(nowsec / oneblockamount);
                    playblock = "■";
                    noplayblock = "□";
                    progresstext = "[" + playblock.repeat(((nowblock - 1) < 0) ? "0" : nowblock - 1) + "☆" + noplayblock.repeat(20 - nowblock) + "]";
                    return progresstext;
                }

                nowprogresstext = getprogress(playsec, serverQueue.songs[0].totalsec);

                embed = {
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
                serverQueue = queue.get(interaction.guild.id);
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
                serverQueue = queue.get(interaction.guild.id);
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
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could change volume!');
                if (!interaction.options.getString('volume')) return interaction.followUp(`The current volume is: **${serverQueue.volume}**`);
                if (interaction.options.getString('volume') > 10 || interaction.options.getString('volume') < 1) return interaction.followUp('Please enter a number between 1 and 10!');
                serverQueue.resource.volume.setVolume(interaction.options.getString('volume') / 10);
                interaction.followUp(`I set the volume to: **${interaction.options.getString('volume')}**`);
                break;

            case 'pause':
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could pause!');
                if (serverQueue.paused) return interaction.followUp('The song is already paused!');
                serverQueue.paused = true;
                serverQueue.player.pause();
                interaction.followUp('Paused the song!');
                break;

            case 'resume':
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could resume!');
                if (!serverQueue.paused) return interaction.followUp('The song is already playing!');
                serverQueue.paused = false;
                serverQueue.player.unpause();
                interaction.followUp('Resumed the song!');
                break;

            case 'remove':
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could remove!');
                if (!interaction.options.getString('songnumber')) return interaction.followUp('Please enter a song number!');
                if (interaction.options.getString('songnumber') > serverQueue.songs.length || interaction.options.getString('songnumber') < 1) return interaction.followUp('Please enter a valid song number!');
                serverQueue.songs.splice(interaction.options.getString('songnumber') - 1, 1);
                interaction.followUp(`I removed the song number: **${interaction.options.getString('songnumber')}**`);
                break;

            case 'shuffle':
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could shuffle!');
                if (serverQueue.songs.length < 3) return interaction.followUp('There must be at least 3 songs in the queue to shuffle it!');
                for (let i = serverQueue.songs.length - 1; i > 1; i--) {
                    const j = 1 + Math.floor(Math.random() * i);
                    [serverQueue.songs[i], serverQueue.songs[j]] = [serverQueue.songs[j], serverQueue.songs[i]];
                }
                interaction.followUp('Shuffled the queue!');
                break;

            case 'skipto':
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could skip to!');
                if (!interaction.options.getString('songnumber')) return interaction.followUp('Please enter a song number!');
                if (interaction.options.getString('songnumber') > serverQueue.songs.length || interaction.options.getString('songnumber') < 1) return interaction.followUp('Please enter a valid song number!');
                removed = serverQueue.songs.splice(0, interaction.options.getString('songnumber') - 1);
                if (serverQueue.queueloop === true) serverQueue.push(removed);
                serverQueue.player.stop();
                interaction.followUp(`I skipped to the song number: **${interaction.options.getString('songnumber')}**`);
                break;

            case 'help':
                embed = new EmbedBuilder()
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
                embed = new EmbedBuilder()
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
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('There is no song that I could clear!');
                serverQueue.songs = [];
                serverQueue.player.stop();
                interaction.followUp('Cleared the queue!');
                break;

            case 'invite':
                embed = new EmbedBuilder()
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

    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (!oldState.member.user.bot && oldState.channelId !=null && newState.channelId === null && oldState.channel.members.size === 1) {
            serverQueue = queue.get(oldState.guild.id);
            if (!serverQueue) return;
            serverQueue.songs = [];
            serverQueue.player.stop();
            serverQueue.textChannel.send('Everyone left the voice channel, so I left the voice channel as well!');
        }
    });


    async function play(guild, song, interaction = null) {
        serverQueue = queue.get(guild.id);

        if (!song) {
            serverQueue.connection.destroy();
            queue.delete(guild.id);
            return;
        }

        let stream = await playdl.stream(song.url)

        player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop,
            },
        });

        resource = createAudioResource(stream.stream, { inlineVolume: true, inputType: stream.type });
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

        embed = new EmbedBuilder()
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

} else {
    process.on('message', async (message) => {
        if (message[0] === "stop") return process.exit(0);
        songInfo = await ytdl.getInfo(message[0]).catch(error => {
            process.send({ type: "error", value: [error], index: message[1], token: message[2] });

        });

        if (!songInfo) return process.send({ type: "error", value: ["No song found"], index: message[1], token: message[2] });

        song = {
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

        process.send({ type: "end", song: song, index: message[1], token: message[2] });

    });
}