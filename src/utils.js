function toHms(t) {
    let hms = "";
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    if (h !== 0) {
        hms = h + ":" + padZero(m) + ":" + padZero(s);
    } else if (m !== 0) {
        hms = m + ":" + padZero(s);
    } else {
        hms = "0:" + padZero(s);
    }
    return hms;
    function padZero(v) {
        return v < 10 ? "0" + v : v;
    }
}

function parseTime(t) {
    const parts = t.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        return parts[0];
    }
    return null;
}

/**
 * Format large numbers to human-readable format
 * @param {number|string} num - Number to format
 * @returns {string} Formatted number (e.g., "1.2M", "3.5K", "123")
 */
function formatNumber(num) {
    const n = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(n)) return 'N/A';

    if (n >= 1000000000) {
        return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (n >= 1000000) {
        return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (n >= 1000) {
        return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return n.toString();
}

module.exports = { toHms, parseTime, formatNumber };
