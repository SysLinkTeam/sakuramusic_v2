const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Autoplay extends BaseCommand {
    constructor() {
        super({
            name: 'autoplay',
            description: 'Autoplay the music if the queue is empty',
            name_localizations: {
                ja: '自動再生',
                ko: '자동재생',
            },
            description_localizations: {
                ja: 'キューが空のときに関連曲を自動再生',
                ko: '큐가 비어 있을 때 자동으로 관련 곡 재생',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to enable/disable autoplay!');
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('Play a song first!');
        if (serverQueue.autoPlay === false) {
            serverQueue.autoPlay = true;
            interaction.followUp('Autoplay is enabled!');
        } else {
            serverQueue.autoPlay = false;
            interaction.followUp('Autoplay is disabled!');
        }
    }
}
module.exports = Autoplay;
