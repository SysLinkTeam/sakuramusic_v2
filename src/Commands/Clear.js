const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Clear extends BaseCommand {
    constructor() {
        super({
            name: 'clear',
            description: 'Clear the queue',
            name_localizations: {
                ja: 'クリア',
                ko: '초기화',
            },
            description_localizations: {
                ja: 'キューをクリア',
                ko: '큐를 비웁니다',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_CLEAR);
        if (error) return interaction.followUp(error);

        if (!serverQueue.player) return interaction.followUp(ERRORS.NO_SONG_PLAYING);

        serverQueue.songs = [];
        serverQueue.autoPlay = false;
        serverQueue.player.stop();
        interaction.followUp(INFO.QUEUE_CLEARED);
    }
}
module.exports = Clear;
