const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('キューに入っている曲一覧を表示'),
  
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

    const tracks = queue.tracks.map((track, i) => `${i + 1}. **${track.title}**`).join('\n');
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blue)
          .setDescription(`${locale.queue.replace('{tracks}', tracks)} :bar_chart:`)
      ]
    });
  }
};
