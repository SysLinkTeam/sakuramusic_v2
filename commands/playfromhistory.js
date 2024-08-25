const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const { getUserPlayHistory, getServerPlayHistory } = require('../historyManager');
const { addTrackToQueue, updateCurrentTrack } = require('../queueManager');
const { createQueue, getQueue } = require('../queueManager');
const { getSettings, saveSettings } = require('../settingsManager');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playfromhistory')
    .setDescription('再生履歴から曲を再生キューに追加します。')
    .addIntegerOption(option =>
      option.setName('index')
        .setDescription('再生履歴のインデックスを指定してください。')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('serverhistory')
        .setDescription('サーバーの再生履歴からデータを取得します')
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const index = interaction.options.getInteger('index');
    const serverHistory = interaction.options.getBoolean('serverhistory');
    const lang = interaction.guild.preferredLocale || 'en';
    const locale = locales[lang] || locales['en'];
    const channel = interaction.member.voice.channel;
    

    let results = [];


    const page = Math.floor(index / 10);
    if (serverHistory) {
      results = await getServerPlayHistory(interaction.guild.id, page);
    } else {
      results = await getUserPlayHistory(userId, page);
    }

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

    let settings = await getSettings(interaction.guild.id);
    if (!settings) {
      settings = {
        volume: 100, // デフォルトの音量
        loopState: 'none', // デフォルトのループモード
        equalizer: 'Default' // デフォルトのイコライザープリセット
      };
      await saveSettings(interaction.guild.id, settings);
    }

    const queueId = await getQueue(interaction.guild.id) ?? await createQueue(interaction.guild.id);
    const track = results[index - 1];
    let queue = interaction.client.player.nodes.get(interaction.guild.id);
    if (!queue) {
      // キューが存在しない場合は新規作成
      queue = interaction.client.player.nodes.create(interaction.guild, {
        metadata: {
          channel: interaction.channel
        },
        async onBeforeCreateStream(track, source, _queue) {
          try {
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
            if (attachment) return await streamMusic(track.url);
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

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription(`${locale.no_voice_channel} :x:`)
          ],
          ephemeral: true
        });
      }
    } else {
      // 既存のキューがある場合はボイスチャンネルに接続されているか確認
      if (!queue.connection) {
        try {
          await queue.connect(channel);
        } catch {
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


    // ループ設定を反映
    let loopMode;
    if (settings.loopState === 'none') loopMode = 0;
    else if (settings.loopState === 'loop') loopMode = 1;
    else if (settings.loopState === 'queueloop') loopMode = 2;
    queue.setRepeatMode(loopMode);

    const result = await interaction.client.player.search(track.track_url, {
      requestedBy: interaction.user
    });

    const trackInfo = result.tracks[0];
    const trackId = await addTrackToQueue(queueId, trackInfo); // トラックをデータベースに保存

    queue.addTrack(trackInfo);

    // サーバー設定をキューに適用
    queue.node.setVolume(settings.volume);

    if (!queue.node.isPlaying()) {
      await updateCurrentTrack(queueId, trackId); // 現在のトラックを更新
      await queue.node.play();
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`${locale.play.replace('{track}', trackInfo.title)} :musical_note:`)
      ]
    }).then(msg => {
      setTimeout(async () => {
        interaction.reply = interaction.followUp;
        await interaction.client.commands.get('nowplaying').execute(interaction);
      }, 1000);
    });

    // サーバー設定をキューに適用
    queue.node.setVolume(settings.volume);
    //queue.filters.equalizer.setEQ(equalizerPresets[settings.equalizer]);

    // 再生後の設定を保存
    await saveSettings(interaction.guild.id, {
      volume: queue.node.volume,
      loopState: settings.loopState,
      equalizer: settings.equalizer
    });
  }
};
