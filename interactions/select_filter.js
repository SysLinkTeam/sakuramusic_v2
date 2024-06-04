const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  async execute(interaction) {
    const queue = interaction.client.player.nodes.get(interaction.guild.id);
    const filterName = interaction.values[0];
    const locale = locales[interaction.guild.preferredLocale || 'en'] || locales['en'];

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

    if (filterName === 'none') {
      queue.filters.ffmpeg.toggle([]);
    } else {
      if (queue.filters.ffmpeg.filters.includes(filterName)) {
        queue.filters.ffmpeg.toggle(queue.filters.ffmpeg.filters.filter(f => f !== filterName));
      } else {
        queue.filters.ffmpeg.toggle(queue.filters.ffmpeg.filters.concat([...filterName]));
      }
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.filter_applied.replace('{filter}', filterName)} :white_check_mark:`)
      ],
      ephemeral: true
    });
  }
};
