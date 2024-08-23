const db = require('./database');

async function getEqualizerPresets() {

    const equalizerPresets = {
        'Default': [
            { band: 0, gain: 0 },
            { band: 1, gain: 0 },
            { band: 2, gain: 0 },
            { band: 3, gain: 0 },
            { band: 4, gain: 0 },
            { band: 5, gain: 0 },
            { band: 6, gain: 0 },
            { band: 7, gain: 0 },
            { band: 8, gain: 0 },
            { band: 9, gain: 0 },
            { band: 10, gain: 0 },
            { band: 11, gain: 0 },
            { band: 12, gain: 0 },
            { band: 13, gain: 0 },
            { band: 14, gain: 0 }
        ],
        '01 Acoustic': [
            { band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.25 },
            { band: 3, gain: 0.2 }, { band: 4, gain: 0.15 }, { band: 5, gain: 0.1 },
            { band: 6, gain: 0.05 }, { band: 7, gain: 0 }, { band: 8, gain: -0.05 },
            { band: 9, gain: -0.1 }, { band: 10, gain: -0.15 }, { band: 11, gain: -0.2 },
            { band: 12, gain: -0.25 }, { band: 13, gain: -0.3 }, { band: 14, gain: -0.35 }
        ],
        '02 Bass Booster': [
            { band: 0, gain: 0.5 }, { band: 1, gain: 0.5 }, { band: 2, gain: 0.5 },
            { band: 3, gain: 0.4 }, { band: 4, gain: 0.3 }, { band: 5, gain: 0.2 },
            { band: 6, gain: 0.1 }, { band: 7, gain: 0 }, { band: 8, gain: -0.1 },
            { band: 9, gain: -0.2 }, { band: 10, gain: -0.3 }, { band: 11, gain: -0.4 },
            { band: 12, gain: -0.5 }, { band: 13, gain: -0.6 }, { band: 14, gain: -0.7 }
        ],
        '03 Bass Reducer': [
            { band: 0, gain: -0.5 }, { band: 1, gain: -0.5 }, { band: 2, gain: -0.5 },
            { band: 3, gain: -0.4 }, { band: 4, gain: -0.3 }, { band: 5, gain: -0.2 },
            { band: 6, gain: -0.1 }, { band: 7, gain: 0 }, { band: 8, gain: 0.1 },
            { band: 9, gain: 0.2 }, { band: 10, gain: 0.3 }, { band: 11, gain: 0.4 },
            { band: 12, gain: 0.5 }, { band: 13, gain: 0.6 }, { band: 14, gain: 0.7 }
        ],
        '04 Classical': [
            { band: 0, gain: 0.3 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.1 },
            { band: 3, gain: 0 }, { band: 4, gain: -0.1 }, { band: 5, gain: -0.2 },
            { band: 6, gain: -0.3 }, { band: 7, gain: -0.4 }, { band: 8, gain: -0.5 },
            { band: 9, gain: -0.4 }, { band: 10, gain: -0.3 }, { band: 11, gain: -0.2 },
            { band: 12, gain: -0.1 }, { band: 13, gain: 0 }, { band: 14, gain: 0.1 }
        ],
        '05 Dance': [
            { band: 0, gain: 0.2 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.2 },
            { band: 3, gain: 0.1 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.1 },
            { band: 6, gain: 0 }, { band: 7, gain: 0 }, { band: 8, gain: -0.1 },
            { band: 9, gain: -0.1 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.2 },
            { band: 12, gain: -0.2 }, { band: 13, gain: -0.2 }, { band: 14, gain: -0.3 }
        ],
        '06 Deep': [
            { band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.25 },
            { band: 3, gain: 0.15 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.05 },
            { band: 6, gain: 0 }, { band: 7, gain: -0.05 }, { band: 8, gain: -0.1 },
            { band: 9, gain: -0.15 }, { band: 10, gain: -0.2 }, { band: 11, gain: -0.25 },
            { band: 12, gain: -0.3 }, { band: 13, gain: -0.35 }, { band: 14, gain: -0.4 }
        ],
        '07 Electronic': [
            { band: 0, gain: 0.35 }, { band: 1, gain: 0.35 }, { band: 2, gain: 0.35 },
            { band: 3, gain: 0.25 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.15 },
            { band: 6, gain: 0.1 }, { band: 7, gain: 0.05 }, { band: 8, gain: 0 },
            { band: 9, gain: -0.05 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.15 },
            { band: 12, gain: -0.2 }, { band: 13, gain: -0.25 }, { band: 14, gain: -0.3 }
        ],
        '08 Fine': [
            { band: 0, gain: 0.15 }, { band: 1, gain: 0.15 }, { band: 2, gain: 0.15 },
            { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
            { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
            { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
            { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
        ],
        '09 Flat': [
            { band: 0, gain: 0 }, { band: 1, gain: 0 }, { band: 2, gain: 0 },
            { band: 3, gain: 0 }, { band: 4, gain: 0 }, { band: 5, gain: 0 },
            { band: 6, gain: 0 }, { band: 7, gain: 0 }, { band: 8, gain: 0 },
            { band: 9, gain: 0 }, { band: 10, gain: 0 }, { band: 11, gain: 0 },
            { band: 12, gain: 0 }, { band: 13, gain: 0 }, { band: 14, gain: 0 }
        ],
        '10 HipHop': [
            { band: 0, gain: 0.3 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.3 },
            { band: 3, gain: 0.2 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0 },
            { band: 6, gain: -0.1 }, { band: 7, gain: -0.2 }, { band: 8, gain: -0.3 },
            { band: 9, gain: -0.4 }, { band: 10, gain: -0.5 }, { band: 11, gain: -0.6 },
            { band: 12, gain: -0.7 }, { band: 13, gain: -0.8 }, { band: 14, gain: -0.9 }
        ],
        '11 Jazz': [
            { band: 0, gain: 0.25 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.15 },
            { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
            { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
            { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
            { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
        ],
        '12 Loudness': [
            { band: 0, gain: 0.4 }, { band: 1, gain: 0.4 }, { band: 2, gain: 0.4 },
            { band: 3, gain: 0.3 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.1 },
            { band: 6, gain: 0 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.2 },
            { band: 9, gain: -0.3 }, { band: 10, gain: -0.4 }, { band: 11, gain: -0.5 },
            { band: 12, gain: -0.6 }, { band: 13, gain: -0.7 }, { band: 14, gain: -0.8 }
        ],
        '13 Lounge': [
            { band: 0, gain: 0.2 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.2 },
            { band: 3, gain: 0.15 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.05 },
            { band: 6, gain: 0 }, { band: 7, gain: -0.05 }, { band: 8, gain: -0.1 },
            { band: 9, gain: -0.15 }, { band: 10, gain: -0.2 }, { band: 11, gain: -0.25 },
            { band: 12, gain: -0.3 }, { band: 13, gain: -0.35 }, { band: 14, gain: -0.4 }
        ],
        '14 Piano': [
            { band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.25 },
            { band: 3, gain: 0.2 }, { band: 4, gain: 0.15 }, { band: 5, gain: 0.1 },
            { band: 6, gain: 0.05 }, { band: 7, gain: 0 }, { band: 8, gain: -0.05 },
            { band: 9, gain: -0.1 }, { band: 10, gain: -0.15 }, { band: 11, gain: -0.2 },
            { band: 12, gain: -0.25 }, { band: 13, gain: -0.3 }, { band: 14, gain: -0.35 }
        ],
        '15 Pop': [
            { band: 0, gain: 0.3 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.3 },
            { band: 3, gain: 0.25 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.15 },
            { band: 6, gain: 0.1 }, { band: 7, gain: 0.05 }, { band: 8, gain: 0 },
            { band: 9, gain: -0.05 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.15 },
            { band: 12, gain: -0.2 }, { band: 13, gain: -0.25 }, { band: 14, gain: -0.3 }
        ],
        '16 R&B': [
            { band: 0, gain: 0.35 }, { band: 1, gain: 0.35 }, { band: 2, gain: 0.35 },
            { band: 3, gain: 0.3 }, { band: 4, gain: 0.25 }, { band: 5, gain: 0.2 },
            { band: 6, gain: 0.15 }, { band: 7, gain: 0.1 }, { band: 8, gain: 0.05 },
            { band: 9, gain: 0 }, { band: 10, gain: -0.05 }, { band: 11, gain: -0.1 },
            { band: 12, gain: -0.15 }, { band: 13, gain: -0.2 }, { band: 14, gain: -0.25 }
        ],
        '17 Reggae': [
            { band: 0, gain: 0.25 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.15 },
            { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
            { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
            { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
            { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
        ],
        '18 Rock': [
            { band: 0, gain: 0.3 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.3 },
            { band: 3, gain: 0.25 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.15 },
            { band: 6, gain: 0.1 }, { band: 7, gain: 0.05 }, { band: 8, gain: 0 },
            { band: 9, gain: -0.05 }, { band: 10, gain: -0.1 }, { band: 11, gain: -0.15 },
            { band: 12, gain: -0.2 }, { band: 13, gain: -0.25 }, { band: 14, gain: -0.3 }
        ],
        '19 Small Speakers': [
            { band: 0, gain: 0.2 }, { band: 1, gain: 0.2 }, { band: 2, gain: 0.2 },
            { band: 3, gain: 0.1 }, { band: 4, gain: 0 }, { band: 5, gain: -0.1 },
            { band: 6, gain: -0.2 }, { band: 7, gain: -0.3 }, { band: 8, gain: -0.4 },
            { band: 9, gain: -0.5 }, { band: 10, gain: -0.6 }, { band: 11, gain: -0.7 },
            { band: 12, gain: -0.8 }, { band: 13, gain: -0.9 }, { band: 14, gain: -1.0 }
        ],
        '20 Spoken Word': [
            { band: 0, gain: 0.15 }, { band: 1, gain: 0.15 }, { band: 2, gain: 0.15 },
            { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, { band: 5, gain: 0 },
            { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.15 },
            { band: 9, gain: -0.2 }, { band: 10, gain: -0.25 }, { band: 11, gain: -0.3 },
            { band: 12, gain: -0.35 }, { band: 13, gain: -0.4 }, { band: 14, gain: -0.45 }
        ],
        '21 Treble Booster': [
            { band: 0, gain: 0.5 }, { band: 1, gain: 0.4 }, { band: 2, gain: 0.3 },
            { band: 3, gain: 0.2 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0 },
            { band: 6, gain: -0.1 }, { band: 7, gain: -0.2 }, { band: 8, gain: -0.3 },
            { band: 9, gain: -0.4 }, { band: 10, gain: -0.5 }, { band: 11, gain: -0.6 },
            { band: 12, gain: -0.7 }, { band: 13, gain: -0.8 }, { band: 14, gain: -0.9 }
        ],
        '22 Treble Reducer': [
            { band: 0, gain: -0.5 }, { band: 1, gain: -0.4 }, { band: 2, gain: -0.3 },
            { band: 3, gain: -0.2 }, { band: 4, gain: -0.1 }, { band: 5, gain: 0 },
            { band: 6, gain: 0.1 }, { band: 7, gain: 0.2 }, { band: 8, gain: 0.3 },
            { band: 9, gain: 0.4 }, { band: 10, gain: 0.5 }, { band: 11, gain: 0.6 },
            { band: 12, gain: 0.7 }, { band: 13, gain: 0.8 }, { band: 14, gain: 0.9 }
        ],
        '23 Vocal Booster': [
            { band: 0, gain: 0.35 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.25 },
            { band: 3, gain: 0.2 }, { band: 4, gain: 0.15 }, { band: 5, gain: 0.1 },
            { band: 6, gain: 0.05 }, { band: 7, gain: 0 }, { band: 8, gain: -0.05 },
            { band: 9, gain: -0.1 }, { band: 10, gain: -0.15 }, { band: 11, gain: -0.2 },
            { band: 12, gain: -0.25 }, { band: 13, gain: -0.3 }, { band: 14, gain: -0.35 }
        ],
        '24 Perfect': [
            { band: 0, gain: 0.4 }, { band: 1, gain: 0.4 }, { band: 2, gain: 0.4 },
            { band: 3, gain: 0.3 }, { band: 4, gain: 0.3 }, { band: 5, gain: 0.3 },
            { band: 6, gain: 0.2 }, { band: 7, gain: 0.2 }, { band: 8, gain: 0.2 },
            { band: 9, gain: 0.1 }, { band: 10, gain: 0.1 }, { band: 11, gain: 0.1 },
            { band: 12, gain: 0.05 }, { band: 13, gain: 0.05 }, { band: 14, gain: 0.05 }
        ]
    };

    return equalizerPresets;
    const query = `
    SELECT p.name, b.band, b.gain 
    FROM equalizer_presets p
    JOIN equalizer_bands b ON p.id = b.preset_id
  `;
    try {
        const presets = await db.query(query);
        return presets.reduce((acc, curr) => {
            if (!acc[curr.name]) acc[curr.name] = [];
            acc[curr.name].push({ band: curr.band, gain: curr.gain });
            return acc;
        }, {});
    } catch (error) {
        console.error('Failed to fetch equalizer presets:', error);
        return {};
    }
}

module.exports = { getEqualizerPresets };
