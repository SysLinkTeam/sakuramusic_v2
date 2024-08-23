const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('ボリュームを変更')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('ボリューム (0-100)')
        .setRequired(true)),
  
  async execute(interaction) {
    const volume = interaction.options.getInteger('amount');
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

    queue.node.setVolume(volume);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blue)
          .setDescription(`${locale.volume.replace('{volume}', volume)} :speaker:`)
      ]
    });
  }
};
