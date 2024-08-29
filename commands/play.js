const { SlashCommandBuilder } = require('@discordjs/builders');
const { QueryType } = require('discord-player');
const { EmbedBuilder, Colors } = require('discord.js');
const locales = require('../locales.js');
const { Readable } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const https = require('https');
const http = require('http');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('音楽を再生する')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('URLまたは検索ワード')
        .setRequired(false))
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('音楽ファイル (mp3, wav, m4a, flac, opus)')
        .setRequired(false)),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const attachment = interaction.options.getAttachment('file');

    if (!query && !attachment) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('クエリまたは音楽ファイルが必要です。再試行してください。')
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
      async onBeforeCreateStream(track, source, _queue) {
        if (source === 'attachment') {
          const supportedFormats = ['mp3', 'wav', 'm4a', 'flac', 'opus'];
          const fileExtension = path.extname(new URL(track.url).pathname).slice(1).toLowerCase();

          if (!supportedFormats.includes(fileExtension)) {
            throw new Error('Unsupported file format. Supported formats: mp3, wav, m4a, flac, opus.');
          }

          const protocol = track.url.startsWith('https') ? https : http;

          return new Promise((resolve, reject) => {
            const request = protocol.get(track.url, (response) => {
              if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get file, status code: ${response.statusCode}`));
              }

              if (fileExtension === 'opus') {
                return resolve(response); // Opusの場合、そのままストリームを返す
              }

              // 他の形式の場合、ffmpegでopusに変換
              const convertedStream = ffmpeg()
                .input(response)
                .inputFormat(fileExtension)
                .toFormat('opus')
                .audioCodec('libopus')
                .on('start', (commandLine) => {
                  console.log('Spawned Ffmpeg with command: ' + commandLine);
                })
                .on('error', (err) => {
                  console.error('Error during conversion:', err.message);
                  reject(err);
                })
                .on('end', () => {
                  console.log('Conversion finished!');
                })
                .pipe();

              resolve(convertedStream);
            });

            request.on('error', (err) => {
              console.error('Error downloading file:', err);
              reject(err);
            });
          });
        } else if (source === 'youtube') {
          const youtubeUrl = track.url;
          const encodedUrl = encodeURIComponent(youtubeUrl);
          const apiUrl = `https://downloader.sprink.cloud/api/download/audio/opus?url=${encodedUrl}`;
          return await streamMusic(apiUrl);
        }
      }
    });

    if (attachment) {
      const fileExtension = path.extname(new URL(attachment.url).pathname).slice(1).toLowerCase();

      const supportedFormats = ['mp3', 'wav', 'm4a', 'flac', 'opus'];
      if (!supportedFormats.includes(fileExtension)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription('サポートされていないファイル形式です。サポートされている形式: mp3, wav, m4a, flac, opus。')
          ],
          ephemeral: true
        });
      }

      if (!queue.connection) await queue.connect(channel);
      const track = {
        title: attachment.name,
        url: attachment.url,
        requestedBy: interaction.user,
        source: 'attachment'
      };
      queue.addTrack(track);

      if (queue.node.isPlaying()) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Green)
              .setDescription(`${locale.added_to_queue.replace('{track}', attachment.name)} :musical_note:`)
          ]
        });
        return;
      }

      await queue.node.play();
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.play.replace('{track}', attachment.name)} :musical_note:`)
        ]
      });
    } else if (query) {
      // URLまたは検索ワードでの再生処理
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
      if (!queue.connection) await queue.connect(channel);
      if (queue.node.isPlaying()) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Green)
              .setDescription(`${locale.added_to_queue.replace('{track}', attachment.name)} :musical_note:`)
          ]
        });
        return;
      }
      await queue.node.play();

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`${locale.play.replace('{track}', track.title)} :musical_note:`)
        ]
      });
    }

    async function streamMusic(url) {
      return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
          if (response.statusCode !== 200) {
            return reject(new Error(`Failed to get file, status code: ${response.statusCode}`));
          }
          const stream = new Readable({
            read() { }
          });
          response.on('data', (chunk) => {
            stream.push(chunk);
          });
          response.on('end', () => {
            stream.push(null);
          });
          resolve(stream);
        }).on('error', (err) => {
          reject(err);
        });
      });
    }
  }
};
