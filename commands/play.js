const { SlashCommandBuilder } = require('@discordjs/builders');
const { QueryType } = require('discord-player');
const { EmbedBuilder, Colors } = require('discord.js');
const https = require('https');
const http = require('http');
const { Readable } = require('stream');
const { getSettings, saveSettings } = require('../settingsManager');
const { createQueue, addTrackToQueue, updateCurrentTrack, savePlaybackState } = require('../queueManager');
const locales = require('../locales.js');
const { getEqualizerPresets } = require('../equalizer.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('音楽を再生する')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('URLまたは検索ワード')
        .setRequired(false))
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('音楽ファイルを添付')
        .setRequired(false)),

  async execute(interaction) {
    const equalizerPresets = await getEqualizerPresets();
    const query = interaction.options.getString('query');
    const attachment = interaction.options.getAttachment('attachment');
    const lang = interaction.guild.preferredLocale || 'en';
    const locale = locales[lang] || locales['en'];

    if (!query && !attachment) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription('URL、検索ワード、または添付ファイルを指定してください。')
        ],
        ephemeral: true
      });
    }

    const channel = interaction.member.voice.channel;

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

    // サーバー設定を取得
    let settings = await getSettings(interaction.guild.id);
    if (!settings) {
      settings = {
        volume: 100, // デフォルトの音量
        loopState: 'none', // デフォルトのループモード
        equalizer: 'Default' // デフォルトのイコライザープリセット
      };
      await saveSettings(interaction.guild.id, settings);
    }

    let queue = interaction.client.player.nodes.get(interaction.guild.id);
    if (!queue) {
      // 新しいキューを作成
      queue = interaction.client.player.nodes.create(interaction.guild, {
        metadata: {
          channel: interaction.channel
        },
        async onBeforeCreateStream(track, source, _queue) {
          try {
            if (attachment) {
              // 添付ファイルの場合はそのままストリームを作成
              return source;
            }

            // YouTubeリンクの処理
            const youtubeUrl = track.url;  
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
                    read() { }
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

      // ループ設定を反映
      let loopMode;
      if (settings.loopState === 'none') loopMode = 0;
      else if (settings.loopState === 'loop') loopMode = 1;
      else if (settings.loopState === 'queueloop') loopMode = 2;
      queue.setRepeatMode(loopMode);

    } else {
      // 既存のキューがある場合はボイスチャンネルに接続されているか確認
      if (!queue.connection) {
        try {
          await queue.connect(channel);
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
      }
    }

    let result;

    if (attachment) {
      // 添付ファイルの処理
      result = {
        tracks: [{
          title: attachment.name,
          url: attachment.url,
          requestedBy: interaction.user
        }]
      };
    } else {
      // 検索クエリまたはURLの処理
      result = await interaction.client.player.search(query, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE_SEARCH
      });
    }

    if (!result || result.tracks.length === 0) {
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
    await addTrackToQueue(queue.id, track); // トラックをデータベースに保存

    queue.addTrack(track);

    if (!queue.node.isPlaying()) {
      await updateCurrentTrack(queue.id, track.id); // 現在のトラックを更新
      await queue.node.play();
    } else {
      // 再生中の位置を保存
      queue.node.on('trackEnd', async (track) => {
        await savePlaybackState(queue.id, track, queue.node.getCurrentTime());
      });
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.play.replace('{track}', track.title)} :musical_note:`)
      ]
    }).then(msg => {
      setTimeout(async () => {
        interaction.reply = interaction.followUp;
        await interaction.client.commands.get('nowplaying').execute(interaction);
      }, 1000);
    });

    // サーバー設定をキューに適用
    queue.node.setVolume(settings.volume);
    queue.filters.equalizer.setEQ(equalizerPresets[settings.equalizer]);

    // 再生後の設定を保存
    await saveSettings(interaction.guild.id, {
      volume: queue.node.volume,
      loopState: settings.loopState,
      equalizer: settings.equalizer
    });
  }
};
