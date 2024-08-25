const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const { getUserPlayHistory, getServerPlayHistory } = require('../historyManager');

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
