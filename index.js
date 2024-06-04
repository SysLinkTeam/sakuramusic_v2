const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { Player } = require('discord-player');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');
const URL = 'https://discord.com/api/webhooks/1247351274966618185/iXlixodGppgXlA95EqyUdwRtiKUnMvkP8r82oCGkWQ6bThHp2rV6zzNEmst8LZ6jVesk';
const { WebhookClient } = require('discord.js');
const webhookClient = new WebhookClient({ url: URL });

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

let text = '';
process.stdout.write = (write => function (string, encoding, fd) {
  text += string;
  write.apply(process.stdout, arguments);
})(process.stdout.write);

process.stderr.write = (write => function (string, encoding, fd) {
  text += string;
  write.apply(process.stderr, arguments);
})(process.stderr.write);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }

  await client.player.extractors.loadDefault();

  setInterval(() => {
    if (text !== '') {
      const chunks = text.match(/[\s\S]{1,2000}/g);
      let i = 0;
      for (const chunk of chunks) {
        i++
        webhookClient.sendSlackMessage({
          text: chunk,
          username: `[console]${client.user.tag}(${i}/${chunks.length})`,
          icon_url: client.user.displayAvatarURL()
        })
      }
      text = '';
    }
  }, 10000);




});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const command = client.commands.get(interaction.commandName);
  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    const buttonCommand = require(`./interactions/${interaction.customId}.js`);
    if (buttonCommand) {
      try {
        await buttonCommand.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this button interaction!', ephemeral: true });
      }
    }
  }

  if (interaction.isStringSelectMenu()) {
    const selectMenuCommand = require(`./interactions/${interaction.customId}.js`);
    if (selectMenuCommand) {
      try {
        await selectMenuCommand.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this select menu interaction!', ephemeral: true });
      }
    }
  }
});

client.player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25
  }
});

client.login(token);
