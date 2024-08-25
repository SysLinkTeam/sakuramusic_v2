const db = require('./database');

async function createUserHistoryEntry(userId, track) {
    const query = `
    INSERT INTO user_play_history (user_id, track_title, track_url, played_at)
    VALUES (?, ?, ?, NOW())
  `;
    const params = [userId, track.title, track.url];

    try {
        await db.query(query, params);
    } catch (error) {
        console.error('Failed to create user history entry:', error);
    }
}

async function createServerHistoryEntry(serverId, track) {
    const query = `
    INSERT INTO server_play_history (server_id, track_title, track_url, played_at)
    VALUES (?, ?, ?, NOW())
  `;
    const params = [serverId, track.title, track.url];

    try {
        await db.query(query, params);
    } catch (error) {
        console.error('Failed to create server history entry:', error);
    }
}

async function getUserPlayHistory(userId,page) {
    const query = `
    SELECT * FROM user_play_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 10 OFFSET ?
  `;
    const params = [userId, page * 10];

    try {
        const results = await db.query(query, params);
        return results;
    } catch (error) {
        console.error('Failed to fetch user play history:', error);
        return [];
    }
}

async function getServerPlayHistory(serverId, page) {
    const query = `
    SELECT * FROM server_play_history WHERE server_id = ? ORDER BY played_at DESC LIMIT 10 OFFSET ?
  `;
    const params = [serverId, page * 10];

    try {
        const results = await db.query(query, params);
        return results;
    } catch (error) {
        console.error('Failed to fetch server play history:', error);
        return [];
    }
}

async function clearUserPlayHistory(userId) {
    const query = 'DELETE FROM user_play_history WHERE user_id = ?';
    const params = [userId];

    try {
        await db.query(query, params);
    } catch (error) {
        console.error('Failed to clear user play history:', error);
    }
}

async function clearServerPlayHistory(serverId) {
    const query = 'DELETE FROM server_play_history WHERE server_id = ?';
    const params = [serverId];

    try {
        await db.query(query, params);
    } catch (error) {
        console.error('Failed to clear server play history:', error);
    }
}

module.exports = {
    createUserHistoryEntry,
    createServerHistoryEntry,
    getUserPlayHistory,
    getServerPlayHistory,
    clearUserPlayHistory,
    clearServerPlayHistory
};