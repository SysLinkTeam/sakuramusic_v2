const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Pause extends BaseCommand {
    constructor() {
        super({
            name: 'pause',
            description: 'Pause the music',
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
