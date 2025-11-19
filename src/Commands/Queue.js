const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, BOT_NAME } = require('../constants/messages');
const { QUEUE } = require('../config/constants');

class Queue extends BaseCommand {
    constructor() {
        super({
            name: 'queue',
            description: 'Show the queue',
            name_localizations: {
                ja: 'キュー',
                ko: '큐',
            },
            description_localizations: {
                ja: 'キューを表示',
                ko: '큐 표시',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { queue, client }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_TO_SHOW_QUEUE);
        if (error) return interaction.followUp(error);

        let songlist = serverQueue.songs.map(song => `**-** ${song.title}`).join('\n');
        if (songlist.length > QUEUE.MAX_DISPLAY_LENGTH) {
            const truncatedList = songlist.slice(0, QUEUE.MAX_DISPLAY_LENGTH).split('\n').slice(0, -1);
            const remainingSongs = serverQueue.songs.length - truncatedList.length;
            songlist = truncatedList.join('\n') + `\n...and more ${remainingSongs} songs in queue!`;
        }
        const embed = new EmbedBuilder()
            .setTitle('Queue')
            .setDescription(`Now Playing: ${serverQueue.songs[0].title}\n\n${songlist}`)
            .setFooter({
                text: BOT_NAME,
                iconURL: client.user.displayAvatarURL(),
            })
            .setColor('#ff0000');
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = Queue;
