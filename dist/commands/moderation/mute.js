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
        .setName('mute')
        .setDescription('Mute a user')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
        .addIntegerOption(option => option
        .setName('duration')
        .setDescription('Duration in minutes (leave empty for permanent)')
        .setRequired(false)
        .setMinValue(1))
        .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for the mute')
        .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot mute yourself!', ephemeral: true });
        }
        const member = await interaction.guild?.members.fetch(user.id);
        if (!member) {
            return interaction.reply({ content: 'User not found in this server!', ephemeral: true });
        }
        const mutedRole = interaction.guild?.roles.cache.get(config_1.default.roles.mutedRole);
        if (!mutedRole) {
            return interaction.reply({ content: 'Muted role not configured! Please set up the muted role first.', ephemeral: true });
        }
        try {
            await member.roles.add(mutedRole);
            const expiresAt = duration ? Date.now() + (duration * 60000) : null;
            database_1.default.prepare('INSERT INTO mutes (user_id, moderator_id, reason, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(user.id, interaction.user.id, reason, expiresAt, Date.now());
            const durationText = duration ? `${duration} minutes` : 'Permanent';
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.warning)
                .setTitle(`${config_1.default.emojis.mute} User Muted`)
                .setDescription(`**User:** ${user.tag}\n**Duration:** ${durationText}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}`)
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
            await interaction.reply({ content: 'Failed to mute the user. Make sure I have the necessary permissions.', ephemeral: true });
        }
    }
};
