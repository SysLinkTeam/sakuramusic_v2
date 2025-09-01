const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

class Invite extends BaseCommand {
    constructor() {
        super({
            name: 'invite',
            description: 'Invite SakuraMusicV2 to your server',
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { client }) {
        const embed = new EmbedBuilder()
            .setTitle('Invite')
            .setDescription(`[Click here to invite SakuraMusic v2](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`)
            .setFooter({
                text: 'SakuraMusic v2',
                iconURL: client.user.displayAvatarURL(),
            })
            .setColor('#ff0000');
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = Invite;
