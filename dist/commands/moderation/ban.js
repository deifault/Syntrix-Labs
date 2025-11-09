"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../../config"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers)
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
        .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
        .addIntegerOption(option => option
        .setName('delete_days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot ban yourself!', ephemeral: true });
        }
        if (user.id === interaction.client.user.id) {
            return interaction.reply({ content: 'I cannot ban myself!', ephemeral: true });
        }
        try {
            await interaction.guild?.members.ban(user, {
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageSeconds: deleteDays * 86400
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.error)
                .setTitle(`${config_1.default.emojis.ban} User Banned`)
                .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}`)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            await interaction.reply({ embeds: [embed] });
            const logChannel = interaction.guild?.channels.cache.get(config_1.default.channels.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send({ embeds: [embed] });
            }
        }
        catch (error) {
            await interaction.reply({ content: 'Failed to ban the user. Make sure I have the necessary permissions and the user is not higher in role hierarchy.', ephemeral: true });
        }
    }
};
