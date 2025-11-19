const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

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
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_REMOVE);
        if (error) return interaction.followUp(error);

        const songNumber = interaction.options.getInteger('songnumber');
        if (songNumber > serverQueue.songs.length || songNumber < 1) {
            return interaction.followUp(ERRORS.INVALID_SONG_NUMBER);
        }

        serverQueue.songs.splice(songNumber - 1, 1);
        interaction.followUp(INFO.SONG_REMOVED(songNumber));
    }
}
module.exports = Remove;
