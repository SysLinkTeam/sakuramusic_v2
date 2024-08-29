const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('指定した時間にシークします')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('シークする時間 (hh:mm:ss, mm:ss, または秒数)')
        .setRequired(true)),

  async execute(interaction) {
    const timeInput = interaction.options.getString('time');
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

    // 時間を秒数に変換する関数
    const parseTime = (time) => {
      if (time.includes(':')) {
        const parts = time.split(':').reverse();
        let seconds = 0;

        for (let i = 0; i < parts.length; i++) {
          seconds += parseInt(parts[i], 10) * Math.pow(60, i);
        }
        return seconds;
      } else {
        return parseInt(time, 10);
      }
    };

    const seconds = parseTime(timeInput);

    if (isNaN(seconds) || seconds < 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('無効な時間形式です。hh:mm:ss, mm:ss, または秒数で入力してください。')
        ],
        ephemeral: true
      });
    }

    try {
      queue.node.seek(seconds * 1000); // シークをミリ秒単位で実行
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.seek.replace('{seconds}', seconds)} :fast_forward:`)
        ]
      });
    } catch (error) {
      console.error('Error seeking in track:', error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('シーク中にエラーが発生しました。')
        ],
        ephemeral: true
      });
    }
  }
};