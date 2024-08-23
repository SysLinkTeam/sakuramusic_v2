const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: '192.168.100.22',
    user: 'sakuramusic_v2',
    password: 'plusmusic',
    database: 'SakuraMusic_v2',
    connectionLimit: 50
});

async function query(sql, params) {
    let conn;
    try {
        conn = await pool.getConnection();
        const res = await conn.query(sql, params);
        return res;
    } catch (error) {
        console.error('SQL Error:', error);
        throw error;
    } finally {
        if (conn) conn.end();
    }
}

// ログを記録しないためのクエリ関数
async function queryWithoutLogging(sql, params) {
    let conn;
    try {
        conn = await pool.getConnection();
        const res = await conn.query(sql, params);
        return res;
    } catch (error) {
        console.error('SQL Error:', error);
        throw error;
    } finally {
        if (conn) conn.end();
    }
}

module.exports = { query, queryWithoutLogging };
