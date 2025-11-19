/**
 * Common error and info messages used across the application
 */
module.exports = {
  ERRORS: {
    // Voice channel errors
    NOT_IN_VOICE_CHANNEL: 'You have to be in a voice channel to use this command!',
    BOT_NO_PERMISSION: 'I need the permissions to join and speak in your voice channel!',

    // Queue errors
    NO_SONG_IN_QUEUE: 'There is no song in the queue!',
    NO_SONG_TO_PAUSE: 'There is no song that I could pause!',
    NO_SONG_TO_RESUME: 'There is no song that I could resume!',
    NO_SONG_TO_SKIP: 'There is no song that I could skip!',
    NO_SONG_TO_STOP: 'There is no song that I could stop!',
    NO_SONG_TO_REMOVE: 'There is no song that I could remove!',
    NO_SONG_TO_SKIP_TO: 'There is no song that I could skip to!',
    NO_SONG_TO_SHOW: 'There is no song that I could tell you about!',
    NO_SONG_TO_CLEAR: 'There is no song that I could clear!',
    NO_SONG_TO_LOOP: 'There is no song that I could loop!',
    NO_SONG_TO_QUEUE_LOOP: 'There is no song that I could queue loop!',
    NO_SONG_TO_CHANGE_VOLUME: 'There is no song that I could change volume!',
    NO_SONG_TO_SEEK: 'There is no song that I could seek!',
    NO_SONG_TO_SHUFFLE: 'There is no song that I could shuffle!',
    NO_SONG_TO_SHOW_QUEUE: 'There is no song that I could show the queue!',
    NO_SONG_TO_SHOW_HISTORY: 'There is no song that I could show the history!',
    NO_SONG_PLAYING: 'No music is currently being played!',

    // YouTube/Fetch errors
    YOUTUBE_FETCH_FAILED: `Oops, there seems to have been an error.
Please check the following points.
* Is the URL correct?
* If it's a playlist, check if it's a public playlist.
* If it's a video, check that the video is public.
If the above checks are correct, please try again later.

YouTube API may be experiencing high load due to time of day or other factors.`,

    // Input validation errors
    INVALID_SONG_NUMBER: 'Please enter a valid song number!',
    INVALID_VOLUME: 'Please enter a number between 1 and 10!',
    INVALID_SEEK_TIME: 'Please enter a valid time!',
    INVALID_URL: 'Invalid URL provided. Please provide a valid YouTube URL.',
    PLAYLIST_TOO_LARGE: (max) => `This playlist is too large! Maximum allowed size is ${max} songs.`,
    NEED_URL_OR_FILE: 'You need to provide a URL/search query or attach an audio file.',
    NEED_SONG_NUMBER: 'Please enter a song number!',
    NEED_MINIMUM_SONGS: (min) => `You need at least ${min} songs in the queue to shuffle!`,

    // State errors
    SONG_ALREADY_PAUSED: 'The song is already paused!',
    SONG_NOT_PAUSED: 'The song is not paused!',

    // Autoplay errors
    AUTOPLAY_NO_NEXT_SONG: 'I cannot find the next song, so I will stop playing music',
    AUTOPLAY_CANNOT_PLAY: 'I find the next song, but I cannot play it, so I will stop playing music.\nPlease try again later.',

    // Attachment errors
    ATTACHMENT_EXPIRED: 'Attachment link expired, skipping.',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: (seconds) => `You're sending commands too fast! Please wait ${seconds} seconds.`,

    // Generic errors
    COMMAND_EXECUTION_ERROR: 'There was an error executing that command!',
  },

  INFO: {
    // Song added messages
    SONG_ADDED: (title) => `${title} has been added to the queue!`,
    BULK_SONGS_ADDING: (count) => `We are now adding ${count} songs to the queue.\nPlease wait a moment...\nIt may take a while to add songs to the queue.`,

    // Playback control
    SONG_PAUSED: 'Paused the song!',
    SONG_RESUMED: 'Resumed the song!',
    SONG_SKIPPED: 'Skipped the song!',
    SONG_STOPPED: 'Stopped the song!',
    SONG_REMOVED: (number) => `I removed the song number: **${number}**`,
    SKIPPED_TO: (number) => `I skipped to the song number: **${number}**`,
    VOLUME_SET: (volume) => `I set the volume to: **${volume}**`,
    SEEKED_TO: (time) => `Seeked to: **${time}**`,

    // Loop control
    LOOP_ENABLED: 'Looping the current song!',
    LOOP_DISABLED: 'Disabled loop!',
    QUEUE_LOOP_ENABLED: 'Looping the queue!',
    QUEUE_LOOP_DISABLED: 'Disabled queue loop!',

    // Autoplay
    AUTOPLAY_ENABLED: 'Autoplay enabled!',
    AUTOPLAY_DISABLED: 'Autoplay disabled!',
    AUTOPLAY_SEARCHING: 'Auto play is enabled, so I will search next song for you!',

    // Queue management
    QUEUE_CLEARED: 'Cleared the queue!',
    QUEUE_SHUFFLED: 'Shuffled the queue!',
    QUEUE_EMPTY_STOP: 'Stop playing music because there is no song in the queue!',

    // Voice channel
    EVERYONE_LEFT: 'Everyone left the voice channel, so I left the voice channel as well!',

    // Bot restart
    REBOOT_MESSAGE: {
      title: "Sorry for the inconvenience...",
      description: "We are sorry that you had to restart the bot while using our service.\nWe are always working to fix bugs, add new features and improve stability.\nPlease be assured that we will be restarting soon, and that your queue and other data will be preserved after the restart."
    },
  },

  // Bot branding
  BOT_NAME: 'SakuraMusic V2',
  BOT_NAME_DISPLAY: 'SakuraMusic v2',
};
