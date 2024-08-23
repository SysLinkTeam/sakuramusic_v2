const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const db = require('../database'); // データベース接続

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playfromhistory')
    .setDescription('再生履歴から曲を再生キューに追加します。')
    .addIntegerOption(option => 
      option.setName('index')
        .setDescription('再生履歴のインデックスを指定してください。')
        .setRequired(true)),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const index = interaction.options.getInteger('index');
    const results = await db.query(
      'SELECT track_title, track_url FROM user_play_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 10',
      [userId]
    );

    if (index < 1 || index > results.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('無効なインデックスです。')
        ],
        ephemeral: true
      });
    }

    const track = results[index - 1];
    const queue = interaction.client.player.nodes.get(interaction.guild.id);
    if (!queue) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('再生キューが見つかりませんでした。')
        ],
        ephemeral: true
      });
    }

    const trackInfo = await interaction.client.player.search(track.track_url, {
      requestedBy: interaction.user
    });

    queue.addTrack(trackInfo.tracks[0]);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`**${track.track_title}** を再生キューに追加しました。`)
      ]
    });

    if (!queue.playing) queue.node.play();
  }
};
