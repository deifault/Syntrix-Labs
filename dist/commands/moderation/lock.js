"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../../config"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels)
        .addChannelOption(option => option
        .setName('channel')
        .setDescription('The channel to lock')
        .addChannelTypes(discord_js_1.ChannelType.GuildText)
        .setRequired(false))
        .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for locking')
        .setRequired(false)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
            return interaction.reply({ content: 'Invalid channel!', ephemeral: true });
        }
        try {
            if ('permissionOverwrites' in channel) {
                await channel.permissionOverwrites.edit(interaction.guild.id, {
                    SendMessages: false
                });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.error)
                .setTitle(`${config_1.default.emojis.lock} Channel Locked`)
                .setDescription(`${channel} has been locked.\n**Reason:** ${reason}\n**Locked by:** ${interaction.user}`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            await interaction.reply({ content: 'Failed to lock the channel.', ephemeral: true });
        }
    }
};
