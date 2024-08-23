const { getPlaybackState, getQueueTracks } = require('./queueManager');
const equalizerPresets = require('./equalizerPresets'); // イコライザー設定を利用

async function restorePlayback(interaction) {
    const guildId = interaction.guild.id;
    const playbackState = await getPlaybackState(guildId);

    if (!playbackState) return;

    const queue = interaction.client.player.nodes.create(interaction.guild, {
        metadata: {
            channel: interaction.channel
        }
    });

    const tracks = await getQueueTracks(playbackState.id);
    tracks.forEach(track => {
        queue.addTrack({
            title: track.track_title,
            url: track.track_url,
            requestedBy: { id: track.requested_by }
        });
    });

    await queue.connect(interaction.member.voice.channel);

    // 設定を反映
    queue.node.setVolume(playbackState.volume);
    queue.filters.equalizer.setEQ(equalizerPresets[playbackState.equalizer]);

    // ループ設定を反映
    let loopMode;
    if (playbackState.loop_state === 'noloop') loopMode = 0;
    else if (playbackState.loop_state === 'loop') loopMode = 1;
    else if (playbackState.loop_state === 'queueloop') loopMode = 2;
    queue.setRepeatMode(loopMode);

    // 再生を再開
    if (playbackState.current_track_id) {
        await queue.node.play();
        queue.node.seek(playbackState.current_position);
    }
}

module.exports = {
    restorePlayback
};
