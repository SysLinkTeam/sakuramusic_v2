/**
 * Application-wide constants and configuration values
 */

module.exports = {
  // Audio configuration
  AUDIO: {
    DEFAULT_VOLUME: 0.2,
    HIGH_WATER_MARK: 1 << 25, // 33,554,432 bytes for streaming buffer
  },

  // Cache and performance thresholds
  CACHE: {
    AUTO_SAVE_INTERVAL: '*/5 * * * * *', // Every 5 seconds
    MEMORY_THRESHOLD: 0.8, // 80% memory usage threshold before clearing cache
  },

  // Playlist batch processing limits
  PLAYLIST: {
    BATCH_LIMIT_SMALL: 300,    // Below this: process all at once
    BATCH_LIMIT_MEDIUM: 1000,  // Below this: batch size of 5
    BATCH_SIZE_MEDIUM: 5,      // Batch size for medium playlists
    BATCH_SIZE_LARGE: 10,      // Batch size for large playlists
    PROGRESS_REPORT_INTERVAL: 100, // Report progress every N songs
  },

  // Attachment expiration
  ATTACHMENT: {
    EXPIRY_TIME: 7200000, // 2 hours in milliseconds
  },

  // Search configuration
  SEARCH: {
    AUTO_PLAY_LIMIT: 10, // Number of results to fetch for autoplay
    TITLE_SEARCH_RATIO: 0.5, // Use first half of title for search
  },

  // User agent for external requests
  DEFAULT_USER_AGENT: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:68.0) Gecko/20100101 Firefox/68.0",

  // yt-dlp configuration
  YTDLP: {
    PLATFORMS: {
      win32: {
        x64: 'yt-dlp.exe',
        default: 'yt-dlp_x86.exe'
      },
      linux: 'yt-dlp',
      darwin: 'yt-dlp_macos'
    },
    VERSION_FILE: './yt-dlp_version',
    API_URL: 'https://api.github.com/repos/yt-dlp/yt-dlp-nightly-builds/releases/latest'
  }
};
