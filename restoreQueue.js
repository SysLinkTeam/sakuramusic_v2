const db = require('./database');
const { getQueueTracks, updateCurrentTrack } = require('./queueManager');

async function restoreQueue(guildId, interaction) {
    const queueData = await db.query('SELECT * FROM queues WHERE guild_id = ?', [guildId]);
    if (queueData.length === 0) return null;

    const queue = queueData[0];
    const tracks = await getQueueTracks(queue.id);
    
    // プレイヤーにキューを再設定
    const playerQueue = interaction.client.player.nodes.create(guildId, {
        metadata: {
            channel: interaction.channel
        },
        volume: queue.volume,
        loopState: queue.loop_state
    });

    for (const track of tracks) {
        playerQueue.addTrack({
            title: track.track_title,
            url: track.track_url,
            requestedBy: { id: track.requested_by }
        });
    }

    if (queue.current_track_id) {
        await playerQueue.node.play(); // 現在のトラックを再生
    }

    return playerQueue;
}

module.exports = {
    restoreQueue
};
