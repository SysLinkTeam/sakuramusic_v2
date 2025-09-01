const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class QueueLoop extends BaseCommand {
    constructor() {
        super({
            name: 'queueloop',
            description: 'Loop the queue',
            name_localizations: {
                ja: 'キューループ',
                ko: '큐루프',
            },
            description_localizations: {
                ja: 'キューをループ',
                ko: '큐를 반복 재생',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could set up queue loop mode!');
        if (serverQueue.queueloop === false) {
            serverQueue.queueloop = true;
            interaction.followUp('Looping the queue!');
        } else {
            serverQueue.queueloop = false;
            interaction.followUp('Stopped looping the queue!');
        }
    }
}
module.exports = QueueLoop;
