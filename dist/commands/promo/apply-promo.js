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
        .setName('apply-promo')
        .setDescription('Apply a promo code discount to an order ticket')
        .addStringOption(option => option
        .setName('code')
        .setDescription('The promo code to apply')
        .setRequired(true)),
    async execute(interaction) {
        const member = interaction.member;
        const hasOrderRole = member?.roles && member.roles.cache?.has(config_1.default.roles.orderRole);
        const hasStaffRole = member?.roles && member.roles.cache?.has(config_1.default.roles.staffRole);
        if (!hasOrderRole && !hasStaffRole) {
            return interaction.reply({
                content: '❌ You need the Order Team role to use this command!',
                ephemeral: true
            });
        }
        const ticket = database_1.default.prepare('SELECT * FROM tickets WHERE channel_id = ? AND type = ?').get(interaction.channel?.id, 'order');
        if (!ticket) {
            return interaction.reply({
                content: '❌ This command can only be used in order tickets!',
                ephemeral: true
            });
        }
        const code = interaction.options.getString('code', true).toUpperCase();
        const promoData = database_1.default.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code);
        if (!promoData) {
            return interaction.reply({
                content: `❌ Promo code **${code}** does not exist!`,
                ephemeral: true
            });
        }
        if (promoData.expires_at && promoData.expires_at < Date.now()) {
            return interaction.reply({
                content: `❌ Promo code **${code}** has expired!`,
                ephemeral: true
            });
        }
        if (promoData.uses >= promoData.max_uses) {
            return interaction.reply({
                content: `❌ Promo code **${code}** has reached its maximum uses! (${promoData.uses}/${promoData.max_uses})`,
                ephemeral: true
            });
        }
        database_1.default.prepare('UPDATE promo_codes SET uses = ? WHERE code = ?').run(promoData.uses + 1, code);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config_1.default.colors.success)
            .setTitle(`${config_1.default.emojis.success} Promo Code Applied`)
            .setDescription(`**Code:** ${code}\n**Discount:** ${promoData.discount}%\n**Applied by:** ${interaction.user}`)
            .addFields({ name: 'Usage', value: `${promoData.uses + 1}/${promoData.max_uses}`, inline: true }, { name: 'Expires', value: promoData.expires_at ? `<t:${Math.floor(promoData.expires_at / 1000)}:R>` : 'Never', inline: true })
            .setTimestamp()
            .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });
        await interaction.reply({ embeds: [embed] });
    }
};
