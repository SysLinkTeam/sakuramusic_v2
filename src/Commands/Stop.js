const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Stop extends BaseCommand {
    constructor() {
        super({
            name: 'stop',
            description: 'Stop the music',
            name_localizations: {
                ja: '停止',
                ko: '정지',
            },
            description_localizations: {
                ja: '音楽を停止',
                ko: '음악 정지',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_STOP);
        if (error) return interaction.followUp(error);

        if (!serverQueue.player) return interaction.followUp(ERRORS.NO_SONG_PLAYING);

        serverQueue.songs = [];
        serverQueue.autoPlay = false;
        serverQueue.player.stop();
        interaction.followUp(INFO.SONG_STOPPED);
    }
}
module.exports = Stop;
