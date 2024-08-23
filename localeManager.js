const db = require('./database');

async function getLocaleData(localeCode) {
    const query = 'SELECT key_name, value FROM locales WHERE locale_code = ?';
    try {
        const results = await db.query(query, [localeCode]);
        if (results.length > 0) {
            return results.reduce((acc, curr) => {
                acc[curr.key_name] = curr.value;
                return acc;
            }, {});
        } else {
            console.error('Locale not found:', localeCode);
            return {};
        }
    } catch (error) {
        console.error('Failed to fetch locale data:', error);
        return {};
    }
}

module.exports = { getLocaleData };
