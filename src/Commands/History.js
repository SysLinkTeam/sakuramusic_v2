const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

const ITEMS_PER_PAGE = 10;

class History extends BaseCommand {
    constructor() {
        super({
            name: 'history',
            description: 'Show playback history or replay a song',
            name_localizations: {
                ja: '履歴',
                ko: '히스토리',
            },
            description_localizations: {
                ja: '再生履歴を表示または再生',
                ko: '재생 기록을 표시하거나 재생',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'index',
                    description: 'History entry to play',
                    name_localizations: {
                        ja: '番号',
                        ko: '번호',
                    },
                    description_localizations: {
                        ja: '再生する履歴項目',
                        ko: '재생할 기록 항목',
                    },
                    type: ApplicationCommandOptionType.Integer,
                    required: false
                },
                {
                    name: 'page',
                    description: 'Page number for history list',
                    name_localizations: {
                        ja: 'ページ',
                        ko: '페이지',
                    },
                    description_localizations: {
                        ja: '履歴リストのページ番号',
                        ko: '기록 목록의 페이지 번호',
                    },
                    type: ApplicationCommandOptionType.Integer,
                    required: false,
                    min_value: 1
                }
            ]
        });
    }

    async execute(interaction, context) {
        const { queue, client } = context;
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue || serverQueue.history.length === 0) {
            return interaction.followUp('No history available.');
        }

        const idx = interaction.options.getInteger('index');

        // If index is provided, replay that song
        if (idx) {
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

        // Show paginated history list
        const page = interaction.options.getInteger('page') || 1;
        const totalPages = Math.ceil(serverQueue.history.length / ITEMS_PER_PAGE);

        if (page > totalPages) {
            return interaction.followUp(`Invalid page number. Total pages: ${totalPages}`);
        }

        const startIdx = (page - 1) * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, serverQueue.history.length);
        const pageItems = serverQueue.history.slice(startIdx, endIdx);

        const list = pageItems.map((s, i) => {
            const globalIdx = startIdx + i + 1;
            const expired = s.type === 'attachment' && s.expiresAt && Date.now() > s.expiresAt ? ' *(expired)*' : '';
            return `\`${globalIdx}.\` ${s.title}${expired}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`📜 Playback History`)
            .setDescription(list)
            .setFooter({
                text: `Page ${page}/${totalPages} | Total: ${serverQueue.history.length} songs | Use /history index:<number> to replay`,
                iconURL: client.user.displayAvatarURL()
            })
            .setColor('#00aaff');

        return interaction.followUp({ embeds: [embed] });
    }
}

module.exports = History;
