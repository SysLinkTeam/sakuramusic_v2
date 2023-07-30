try {
    var { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, ActivityType, TextChannel, VoiceChannel, Guild, GuildMember, User } = require('discord.js');
    var { joinVoiceChannel, createAudioResource, playAudioResource, AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, VoiceConnection, AudioPlayer, AudioResource } = require('@discordjs/voice');
    var ytdl = require('ytdl-core');
    var ytpl = require('ytpl');
    var playdl = require("play-dl")
    var streamer = require('yt-dlp-wrap').default;
    var cluster = require('cluster');
    var { cpus } = require('os');
    var os = require('os');
    var cron = require('node-cron');
    var events = require('events');
    var fs = require('fs');
    var { https } = require('follow-redirects');
    var  stream  = require('stream');
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
    console.log("Installing dependencies...")
    const { execSync } = require('child_process');
    execSync('npm install', (err, stdout, stderr) => {
        if (err) {
            console.log("Failed to install dependencies.")
            console.log(err);
            return;
        }
        console.log(stdout);
        console.log("Dependencies installed. restarting...")
        require('child_process').execSync('node index.js', { stdio: [0, 1, 2] });
        process.exit();
    });

}

const EventEmitter = events.EventEmitter;
const ee = new EventEmitter();
const numCPUs = cpus().length;
require('dotenv').config();
process.env['YTDL_NO_UPDATE'] = true;

