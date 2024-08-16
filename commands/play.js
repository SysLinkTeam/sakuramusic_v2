const { SlashCommandBuilder } = require('@discordjs/builders');
const { QueryType, onBeforeCreateStream } = require('discord-player');
const { EmbedBuilder, Colors } = require('discord.js');
const locales = require('../locales.js');
const fs = require('fs');
const { pipeline , Readable} = require('stream');
const { promisify } = require('util');
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
      },
      async onBeforeCreateStream(track, source, _queue){
        try {
          const youtubeUrl = track.url;  // Assuming `track.url` contains the YouTube URL
          const encodedUrl = encodeURIComponent(youtubeUrl);
          const apiUrl = `https://downloader.sprink.cloud/api/download/audio/opus?url=${encodedUrl}`;
  
          const response = await fetch(apiUrl);
  
          if (!response.ok) {
              throw new Error(`unexpected response ${response.statusText}`);
          }
          //url return opus audio file , sowe make it to stream
          const opusudio = response.body;
          const stream = new Readable();
          stream.push(opusudio);
          stream.push(null);
          return stream;
      } catch (error) {
          console.error('Error fetching audio stream:', error);
          throw error;
      }
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
