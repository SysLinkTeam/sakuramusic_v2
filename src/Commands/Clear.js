const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Clear extends BaseCommand {
    constructor() {
        super({
            name: 'clear',
            description: 'Clear the queue',
            name_localizations: {
                ja: 'クリア',
                ko: '초기화',
            },
            description_localizations: {
                ja: 'キューをクリア',
                ko: '큐를 비웁니다',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could clear!');
        serverQueue.songs = [];
        serverQueue.player.stop();
        interaction.followUp('Cleared the queue!');
    }
}
module.exports = Clear;
