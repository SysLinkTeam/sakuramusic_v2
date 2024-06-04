const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('指定した秒数にシーク')
    .addIntegerOption(option => 
      option.setName('seconds')
        .setDescription('シークする秒数')
        .setRequired(true)),
  
  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
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

    queue.node.seek(seconds * 1000);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.seek.replace('{seconds}', seconds)} :white_check_mark:`)
      ]
    });
  }
};
