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

module.exports = { toHms, parseTime };
