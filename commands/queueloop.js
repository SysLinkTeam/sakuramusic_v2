const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queueloop')
    .setDescription('キュー全体をループする'),
  
  async execute(interaction) {
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

    const repeatMode = queue.repeatMode;
    if (repeatMode === 2) {
      queue.setRepeatMode(0);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.loop_disabled} :white_check_mark:`)
        ]
      });
    } else {
      queue.setRepeatMode(2);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.queueloop} :white_check_mark:`)
        ]
      });
    }
  }
};
