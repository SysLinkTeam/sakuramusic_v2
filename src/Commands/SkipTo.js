const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');

class SkipTo extends BaseCommand {
    constructor() {
        super({
            name: 'skipto',
            description: 'Skip to the song',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'songnumber',
                    description: 'Index',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could skip to!');
        if (!interaction.options.getString('songnumber')) return interaction.followUp('Please enter a song number!');
        if (interaction.options.getString('songnumber') > serverQueue.songs.length || interaction.options.getString('songnumber') < 1) return interaction.followUp('Please enter a valid song number!');
        const removed = serverQueue.songs.splice(0, interaction.options.getString('songnumber') - 1);
        if (serverQueue.queueloop === true) serverQueue.push(removed);
        serverQueue.player.stop();
        interaction.followUp(`I skipped to the song number: **${interaction.options.getString('songnumber')}**`);
    }
}
module.exports = SkipTo;
