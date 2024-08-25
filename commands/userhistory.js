const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const { getUserPlayHistory } = require('../historyManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userhistory')
    .setDescription('あなたの再生履歴を表示します。')
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('ページ番号')
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const page = interaction.options.getInteger('page') || 1;

    const results = await getUserPlayHistory(userId, page - 1);

    if (results.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('再生履歴がありません。')
        ],
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle('あなたの再生履歴')
      .setDescription(results.map((row, index) => `**${index + 1}: **[${row.track_title}](${row.track_url}) (${new Date(row.played_at).toLocaleString()})`).join('\n'));

    await interaction.reply({ embeds: [embed] });
  }
};
