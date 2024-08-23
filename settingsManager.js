const db = require('./database');

// 設定の保存
async function saveSettings(guildId, settings) {
    await db.query(
        `INSERT INTO settings (guild_id, volume, loop_state, equalizer) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         volume = VALUES(volume), 
         loop_state = VALUES(loop_state), 
         equalizer = VALUES(equalizer)`,
        [guildId, settings.volume, settings.loopState, settings.equalizer]
    );
}

// 設定の取得
async function getSettings(guildId) {
    const result = await db.query(
        'SELECT * FROM settings WHERE guild_id = ?',
        [guildId]
    );
    return result.length > 0 ? result[0] : null;
}

module.exports = {
    saveSettings,
    getSettings
};
