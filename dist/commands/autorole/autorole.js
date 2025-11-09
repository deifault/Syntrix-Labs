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
        .setName('autorole')
        .setDescription('Manage automatic role assignment')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add an autorole')
        .addRoleOption(option => option
        .setName('role')
        .setDescription('The role to automatically assign')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('remove')
        .setDescription('Remove an autorole')
        .addRoleOption(option => option
        .setName('role')
        .setDescription('The role to remove from autoroles')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('list')
        .setDescription('List all autoroles')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'add') {
            const role = interaction.options.getRole('role', true);
            const existing = database_1.default.prepare('SELECT * FROM autoroles WHERE guild_id = ? AND role_id = ?').get(interaction.guild.id, role.id);
            if (existing) {
                return interaction.reply({ content: 'This role is already an autorole!', ephemeral: true });
            }
            database_1.default.prepare('INSERT INTO autoroles (guild_id, role_id, created_at) VALUES (?, ?, ?)').run(interaction.guild.id, role.id, Date.now());
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.success} Autorole Added`)
                .setDescription(`${role} will now be automatically assigned to new members.`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'remove') {
            const role = interaction.options.getRole('role', true);
            const result = database_1.default.prepare('DELETE FROM autoroles WHERE guild_id = ? AND role_id = ?').run(interaction.guild.id, role.id);
            if (result.changes === 0) {
                return interaction.reply({ content: 'This role is not an autorole!', ephemeral: true });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.error)
                .setTitle(`${config_1.default.emojis.error} Autorole Removed`)
                .setDescription(`${role} will no longer be automatically assigned to new members.`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'list') {
            const autoroles = database_1.default.prepare('SELECT role_id FROM autoroles WHERE guild_id = ?').all(interaction.guild.id);
            if (autoroles.length === 0) {
                return interaction.reply({ content: 'No autoroles configured!', ephemeral: true });
            }
            const roleList = autoroles.map(ar => `<@&${ar.role_id}>`).join('\n');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.info)
                .setTitle('Autoroles')
                .setDescription(roleList)
                .setTimestamp()
                .setFooter({ text: `${autoroles.length} autorole(s) configured` });
            await interaction.reply({ embeds: [embed] });
        }
    }
};
