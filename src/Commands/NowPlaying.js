const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { toHms } = require('../utils');

class NowPlaying extends BaseCommand {
    constructor() {
        super({
            name: 'nowplaying',
            description: 'Show the song you are playing',
            name_localizations: {
                ja: '再生中',
                ko: '현재재생중',
            },
            description_localizations: {
                ja: '再生中の曲を表示',
                ko: '재생 중인 곡 표시',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue, client }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could tell you about the song you are playing!');
        const playsec = Math.floor(serverQueue.resource.playbackDuration / 1000);
        const playtimetext = toHms(playsec);
        const musicplaytimetext = toHms(serverQueue.songs[0].totalsec);
        const getprogress = (nowsec, allsec) => {
            const oneblockamount = allsec / 20;
            const nowblock = Math.floor(nowsec / oneblockamount);
            const playblock = '■';
            const noplayblock = '□';
            return '[' + playblock.repeat(((nowblock - 1) < 0) ? 0 : nowblock - 1) + '☆' + noplayblock.repeat(20 - nowblock) + ']';
        };
        const nowprogresstext = getprogress(playsec, serverQueue.songs[0].totalsec);
        const embed = {
            title: serverQueue.songs[0].title,
            url: serverQueue.songs[0].url,
            color: Math.floor(Math.random() * 16777214) + 1,
            thumbnail: { url: serverQueue.songs[0].thumbnail },
            footer: {
                text: 'SakuraMusic V2',
                iconURL: client.user.displayAvatarURL(),
            },
            author: {
                name: serverQueue.songs[0].author.name,
                url: serverQueue.songs[0].author.url,
            },
            fields: [
                { name: 'channel', value: serverQueue.songs[0].author.name },
                { name: 'Play time', value: playtimetext, inline: true },
                { name: 'Music length', value: musicplaytimetext, inline: true },
                { name: 'Progress', value: nowprogresstext },
                { name: 'viewCount', value: serverQueue.songs[0].viewcount, inline: true },
                { name: 'Channel:subscriber', value: serverQueue.songs[0].author.subscriber_count, inline: true },
                { name: 'Channel:verified', value: serverQueue.songs[0].author.verified, inline: true },
            ],
        };
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = NowPlaying;
