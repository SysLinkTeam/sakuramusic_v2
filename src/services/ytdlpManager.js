const fs = require('fs');
const { https } = require('follow-redirects');
const { YTDLP, DEFAULT_USER_AGENT } = require('../config/constants');

/**
 * YT-DLP Manager - Handles downloading and updating yt-dlp binary
 */
class YTDLPManager {
    constructor() {
        this.filename = this.getPlatformFilename();
        this.userAgent = process.env.userAgent || DEFAULT_USER_AGENT;
    }

    /**
     * Get the appropriate yt-dlp filename for current platform
     * @returns {string} Filename for current platform
     */
    getPlatformFilename() {
        switch (process.platform) {
            case "win32":
                return process.arch === "x64"
                    ? YTDLP.PLATFORMS.win32.x64
                    : YTDLP.PLATFORMS.win32.default;
            case "linux":
                return YTDLP.PLATFORMS.linux;
            case "darwin":
                return YTDLP.PLATFORMS.darwin;
            default:
                throw new Error("Unsupported platform. Please use Windows, Linux or macOS.");
        }
    }

    /**
     * Fetch latest release information from GitHub
     * @returns {Promise<Object>} Release information
     */
    async fetchLatestRelease() {
        return new Promise((resolve, reject) => {
            https.get(YTDLP.API_URL, {
                headers: { "User-Agent": this.userAgent }
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Download yt-dlp binary
     * @param {string} downloadUrl - URL to download from
     * @param {string} version - Version tag
     * @returns {Promise<void>}
     */
    async downloadBinary(downloadUrl, version) {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/octet-stream'
                }
            };

            https.get(downloadUrl, options, (res) => {
                const writeStream = fs.createWriteStream('./' + this.filename);

                res.pipe(writeStream).on('finish', () => {
                    console.log("yt-dlp downloaded!");
                    fs.chmodSync('./' + this.filename, 0o755);
                    fs.writeFileSync(YTDLP.VERSION_FILE, version);
                    console.log("yt-dlp version: " + version);
                    resolve();
                }).on('error', reject);
            }).on('error', reject);
        });
    }

    /**
     * Get current installed version
     * @returns {string|null} Version string or null if not installed
     */
    getCurrentVersion() {
        if (!fs.existsSync(YTDLP.VERSION_FILE)) {
            return null;
        }
        return fs.readFileSync(YTDLP.VERSION_FILE, 'utf8');
    }

    /**
     * Check if binary exists
     * @returns {boolean}
     */
    binaryExists() {
        return fs.existsSync('./' + this.filename);
    }

    /**
     * Initialize yt-dlp (download if missing, update if available)
     */
    async initialize() {
        try {
            if (!this.binaryExists()) {
                await this.downloadLatest();
            } else {
                await this.checkForUpdates();
            }
        } catch (error) {
            console.error('Error initializing yt-dlp:', error);
        }
    }

    /**
     * Download latest version
     */
    async downloadLatest() {
        console.log("getting latest yt-dlp...");

        const release = await this.fetchLatestRelease();
        const asset = release.assets.find(asset => asset.name === this.filename);

        if (!asset) {
            throw new Error(`No asset found for ${this.filename}`);
        }

        console.log("downloading yt-dlp...");
        await this.downloadBinary(asset.url, release.tag_name);
    }

    /**
     * Check for updates and install if available
     */
    async checkForUpdates() {
        const currentVersion = this.getCurrentVersion();
        console.log("yt-dlp version: " + currentVersion);
        console.log("yt-dlp is already downloaded!");
        console.log("checking for updates...");

        try {
            const release = await this.fetchLatestRelease();

            if (release.tag_name !== currentVersion) {
                console.log("updating yt-dlp...");
                const asset = release.assets.find(asset => asset.name === this.filename);

                if (asset) {
                    await this.downloadBinary(asset.url, release.tag_name);
                    console.log("yt-dlp updated!");
                }
            } else {
                console.log("yt-dlp is up to date!");
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }
}

module.exports = YTDLPManager;
