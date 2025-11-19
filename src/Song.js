class Song {
  constructor({ title, url, totalsec, viewcount, author, thumbnail, type = 'youtube', expiresAt = null }) {
    // Validate required fields
    if (!title || typeof title !== 'string') {
      throw new Error('Song title must be a non-empty string');
    }
    if (!url || typeof url !== 'string') {
      throw new Error('Song URL must be a non-empty string');
    }

    // Validate and sanitize title (prevent XSS)
    this.title = String(title).substring(0, 500); // Limit length

    // Validate URL
    this.url = String(url).substring(0, 2000); // Limit length

    // Validate totalsec
    if (totalsec !== undefined && totalsec !== null) {
      const totalSecNum = Number(totalsec);
      if (isNaN(totalSecNum) || totalSecNum < 0) {
        this.totalsec = 0;
      } else {
        this.totalsec = totalSecNum;
      }
    } else {
      this.totalsec = null;
    }

    // Validate viewcount
    if (viewcount !== undefined && viewcount !== null) {
      const viewCountNum = Number(viewcount);
      if (isNaN(viewCountNum) || viewCountNum < 0) {
        this.viewcount = 0;
      } else {
        this.viewcount = viewCountNum;
      }
    } else {
      this.viewcount = 0;
    }

    // Validate author object
    if (author && typeof author === 'object') {
      this.author = {
        name: author.name ? String(author.name).substring(0, 200) : 'Unknown',
        url: author.url ? String(author.url).substring(0, 2000) : null,
        subscriber_count: author.subscriber_count || 0,
        verified: Boolean(author.verified)
      };
    } else {
      this.author = {
        name: 'Unknown',
        url: null,
        subscriber_count: 0,
        verified: false
      };
    }

    // Validate thumbnail
    if (thumbnail && typeof thumbnail === 'string') {
      this.thumbnail = String(thumbnail).substring(0, 2000);
    } else {
      this.thumbnail = null;
    }

    // Validate type
    const validTypes = ['youtube', 'attachment'];
    this.type = validTypes.includes(type) ? type : 'youtube';

    // Validate expiresAt
    if (expiresAt !== null && expiresAt !== undefined) {
      const expiresNum = Number(expiresAt);
      if (!isNaN(expiresNum) && expiresNum > 0) {
        this.expiresAt = expiresNum;
      }
    }
  }

  /**
   * Creates a Song instance from YouTube video information
   * @param {Object} songInfo - The video info object from ytdl.getInfo()
   * @returns {Song} A new Song instance
   */
  static fromYouTubeInfo(songInfo) {
    // Validate songInfo structure
    if (!songInfo || typeof songInfo !== 'object') {
      throw new Error('Invalid songInfo: must be an object');
    }

    if (!songInfo.videoDetails || typeof songInfo.videoDetails !== 'object') {
      throw new Error('Invalid songInfo: missing videoDetails');
    }

    const videoDetails = songInfo.videoDetails;

    // Validate required fields
    if (!videoDetails.title || typeof videoDetails.title !== 'string') {
      throw new Error('Invalid songInfo: missing or invalid title');
    }

    if (!videoDetails.video_url || typeof videoDetails.video_url !== 'string') {
      throw new Error('Invalid songInfo: missing or invalid video_url');
    }

    // Safely extract thumbnail
    let thumbnail = null;
    if (Array.isArray(videoDetails.thumbnails) && videoDetails.thumbnails.length > 0) {
      const lastThumbnail = videoDetails.thumbnails[videoDetails.thumbnails.length - 1];
      if (lastThumbnail && lastThumbnail.url) {
        thumbnail = lastThumbnail.url;
      }
    }

    // Safely extract author information
    const author = {
      name: 'Unknown',
      url: null,
      subscriber_count: 0,
      verified: false
    };

    if (videoDetails.author && typeof videoDetails.author === 'object') {
      if (videoDetails.author.name) {
        author.name = videoDetails.author.name;
      }
      if (videoDetails.author.channel_url) {
        author.url = videoDetails.author.channel_url;
      }
      if (videoDetails.author.subscriber_count !== undefined) {
        author.subscriber_count = videoDetails.author.subscriber_count;
      }
      if (videoDetails.author.verified !== undefined) {
        author.verified = videoDetails.author.verified;
      }
    }

    return new Song({
      title: videoDetails.title,
      url: videoDetails.video_url,
      totalsec: videoDetails.lengthSeconds,
      viewcount: videoDetails.viewCount,
      author: author,
      thumbnail: thumbnail
    });
  }
}

module.exports = Song;
