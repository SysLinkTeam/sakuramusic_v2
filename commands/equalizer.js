const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const locales = require('../locales.js');

const equalizerPresets = {
    'Default': [
        { band: 0, gain: 0 },
        { band: 1, gain: 0 },
        { band: 2, gain: 0 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0 },
        { band: 5, gain: 0 },
        { band: 6, gain: 0 },
        { band: 7, gain: 0 },
        { band: 8, gain: 0 },
        { band: 9, gain: 0 },
        { band: 10, gain: 0 },
        { band: 11, gain: 0 },
        { band: 12, gain: 0 },
        { band: 13, gain: 0 },
        { band: 14, gain: 0 }
    ],
    '01 Acoustic': [
        { band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.25 },
        { band: 3, gain: 0.2 }, { band: 4, gain: 0.15 }, { band: 5, gain: 0.1 },
        { band: 6, gain: 0.05 }, { band: 7, gain: 0 }, { band: 8, gain: -0.05 },
        { band: 9, gain: -0.1 }, { band: 10, gain: -0.15 }, { band: 11, gain: -0.2 },
        { band: 12, gain: -0.25 }, { band: 13, gain: -0.3 }, { band: 14, gain: -0.35 }
    ],
    '02 Bass Booster': [
        { band: 0, gain: 0.5 }, { band: 1, gain: 0.5 }, { band: 2, gain: 0.5 },
        { band: 3, gain: 0.4 }, { band: 4, gain: 0.3 }, { band: 5, gain: 0.2 },
        { band: 6, gain: 0.1 }, { band: 7, gain: 0 }, { band: 8, gain: -0.1 },
        { band: 9, gain: -0.2 }, { band: 10, gain: -0.3 }, { band: 11, gain: -0.4 },
        { band: 12, gain: -0.5 }, { band: 13, gain: -0.6 }, { band: 14, gain: -0.7 }
    ],
    '03 Bass Reducer': [
        { band: 0, gain: -0.5 }, { band: 1, gain: -0.5 }, { band: 2, gain: -0.5 },
        { band: 3, gain: -0.4 }, { band: 4, gain: -0.3 }, { band: 5, gain: -0.2 },
        { band: 6, gain: -0.1 }, { band: 7, gain: 0 }, { band: 8, gain: 0.1 },
        { band: 9, gain: 0.2 }, { band: 10, gain: 0.3 }, { band: 11, gain: 0.4 },
        { band: 12, gain: 0.5 }, { band: 13, gain: 0.6 }, { band: 14, gain: 0.7 }
    ],
    '04 Classical': [
        { band: 0, gain: 0.3 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.1 },
        { band: 3, gain: 0 }, { band: 4, gain: -0.1 }, { band: 5, gain: -0.2 },
        { band: 6, gain: -0.3 }, { band: 7, gain: -0.4 }, { band: 8, gain: -0.5 },
        { band: 9, gain: -0.4 }, { band: 10, gain: -0.3 }, { band: 11, gain: -0.2 },
        { band: 12, gain: -0.1 }, { band: 13, gain: 0 }, { band: 14, gain: 0.1 }
    ],
    '05 Dance': [
        { band: 0, gain: 0.2 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.2 },
        { band: 3, gain: 0.1 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.1 },
        { band: 6, gain: 0 }, { band: 7, gain: 0 }, { band: 8, gain: -0.1 },
        { band: 9, gain: -0.1 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.2 },
        { band: 12, gain: -0.2 }, { band: 13, gain: -0.2 }, { band: 14, gain: -0.3 }
    ],
    '06 Deep': [
        { band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.25 },
        { band: 3, gain: 0.15 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.05 },
        { band: 6, gain: 0 }, { band: 7, gain: -0.05 }, { band: 8, gain: -0.1 },
        { band: 9, gain: -0.15 }, { band: 10, gain: -0.2 }, { band: 11, gain: -0.25 },
        { band: 12, gain: -0.3 }, { band: 13, gain: -0.35 }, { band: 14, gain: -0.4 }
    ],
    '07 Electronic': [
        { band: 0, gain: 0.35 }, { band: 1, gain: 0.35 }, { band: 2, gain: 0.35 },
        { band: 3, gain: 0.25 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.15 },
        { band: 6, gain: 0.1 }, { band: 7, gain: 0.05 }, { band: 8, gain: 0 },
        { band: 9, gain: -0.05 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.15 },
        { band: 12, gain: -0.2 }, { band: 13, gain: -0.25 }, { band: 14, gain: -0.3 }
    ],
    '08 Fine': [
        { band: 0, gain: 0.15 }, { band: 1, gain: 0.15 }, { band: 2, gain: 0.15 },
        { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
        { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
        { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
        { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
    ],
    '09 Flat': [
        { band: 0, gain: 0 }, { band: 1, gain: 0 }, { band: 2, gain: 0 },
        { band: 3, gain: 0 }, { band: 4, gain: 0 }, { band: 5, gain: 0 },
        { band: 6, gain: 0 }, { band: 7, gain: 0 }, { band: 8, gain: 0 },
        { band: 9, gain: 0 }, { band: 10, gain: 0 }, { band: 11, gain: 0 },
        { band: 12, gain: 0 }, { band: 13, gain: 0 }, { band: 14, gain: 0 }
    ],
    '10 HipHop': [
        { band: 0, gain: 0.3 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.3 },
        { band: 3, gain: 0.2 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0 },
        { band: 6, gain: -0.1 }, { band: 7, gain: -0.2 }, { band: 8, gain: -0.3 },
        { band: 9, gain: -0.4 }, { band: 10, gain: -0.5 }, { band: 11, gain: -0.6 },
        { band: 12, gain: -0.7 }, { band: 13, gain: -0.8 }, { band: 14, gain: -0.9 }
    ],
    '11 Jazz': [
        { band: 0, gain: 0.25 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.15 },
        { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
        { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
        { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
        { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
    ],
    '12 Loudness': [
        { band: 0, gain: 0.4 }, { band: 1, gain: 0.4 }, { band: 2, gain: 0.4 },
        { band: 3, gain: 0.3 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.1 },
        { band: 6, gain: 0 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.2 },
        { band: 9, gain: -0.3 }, { band: 10, gain: -0.4 }, { band: 11, gain: -0.5 },
        { band: 12, gain: -0.6 }, { band: 13, gain: -0.7 }, { band: 14, gain: -0.8 }
    ],
    '13 Lounge': [
        { band: 0, gain: 0.2 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.2 },
        { band: 3, gain: 0.15 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.05 },
        { band: 6, gain: 0 }, { band: 7, gain: -0.05 }, { band: 8, gain: -0.1 },
        { band: 9, gain: -0.15 }, { band: 10, gain: -0.2 }, { band: 11, gain: -0.25 },
        { band: 12, gain: -0.3 }, { band: 13, gain: -0.35 }, { band: 14, gain: -0.4 }
    ],
    '14 Piano': [
        { band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.25 },
        { band: 3, gain: 0.2 }, { band: 4, gain: 0.15 }, { band: 5, gain: 0.1 },
        { band: 6, gain: 0.05 }, { band: 7, gain: 0 }, { band: 8, gain: -0.05 },
        { band: 9, gain: -0.1 }, { band: 10, gain: -0.15 }, { band: 11, gain: -0.2 },
        { band: 12, gain: -0.25 }, { band: 13, gain: -0.3 }, { band: 14, gain: -0.35 }
    ],
    '15 Pop': [
        { band: 0, gain: 0.3 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.3 },
        { band: 3, gain: 0.25 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.15 },
        { band: 6, gain: 0.1 }, { band: 7, gain: 0.05 }, { band: 8, gain: 0 },
        { band: 9, gain: -0.05 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.15 },
        { band: 12, gain: -0.2 }, { band: 13, gain: -0.25 }, { band: 14, gain: -0.3 }
    ],
    '16 R&B': [
        { band: 0, gain: 0.35 }, { band: 1, gain: 0.35 }, { band: 2, gain: 0.35 },
        { band: 3, gain: 0.3 }, { band: 4, gain: 0.25 }, { band: 5, gain: 0.2 },
        { band: 6, gain: 0.15 }, { band: 7, gain: 0.1 }, { band: 8, gain: 0.05 },
        { band: 9, gain: 0 }, { band: 10, gain: -0.05 }, { band: 11, gain: -0.1 },
        { band: 12, gain: -0.15 }, { band: 13, gain: -0.2 }, { band: 14, gain: -0.25 }
    ],
    '17 Reggae': [
        { band: 0, gain: 0.25 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.15 },
        { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
        { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
        { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
        { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
    ],
    '18 Rock': [
        { band: 0, gain: 0.3 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.3 },
        { band: 3, gain: 0.25 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.15 },
        { band: 6, gain: 0.1 }, { band: 7, gain: 0.05 }, { band: 8, gain: 0 },
        { band: 9, gain: -0.05 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.15 },
        { band: 12, gain: -0.2 }, { band: 13, gain: -0.25 }, { band: 14, gain: -0.3 }
    ],
    '19 Small Speakers': [
        { band: 0, gain: 0.2 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.2 },
        { band: 3, gain: 0.1 }, { band: 4, gain: 0 }, { band: 5, gain: -0.1 },
        { band: 6, gain: -0.2 }, { band: 7, gain: -0.3 }, { band: 8, gain: -0.4 },
        { band: 9, gain: -0.5 }, { band: 10, gain: -0.6 }, { band: 11, gain: -0.7 },
        { band: 12, gain: -0.8 }, { band: 13, gain: -0.9 }, { band: 14, gain: -1.0 }
    ],
    '20 Spoken Word': [
        { band: 0, gain: 0.15 }, { band: 1, gain: 0.15 }, { band: 2, gain: 0.15 },
        { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
        { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
        { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
        { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
    ],
    '21 Treble Booster': [
        { band: 0, gain: 0.5 }, { band: 1, gain: 0.4 }, { band: 2, gain: 0.3 },
        { band: 3, gain: 0.2 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0 },
        { band: 6, gain: -0.1 }, { band: 7, gain: -0.2 }, { band: 8, gain: -0.3 },
        { band: 9, gain: -0.4 }, { band: 10, gain: -0.5 }, { band: 11, gain: -0.6 },
        { band: 12, gain: -0.7 }, { band: 13, gain: -0.8 }, { band: 14, gain: -0.9 }
    ],
    '22 Treble Reducer': [
        { band: 0, gain: -0.5 }, { band: 1, gain: -0.4 }, { band: 2, gain: -0.3 },
        { band: 3, gain: -0.2 }, { band: 4, gain: -0.1 }, { band: 5, gain: 0 },
        { band: 6, gain: 0.1 }, { band: 7, gain: 0.2 }, { band: 8, gain: 0.3 },
        { band: 9, gain: 0.4 }, { band: 10, gain: 0.5 }, { band: 11, gain: 0.6 },
        { band: 12, gain: 0.7 }, { band: 13, gain: 0.8 }, { band: 14, gain: 0.9 }
    ],
    '23 Vocal Booster': [
        { band: 0, gain: 0.35 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.25 },
        { band: 3, gain: 0.2 }, { band: 4, gain: 0.15 }, { band: 5, gain: 0.1 },
        { band: 6, gain: 0.05 }, { band: 7, gain: 0 }, { band: 8, gain: -0.05 },
        { band: 9, gain: -0.1 }, { band: 10, gain: -0.15 }, { band: 11, gain: -0.2 },
        { band: 12, gain: -0.25 }, { band: 13, gain: -0.3 }, { band: 14, gain: -0.35 }
    ],
    '24 Perfect': [
        { band: 0, gain: 0.4 }, { band: 1, gain: 0.4 }, { band: 2, gain: 0.4 },
        { band: 3, gain: 0.3 }, { band: 4, gain: 0.3 }, { band: 5, gain: 0.3 },
        { band: 6, gain: 0.2 }, { band: 7, gain: 0.2 }, { band: 8, gain: 0.2 },
        { band: 9, gain: 0.1 }, { band: 10, gain: 0.1 }, { band: 11, gain: 0.1 },
        { band: 12, gain: 0.05 }, { band: 13, gain: 0.05 }, { band: 14, gain: 0.05 }
    ]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('equalizer')
        .setDescription('イコライザープリセットを適用します')
        .addStringOption(option =>
            option.setName('preset')
                .setDescription('イコライザープリセット')
                .setRequired(true)
                .addChoices(
                    { name: 'Default', value: 'Default' },
                    { name: '01 Acoustic', value: '01 Acoustic' },
                    { name: '02 Bass Booster', value: '02 Bass Booster' },
                    { name: '03 Bass Reducer', value: '03 Bass Reducer' },
                    { name: '04 Classical', value: '04 Classical' },
                    { name: '05 Dance', value: '05 Dance' },
                    { name: '06 Deep', value: '06 Deep' },
                    { name: '07 Electronic', value: '07 Electronic' },
                    { name: '08 Fine', value: '08 Fine' },
                    { name: '09 Flat', value: '09 Flat' },
                    { name: '10 HipHop', value: '10 HipHop' },
                    { name: '11 Jazz', value: '11 Jazz' },
                    { name: '12 Loudness', value: '12 Loudness' },
                    { name: '13 Lounge', value: '13 Lounge' },
                    { name: '14 Piano', value: '14 Piano' },
                    { name: '15 Pop', value: '15 Pop' },
                    { name: '16 R&B', value: '16 R&B' },
                    { name: '17 Reggae', value: '17 Reggae' },
                    { name: '18 Rock', value: '18 Rock' },
                    { name: '19 Small Speakers', value: '19 Small Speakers' },
                    { name: '20 Spoken Word', value: '20 Spoken Word' },
                    { name: '21 Treble Booster', value: '21 Treble Booster' },
                    { name: '22 Treble Reducer', value: '22 Treble Reducer' },
                    { name: '23 Vocal Booster', value: '23 Vocal Booster' },
                    { name: '24 Perfect', value: '24 Perfect' }
                )),

    async execute(interaction) {
        const preset = interaction.options.getString('preset');
        const queue = interaction.client.player.nodes.get(interaction.guild.id);
        const lang = interaction.guild.preferredLocale || 'en';
        const locale = locales[lang] || locales['en'];

        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setDescription(`${locale.no_queue} :x:`)
                ],
                ephemeral: true
            });
        }

        if (!equalizerPresets[preset]) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setDescription(`${locale.invalid_preset} :x:`)
                ],
                ephemeral: true
            });
        }

        queue.filters.equalizer.setEQ(equalizerPresets[preset]);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`${locale.preset_applied.replace('{preset}', preset)} :white_check_mark:`)
            ]
        });
    }
};
