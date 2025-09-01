const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');

class Volume extends BaseCommand {
    constructor() {
        super({
            name: 'volume',
            description: 'Change the volume',
            name_localizations: {
                ja: 'ボリューム',
                ko: '볼륨',
            },
            description_localizations: {
                ja: '音量を変更',
                ko: '볼륨을 변경',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'volume',
                    description: 'Volume',
                    name_localizations: {
                        ja: '音量',
                        ko: '볼륨',
                    },
                    description_localizations: {
                        ja: '音量',
                        ko: '볼륨',
                    },
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could change volume!');
        if (!interaction.options.getString('volume')) return interaction.followUp(`The current volume is: **${Math.round(serverQueue.resource.volume.volume * 10)}**`);
        const volume = parseInt(interaction.options.getString('volume'));
        if (volume > 10 || volume < 1) return interaction.followUp('Please enter a number between 1 and 10!');
        serverQueue.setVolume(volume / 10);
        interaction.followUp(`I set the volume to: **${volume}**`);
    }
}
module.exports = Volume;
