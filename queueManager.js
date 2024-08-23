const db = require('./database');

// キューの作成
async function createQueue(guildId) {
    const result = await db.query(
        'INSERT INTO queues (guild_id) VALUES (?)',
        [guildId]
    );
    return result.insertId;
}

// トラックの追加
async function addTrackToQueue(queueId, track) {
    await db.query(
        'INSERT INTO queue_tracks (queue_id, track_title, track_url, requested_by) VALUES (?, ?, ?, ?)',
        [queueId, track.title, track.url, track.requestedBy.id]
    );
}

// キュー内のトラックの取得
async function getQueueTracks(queueId) {
    const result = await db.query(
        'SELECT * FROM queue_tracks WHERE queue_id = ? ORDER BY added_at',
        [queueId]
    );
    return result;
}

// 現在のトラックの更新
async function updateCurrentTrack(queueId, trackId) {
    await db.query(
        'UPDATE queues SET current_track_id = ? WHERE id = ?',
        [trackId, queueId]
    );
}

// 再生状態の保存
async function savePlaybackState(queueId, track, position) {
    await db.query(
        'UPDATE queues SET current_track_id = ?, current_position = ? WHERE id = ?',
        [track.id, position, queueId]
    );
}

// 再生状態の取得
async function getPlaybackState(guildId) {
    const result = await db.query(
        'SELECT * FROM queues WHERE guild_id = ?',
        [guildId]
    );
    return result.length > 0 ? result[0] : null;
}

module.exports = {
    createQueue,
    addTrackToQueue,
    getQueueTracks,
    updateCurrentTrack,
    savePlaybackState,
    getPlaybackState
};
