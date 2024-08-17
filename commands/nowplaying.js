const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, Colors } = require('discord.js');
const locales = require('../locales.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('現在再生中の曲の情報を表示'),

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

    const track = queue.currentTrack;
    const filters = queue.filters.ffmpeg.filters.join(', ') || 'None';
    const progress = queue.node.createProgressBar();
    console.log(queue.node.volume);
    if(queue.node.volume > 100) queue.node.setVolume(100);
    const volume = queue.node.volume;

    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle(track.title)
      .setURL(track.url)
      .setAuthor({ name: track.author })
      .setThumbnail(track.thumbnail)
      .addFields(
        { name: 'Duration', value: formatDuration(track.durationMS), inline: true },
        { name: 'Played', value: formatDuration(queue.node.estimatedPlaybackTime), inline: true },
        { name: 'Views', value: track.views.toLocaleString(), inline: true },
        { name: 'Volume', value: `${volume}%`, inline: true },
        { name: 'Filters', value: filters, inline: true },
        { name: 'Progress', value: progress, inline: false }
      );

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous_track')
          .setLabel('⏮')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('seek_back')
          .setLabel('⏪')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('pause_resume')
          .setLabel(queue.node.paused ? '▶' : '⏸')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('seek_forward')
          .setLabel('⏩')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('next_track')
          .setLabel('⏭')
          .setStyle(ButtonStyle.Primary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('volume_down')
          .setLabel('🔉')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('volume_reset')
          .setLabel('🔈')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('volume_up')
          .setLabel('🔊')
          .setStyle(ButtonStyle.Primary)
      );

    const row3 = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_filter')
          .setPlaceholder(locale.filters)
          .addOptions([
            { label: 'None', value: 'none' },
            { label: '8D', value: '8D' },
            { label: 'Gate', value: 'gate' },
            { label: 'Haas', value: 'haas' },
            { label: 'Phaser', value: 'phaser' },
            { label: 'Treble', value: 'treble' },
            { label: 'Tremolo', value: 'tremolo' },
            { label: 'Vibrato', value: 'vibrato' },
            { label: 'Reverse', value: 'reverse' },
            { label: 'Karaoke', value: 'karaoke' },
            { label: 'Flanger', value: 'flanger' },
            { label: 'Mcompand', value: 'mcompand' },
            { label: 'Pulsator', value: 'pulsator' },
            { label: 'Subboost', value: 'subboost' },
            { label: 'Bassboost', value: 'bassboost' },
            { label: 'Vaporwave', value: 'vaporwave' },
            { label: 'Nightcore', value: 'nightcore' },
            { label: 'Normalizer', value: 'normalizer' },
            { label: 'Surrounding', value: 'surrounding' }
          ])
      );

    const panel = await interaction.reply({
      embeds: [embed],
      components: [row1, row2/*, row3*/]
    });

    //15分間の間、最新の情報に5秒ごとに更新する
    //更新する項目は、再生時間、プログレスバー、ボリューム、フィルター
    //15分間のタイマーはsetTimeoutを使う。5秒ごとの更新はsetIntervalを使う
    const updateInterval = setInterval(async function updatePanel(){
      const queue = interaction.client.player.nodes.get(interaction.guild.id);
      if (!queue || !queue.node.isPlaying()) {
        return clearInterval(updateInterval);
      }
      const track = queue.currentTrack;
      const progress = queue.node.createProgressBar();
      const volume = queue.node.volume;
      const filters = queue.filters.ffmpeg.filters.join(', ') || 'None';

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(track.title)
        .setURL(track.url)
        .setAuthor({ name: track.author })
        .setThumbnail(track.thumbnail)
        .addFields(
          { name: 'Duration', value: formatDuration(track.durationMS), inline: true },
          { name: 'Played', value: formatDuration(queue.node.estimatedPlaybackTime), inline: true },
          { name: 'Views', value: track.views.toLocaleString(), inline: true },
          { name: 'Volume', value: `${volume}%`, inline: true },
          { name: 'Filters', value: filters, inline: true },
          { name: 'Progress', value: progress, inline: false }
        );

      await panel.edit({
        embeds: [embed],
        components: [row1, row2/*, row3*/]
      }).catch(err => {
        clearInterval(updateInterval);
      });
    }, 5000);
    setTimeout(() => {
      clearInterval(updateInterval);
    }, 900000);
    
  }
};

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours > 0 ? `${hours}:` : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
}
