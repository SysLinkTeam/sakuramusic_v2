const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

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
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could tell you the queue!');
        let songlist = serverQueue.songs.map(song => `**-** ${song.title}`).join('\n');
        if (songlist.length > 1500) {
            songlist = songlist.slice(0, 1500).split('\n').slice(0, -1).join('\n') + `\n...and more ${serverQueue.songs.map(song => `**-** ${song.title}`).length - songlist.slice(0, 1500).split('\n').slice(0, -1).length} songs in queue!`;
        }
        const embed = new EmbedBuilder()
            .setTitle('Queue')
            .setDescription(`Now Playing: ${serverQueue.songs[0].title}\n\n${songlist}`)
            .setFooter({
                text: 'SakuraMusic V2',
                iconURL: client.user.displayAvatarURL(),
            })
            .setColor('#ff0000');
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = Queue;
