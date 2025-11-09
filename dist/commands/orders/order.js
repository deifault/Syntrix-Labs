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
        .setName('order')
        .setDescription('Manage orders')
        .addSubcommand(subcommand => subcommand
        .setName('setup')
        .setDescription('Setup the order system with a panel'))
        .addSubcommand(subcommand => subcommand
        .setName('complete')
        .setDescription('Mark an order as completed')
        .addIntegerOption(option => option
        .setName('id')
        .setDescription('Order ID')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('cancel')
        .setDescription('Cancel an order')
        .addIntegerOption(option => option
        .setName('id')
        .setDescription('Order ID')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('list')
        .setDescription('List all orders')
        .addStringOption(option => option
        .setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices({ name: 'Pending', value: 'pending' }, { name: 'Completed', value: 'completed' }, { name: 'Cancelled', value: 'cancelled' }))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'setup') {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.info)
                .setTitle(`${config_1.default.emojis.order} Order System`)
                .setDescription('Ready to place an order? Click the button below to get started!\n\nOur team will process your order and get back to you shortly.')
                .addFields({ name: 'Processing Time', value: '24-48 hours', inline: true }, { name: 'Payment', value: 'After confirmation', inline: true })
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('create_order')
                .setLabel('Place Order')
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setEmoji(config_1.default.emojis.order));
            if (interaction.channel && 'send' in interaction.channel) {
                await interaction.channel.send({ embeds: [embed], components: [row] });
            }
            await interaction.reply({ content: 'Order panel has been set up!', ephemeral: true });
        }
        if (subcommand === 'complete') {
            const hasPermission = interaction.member?.permissions &&
                interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels);
            if (!hasPermission) {
                return interaction.reply({ content: 'Only staff can complete orders!', ephemeral: true });
            }
            const orderId = interaction.options.getInteger('id', true);
            const order = database_1.default.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
            if (!order) {
                return interaction.reply({ content: 'Order not found!', ephemeral: true });
            }
            database_1.default.prepare('UPDATE orders SET status = ?, completed_at = ? WHERE id = ?').run('completed', Date.now(), orderId);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.success} Order Completed`)
                .setDescription(`Order #${orderId} has been marked as completed!`)
                .addFields({ name: 'Product', value: order.product, inline: true }, { name: 'Customer', value: `<@${order.user_id}>`, inline: true }, { name: 'Total', value: `$${order.total_price.toFixed(2)}`, inline: true })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'cancel') {
            const hasPermission = interaction.member?.permissions &&
                interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels);
            if (!hasPermission) {
                return interaction.reply({ content: 'Only staff can cancel orders!', ephemeral: true });
            }
            const orderId = interaction.options.getInteger('id', true);
            const order = database_1.default.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
            if (!order) {
                return interaction.reply({ content: 'Order not found!', ephemeral: true });
            }
            database_1.default.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', orderId);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.error)
                .setTitle(`${config_1.default.emojis.error} Order Cancelled`)
                .setDescription(`Order #${orderId} has been cancelled.`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'list') {
            const status = interaction.options.getString('status');
            let query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 10';
            let params = [];
            if (status) {
                query = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 10';
                params = [status];
            }
            const orders = database_1.default.prepare(query).all(...params);
            if (orders.length === 0) {
                return interaction.reply({ content: 'No orders found!', ephemeral: true });
            }
            const orderList = orders.map(o => {
                const statusEmoji = o.status === 'completed' ? '🟢' : o.status === 'cancelled' ? '🔴' : '🟡';
                return `**Order #${o.id}** ${statusEmoji}\n**Product:** ${o.product}\n**Customer:** <@${o.user_id}>\n**Price:** $${o.total_price.toFixed(2)}`;
            }).join('\n\n');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.info)
                .setTitle(`${config_1.default.emojis.order} Orders List`)
                .setDescription(orderList)
                .setTimestamp()
                .setFooter({ text: `Showing ${orders.length} orders` });
            await interaction.reply({ embeds: [embed] });
        }
    }
};
