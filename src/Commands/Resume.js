const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Resume extends BaseCommand {
    constructor() {
        super({
            name: 'resume',
            description: 'Resume the music',
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could resume!');
        if (!serverQueue.paused) return interaction.followUp('The song is already playing!');
        serverQueue.resume();
        interaction.followUp('Resumed the song!');
    }
}
module.exports = Resume;
