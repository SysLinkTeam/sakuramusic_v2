const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { validateMusicCommand } = require('../validators');
const { ERRORS, INFO } = require('../constants/messages');
const { AUDIO } = require('../config/constants');

class Quality extends BaseCommand {
    constructor() {
        super({
            name: 'quality',
            description: 'Change audio quality (affects bandwidth usage)',
            name_localizations: {
                ja: '音質',
                ko: '음질',
            },
            description_localizations: {
                ja: '音質を変更（帯域幅使用量に影響）',
                ko: '오디오 품질을 변경（대역폭 사용에 영향）',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'level',
                    description: 'Quality level (low/medium/high)',
                    name_localizations: {
                        ja: 'レベル',
                        ko: '레벨',
                    },
                    description_localizations: {
                        ja: '音質レベル（低/中/高）',
                        ko: '품질 수준（낮음/중간/높음）',
                    },
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: 'Low (saves bandwidth)',
                            value: 'low'
                        },
                        {
                            name: 'Medium (balanced)',
                            value: 'medium'
                        },
                        {
                            name: 'High (best audio)',
                            value: 'high'
                        }
                    ]
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const { error, serverQueue } = validateMusicCommand(interaction, queue, ERRORS.NO_SONG_IN_QUEUE);
        if (error) return interaction.followUp(error);

        const quality = interaction.options.getString('level');

        // Validate quality option (should always be valid due to choices, but double-check)
        if (!AUDIO.QUALITY_OPTIONS[quality]) {
            return interaction.followUp('Invalid quality level. Please choose low, medium, or high.');
        }

        const previousQuality = serverQueue.quality;
        serverQueue.quality = quality;

        const qualityLabel = AUDIO.QUALITY_LABELS[quality];
        const message = `🎵 Audio quality changed from **${previousQuality}** to **${quality}**\n${qualityLabel}\n\n⚠️ Quality change will apply to the next song. Current song will continue with previous quality.`;

        interaction.followUp(message);
    }
}

module.exports = Quality;
