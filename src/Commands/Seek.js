const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { parseTime, toHms } = require('../utils');

class Seek extends BaseCommand {
    constructor() {
        super({
            name: 'seek',
            description: 'Seek to the given time in the current song',
            name_localizations: {
                ja: 'シーク',
                ko: '탐색',
            },
            description_localizations: {
                ja: '現在の曲の指定した時間に移動',
                ko: '현재 곡의 지정된 시간으로 이동',
            },
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'position',
                    description: 'Time (seconds or mm:ss)',
                    name_localizations: {
                        ja: '時間',
                        ko: '시간',
                    },
                    description_localizations: {
                        ja: '時間 (秒または mm:ss)',
                        ko: '시간 (초 또는 mm:ss)',
                    },
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        });
    }

    async execute(interaction, { queue }) {
        const serverQueue = queue.get(interaction.guild.id);
        if (!serverQueue) return interaction.followUp('There is no song that I could seek!');
        const position = interaction.options.getString('position');
        const seconds = parseTime(position);
        if (seconds === null) return interaction.followUp('Please enter a valid time!');
        if (seconds < 0 || seconds > serverQueue.songs[0].totalsec) return interaction.followUp('Please enter a time within the length of the song!');
        await serverQueue.seek(seconds);
        interaction.followUp(`Seeked to **${toHms(seconds)}**!`);
    }
}
module.exports = Seek;
