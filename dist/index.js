"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const discord_js_1 = require("discord.js");
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
const path_1 = require("path");
(0, dotenv_1.config)();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildModeration
    ]
});
exports.commands = new discord_js_1.Collection();
const loadCommands = () => {
    const commandFolders = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, 'commands'));
    for (const folder of commandFolders) {
        const commandFiles = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, 'commands', folder)).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require((0, path_1.join)(__dirname, 'commands', folder, file)).default;
            if (command && command.data && command.execute) {
                exports.commands.set(command.data.name, command);
            }
        }
    }
};
const loadEvents = () => {
    const eventFiles = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, 'events')).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require((0, path_1.join)(__dirname, 'events', file)).default;
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        }
        else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
};
const registerCommands = async () => {
    const commandsData = Array.from(exports.commands.values()).map(cmd => cmd.data.toJSON());
    const rest = new discord_js_1.REST().setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commandsData });
    }
    catch (error) {
        throw error;
    }
};
loadCommands();
loadEvents();
client.login(process.env.DISCORD_TOKEN).then(() => {
    registerCommands();
});
exports.default = client;
