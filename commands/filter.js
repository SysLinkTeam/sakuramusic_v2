const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

const filters = ['8D', 'gate', 'haas', 'phaser', 'treble', 'tremolo', 'vibrato', 'reverse', 'karaoke', 'flanger', 'mcompand', 'pulsator', 'subboost', 'bassboost', 'vaporwave', 'nightcore', 'normalizer', 'surrounding'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('フィルターを適用または解除する')
    .addStringOption(option => 
      option.setName('name')
        .setDescription('フィルター名')
        .setRequired(true)
        .addChoices(...filters.map(filter => ({ name: filter, value: filter })))),
  
  async execute(interaction) {
    const filterName = interaction.options.getString('name');
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

    if (queue.filters.ffmpeg.filters.includes(filterName)) {
      queue.filters.ffmpeg.toggle(queue.filters.ffmpeg.filters.filter(f => f !== filterName));
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.filter_removed.replace('{filter}', filterName)} :white_check_mark:`)
        ]
      });
    } else {
      queue.filters.ffmpeg.toggle(queue.filters.ffmpeg.filters.concat([filterName]));
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.filter_applied.replace('{filter}', filterName)} :white_check_mark:`)
        ]
      });
    }
  }
};
