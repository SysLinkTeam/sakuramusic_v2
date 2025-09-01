const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

class Ping extends BaseCommand {
    constructor() {
        super({
            name: 'ping',
            description: 'Show the ping',
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { client }) {
        const embed = new EmbedBuilder()
            .setTitle('Pong!')
            .setDescription(`Latency: **${Date.now() - interaction.createdTimestamp}ms**\nAPI Latency: **${Math.round(client.ws.ping)}ms**`)
            .setFooter({
                text: 'SakuraMusic v2',
                iconURL: client.user.displayAvatarURL(),
            })
            .setColor('#ff0000');
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = Ping;
