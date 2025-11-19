const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class QueueLoop extends BaseCommand {
    constructor() {
        super({
            name: 'queueloop',
            description: 'Loop the queue',
            name_localizations: {
                ja: 'キューループ',
                ko: '큐루프',
            },
            description_localizations: {
                ja: 'キューをループ',
                ko: '큐를 반복 재생',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_QUEUE_LOOP);
        if (error) return interaction.followUp(error);

        if (serverQueue.queueloop === false) {
            serverQueue.queueloop = true;
            interaction.followUp(INFO.QUEUE_LOOP_ENABLED);
        } else {
            serverQueue.queueloop = false;
            interaction.followUp(INFO.QUEUE_LOOP_DISABLED);
        }
    }
}
module.exports = QueueLoop;
