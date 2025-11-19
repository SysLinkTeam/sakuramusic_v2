const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Skip extends BaseCommand {
    constructor() {
        super({
            name: 'skip',
            description: 'Skip the music',
            name_localizations: {
                ja: 'スキップ',
                ko: '스킵',
            },
            description_localizations: {
                ja: '音楽をスキップ',
                ko: '음악을 스킵',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_SKIP);
        if (error) return interaction.followUp(error);

        if (!serverQueue.player) return interaction.followUp(ERRORS.NO_SONG_PLAYING);

        serverQueue.player.stop();
        interaction.followUp(INFO.SONG_SKIPPED);
    }
}
module.exports = Skip;
