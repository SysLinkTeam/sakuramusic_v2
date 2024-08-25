const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const { getServerPlayHistory } = require('../historyManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverhistory')
    .setDescription('このサーバーの再生履歴を表示します。'),
  
  async execute(interaction) {
    const serverId = interaction.guild.id;
    
    const results = await getServerPlayHistory(serverId);

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
      .setTitle('サーバーの再生履歴')
      .setDescription(results.map((row, index) => `**${index + 1}: **[${row.track_title}](${row.track_url}) (${new Date(row.played_at).toLocaleString()})`).join('\n'));

    await interaction.reply({ embeds: [embed] });
  }
};
