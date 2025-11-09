"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../../config"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage ticket system')
        .addSubcommand(subcommand => subcommand
        .setName('setup')
        .setDescription('Setup the ticket system with a panel'))
        .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to add')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to remove')
        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'setup') {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.primary)
                .setTitle(`${config_1.default.emojis.ticket} Support Tickets`)
                .setDescription('Need help? Click the button below to create a support ticket.')
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Create Ticket')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji(config_1.default.emojis.ticket));
            if (interaction.channel && 'send' in interaction.channel) {
                await interaction.channel.send({ embeds: [embed], components: [row] });
            }
            await interaction.reply({ content: 'Ticket panel has been set up!', ephemeral: true });
        }
        if (subcommand === 'add') {
            const user = interaction.options.getUser('user', true);
            const channel = interaction.channel;
            if (channel?.type !== discord_js_1.ChannelType.GuildText) {
                return interaction.reply({ content: 'This command can only be used in text channels!', ephemeral: true });
            }
            const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
            if (!member) {
                return interaction.reply({ content: 'User not found!', ephemeral: true });
            }
            await channel.permissionOverwrites.create(member, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setDescription(`${config_1.default.emojis.success} ${member} has been added to this ticket.`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'remove') {
            const user = interaction.options.getUser('user', true);
            const channel = interaction.channel;
            if (channel?.type !== discord_js_1.ChannelType.GuildText) {
                return interaction.reply({ content: 'This command can only be used in text channels!', ephemeral: true });
            }
            const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
            if (!member) {
                return interaction.reply({ content: 'User not found!', ephemeral: true });
            }
            await channel.permissionOverwrites.delete(member);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.error)
                .setDescription(`${config_1.default.emojis.error} ${member} has been removed from this ticket.`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
    }
};
