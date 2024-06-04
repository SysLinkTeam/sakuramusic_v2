const { SlashCommandBuilder } = require('@discordjs/builders');
const { QueryType } = require('discord-player');
const { EmbedBuilder, Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('音楽を再生する')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('URLまたは検索ワード')
        .setRequired(true)),
  
  async execute(interaction) {
    const query = interaction.options.getString('query');
    if (!query) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('クエリが無効です。再試行してください。')
        ],
        ephemeral: true
      });
    }

    const channel = interaction.member.voice.channel;
    const lang = interaction.guild.preferredLocale || 'en';
    const locale = locales[lang] || locales['en'];

    if (!channel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`${locale.no_voice_channel} :x:`)
        ],
        ephemeral: true
      });
    }

    const queue = interaction.client.player.nodes.create(interaction.guild, {
      metadata: {
        channel: interaction.channel
      }
    });

    try {
      if (!queue.connection) await queue.connect(channel);
    } catch {
      queue.destroy();
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`${locale.no_voice_channel} :x:`)
        ],
        ephemeral: true
      });
    }

    const result = await interaction.client.player.search(query, {
      requestedBy: interaction.user,
      searchEngine: QueryType.YOUTUBE_SEARCH
    });


    if (result.tracks.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`${locale.no_search_result} :x:`)
        ],
        ephemeral: true
      });
    }

    const track = result.tracks[0];
    queue.addTrack(track);

    if (!queue.node.isPlaying()) await queue.node.play();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.play.replace('{track}', track.title)} :musical_note:`)
      ]
    });
  }
};
