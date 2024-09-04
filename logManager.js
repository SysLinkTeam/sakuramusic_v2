const db = require('./database');

function censor(censor) {
    var i = 0;

    return function (key, value) {
        if (typeof value === 'bigint') return value.toString();      

        if (i !== 0 && typeof (censor) === 'object' && typeof (value) == 'object' && censor == value)
            return '[Circular]';

        if (i >= 29) 
            return '[Unknown]';

        ++i;        
        return value;
    }
}

// action_typeがデータベースに存在するか確認し、存在しない場合は追加する
async function ensureActionTypeExists(actionType) {
    const querySelect = 'SELECT id FROM action_types WHERE value = ?';
    const queryInsert = 'INSERT INTO action_types (name, value) VALUES (?, ?)';

    try {
        const results = await db.query(querySelect, [actionType]);

        if (results.length === 0) {
            // actionTypeが存在しない場合、新しく追加
            await db.query(queryInsert, [actionType, actionType]);
            console.log(`Added new action type: ${actionType}`);
        }
    } catch (error) {
        console.error('Failed to ensure action type exists:', error);
        throw error;
    }
}

async function logAction(guildId, userId, commandName, actionType, details) {
    // actionTypeが存在することを保証
    await ensureActionTypeExists(actionType);

    const query = `
    INSERT INTO bot_logs (guild_id, user_id, command_name, action_type, action_details, timestamp)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
    const params = [guildId, userId, commandName, actionType, JSON.stringify(details, censor(details))];

    try {
        await db.queryWithoutLogging(query, params);
    } catch (error) {
        console.error('Failed to log action:', error);
    }
}

async function getActionTypes() {
    const query = 'SELECT name, value FROM action_types';
    try {
        const actionTypes = await db.query(query);
        return actionTypes.reduce((acc, curr) => {
            acc[curr.value] = curr.name;
            return acc;
        }, {});
    } catch (error) {
        console.error('Failed to fetch action types:', error);
        return {};
    }
}
module.exports = { 
    logAction, 
    getActionTypes
};
