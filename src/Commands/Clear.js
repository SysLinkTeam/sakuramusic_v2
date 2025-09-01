const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Clear extends BaseCommand {
    constructor() {
        super({
            name: 'clear',
            description: 'Clear the queue',
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
