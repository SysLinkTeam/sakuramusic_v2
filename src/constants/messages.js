/**
 * Common error and info messages used across the application
 */
module.exports = {
  ERRORS: {
    YOUTUBE_FETCH_FAILED: `Oops, there seems to have been an error.
Please check the following points.
* Is the URL correct?
* If it's a playlist, check if it's a public playlist.
* If it's a video, check that the video is public.
If the above checks are correct, please try again later.

YouTube API may be experiencing high load due to time of day or other factors.
\`\`\``,
    NOT_IN_VOICE_CHANNEL: 'You have to be in a voice channel to use this command!',
    BOT_NO_PERMISSION: 'I need the permissions to join and speak in your voice channel!',
    NO_SONG_IN_QUEUE: 'There is no song in the queue!',
    COMMAND_EXECUTION_ERROR: 'There was an error executing that command!',
  },

  INFO: {
    SONG_ADDED: (title) => `${title} has been added to the queue!`,
    BULK_SONGS_ADDING: (count) => `We are now adding ${count} songs to the queue.\nPlease wait a moment...\nIt may take a while to add songs to the queue.`,
  }
};
