const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Resume extends BaseCommand {
    constructor() {
        super({
            name: 'resume',
            description: 'Resume the music',
            name_localizations: {
                ja: '再開',
                ko: '재개',
            },
            description_localizations: {
                ja: '音楽を再開',
                ko: '음악 재개',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_RESUME);
        if (error) return interaction.followUp(error);

        if (!serverQueue.paused) return interaction.followUp(ERRORS.SONG_NOT_PAUSED);

        serverQueue.resume();
        interaction.followUp(INFO.SONG_RESUMED);
    }
}
module.exports = Resume;
