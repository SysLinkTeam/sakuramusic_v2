const { SlashCommandBuilder } = require('@discordjs/builders');
const { QueryType, onBeforeCreateStream } = require('discord-player');
const { EmbedBuilder, Colors, IntegrationApplication } = require('discord.js');
const locales = require('../locales.js');
const https = require('https');
const http = require('http');
const { Readable } = require('stream');
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
          function streamMusic(url) {
              return new Promise((resolve, reject) => {
                  const protocol = url.startsWith('https') ? https : http;
          
                  protocol.get(url, (response) => {
                      if (response.statusCode !== 200) {
                          return reject(new Error(`Failed to get file, status code: ${response.statusCode}`));
                      }
          
                      const stream = new Readable({
                          read() {}
                      });
          
                      response.on('data', (chunk) => {
                          stream.push(chunk);
                      });
          
                      response.on('end', () => {
                          stream.push(null); // 終了を示す
                      });
          
                      resolve(stream);
                  }).on('error', (err) => {
                      reject(err);
                  });
              });
          }
          return await streamMusic(apiUrl);
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
    if (queue.node.isPlaying()) return await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.addedqueue.replace('{track}', track.title)} :musical_note:`)
      ],
      ephemeral: true
    }); 
    
    await queue.node.play();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.play.replace('{track}', track.title)} :musical_note:`)
      ]
    }).then(msg => {
      setTimeout(async () => {
          interaction.reply = interaction.followUp;
          const nowplayingIntaraclion = await interaction.client.commands.get('nowplaying').execute(interaction);
      }, 1000);
    });
    
    
  }
};
