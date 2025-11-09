import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';
import db from './database';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

export const commands = new Collection<string, any>();

const loadCommands = () => {
  const commandFolders = readdirSync(join(__dirname, 'commands'));
  
  for (const folder of commandFolders) {
    const commandFiles = readdirSync(join(__dirname, 'commands', folder)).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const command = require(join(__dirname, 'commands', folder, file)).default;
      if (command && command.data && command.execute) {
        commands.set(command.data.name, command);
      }
    }
  }
};

const loadEvents = () => {
  const eventFiles = readdirSync(join(__dirname, 'events')).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const event = require(join(__dirname, 'events', file)).default;
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
};

const registerCommands = async () => {
  const commandsData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
  
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commandsData }
    );
  } catch (error) {
    throw error;
  }
};

loadCommands();
loadEvents();

client.login(process.env.DISCORD_TOKEN).then(() => {
  registerCommands();
});

export default client;
