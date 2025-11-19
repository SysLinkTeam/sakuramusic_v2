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

        // Build queue string efficiently without mapping entire array
        let songlist = '';
        let songsDisplayed = 0;

        for (let i = 0; i < serverQueue.songs.length; i++) {
            const line = `**-** ${serverQueue.songs[i].title}\n`;

            // Check if adding this line would exceed the limit
            if (songlist.length + line.length > QUEUE.MAX_DISPLAY_LENGTH) {
                const remainingSongs = serverQueue.songs.length - songsDisplayed;
                songlist += `\n...and ${remainingSongs} more song${remainingSongs !== 1 ? 's' : ''} in queue!`;
                break;
            }

            songlist += line;
            songsDisplayed++;
        }

        // Remove trailing newline
        songlist = songlist.trimEnd();

        const embed = new EmbedBuilder()
            .setTitle(`Queue (${serverQueue.songs.length} song${serverQueue.songs.length !== 1 ? 's' : ''})`)
            .setDescription(`**Now Playing:** ${serverQueue.songs[0].title}\n\n${songlist}`)
            .setFooter({
                text: BOT_NAME,
                iconURL: client.user.displayAvatarURL(),
            })
            .setColor('#ff0000');
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = Queue;
