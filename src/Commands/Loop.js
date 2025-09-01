const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Loop extends BaseCommand {
    constructor() {
        super({
            name: 'loop',
            description: 'Loop the song',
            name_localizations: {
                ja: 'ループ',
                ko: '루프',
            },
            description_localizations: {
                ja: '曲をループ',
                ko: '곡을 반복 재생',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could set up loop mode!');
        if (serverQueue.loop === false) {
            serverQueue.loop = true;
            interaction.followUp('Looping the queue!');
        } else {
            serverQueue.loop = false;
            interaction.followUp('Stopped looping the queue!');
        }
    }
}
module.exports = Loop;
