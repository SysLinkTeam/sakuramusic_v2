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

    if(queue.node.volume > 100) queue.node.setVolume(100);
    if(queue.node.volume <= 0) queue.node.setVolume(0);

    const newVolume = queue.node.volume - 10;
    queue.node.setVolume(newVolume);

    if(queue.node.volume <= 0) {
      queue.node.setVolume(0);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`${locale.volume_min} :x:`)
        ],
        ephemeral: true
      }).then(msg => {
        setTimeout(() => {
          msg.delete();
        }, 2500);
      });
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.volume_down} :white_check_mark:`)
      ]
    })
  }
};
