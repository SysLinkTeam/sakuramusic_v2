const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { t } = require('../locale');

class Help extends BaseCommand {
    constructor() {
        super({
            name: 'help',
            description: 'Show the help',
            name_localizations: {
                ja: 'ヘルプ',
                ko: '도움말',
            },
            description_localizations: {
                ja: 'ヘルプを表示',
                ko: '도움말을 표시',
            },
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { client }) {
        const locale = interaction.locale || interaction.guildLocale || 'en';
        const embed = new EmbedBuilder()
            .setTitle(t(locale, 'HELP_TITLE'))
            .setDescription(t(locale, 'HELP_DESCRIPTION'))
            .setFooter({
                text: 'SakuraMusic v2',
                iconURL: client.user.displayAvatarURL(),
            })
            .setColor('#ff0000');
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = Help;
