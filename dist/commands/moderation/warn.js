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
        .setName('warn')
        .setDescription('Warn a user')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
        .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', true);
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot warn yourself!', ephemeral: true });
        }
        const warnId = database_1.default.prepare('INSERT INTO warnings (user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?)').run(user.id, interaction.user.id, reason, Date.now()).lastInsertRowid;
        const warnings = database_1.default.prepare('SELECT COUNT(*) as count FROM warnings WHERE user_id = ?').get(user.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.warning)
            .setTitle(`${config_1.default.emojis.warning} User Warned`)
            .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}\n**Total Warnings:** ${warnings.count}`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `Syntrix Labs | Warning ID: ${warnId}`, iconURL: interaction.client.user.displayAvatarURL() });
        await interaction.reply({ embeds: [embed] });
        const logChannel = interaction.guild?.channels.cache.get(config_1.default.channels.logChannel);
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [embed] });
        }
        try {
            const dmEmbed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.warning)
                .setTitle(`${config_1.default.emojis.warning} You have been warned`)
                .setDescription(`**Server:** ${interaction.guild?.name}\n**Reason:** ${reason}\n**Total Warnings:** ${warnings.count}`)
                .setTimestamp();
            await user.send({ embeds: [dmEmbed] });
        }
        catch (error) { }
    }
};
