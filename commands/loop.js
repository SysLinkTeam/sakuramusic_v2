const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('今の曲を無限ループする/解除する'),
  
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
    if (repeatMode === 1) {
      queue.setRepeatMode(0);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.loop_disabled} :white_check_mark:`)
        ]
      });
    } else {
      queue.setRepeatMode(1);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.loop} :white_check_mark:`)
        ]
      });
    }
  }
};
