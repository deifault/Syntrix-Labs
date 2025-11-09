"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../../config"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels)
        .addChannelOption(option => option
        .setName('channel')
        .setDescription('The channel to unlock')
        .addChannelTypes(discord_js_1.ChannelType.GuildText)
        .setRequired(false))
        .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for unlocking')
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
                    SendMessages: null
                });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.unlock} Channel Unlocked`)
                .setDescription(`${channel} has been unlocked.\n**Reason:** ${reason}\n**Unlocked by:** ${interaction.user}`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            await interaction.reply({ content: 'Failed to unlock the channel.', ephemeral: true });
        }
    }
};
