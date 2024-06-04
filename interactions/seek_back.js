const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  async execute(interaction) {
    const queue = interaction.client.player.nodes.get(interaction.guild.id);
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

    const currentTime = queue.node.estimatedPlaybackTime - 10000;
    queue.node.seek(currentTime < 0 ? 0 : currentTime);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.seek_back} :white_check_mark:`)
      ]
    });
  }
};
