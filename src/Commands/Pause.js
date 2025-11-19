const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Pause extends BaseCommand {
    constructor() {
        super({
            name: 'pause',
            description: 'Pause the music',
            name_localizations: {
                ja: '一時停止',
                ko: '일시정지',
            },
            description_localizations: {
                ja: '音楽を一時停止',
                ko: '음악 일시 정지',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_PAUSE);
        if (error) return interaction.followUp(error);

        if (serverQueue.paused) return interaction.followUp(ERRORS.SONG_ALREADY_PAUSED);

        serverQueue.pause();
        interaction.followUp(INFO.SONG_PAUSED);
    }
}
module.exports = Pause;
