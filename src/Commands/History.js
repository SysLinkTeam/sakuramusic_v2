const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

class History extends BaseCommand {
    constructor() {
        super({
            name: 'history',
            description: 'Show playback history or replay a song',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'index',
                    description: 'History entry to play',
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                }
            ]
        });
    }

    async execute(interaction, context) {
        const { queue } = context;
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue || serverQueue.history.length === 0) {
            return interaction.followUp('No history available.');
        }

        const idx = interaction.options.getInteger('index');
        if (!idx) {
            const list = serverQueue.history.map((s, i) => {
                const expired = s.type === 'attachment' && s.expiresAt && Date.now() > s.expiresAt ? ' (expired)' : '';
                return `${i + 1}. ${s.title}${expired}`;
            }).join('\n');
            return interaction.followUp(`Playback history:\n${list}`);
        }

        const song = serverQueue.history[idx - 1];
        if (!song) return interaction.followUp('Invalid history index.');
        if (song.type === 'attachment' && song.expiresAt && Date.now() > song.expiresAt) {
            return interaction.followUp('This attachment link has expired and cannot be played.');
        }
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.followUp('You need to be in a voice channel to play music!');

        serverQueue.songs.unshift(song);
        if (serverQueue.player) serverQueue.player.stop();
        return interaction.followUp(`Playing ${song.title} from history.`);
    }
}

module.exports = History;
