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
        .setName('track')
        .setDescription('Track order status')
        .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add a tracked order')
        .addStringOption(option => option
        .setName('order_id')
        .setDescription('Order ID/Number')
        .setRequired(true))
        .addUserOption(option => option
        .setName('user')
        .setDescription('User who placed the order')
        .setRequired(true))
        .addStringOption(option => option
        .setName('product')
        .setDescription('Product/Service name')
        .setRequired(true))
        .addStringOption(option => option
        .setName('status')
        .setDescription('Current status')
        .setRequired(true)
        .addChoices({ name: 'Pending', value: 'pending' }, { name: 'In Progress', value: 'in_progress' }, { name: 'Completed', value: 'completed' }, { name: 'Delivered', value: 'delivered' }, { name: 'Cancelled', value: 'cancelled' }))
        .addStringOption(option => option
        .setName('info')
        .setDescription('Tracking information/notes')
        .setRequired(false)))
        .addSubcommand(subcommand => subcommand
        .setName('update')
        .setDescription('Update order tracking status')
        .addStringOption(option => option
        .setName('order_id')
        .setDescription('Order ID to update')
        .setRequired(true))
        .addStringOption(option => option
        .setName('status')
        .setDescription('New status')
        .setRequired(true)
        .addChoices({ name: 'Pending', value: 'pending' }, { name: 'In Progress', value: 'in_progress' }, { name: 'Completed', value: 'completed' }, { name: 'Delivered', value: 'delivered' }, { name: 'Cancelled', value: 'cancelled' }))
        .addStringOption(option => option
        .setName('info')
        .setDescription('Updated tracking information')
        .setRequired(false)))
        .addSubcommand(subcommand => subcommand
        .setName('check')
        .setDescription('Check order tracking status')
        .addStringOption(option => option
        .setName('order_id')
        .setDescription('Order ID to check')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('list')
        .setDescription('List all your tracked orders')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'add') {
            const hasPermission = interaction.member?.permissions &&
                interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels);
            if (!hasPermission) {
                return interaction.reply({ content: 'Only staff can add tracked orders!', ephemeral: true });
            }
            const orderId = interaction.options.getString('order_id', true);
            const user = interaction.options.getUser('user', true);
            const product = interaction.options.getString('product', true);
            const status = interaction.options.getString('status', true);
            const info = interaction.options.getString('info') || 'No additional information';
            const existing = database_1.default.prepare('SELECT * FROM tracked_orders WHERE order_id = ?').get(orderId);
            if (existing) {
                return interaction.reply({ content: 'This order ID is already being tracked!', ephemeral: true });
            }
            database_1.default.prepare('INSERT INTO tracked_orders (order_id, user_id, product, status, tracking_info, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(orderId, user.id, product, status, info, Date.now());
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.order} Order Tracking Added`)
                .setDescription(`**Order ID:** ${orderId}\n**User:** ${user}\n**Product:** ${product}\n**Status:** ${status}\n**Info:** ${info}`)
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            await interaction.reply({ embeds: [embed] });
            try {
                const dmEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(config_1.default.colors.info)
                    .setTitle(`${config_1.default.emojis.order} Order Tracking Started`)
                    .setDescription(`Your order is now being tracked!\n\n**Order ID:** ${orderId}\n**Product:** ${product}\n**Status:** ${status}\n\nUse \`/track check order_id:${orderId}\` to check your order status anytime.`)
                    .setTimestamp()
                    .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
                await user.send({ embeds: [dmEmbed] });
            }
            catch (error) { }
        }
        if (subcommand === 'update') {
            const hasPermission = interaction.member?.permissions &&
                interaction.member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels);
            if (!hasPermission) {
                return interaction.reply({ content: 'Only staff can update order tracking!', ephemeral: true });
            }
            const orderId = interaction.options.getString('order_id', true);
            const status = interaction.options.getString('status', true);
            const info = interaction.options.getString('info');
            const order = database_1.default.prepare('SELECT * FROM tracked_orders WHERE order_id = ?').get(orderId);
            if (!order) {
                return interaction.reply({ content: 'Order not found!', ephemeral: true });
            }
            const trackingInfo = info || order.tracking_info;
            database_1.default.prepare('UPDATE tracked_orders SET status = ?, tracking_info = ?, updated_at = ? WHERE order_id = ?').run(status, trackingInfo, Date.now(), orderId);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.success} Order Tracking Updated`)
                .setDescription(`**Order ID:** ${orderId}\n**New Status:** ${status}\n**Info:** ${trackingInfo}`)
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            await interaction.reply({ embeds: [embed] });
            try {
                const user = await interaction.client.users.fetch(order.user_id);
                const dmEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(config_1.default.colors.info)
                    .setTitle(`${config_1.default.emojis.order} Order Status Updated`)
                    .setDescription(`**Order ID:** ${orderId}\n**Product:** ${order.product}\n**New Status:** ${status}\n**Info:** ${trackingInfo}`)
                    .setTimestamp()
                    .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
                await user.send({ embeds: [dmEmbed] });
            }
            catch (error) { }
        }
        if (subcommand === 'check') {
            const orderId = interaction.options.getString('order_id', true);
            const order = database_1.default.prepare('SELECT * FROM tracked_orders WHERE order_id = ?').get(orderId);
            if (!order) {
                return interaction.reply({ content: 'Order not found!', ephemeral: true });
            }
            const statusEmoji = order.status === 'completed' || order.status === 'delivered' ? '🟢' :
                order.status === 'cancelled' ? '🔴' :
                    order.status === 'in_progress' ? '🟡' : '⚪';
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.info)
                .setTitle(`${config_1.default.emojis.order} Order Tracking`)
                .setDescription(`**Order ID:** ${orderId}\n**Product:** ${order.product}\n**Status:** ${statusEmoji} ${order.status}\n**Info:** ${order.tracking_info}\n**Last Updated:** <t:${Math.floor(order.updated_at / 1000)}:R>`)
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (subcommand === 'list') {
            const orders = database_1.default.prepare('SELECT * FROM tracked_orders WHERE user_id = ?').all(interaction.user.id);
            if (orders.length === 0) {
                return interaction.reply({ content: 'You have no tracked orders!', ephemeral: true });
            }
            const orderList = orders.map(o => {
                const statusEmoji = o.status === 'completed' || o.status === 'delivered' ? '🟢' :
                    o.status === 'cancelled' ? '🔴' :
                        o.status === 'in_progress' ? '🟡' : '⚪';
                return `**${o.order_id}** - ${o.product}\n${statusEmoji} ${o.status}`;
            }).join('\n\n');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.info)
                .setTitle(`${config_1.default.emojis.order} Your Tracked Orders`)
                .setDescription(orderList)
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
