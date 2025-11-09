"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handleModal;
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../database"));
const config_1 = __importDefault(require("../config"));
async function handleModal(interaction) {
    if (interaction.customId === 'order_form') {
        const product = interaction.fields.getTextInputValue('product_input');
        const quantity = interaction.fields.getTextInputValue('quantity_input');
        const budget = interaction.fields.getTextInputValue('budget_input');
        const details = interaction.fields.getTextInputValue('details_input') || 'No additional details provided';
        const guild = interaction.guild;
        const orderChannel = await guild.channels.create({
            name: `order-${interaction.user.username}`,
            type: discord_js_1.ChannelType.GuildText,
            parent: config_1.default.channels.orderCategory,
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
                },
                {
                    id: config_1.default.roles.orderRole,
                    allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory]
                }
            ]
        });
        const ticketId = database_1.default.prepare('INSERT INTO tickets (channel_id, user_id, type, created_at) VALUES (?, ?, ?, ?)').run(orderChannel.id, interaction.user.id, 'order', Date.now()).lastInsertRowid;
        const welcomeEmbed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.info)
            .setTitle(`${config_1.default.emojis.order} Order Request #${ticketId}`)
            .setDescription(`${interaction.user} has submitted an order request!`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `Syntrix Labs | Order #${ticketId}`, iconURL: interaction.client.user.displayAvatarURL() });
        const detailsEmbed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.primary)
            .setTitle('📋 Order Details')
            .setDescription(`📦 **Product:** ${product}\n🔢 **Quantity:** ${quantity}\n💰 **Budget:** ${budget}\n📝 **Details:** ${details}`)
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('claim_order')
            .setLabel('Claim Order')
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setEmoji('✋'), new discord_js_1.ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Order')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji(config_1.default.emojis.lock));
        await orderChannel.send({
            content: `<@&${config_1.default.roles.orderRole}>`,
            embeds: [welcomeEmbed, detailsEmbed],
            components: [row]
        });
        await interaction.reply({
            content: `Order ticket created! ${orderChannel}`,
            ephemeral: true
        });
    }
}
