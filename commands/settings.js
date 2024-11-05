const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const { getSettings, saveSettings } = require('../settingsManager');
const locales = require('../locales.js');
const { getEqualizerPresets } = require('../equalizer.js'); // 既存のプリセットを利用

const equalizerPresets = getEqualizerPresets();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('サーバーの音楽再生設定を表示または変更します')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('現在の設定を表示します'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('volume')
        .setDescription('音量を設定します')
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('音量レベル（0-100）')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('loop')
        .setDescription('ループモードを設定します')
        .addStringOption(option =>
          option.setName('mode')
            .setDescription('ループモードを選択します')
            .setRequired(true)
            .addChoices(
              { name: 'なし', value: 'noloop' },
              { name: 'トラック', value: 'loop' },
              { name: 'キュー', value: 'queueloop' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('equalizer')
        .setDescription('イコライザー設定を変更します')
        .addStringOption(option =>
          option.setName('preset')
            .setDescription('イコライザープリセットを選択します')
            .setRequired(true)
            .addChoices(
              { name: 'Default', value: 'Default' },
              { name: '01 Acoustic', value: '01 Acoustic' },
              { name: '02 Bass Booster', value: '02 Bass Booster' },
              { name: '03 Bass Reducer', value: '03 Bass Reducer' },
              { name: '04 Classical', value: '04 Classical' },
              { name: '05 Dance', value: '05 Dance' },
              { name: '06 Deep', value: '06 Deep' },
              { name: '07 Electronic', value: '07 Electronic' },
              { name: '08 Fine', value: '08 Fine' },
              { name: '09 Flat', value: '09 Flat' },
              { name: '10 HipHop', value: '10 HipHop' },
              { name: '11 Jazz', value: '11 Jazz' },
              { name: '12 Loudness', value: '12 Loudness' },
              { name: '13 Lounge', value: '13 Lounge' },
              { name: '14 Piano', value: '14 Piano' },
              { name: '15 Pop', value: '15 Pop' },
              { name: '16 R&B', value: '16 R&B' },
              { name: '17 Reggae', value: '17 Reggae' },
              { name: '18 Rock', value: '18 Rock' },
              { name: '19 Small Speakers', value: '19 Small Speakers' },
              { name: '20 Spoken Word', value: '20 Spoken Word' },
              { name: '21 Treble Booster', value: '21 Treble Booster' },
              { name: '22 Treble Reducer', value: '22 Treble Reducer' },
              { name: '23 Vocal Booster', value: '23 Vocal Booster' },
              { name: '24 Perfect', value: '24 Perfect' }
            ))),

  async execute(interaction) {
    const lang = interaction.guild.preferredLocale || 'en';
    const locale = locales[lang] || locales['en'];
    const guildId = interaction.guild.id;

    // サーバー設定を初期化する
    let settings = await getSettings(guildId);
    if (!settings) {
      settings = {
        volume: 50, // デフォルトの音量
        loopState: 'none', // デフォルトのループモード
        equalizer: 'Default' // デフォルトのイコライザープリセット
      };
      await saveSettings(guildId, settings);
    }

    const queue = interaction.client.player.nodes.get(guildId);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle('サーバーの設定')
        .addFields(
          { name: '音量', value: `${settings.volume}%`, inline: true },
          { name: 'ループモード', value: settings.loopState, inline: true },
          { name: 'イコライザー', value: settings.equalizer || 'Default', inline: true }
        );

      return interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'volume') {
      const level = interaction.options.getInteger('level');

      if (level < 0 || level > 100) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription('音量は0から100の間で指定してください。')
          ],
          ephemeral: true
        });
      }

      settings.volume = level;
      await saveSettings(guildId, settings);

      // プレイヤーに即座に反映
      if (queue && queue.node.isPlaying()) {
        queue.node.setVolume(level);
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`音量が${level}%に設定されました。`)
        ]
      });

    } else if (subcommand === 'loop') {
      const mode = interaction.options.getString('mode');
      let modeValue;

      if (mode === 'noloop') modeValue = "none";
      else if (mode === 'loop') modeValue = "track";
      else if (mode === 'queueloop') modeValue = "queue";

      settings.loopState = modeValue;
      await saveSettings(guildId, settings);

      // プレイヤーに即座に反映
      if (queue && queue.node.isPlaying()) {
        queue.setRepeatMode(modeValue);
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`ループモードが${mode}に設定されました。`)
        ]
      });

    } else if (subcommand === 'equalizer') {
      const preset = interaction.options.getString('preset');

      if (!equalizerPresets[preset]) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription('無効なイコライザープリセットです。')
          ],
          ephemeral: true
        });
      }

      settings.equalizer = preset;
      await saveSettings(guildId, settings);

      // プレイヤーに即座に反映
      if (queue && queue.node.isPlaying()) {
        queue.filters.equalizer.setEQ(equalizerPresets[preset]);
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`イコライザーが${preset}に設定されました。`)
        ]
      });
    }
  }
};
