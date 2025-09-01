const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Pause extends BaseCommand {
    constructor() {
        super({
            name: 'pause',
            description: 'Pause the music',
            name_localizations: {
                ja: '一時停止',
                ko: '일시정지',
            },
            description_localizations: {
                ja: '音楽を一時停止',
                ko: '음악 일시 정지',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could pause!');
        if (serverQueue.paused) return interaction.followUp('The song is already paused!');
        serverQueue.pause();
        interaction.followUp('Paused the song!');
    }
}
module.exports = Pause;
