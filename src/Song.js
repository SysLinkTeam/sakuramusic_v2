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
}

module.exports = Song;
