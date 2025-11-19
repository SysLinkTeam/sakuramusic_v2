const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');

class Autoplay extends BaseCommand {
    constructor() {
        super({
            name: 'autoplay',
            description: 'Autoplay the music if the queue is empty',
            name_localizations: {
                ja: '自動再生',
                ko: '자동재생',
            },
            description_localizations: {
                ja: 'キューが空のときに関連曲を自動再生',
                ko: '큐가 비어 있을 때 자동으로 관련 곡 재생',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_IN_QUEUE);
        if (error) return interaction.followUp(error);

        if (serverQueue.autoPlay === false) {
            serverQueue.autoPlay = true;
            interaction.followUp(INFO.AUTOPLAY_ENABLED);
        } else {
            serverQueue.autoPlay = false;
            interaction.followUp(INFO.AUTOPLAY_DISABLED);
        }
    }
}
module.exports = Autoplay;
