const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('コマンド一覧とその説明を表示'),
  
  async execute(interaction) {
    const lang = interaction.guild.preferredLocale || 'en';
    const locale = locales[lang] || locales['en'];

    const commands = interaction.client.commands.map(cmd => `**/${cmd.data.name}**: ${cmd.data.description}`).join('\n');
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blue)
          .setDescription(`${locale.help.replace('{commands}', commands)} :information_source:`)
      ]
    });
  }
};
