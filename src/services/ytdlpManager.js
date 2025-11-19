const fs = require('fs');
const path = require('path');
const { https } = require('follow-redirects');
const { YTDLP, DEFAULT_USER_AGENT } = require('../config/constants');

/**
 * YT-DLP Manager - Handles downloading and updating yt-dlp binary
 */
class YTDLPManager {
    constructor() {
        this.filename = this.validateAndGetFilename(this.getPlatformFilename());
        this.userAgent = process.env.userAgent || DEFAULT_USER_AGENT;
    }

    /**
     * Validate filename to prevent path traversal attacks
     * @param {string} filename - Filename to validate
     * @returns {string} Validated filename
     * @throws {Error} If filename is invalid or contains path traversal
     */
    validateAndGetFilename(filename) {
        if (!filename || typeof filename !== 'string') {
            throw new Error('Invalid filename provided');
        }

        // Use path.basename to strip any directory components
        const sanitized = path.basename(filename);

        // Additional validation: ensure no path traversal sequences
        if (sanitized !== filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            throw new Error('Invalid filename: path traversal detected');
        }

        // Ensure filename matches expected pattern
        if (!/^yt-dlp(_[a-z0-9]+)?(\.(exe|app))?$/i.test(sanitized)) {
            throw new Error('Invalid filename format');
        }

        return sanitized;
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

            // Use path.join for safe file path construction
            const filePath = path.join(process.cwd(), this.filename);
            const versionFilePath = path.resolve(YTDLP.VERSION_FILE);

            https.get(downloadUrl, options, (res) => {
                const writeStream = fs.createWriteStream(filePath);

                res.pipe(writeStream).on('finish', () => {
                    console.log("yt-dlp downloaded!");
                    fs.chmodSync(filePath, 0o755);
                    fs.writeFileSync(versionFilePath, version);
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
        const filePath = path.join(process.cwd(), this.filename);
        return fs.existsSync(filePath);
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

        // Validate release data
        if (!release || !release.assets || !Array.isArray(release.assets)) {
            throw new Error('Invalid release data received from GitHub API');
        }

        const asset = release.assets.find(asset => asset.name === this.filename);

        if (!asset) {
            throw new Error(`No asset found for ${this.filename}`);
        }

        // Validate asset URL
        if (!asset.url || typeof asset.url !== 'string' || !asset.url.startsWith('https://')) {
            throw new Error('Invalid asset URL received from GitHub API');
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

            // Validate release data
            if (!release || !release.assets || !Array.isArray(release.assets) || !release.tag_name) {
                throw new Error('Invalid release data received from GitHub API');
            }

            if (release.tag_name !== currentVersion) {
                console.log("updating yt-dlp...");
                const asset = release.assets.find(asset => asset.name === this.filename);

                if (asset) {
                    // Validate asset URL
                    if (!asset.url || typeof asset.url !== 'string' || !asset.url.startsWith('https://')) {
                        throw new Error('Invalid asset URL received from GitHub API');
                    }
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
