"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../../config"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers)
        .addStringOption(option => option
        .setName('user_id')
        .setDescription('The ID of the user to unban')
        .setRequired(true))
        .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for the unban')
        .setRequired(false)),
    async execute(interaction) {
        const userId = interaction.options.getString('user_id', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        try {
            await interaction.guild?.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.success} User Unbanned`)
                .setDescription(`**User ID:** ${userId}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}`)
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            await interaction.reply({ embeds: [embed] });
            const logChannel = interaction.guild?.channels.cache.get(config_1.default.channels.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send({ embeds: [embed] });
            }
        }
        catch (error) {
            await interaction.reply({ content: 'Failed to unban the user. Make sure the user ID is correct and they are banned.', ephemeral: true });
        }
    }
};
