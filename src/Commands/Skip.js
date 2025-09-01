const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Skip extends BaseCommand {
    constructor() {
        super({
            name: 'skip',
            description: 'Skip the music',
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to skip the music!');
        if (!serverQueue) return interaction.followUp('There is no song that I could skip!');
        serverQueue.player.stop();
        interaction.followUp('Skipped the song!');
    }
}
module.exports = Skip;
