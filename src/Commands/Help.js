const BaseCommand = require('./BaseCommand');
const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

class Help extends BaseCommand {
    constructor() {
        super({
            name: 'help',
            description: 'Show the help',
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction, { client }) {
        const embed = new EmbedBuilder()
            .setTitle('Help')
            .setDescription('**play** - Plays a song\n**skip** - Skips a song\n**stop** - Stops the music\n**queue** - Shows the queue\n**nowplaying** - Shows the song that is playing\n**loop** - Loops the queue\n**queueloop** - Loops the queue\n**seek** - Seek to a time in the current song\n**volume** - Changes the volume\n**pause** - Pauses the song\n**resume** - Resumes the song\n**remove** - Removes a song from the queue\n**shuffle** - Shuffles the queue\n**skipto** - Skips to a song in the queue\n**help** - Shows this message\n**ping** - Shows the ping\n**invite** - Invite SakuraMusic v2 to your server\n**autoplay** - Autoplay the music if the queue is empty')
            .setFooter({
                text: 'SakuraMusic v2',
                iconURL: client.user.displayAvatarURL(),
            })
            .setColor('#ff0000');
        interaction.followUp({ embeds: [embed] });
    }
}
module.exports = Help;
