const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Stop extends BaseCommand {
    constructor() {
        super({
            name: 'stop',
            description: 'Stop the music',
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!interaction.member.voice.channel) return interaction.followUp('You have to be in a voice channel to stop the music!');
        if (!serverQueue) return interaction.followUp('There is no song that I could stop!');
        serverQueue.songs = [];
        serverQueue.autoPlay = false;
        serverQueue.player.stop();
        interaction.followUp('Stopped the music!');
    }
}
module.exports = Stop;
