const { getSettings } = require('./settingsManager');

async function restoreSettings(guildId, interaction) {
    const settings = await getSettings(guildId);
    if (!settings) return;

    const playerQueue = interaction.client.player.nodes.create(guildId, {
        metadata: {
            channel: interaction.channel
        },
        volume: settings.volume,
        loopState: settings.loop_state
    });

    // フィルタ設定などを適用
    playerQueue.filters.apply(settings.filters.split(','));

    return playerQueue;
}

module.exports = {
    restoreSettings
};
