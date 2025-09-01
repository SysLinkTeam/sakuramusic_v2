const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');

class Shuffle extends BaseCommand {
    constructor() {
        super({
            name: 'shuffle',
            description: 'Shuffle the queue',
            name_localizations: {
                ja: 'シャッフル',
                ko: '셔플',
            },
            description_localizations: {
                ja: 'キューをシャッフル',
                ko: '큐를 섞기',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could shuffle!');
        if (serverQueue.songs.length < 3) return interaction.followUp('There must be at least 3 songs in the queue to shuffle it!');
        for (let i = serverQueue.songs.length - 1; i > 1; i--) {
            const j = 1 + Math.floor(Math.random() * i);
            [serverQueue.songs[i], serverQueue.songs[j]] = [serverQueue.songs[j], serverQueue.songs[i]];
        }
        interaction.followUp('Shuffled the queue!');
    }
}
module.exports = Shuffle;
