try {
    var { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType, ActivityType, TextChannel, VoiceChannel, Guild, GuildMember, User } = require('discord.js');
    var { joinVoiceChannel, createAudioResource, AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior, getVoiceConnection } = require('@discordjs/voice');
    var ytdl = require('ytdl-core');
    var ytpl = require('ytpl');
    var playdl = require("play-dl")
    var streamer = require('yt-dlp-wrap').default;
    var os = require('os');
    var cron = require('node-cron');
    var events = require('events');
    var fs = require('fs');
    var path = require('path');
    var { https } = require('follow-redirects');
    var  stream  = require('stream');
    var ytdl = require('ytdl-core');
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
const MusicQueue = require('./src/MusicQueue');
const Song = require('./src/Song');
const { toHms, parseTime } = require('./src/utils');
const EventEmitter = events.EventEmitter;
const ee = new EventEmitter();
require('dotenv').config();
process.env['YTDL_NO_UPDATE'] = true;

let cacheEnabled = true;
let ramUsageReportEnabled = false;

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
    let client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

    const token = process.env.token
    const queue = new Map();

    let rebootFLG = false;

    const commands = new Map();
    let commandList = [];
    const commandFiles = fs.readdirSync(path.join(__dirname, 'src/Commands')).filter(file => file.endsWith('.js') && file !== 'BaseCommand.js');
    for (const file of commandFiles) {
        const CommandClass = require(`./src/Commands/${file}`);
        const command = new CommandClass();
        commands.set(command.data.name, command);
        commandList.push(command.data);
    }

    const context = { queue, MusicQueue, Song, parseTime, toHms, musicInfoCache, cacheEnabled, client };

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
                const queueContruct = new MusicQueue(
                    client.channels.cache.get(value.textChannel),
                    client.channels.cache.get(value.voiceChannel)
                );
                queueContruct.songs = value.songs;
                queueContruct.playing = value.playing;
                queueContruct.loop = value.loop;
                queueContruct.queueloop = value.queueloop;
                queueContruct.player = null;
                queueContruct.resource = null;
                queueContruct.paused = value.paused;
                queueContruct.autoPlay = value.autoPlay;
                queueContruct.autoPlayPosition = value.autoPlayPosition;
                queueContruct.starttimestamp = value.starttimestamp;
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
        const command = commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction, context);
        } catch (error) {
            console.error(error);
            interaction.followUp('There was an error executing that command!');
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

        if (song.type === 'attachment' && song.expiresAt && Date.now() > song.expiresAt) {
            serverQueue.textChannel.send('Attachment link expired, skipping.');
            serverQueue.songs.shift();
            return play(guild, serverQueue.songs[0], interaction);
        }

        let stream_ytdl;
        player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop,
            },
        });

        if (song.type === 'attachment') {
            const streamAttachment = await new Promise((resolve, reject) => {
                https.get(song.url, res => resolve(res)).on('error', reject);
            });
            resource = createAudioResource(streamAttachment, { inlineVolume: true });
        } else {
            stream_ytdl = ytdl(song.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });
            resource = createAudioResource(stream_ytdl, { inlineVolume: true, inputType: stream.type });
        }

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
                if (songcache) serverQueue.history.push(songcache);
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

    context.play = play;

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
