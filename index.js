const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { Player } = require('discord-player');
const fs = require('fs');
const path = require('path');
const { token, URL } = require('./config.json');
const { WebhookClient } = require('discord.js');
const { restorePlayback } = require('./restorePlayback');
const {updateCurrentTrack} = require('./queueManager');
const { logAction } = require('./logManager'); 
const { createUserHistoryEntry, createServerHistoryEntry } = require('./historyManager');
const webhookClient = new WebhookClient({ url: URL });

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  logAction('global', 'system', null, 'error', { message: 'Unhandled promise rejection', error: error.stack });
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
  logAction('global', 'system', null, 'error', { message: 'Uncaught exception', error: error.stack });
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

const ignoreCommandFiles = ['filter.js'];

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  if (ignoreCommandFiles.includes(file)) continue;
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  logAction('global', 'system', null, 'bot_startup', { message: `Bot started as ${client.user.tag}` });

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');
    logAction('global', 'system', null, 'command_refresh_start', { message: 'Started refreshing application (/) commands.' });

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
    logAction('global', 'system', null, 'command_refresh_end', { message: 'Successfully reloaded application (/) commands.' });
  } catch (error) {
    console.error(error);
    logAction('global', 'system', null, 'error', { message: 'Error during command reload', error: error.stack });
  }

  await client.player.extractors.loadDefault();

  for (const guild of client.guilds.cache.values()) {
    const interaction = { 
        guild, 
        client, 
        channel: guild.channels.cache.find(ch => ch.isTextBased()) 
    };
    //await restorePlayback(interaction);
  }

  setInterval(() => {
    if (text !== '') {
      const chunks = text.match(/[\s\S]{1,1900}/g);
      let i = 0;
      for (const chunk of chunks) {
        i++;
        webhookClient.sendSlackMessage({
          text: `\`\`\`${chunk}\`\`\``,
          username: `[console]${client.user.tag}(${i}/${chunks.length})`,
          icon_url: client.user.displayAvatarURL()
        }).then(response => {
          logAction('global', 'system', null, 'webhook_send_success', { chunk, statusCode: response.statusCode });
        }).catch(error => {
          logAction('global', 'system', null, 'webhook_send_error', { chunk, error: error.stack });
        });
      }
      text = '';
    }
  }, 10000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;
  await interaction.deferReply({ fetchReply: true });
  interaction.reply = interaction.editReply;

  const command = client.commands.get(interaction.commandName);
  if (command) {
    try {
      await command.execute(interaction);
      logAction(interaction.guild.id, interaction.user.id, interaction.commandName, 'command_execution', { interaction });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      logAction(interaction.guild.id, interaction.user.id, interaction.commandName, 'command_error', { error: error.stack });
    }
  }

  if (interaction.isButton()) {
    const buttonCommand = require(`./interactions/${interaction.customId}.js`);
    if (buttonCommand) {
      try {
        setTimeout(() => {
          interaction.deleteReply();
        }, 3000);
        await buttonCommand.execute(interaction);
        logAction(interaction.guild.id, interaction.user.id, interaction.customId, 'button_interaction', { interaction });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this button interaction!', ephemeral: true });
        logAction(interaction.guild.id, interaction.user.id, interaction.customId, 'button_error', { error: error.stack });
      }
    }
  }

  if (interaction.isStringSelectMenu()) {
    const selectMenuCommand = require(`./interactions/${interaction.customId}.js`);
    if (selectMenuCommand) {
      try {
        setTimeout(() => {
          interaction.deleteReply();
        }, 3000);
        await selectMenuCommand.execute(interaction);
        logAction(interaction.guild.id, interaction.user.id, interaction.customId, 'select_menu_interaction', { interaction });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this select menu interaction!', ephemeral: true });
        logAction(interaction.guild.id, interaction.user.id, interaction.customId, 'select_menu_error', { error: error.stack });
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

client.player.events.on('playerStart', async (queue, track) => {
  const userId = track.requestedBy.id;
  const serverId = queue.guild.id;

  createUserHistoryEntry(userId, track);
  createServerHistoryEntry(serverId, track);

  updateCurrentTrack(queue.guild.id, track, 0);

  logAction(serverId, userId, null, 'track_start', { track });
});

client.player.events.on('playerFinish', async (queue, track) => {
  const userId = track.requestedBy.id;
  const serverId = queue.guild.id;

  updateCurrentTrack(queue.guild.id, null, 0);

  logAction(serverId, userId, null, 'track_end', { track });
});

client.player.events.on('queueCreate', async (queue) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'queue_create', { queue });
});

client.player.events.on('queueDelete', async (queue) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'queue_end', { queue });
});

client.player.events.on('error', async (queue, error) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'player_error', { error: error.stack });
});

client.player.events.on('volumeChange', async (queue, track) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'volume_change', { volume: queue.volume });
});

client.player.events.on('playerSkip', async (queue, track) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'track_skip', { track });
});

client.player.events.on('playerPause', async (queue, track) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'track_pause', { track });
});

client.player.events.on('playerResume', async (queue, track) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'track_resume', { track });
});

client.player.events.on('playerError', async (queue, error) => {
  const serverId = queue.guild.id;

  logAction(serverId, 'system', null, 'player_error', { error: error.stack });
});

client.login(token);
