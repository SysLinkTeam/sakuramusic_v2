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

    queue.node.skip();
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.next_track} :white_check_mark:`)
      ]
    });
  }
};
