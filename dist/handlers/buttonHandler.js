"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handleButton;
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../database"));
const config_1 = __importDefault(require("../config"));
const transcript_1 = require("../utils/transcript");
async function handleButton(interaction) {
    if (interaction.customId === 'create_ticket') {
        const existing = database_1.default.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = ?').get(interaction.user.id, 'open');
        if (existing) {
            return interaction.reply({ content: 'You already have an open ticket!', ephemeral: true });
        }
        const guild = interaction.guild;
        const ticketChannel = await guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: discord_js_1.ChannelType.GuildText,
            parent: config_1.default.channels.ticketCategory,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory]
                },
                {
                    id: config_1.default.roles.staffRole,
                    allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory]
                }
            ]
        });
        database_1.default.prepare('INSERT INTO tickets (channel_id, user_id, type, created_at) VALUES (?, ?, ?, ?)').run(ticketChannel.id, interaction.user.id, 'general', Date.now());
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.primary)
            .setTitle('Support Ticket')
            .setDescription(`Welcome ${interaction.user}!\nA staff member will be with you shortly. Please describe your issue in detail.`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji(config_1.default.emojis.lock));
        await ticketChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({
            content: `Ticket created! ${ticketChannel}`,
            ephemeral: true
        });
    }
    if (interaction.customId === 'create_order') {
        const existing = database_1.default.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = ? AND type = ?').get(interaction.user.id, 'open', 'order');
        if (existing) {
            return interaction.reply({ content: 'You already have an open order ticket!', ephemeral: true });
        }
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('order_form')
            .setTitle('Order Request Form');
        const productInput = new discord_js_1.TextInputBuilder()
            .setCustomId('product_input')
            .setLabel('What would you like to order?')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('e.g., Discord Bot, Website, Graphics')
            .setRequired(true)
            .setMaxLength(100);
        const quantityInput = new discord_js_1.TextInputBuilder()
            .setCustomId('quantity_input')
            .setLabel('How many?')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('e.g., 1, 2, 3')
            .setRequired(true)
            .setMaxLength(50);
        const budgetInput = new discord_js_1.TextInputBuilder()
            .setCustomId('budget_input')
            .setLabel('Your budget range')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('e.g., $50-$100')
            .setRequired(true)
            .setMaxLength(50);
        const detailsInput = new discord_js_1.TextInputBuilder()
            .setCustomId('details_input')
            .setLabel('Additional details (mention promo code here)')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('Provide any additional information about your order...')
            .setRequired(false)
            .setMaxLength(1000);
        const firstRow = new discord_js_1.ActionRowBuilder().addComponents(productInput);
        const secondRow = new discord_js_1.ActionRowBuilder().addComponents(quantityInput);
        const thirdRow = new discord_js_1.ActionRowBuilder().addComponents(budgetInput);
        const fourthRow = new discord_js_1.ActionRowBuilder().addComponents(detailsInput);
        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);
        await interaction.showModal(modal);
    }
    if (interaction.customId === 'close_ticket') {
        const ticket = database_1.default.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(interaction.channel.id);
        if (!ticket) {
            return interaction.reply({ content: 'This is not a valid ticket channel!', ephemeral: true });
        }
        const hasPermission = interaction.member?.permissions &&
            interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels);
        if (!hasPermission && ticket.user_id !== interaction.user.id) {
            return interaction.reply({ content: 'Only staff or the ticket creator can close this ticket!', ephemeral: true });
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.error)
            .setTitle('Ticket Closing')
            .setDescription('Creating transcript and closing ticket in 5 seconds...')
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        const ticketData = ticket;
        const transcript = await (0, transcript_1.createTranscript)(interaction.channel, interaction.user.tag, 'Ticket closed');
        await (0, transcript_1.sendTranscriptToLog)(interaction.channel, transcript, interaction.user.tag, ticketData.type);
        database_1.default.prepare('UPDATE tickets SET status = ?, closed_at = ? WHERE channel_id = ?').run('closed', Date.now(), interaction.channel.id);
        setTimeout(async () => {
            try {
                await interaction.channel?.delete();
            }
            catch (error) { }
        }, 5000);
    }
    if (interaction.customId === 'claim_order') {
        const ticket = database_1.default.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(interaction.channel.id);
        if (!ticket) {
            return interaction.reply({ content: 'This is not a valid ticket channel!', ephemeral: true });
        }
        const hasPermission = interaction.member?.permissions &&
            interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels);
        if (!hasPermission) {
            return interaction.reply({ content: 'Only staff members can claim orders!', ephemeral: true });
        }
        const ticketData = ticket;
        if (ticketData.claimed_by) {
            return interaction.reply({ content: `This order has already been claimed by <@${ticketData.claimed_by}>!`, ephemeral: true });
        }
        database_1.default.prepare('UPDATE tickets SET claimed_by = ?, claimed_at = ? WHERE channel_id = ?').run(interaction.user.id, Date.now(), interaction.channel.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.success)
            .setTitle(`${config_1.default.emojis.success} Order Claimed`)
            .setDescription(`This order has been claimed by ${interaction.user}!\n\nThey will be handling your request.`)
            .setTimestamp()
            .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
        await interaction.reply({ embeds: [embed] });
        if (interaction.message && interaction.message.components.length > 0) {
            const disabledRow = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('claim_order')
                .setLabel('Claimed')
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setEmoji('✅')
                .setDisabled(true), new discord_js_1.ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Order')
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setEmoji(config_1.default.emojis.lock));
            await interaction.message.edit({ components: [disabledRow] });
        }
    }
}