if (cluster.isPrimary) {
    cacheEnabled = true;
    ramUsageReportEnabled = false;
    multiCoreScale = 1;

    if (process.env.multiCoreScale) {
        multiCoreScale = parseInt(process.env.multiCoreScale);
        if (multiCoreScale < 1) multiCoreScale = 1;
    }

    if (process.env.cacheEnabled == "false") {
        cacheEnabled = false;
        console.log("-------Cache is disabled-------")
        console.log("Cache will not be saved")
        console.log("Cache will not be loaded on startup")
        console.log("It may increase response time and Network usage but it will reduce RAM usage")
        console.log("If you want to enable cache, set cacheEnabled to true in .env")
        console.log("-------------------------------")
    }
    if (cacheEnabled) {
        console.log("-------Cache is enabled-------")
        console.log("Cache will be saved every 5 seconds")
        console.log("Cache will be loaded on startup")
        console.log("It may use a lot of RAM if you have a lot of servers or users but it will reduce response time and reduce Network usage")
        if (process.env.ramUsageReportEnabled == "true") {
            console.log("ramUsageReportEnabled is enabled. It will show RAM usage report every 5 seconds.")
            ramUsageReportEnabled = true;
        } else {
            console.log("if you want to show RAM usage report, set ramUsageReportEnabled to true in .env")
        }
        console.log("If you want to disable cache, set cacheEnabled to false in .env")
        console.log("-------------------------------")
    }
    const replacer = (k, v) => {
        if (v instanceof Map) {
            return {
                dataType: "Map",
                value: [...v]
            }
        }
        return v
    }
    const reviver = (k, v) => {
        if (typeof v === "object" && v !== null) {
            if (v.dataType === "Map") {
                return new Map(v.value)
            }
        } else if (v === undefined || v === null) {
            return new Map()
        }
        return v
    }
    let musicInfoCache = new Map();
    let temp = {};
    let Index = {};
    let active = {};
    let count = {};
    let allcount = {};
    let fallcount = {};
    client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

    token = process.env.token
    queue = new Map();

    rebootFLG = false;

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
        },
        {
            name: 'autoplay',
            description: 'Autoplay the music if the queue is empty',
        }
    ];

    let yt_dlp_filename = "";

    switch (process.platform) {
        case "win32":
            if (process.arch == "x64") {
                yt_dlp_filename = "yt-dlp.exe";
                break;
            }
            yt_dlp_filename = "yt-dlp_x86.exe";
            break;
        case "linux":
            yt_dlp_filename = "yt-dlp";
            break;
        case "darwin":
            yt_dlp_filename = "yt-dlp_macos";
            break;
        default:
            console.log("Unsupported platform. Please use Windows, Linux or macOS.")
            process.exit(1);
    }

    let userAgent = process.env.userAgent ? process.env.userAgent : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:68.0) Gecko/20100101 Firefox/68.0";
    (async () => await (() => {
        if (!fs.existsSync('./' + yt_dlp_filename)) {
            return new Promise((resolve) => {
                console.log("getting latest yt-dlp...")
                https.get('https://api.github.com/repos/yt-dlp/yt-dlp-nightly-builds/releases/latest', { headers: { "User-Agent": userAgent } }, (res) => {
                    let body = '';
                    res.on('data', (chunk) => {
                        body += chunk;
                    });
                    res.on('end', () => {
                        let json = JSON.parse(body);
                        console.log("downloading yt-dlp...")
                        var options = {
                            headers: {
                                'User-Agent': userAgent,
                                'Accept': 'application/octet-stream'
                            }
                        };
                        https.get(json.assets.filter((asset) => asset.name == yt_dlp_filename)[0].url,options, (res) => {
                            res.pipe(fs.createWriteStream('./' + yt_dlp_filename)).on('finish', () => {
                                console.log("yt-dlp downloaded!")
                                fs.chmodSync('./' + yt_dlp_filename, 0o755);
                                fs.writeFileSync('./yt-dlp_version', 'utf8');
                                console.log("yt-dlp version: " + json.tag_name);
                                resolve();
                            });
                        }).on('error', (e) => {
                            console.error(e);
                        });
                    });
                }).on('error', (e) => {
                    console.error(e);
                });
            })
        } else {
            let yt_dlp_version = fs.readFileSync('./yt-dlp_version', 'utf8');
            console.log("yt-dlp version: " + yt_dlp_version);
            console.log("yt-dlp is already downloaded!")
            console.log("checking for updates...")
            https.get('https://api.github.com/repos/yt-dlp/yt-dlp-nightly-builds/releases/latest', { headers: { "User-Agent": userAgent } }, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    let json = JSON.parse(body);
                    if (json.tag_name != yt_dlp_version) {
                        console.log("updating yt-dlp...")
                        var options = {
                            headers: {
                                'User-Agent': userAgent,
                                'Accept': 'application/octet-stream'
                            }
                        };
                        https.get(json.assets.filter((asset) => asset.name == yt_dlp_filename)[0].url,options, (res) => {
                            res.pipe(fs.createWriteStream('./' + yt_dlp_filename)).on('finish', () => {
                                console.log("yt-dlp updated!")
                                fs.chmodSync('./' + yt_dlp_filename, 0o755);
                                fs.writeFileSync('./yt-dlp_version', json.tag_name);
                            });
                        }).on('error', (e) => {
                            console.error(e);
                        });
                    } else {
                        console.log("yt-dlp is up to date!")
                    }
                });
            }).on('error', (e) => {
                console.error(e);
            });
        }
    })())();

    process.on('uncaughtException', async function (err) {
        console.error(err);
    });

    client.once('ready', async () => {
        console.log(`${client.user.username} is now online!`);
        client.application.commands.set(commandList);

        if (!fs.existsSync('./cache.json')) fs.writeFileSync('./cache.json', JSON.stringify(new Map(), replacer))
        if (cacheEnabled) musicInfoCache = JSON.parse(fs.readFileSync('./cache.json', 'utf8'), reviver);

        if (!fs.existsSync('./queue.json')) fs.writeFileSync('./queue.json', JSON.stringify(getQueueData()))
        async function loadQueue() {
            let queuedata = JSON.parse(fs.readFileSync('./queue.json', 'utf8'));
            if (queuedata.length == 0) return new Map();
            queuedata.forEach((value) => {
                queueContruct = {
                    textChannel: client.channels.cache.get(value.textChannel),
                    voiceChannel: client.channels.cache.get(value.voiceChannel),
                    connection: null,
                    songs: value.songs,
                    playing: value.playing,
                    loop: value.loop,
                    queueloop: value.queueloop,
                    player: null,
                    resource: null,
                    paused: value.paused,
                    autoPlay: value.autoPlay,
                    autoPlayPosition: value.autoPlayPosition,
                    starttimestamp: value.starttimestamp
                };
                if (queueContruct.songs.length == 0) return;
                if (queueContruct.textChannel == null || queueContruct.voiceChannel == null) return;
                queue.set(value.key, queueContruct);
            });
            rebootFLG = true;
        }
        await loadQueue();
        if (queue.length != 0) rebootFLG = true;
        if (rebootFLG) {
            for (const [key, value] of queue) {
                if (value.songs.length == 0) continue;
                value.textChannel.send({ embeds: [new EmbedBuilder().setTitle("Sorry for the inconvenience...").setDescription("We are sorry that you had to restart the bot while using our service.\nWe are always working to fix bugs, add new features and improve stability.\nPlease be assured that we will be restarting soon, and that your queue and other data will be preserved after the restart.").setColor("#ff0000").setFooter({ text: "SakuraMusic v2", iconURL: client.user.displayAvatarURL() })] })
                value.connection = await joinVoiceChannel({
                    channelId: value.voiceChannel.id,
                    guildId: value.voiceChannel.guild.id,
                    adapterCreator: value.voiceChannel.guild.voiceAdapterCreator
                });
                play(value.voiceChannel.guild, value.songs[0])
            }
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
        await interaction.deferReply();

        switch (interaction.commandName) {
            case 'play':

                voiceChannel = interaction.member.voice.channel;

                if (!voiceChannel) return interaction.followUp('You need to be in a voice channel to play music!');

                permissions = voiceChannel.permissionsFor(interaction.client.user);

                if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
                    return interaction.followUp("I need the permissions to join and speak in your voice channel!");
                }

                var musiclist = [];
                serverQueue = queue.get(interaction.guild.id);
                url = interaction.options.getString('video_info');
                if (url.includes('list=') && !url.includes('watch?v=')) {
                    playlist = await ytpl(url, { limit: Infinity }).catch(error => {
                        console.log(error)
                        interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a Youtube URL?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.")
                    });

                    if (!playlist) return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a Youtube URL?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.");

                    musiclist.push(...playlist.items.map(x => x.url.substring(0, x.url.indexOf("&list="))));

                } else {
                    errorFLG = false;
                    if (!url.includes('youtube.com') && !url.includes('youtu.be/')) {
                        let yt_info = await playdl.search(url, {
                            limit: 1
                        }).catch(async error => {
                            errorFLG = true;
                            return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.")
                        });
                        if (errorFLG) return;
                        if (yt_info.length == 0) return interaction.followUp("Oops, there seems to have been an error.\nPlease check the following points.\n*Is the URL correct?\n*Are you using a URL other than Youtube?\n*Is the URL shortened? \nIf the problem still persists, please wait a while and try again.")
                        url = yt_info[0].url
                    }
                    musiclist.push(url)
                }
                songs = [];
                if (!musicInfoCache.has(musiclist[0])) {
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

                    if (cacheEnabled) musicInfoCache.set(songInfo.videoDetails.video_url, song)
                } else {
                    song = musicInfoCache.get(musiclist.shift())
                }
                if (!serverQueue) {

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
                        paused: false,
                        autoPlay: false,
                        autoPlayPosition: 1
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
                interaction.followUp(`We are now adding ${musiclist.length} songs to the queue.\nPleas wait a moment...\nIt may take a while to add songs to the queue.`);

                let token = Math.random().toString(36).slice(-8);

                Index[token] = 0;
                active[token] = 0;
                count[token] = 0;
                temp[token] = [];
                allcount[token] = musiclist.length;
                fallcount[token] = 0;
                let next = [musiclist.shift(), Index[token], token];

                let followUped = false;

                const online_handler = (worker) => {
                    if (musiclist.length <= 0) return;
                    if (musicInfoCache.has(musiclist[0])) {
                        song = musicInfoCache.get(musiclist.shift())
                        temp[token].push({ song: song, index: Index[token] });
                        Index[token]++;
                        count[token]++;
                        return online_handler(worker);
                    }
                    worker.send(next);
                    active[token]++;
                    Index[token]++;
                    next = [musiclist.shift(), Index[token], token];
                }
                const message_handler = async (worker, message) => {
                    if (message.type == "end") {
                        if (message.token != token) return;
                        temp[message.token].push({ song: message.song, index: message.index });
                        if (cacheEnabled) musicInfoCache.set(message.song.url, message.song);
                        count[message.token]++;

                        if (musiclist.length <= 0) {
                            active[message.token]--;
                            if (active[message.token] != 0 || allcount[message.token] == (count[message.token] + failcount[message.token])) return;
                            followUped = true;
                            serverQueue.songs.push(...temp[message.token].sort((a, b) => ((a.index > b.index) ? -1 : 1)).map(x => x.song));
                            serverQueue.textChannel.send(`Added ${count[message.token]} songs to the queue!`);
                            delete active[message.token];
                            delete Index[message.token];
                            delete count[message.token];
                            delete temp[message.token];
                            delete allcount[message.token];
                            delete fallcount[message.token];
                            return
                        } else {
                            if (musicInfoCache.has(musiclist[0])) {
                                song = musicInfoCache.get(musiclist.shift())
                                Index[token]++;
                                count[token]++;
                                return message_handler(worker, { type: "end", token: token, song: song, index: Index[token] - 1 });
                            }
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
                            delete allcount[message.token];
                            delete fallcount[message.token];
                            return
                        } else {
                            if (musicInfoCache.has(musiclist[0])) {
                                song = musicInfoCache.get(musiclist.shift())
                                Index[token]++;
                                fallcount[token]++;
                                return message_handler(worker, { type: "end", token: token, song: song, index: Index[token] - 1 });
                            }
                            worker.send(next);
                            Index[message.token]++;
                            next = [musiclist.shift(), Index[token], token];
                        }
                    }
                }
                if (Object.keys(cluster.workers).length == 0) {
                    for (i = 0; i < numCPUs * multiCoreScale; i++) {
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
                if (!serverQueue) return interaction.followUp('There is no song that I could stop!');
                serverQueue.songs = [];
                serverQueue.autoPlay = false;
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
                playsec = Math.floor(serverQueue.resource.playbackDuration / 1000);

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
                    .setDescription('**play** - Plays a song\n**skip** - Skips a song\n**stop** - Stops the music\n**queue** - Shows the queue\n**nowplaying** - Shows the song that is playing\n**loop** - Loops the queue\n**queueloop** - Loops the queue\n**volume** - Changes the volume\n**pause** - Pauses the song\n**resume** - Resumes the song\n**remove** - Removes a song from the queue\n**shuffle** - Shuffles the queue\n**skipto** - Skips to a song in the queue\n**help** - Shows this message\n**ping** - Shows the ping\n**invite** - Invite SakuraMusic v2 to your server\n**autoplay** - Autoplay the music if the queue is empty')
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

            case 'autoplay':
                if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to enable/disable autoplay!');
                serverQueue = queue.get(interaction.guild.id);
                if (!serverQueue) return interaction.followUp('Play a song first!');
                if (serverQueue.autoPlay === false) {
                    serverQueue.autoPlay = true;
                    interaction.followUp('Autoplay is enabled!');
                } else {
                    serverQueue.autoPlay = false;
                    interaction.followUp('Autoplay is disabled!');
                }
        }
    });

    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (!oldState.member.user.bot && oldState.channelId != null && newState.channelId === null && oldState.channel.members.size === 1) {
            serverQueue = queue.get(oldState.guild.id);
            if (!serverQueue) return;
            serverQueue.songs = [];
            serverQueue.autoPlay = false;
            serverQueue.player.stop();
            serverQueue.connection.destroy();
            serverQueue.textChannel.send('Everyone left the voice channel, so I left the voice channel as well!');
        }
    });


    async function play(guild, song, interaction = null, songcache = null) {
        serverQueue = queue.get(guild.id);
        if (!serverQueue) return;

        if (!song) {
            if (serverQueue.autoPlay === true) {
                serverQueue.textChannel.send('Auto play is enabled, so I will search next song for you!');
                title = songcache.title.slice(0, songcache.title.length / 2);
                let yt_info = await playdl.search(title, {
                    limit: 10
                })
                if (yt_info.length != 0) {
                    yt_info = pickNextSong(yt_info, songcache);
                    if (yt_info == null) {
                        serverQueue.textChannel.send('I cannot find the next song, so I will stop playing music');
                        if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
                        queue.delete(guild.id);
                        return;
                    }
                    songInfo = await ytdl.getInfo(yt_info.url).catch(async error => {
                        if (error) {
                            console.log(error);
                            serverQueue.textChannel.send('I find the next song, but I cannot play it, so I will stop playing music.\nPlease try again later.');
                            if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
                            queue.delete(guild.id);
                            return;
                        }
                    });
                    if (songInfo) {
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
                        serverQueue.songs.push(song);
                        serverQueue.autoPlayPosition++;
                        return play(guild, serverQueue.songs[0], interaction);
                    }
                } else {
                    serverQueue.textChannel.send('I cannot find the next song, so I will stop playing music');

                }
            }
            serverQueue.textChannel.send('Stop playing music because there is no song in the queue!');
            if (getVoiceConnection(guild.id)) serverQueue.connection.destroy();
            queue.delete(guild.id);
            return;
        }

        let stream_playdl = await playdl.stream(song.url)
        
        /*
        let stream_ytdlp = new streamer('./' + yt_dlp_filename).execStream([
            song.url,
            '-f',
            'best[ext=mp4]',
        ]);
        */

        
        stream.on('error', (err) => {
            console.log(err);
            serverQueue.textChannel.send('I cannot play this song, so I will skip it!');
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0], interaction);
        });
        
        player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop,
            },
        });
        

        resource = createAudioResource(stream_playdl.stream, { inlineVolume: true, inputType: stream.type });
        resource.volume.setVolume(0.2);
        await player.play(resource);
        serverQueue.player = player;
        serverQueue.resource = resource;
        serverQueue.connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            serverQueue = queue.get(guild.id);
            if (serverQueue.loop === false) {
                if (serverQueue.queueloop === true) {
                    serverQueue.songs.push(serverQueue.songs[0]);
                }
                songcache = serverQueue.songs.shift();
            }

            play(guild, serverQueue.songs[0], interaction, songcache);
        }).on('error', error => {
            console.error(error)
        });
        embed = {
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
        serverQueue.starttimestamp = Date.now();
    }

    function pickNextSong(array, playedsong) {
        if (array.length == 0 || array.length == 1) return null;
        array = array[Math.floor(Math.random() * array.length)]
        if (array.url == playedsong.url) return pickNextSong(array, playedsong);
        return array;
    }

    cron.schedule('*/5 * * * * *', async () => {
        client.user.setPresence({
            activities: [{
                name: ` /help | ${queue.size} vc & ${client.guilds.cache.size} servers`,
                type: ActivityType.Streaming,
            }]
        });
        fs.writeFile('./queue.json', JSON.stringify(getQueueData()), (err) => { if (err) console.error(err) });
        if (cacheEnabled === false) return;
        fs.writeFile('./cache.json', JSON.stringify(musicInfoCache, replacer), (err) => { if (err) console.error(err) });
        let totalmemory = os.totalmem()
        let usedmemory = os.totalmem() - os.freemem()
        let ramUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        if (ramUsageReportEnabled) {
            console.log("--------------------ram usage report--------------------")
            console.log("time: " + new Date().toLocaleString())
            console.log(`Total memory(machine): ${Math.floor(totalmemory / 1024 / 1024 / 1024)} GB`)
            console.log(`Used memory(machine): ${Math.floor(usedmemory / 1024 / 1024 / 1024)} GB`)
            console.log(`RAM Used Percentage(machine): ${Math.floor((usedmemory / totalmemory) * 100)}%`)
            console.log(`RAM usage(SakuraMusic v2): ${Math.floor(ramUsage)} MB`)
            console.log("--------------------ram usage report--------------------")
        }
        if (usedmemory / totalmemory > 0.8) {
            musicInfoCache = new Map();
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            console.error("Cleared cache because of memory usage being too high.")
            console.error(`Total memory: ${Math.floor(totalmemory / 1024 / 1024 / 1024)} GB`)
            console.error(`Used memory: ${Math.floor(usedmemory / 1024 / 1024 / 1024)} GB`)
            console.error(`Percentage: ${Math.floor((usedmemory / totalmemory) * 100)}%`)
            console.error(`Caching has been disabled.`)
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            cacheEnabled = false;
        }
    });

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

    function getQueueData() {
        let data = [];
        var i = 0;
        queue.forEach((value, key) => {
            data[i] = {};
            data[i].key = key;
            data[i].textChannel = value.textChannel.id;
            data[i].voiceChannel = value.voiceChannel.id;
            data[i].songs = value.songs;
            data[i].playing = value.playing;
            data[i].loop = value.loop;
            data[i].queueloop = value.queueloop;
            data[i].starttimestamp = value.starttimestamp;
            data[i].autoPlay = value.autoPlay;
            data[i].autoPlayPosition = value.autoPlayPosition;
            data[i].paused = value.paused;
            data[i].volume = value.resource.volume.volume;
            i++;
        });
        return data;
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