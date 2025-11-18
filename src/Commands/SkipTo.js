const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');

class SkipTo extends BaseCommand {
    constructor() {
        super({
            name: 'skipto',
            description: 'Skip to the song',
            name_localizations: {
                ja: '曲指定スキップ',
                ko: '특정곡건너뛰기',
            },
            description_localizations: {
                ja: '指定した曲にスキップ',
                ko: '해당 곡으로 건너뛰기',
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
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could skip to!');

        const songNumber = interaction.options.getInteger('songnumber');
        if (songNumber > serverQueue.songs.length || songNumber < 1) {
            return interaction.followUp('Please enter a valid song number!');
        }

        const removed = serverQueue.songs.splice(0, songNumber - 1);
        if (serverQueue.queueloop === true) {
            serverQueue.songs.push(...removed);
        }
        serverQueue.player.stop();
        interaction.followUp(`I skipped to the song number: **${songNumber}**`);
    }
}
module.exports = SkipTo;
