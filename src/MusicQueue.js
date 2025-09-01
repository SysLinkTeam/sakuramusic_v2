const ytdl = require('ytdl-core');
const { createAudioResource } = require('@discordjs/voice');

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
    this.player.stop();
    const stream = ytdl(this.songs[0].url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
      begin: seconds * 1000,
    });
    const resource = createAudioResource(stream, { inlineVolume: true });
    const currentVolume = this.resource && this.resource.volume ? this.resource.volume.volume : 0.2;
    resource.volume.setVolume(currentVolume);
    this.resource = resource;
    this.player.play(resource);
    this.starttimestamp = Date.now() - seconds * 1000;
    this.paused = false;
  }
}

module.exports = MusicQueue;
