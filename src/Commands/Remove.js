const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');

class Remove extends BaseCommand {
    constructor() {
        super({
            name: 'remove',
            description: 'Remove the song from the queue',
            name_localizations: {
                ja: '削除',
                ko: '제거',
            },
            description_localizations: {
                ja: 'キューから曲を削除',
                ko: '큐에서 곡을 제거',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'songnumber',
                    description: 'Index',
                    name_localizations: {
                        ja: '曲番号',
                        ko: '곡번호',
                    },
                    description_localizations: {
                        ja: '番号',
                        ko: '인덱스',
                    },
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could remove!');
        if (!interaction.options.getString('songnumber')) return interaction.followUp('Please enter a song number!');
        if (interaction.options.getString('songnumber') > serverQueue.songs.length || interaction.options.getString('songnumber') < 1) return interaction.followUp('Please enter a valid song number!');
        serverQueue.songs.splice(interaction.options.getString('songnumber') - 1, 1);
        interaction.followUp(`I removed the song number: **${interaction.options.getString('songnumber')}**`);
    }
}
module.exports = Remove;
