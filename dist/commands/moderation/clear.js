"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../../config"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages in a channel')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
        .addUserOption(option => option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount', true);
        const user = interaction.options.getUser('user');
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.channel || !interaction.channel.isTextBased() || interaction.channel.isDMBased()) {
            return interaction.editReply({ content: 'This command can only be used in text channels!' });
        }
        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            let toDelete = messages;
            if (user) {
                toDelete = messages.filter((msg) => msg.author.id === user.id);
            }
            if ('bulkDelete' in interaction.channel) {
                const deleted = await interaction.channel.bulkDelete(toDelete, true);
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config_1.default.colors.success)
                    .setTitle(`${config_1.default.emojis.success} Messages Cleared`)
                    .setDescription(`Successfully deleted ${deleted.size} message(s)${user ? ` from ${user}` : ''}.`)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            }
        }
        catch (error) {
            await interaction.editReply({ content: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.' });
        }
    }
};
