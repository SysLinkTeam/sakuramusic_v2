class Song {
  constructor({ title, url, totalsec, viewcount, author, thumbnail, type = 'youtube', expiresAt = null }) {
    this.title = title;
    this.url = url;
    this.totalsec = totalsec !== undefined ? Number(totalsec) : null;
    this.viewcount = viewcount;
    this.author = author;
    this.thumbnail = thumbnail;
    this.type = type;
    if (expiresAt) this.expiresAt = expiresAt;
  }

  /**
   * Creates a Song instance from YouTube video information
   * @param {Object} songInfo - The video info object from ytdl.getInfo()
   * @returns {Song} A new Song instance
   */
  static fromYouTubeInfo(songInfo) {
    const thumbnails = songInfo.videoDetails.thumbnails;
    const thumbnail = thumbnails[thumbnails.length - 1]?.url || thumbnails[Object.keys(thumbnails).length - 1]?.url;

    return new Song({
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
      totalsec: songInfo.videoDetails.lengthSeconds,
      viewcount: songInfo.videoDetails.viewCount,
      author: {
        name: songInfo.videoDetails.author.name,
        url: songInfo.videoDetails.author.channel_url,
        subscriber_count: songInfo.videoDetails.author.subscriber_count,
        verified: songInfo.videoDetails.author.verified
      },
      thumbnail: thumbnail
    });
  }
}

module.exports = Song;
