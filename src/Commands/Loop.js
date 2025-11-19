const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Loop extends BaseCommand {
    constructor() {
        super({
            name: 'loop',
            description: 'Loop the song',
            name_localizations: {
                ja: 'ループ',
                ko: '루프',
            },
            description_localizations: {
                ja: '曲をループ',
                ko: '곡을 반복 재생',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_LOOP);
        if (error) return interaction.followUp(error);

        if (serverQueue.loop === false) {
            serverQueue.loop = true;
            interaction.followUp(INFO.LOOP_ENABLED);
        } else {
            serverQueue.loop = false;
            interaction.followUp(INFO.LOOP_DISABLED);
        }
    }
}
module.exports = Loop;
