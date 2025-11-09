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
        .setName('warnings')
        .setDescription('Check warnings for a user')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const warnings = database_1.default.prepare('SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
        if (warnings.length === 0) {
            return interaction.reply({ content: 'This user has no warnings!', ephemeral: true });
        }
        const warningList = warnings.slice(0, 10).map((w, i) => {
            const date = new Date(w.created_at).toLocaleDateString();
            return `**${i + 1}.** ${w.reason}\n*By <@${w.moderator_id}> on ${date}*`;
        }).join('\n\n');
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.warning)
            .setTitle(`${config_1.default.emojis.warning} Warnings for ${user.username}`)
            .setDescription(warningList)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `Total warnings: ${warnings.length}` });
        await interaction.reply({ embeds: [embed] });
    }
};
