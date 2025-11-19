const ytdl = require('ytdl-core');
const { createAudioResource } = require('@discordjs/voice');
const { AUDIO } = require('./config/constants');

class MusicQueue {
  constructor(textChannel, voiceChannel) {
    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;
    this.connection = null;
    this.songs = [];
    this.history = [];
    this.playing = true;
    this.loop = false;
    this.queueloop = false;
    this.starttimestamp = 0;
    this.player = null;
    this.resource = null;
    this.paused = false;
    this.autoPlay = false;
    this.autoPlayPosition = 1;
  }

  addSong(song) {
    this.songs.push(song);
  }

  skip() {
    if (this.player) {
      this.player.stop();
    }
  }

  stop() {
    this.songs = [];
    this.autoPlay = false;
    if (this.player) {
      this.player.stop();
    }
  }

  pause() {
    if (this.player && !this.paused) {
      this.player.pause();
      this.paused = true;
    }
  }

  resume() {
    if (this.player && this.paused) {
      this.player.unpause();
      this.paused = false;
    }
  }

  setVolume(volume) {
    if (this.resource && this.resource.volume) {
      this.resource.volume.setVolume(volume);
    }
  }

  async seek(seconds) {
    if (!this.player || this.songs.length === 0) return;

    const currentSong = this.songs[0];
    if (!currentSong) return;

    // Validate seek position
    if (seconds < 0 || seconds > currentSong.totalsec) {
      this.textChannel.send('Please enter a time within the length of the song!');
      return;
    }

    // Check if song type supports seeking
    if (currentSong.type === 'attachment') {
      this.textChannel.send('⚠️ Seeking is not supported for uploaded files. Only YouTube videos support seeking.');
      return;
    }

    // Stop current playback
    this.player.stop();

    try {
      // Create new stream starting at the specified position
      // The `begin` parameter makes ytdl start downloading from that timestamp,
      // avoiding unnecessary data transfer
      const stream = ytdl(currentSong.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: AUDIO.HIGH_WATER_MARK,
        begin: seconds * 1000,
      }).on('error', err => {
        console.error('[Seek] Stream error:', err.message);
        this.textChannel.send('Failed to seek. Please try again.').catch(() => {});
      });

      const resource = createAudioResource(stream, { inlineVolume: true });

      // Preserve current volume
      const currentVolume = this.resource && this.resource.volume ? this.resource.volume.volume : AUDIO.DEFAULT_VOLUME;
      resource.volume.setVolume(currentVolume);

      this.resource = resource;
      this.player.play(resource);

      // Update timestamp to match seek position
      this.starttimestamp = Date.now() - seconds * 1000;
      this.paused = false;
    } catch (err) {
      console.error('[Seek] Error:', err.message);
      this.textChannel.send('Failed to seek. Please try again.').catch(() => {});
    }
  }
}

module.exports = MusicQueue;
