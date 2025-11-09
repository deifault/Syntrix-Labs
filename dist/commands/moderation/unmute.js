"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../../database"));
const config_1 = __importDefault(require("../../config"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to unmute')
        .setRequired(true))
        .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for the unmute')
        .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild?.members.fetch(user.id);
        if (!member) {
            return interaction.reply({ content: 'User not found in this server!', ephemeral: true });
        }
        const mutedRole = interaction.guild?.roles.cache.get(config_1.default.roles.mutedRole);
        if (!mutedRole) {
            return interaction.reply({ content: 'Muted role not configured!', ephemeral: true });
        }
        if (!member.roles.cache.has(mutedRole.id)) {
            return interaction.reply({ content: 'This user is not muted!', ephemeral: true });
        }
        try {
            await member.roles.remove(mutedRole);
            database_1.default.prepare('DELETE FROM mutes WHERE user_id = ?').run(user.id);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.unmute} User Unmuted`)
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
            await interaction.reply({ content: 'Failed to unmute the user.', ephemeral: true });
        }
    }
};
