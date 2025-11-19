const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');
const { SHUFFLE } = require('../config/constants');

class Shuffle extends BaseCommand {
    constructor() {
        super({
            name: 'shuffle',
            description: 'Shuffle the queue',
            name_localizations: {
                ja: 'シャッフル',
                ko: '셔플',
            },
            description_localizations: {
                ja: 'キューをシャッフル',
                ko: '큐를 섞기',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_SHUFFLE);
        if (error) return interaction.followUp(error);

        if (serverQueue.songs.length < SHUFFLE.MINIMUM_SONGS) {
            return interaction.followUp(ERRORS.NEED_MINIMUM_SONGS(SHUFFLE.MINIMUM_SONGS));
        }

        for (let i = serverQueue.songs.length - 1; i > 1; i--) {
            const j = 1 + Math.floor(Math.random() * i);
            [serverQueue.songs[i], serverQueue.songs[j]] = [serverQueue.songs[j], serverQueue.songs[i]];
        }
        interaction.followUp(INFO.QUEUE_SHUFFLED);
    }
}
module.exports = Shuffle;
