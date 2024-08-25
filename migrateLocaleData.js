const { queryWithoutLogging } = require('./database'); // database.jsのインポート
const localeData = require('./locales.js'); // locale.jsのパスに応じて調整

async function migrateLocaleData() {
    try {
        for (const [localeCode, messages] of Object.entries(localeData)) {
            for (const [key, value] of Object.entries(messages)) {
                const query = 'INSERT INTO locales (locale_code, key_name, value) VALUES (?, ?, ?)';
                await queryWithoutLogging(query, [localeCode, key, value]);
            }
        }

        console.log('Locale data migrated successfully.');
    } catch (error) {
        console.error('Error migrating locale data:', error);
    }
}

migrateLocaleData();
