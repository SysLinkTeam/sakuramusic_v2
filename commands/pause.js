const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('曲の再生を一時停止'),
  
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

    queue.setPaused(true);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Yellow)
          .setDescription(`${locale.pause} :pause_button:`)
      ]
    });
  }
};
