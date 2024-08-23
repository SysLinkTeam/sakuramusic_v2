const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../database'); // データベース接続を含むモジュール
const { getActionTypes } = require('../logManager'); // ユーティリティ関数

const ALLOWED_USER_ID = '796972193287503913';

const actionTypes = [
    { name: 'Command Execution', value: 'command_execution' },
    { name: 'Command Error', value: 'command_error' },
    { name: 'Track Start', value: 'track_start' },
    { name: 'Track End', value: 'track_end' },
    { name: 'Queue Create', value: 'queue_create' },
    { name: 'Queue End', value: 'queue_end' },
    { name: 'Player Error', value: 'player_error' },
    { name: 'Bot Startup', value: 'bot_startup' },
    { name: 'Command Refresh Start', value: 'command_refresh_start' },
    { name: 'Command Refresh End', value: 'command_refresh_end' },
    { name: 'Webhook Send Success', value: 'webhook_send_success' },
    { name: 'Webhook Send Error', value: 'webhook_send_error' },
    { name: 'Error', value: 'error' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logsearch')
        .setDescription('ログを検索します。')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('特定のユーザーIDで検索します')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('guild')
                .setDescription('特定のサーバーIDで検索します')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('action_type')
                .setDescription('特定のアクションタイプで検索します')
                .setRequired(false)
                .addChoices(actionTypes))
        .addStringOption(option =>
            option.setName('command_name')
                .setDescription('特定のコマンド名で検索します')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('start_date')
                .setDescription('検索の開始日時 (YYYY-MM-DD)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('end_date')
                .setDescription('検索の終了日時 (YYYY-MM-DD)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('adjacent_logs')
                .setDescription('検索結果の前後に取得するログの数 (n個)')
                .setRequired(false)),

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_USER_ID) {
            return interaction.reply({
                content: 'このコマンドを実行する権限がありません。',
                ephemeral: true
            });
        }

        const userId = interaction.options.getString('user');
        const guildId = interaction.options.getString('guild');
        const actionType = interaction.options.getString('action_type');
        const commandName = interaction.options.getString('command_name');
        const startDate = interaction.options.getString('start_date');
        const endDate = interaction.options.getString('end_date');
        const adjacentLogs = interaction.options.getInteger('adjacent_logs') || 0;

        // SQLクエリを動的に構築
        let query = 'SELECT * FROM bot_logs WHERE 1=1';
        const queryParams = [];

        if (userId) {
            query += ' AND user_id = ?';
            queryParams.push(userId);
        }

        if (guildId) {
            query += ' AND guild_id = ?';
            queryParams.push(guildId);
        }

        if (actionType) {
            query += ' AND action_type = ?';
            queryParams.push(actionType);
        }

        if (commandName) {
            query += ' AND command_name = ?';
            queryParams.push(commandName);
        }

        if (startDate) {
            query += ' AND timestamp >= ?';
            queryParams.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            query += ' AND timestamp <= ?';
            queryParams.push(`${endDate} 23:59:59`);
        }

        // クエリを実行して該当するログを取得
        let results;
        try {
            results = await db.query(query, queryParams);
        } catch (error) {
            console.error('Error executing log search:', error);
            return interaction.reply({
                content: 'ログの検索中にエラーが発生しました。',
                ephemeral: true
            });
        }

        if (results.length === 0) {
            return interaction.reply({
                content: '指定された条件に一致するログが見つかりませんでした。',
                ephemeral: true
            });
        }

        // 前後n個のログを取得
        if (adjacentLogs > 0) {
            const firstResultId = results[0].id;
            const lastResultId = results[results.length - 1].id;

            const adjacentQuery = `
        (SELECT * FROM bot_logs WHERE id < ? ORDER BY id DESC LIMIT ?)
        UNION
        (SELECT * FROM bot_logs WHERE id >= ? ORDER BY id ASC LIMIT ?)
      `;
            const adjacentParams = [firstResultId, adjacentLogs, lastResultId, adjacentLogs];

            let adjacentResults;
            try {
                adjacentResults = await db.query(adjacentQuery, adjacentParams);
            } catch (error) {
                console.error('Error executing adjacent log search:', error);
                return interaction.reply({
                    content: '前後のログ取得中にエラーが発生しました。',
                    ephemeral: true
                });
            }

            results = [...adjacentResults.reverse(), ...results, ...adjacentResults];
        }

        // ページネーションのセットアップ
        let page = 0;
        const itemsPerPage = 10;
        const totalPages = Math.ceil(results.length / itemsPerPage);

        const getPageEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle('ログ検索結果')
                .setDescription(`検索条件に一致するログが ${results.length} 件見つかりました。`)
                .setFooter({ text: `ページ ${page + 1} / ${totalPages}` });

            const startIndex = page * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = results.slice(startIndex, endIndex);

            pageItems.forEach((log, index) => {
                embed.addFields({
                    name: `ログ #${startIndex + index + 1}`, value: `
          **Guild ID**: ${log.guild_id}
          **User ID**: ${log.user_id}
          **Command**: ${log.command_name || 'N/A'}
          **Action Type**: ${log.action_type}
          **Details**: ${log.action_details}
          **Timestamp**: ${log.timestamp}
        `});
            });

            return embed;
        };

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('prev')
                    .setLabel('前のページ')
                    .setStyle('PRIMARY')
                    .setDisabled(page === 0),
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('次のページ')
                    .setStyle('PRIMARY')
                    .setDisabled(page === totalPages - 1)
            );

        await interaction.reply({ embeds: [getPageEmbed(page)], components: [row], ephemeral: true });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.customId === 'prev' && page > 0) {
                page--;
            } else if (i.customId === 'next' && page < totalPages - 1) {
                page++;
            }

            await i.update({
                embeds: [getPageEmbed(page)], components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('prev')
                                .setLabel('前のページ')
                                .setStyle('PRIMARY')
                                .setDisabled(page === 0),
                            new MessageButton()
                                .setCustomId('next')
                                .setLabel('次のページ')
                                .setStyle('PRIMARY')
                                .setDisabled(page === totalPages - 1)
                        )
                ]
            });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] });
        });
    }
};
