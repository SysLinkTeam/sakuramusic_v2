const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');
const { VOLUME } = require('../config/constants');

class Volume extends BaseCommand {
    constructor() {
        super({
            name: 'volume',
            description: 'Change the volume',
            name_localizations: {
                ja: 'ボリューム',
                ko: '볼륨',
            },
            description_localizations: {
                ja: '音量を変更',
                ko: '볼륨을 변경',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'volume',
                    description: 'Volume',
                    name_localizations: {
                        ja: '音量',
                        ko: '볼륨',
                    },
                    description_localizations: {
                        ja: '音量',
                        ko: '볼륨',
                    },
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_CHANGE_VOLUME);
        if (error) return interaction.followUp(error);

        const volume = interaction.options.getInteger('volume');
        if (volume > VOLUME.MAX || volume < VOLUME.MIN) {
            return interaction.followUp(ERRORS.INVALID_VOLUME);
        }

        serverQueue.setVolume(volume / 10);
        interaction.followUp(INFO.VOLUME_SET(volume));
    }
}
module.exports = Volume;
