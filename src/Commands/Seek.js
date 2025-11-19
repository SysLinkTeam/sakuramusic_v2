const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { parseTime, toHms } = require('../utils');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Seek extends BaseCommand {
    constructor() {
        super({
            name: 'seek',
            description: 'Seek to the given time in the current song',
            name_localizations: {
                ja: 'シーク',
                ko: '탐색',
            },
            description_localizations: {
                ja: '現在の曲の指定した時間に移動',
                ko: '현재 곡의 지정된 시간으로 이동',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'position',
                    description: 'Time (seconds or mm:ss)',
                    name_localizations: {
                        ja: '時間',
                        ko: '시간',
                    },
                    description_localizations: {
                        ja: '時間 (秒または mm:ss)',
                        ko: '시간 (초 또는 mm:ss)',
                    },
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_SEEK);
        if (error) return interaction.followUp(error);

        const position = interaction.options.getString('position');
        const seconds = parseTime(position);

        // Invalid format
        if (seconds === null) {
            return interaction.followUp(ERRORS.INVALID_SEEK_TIME);
        }

        // Out of range
        if (seconds < 0 || seconds > serverQueue.songs[0].totalsec) {
            return interaction.followUp(ERRORS.INVALID_SEEK_RANGE(toHms(serverQueue.songs[0].totalsec)));
        }

        await serverQueue.seek(seconds);
        interaction.followUp(INFO.SEEKED_TO(toHms(seconds)));
    }
}
module.exports = Seek;
