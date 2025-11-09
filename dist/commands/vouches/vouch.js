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
        .setName('vouch')
        .setDescription('Manage vouches')
        .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add a vouch for a user')
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to vouch for')
        .setRequired(true))
        .addIntegerOption(option => option
        .setName('rating')
        .setDescription('Rating (1-5 stars)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5))
        .addStringOption(option => option
        .setName('comment')
        .setDescription('Your vouch comment')
        .setRequired(false)))
        .addSubcommand(subcommand => subcommand
        .setName('check')
        .setDescription('Check vouches for a user')
        .addUserOption(option => option
        .setName('user')
        .setDescription('The user to check vouches for')
        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'add') {
            const user = interaction.options.getUser('user', true);
            const rating = interaction.options.getInteger('rating', true);
            const comment = interaction.options.getString('comment') || 'No comment provided';
            if (user.id === interaction.user.id) {
                return interaction.reply({ content: 'You cannot vouch for yourself!', ephemeral: true });
            }
            database_1.default.prepare('INSERT INTO vouches (user_id, voucher_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)').run(user.id, interaction.user.id, rating, comment, Date.now());
            const stars = '⭐'.repeat(rating);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`${config_1.default.emojis.vouch} New Vouch Added`)
                .setDescription(`**User:** ${user}\n**Rating:** ${stars} (${rating}/5)\n**Comment:** ${comment}\n**Vouched by:** ${interaction.user}`)
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs | Cmd `/vouch`', iconURL: interaction.client.user.displayAvatarURL() });
            const vouchChannel = interaction.guild?.channels.cache.get(config_1.default.channels.vouchChannel);
            if (vouchChannel && vouchChannel.isTextBased()) {
                await vouchChannel.send({ embeds: [embed] });
            }
            await interaction.reply({ content: `${config_1.default.emojis.success} Vouch added successfully!`, ephemeral: true });
        }
        if (subcommand === 'check') {
            const user = interaction.options.getUser('user', true);
            const vouches = database_1.default.prepare('SELECT * FROM vouches WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
            if (vouches.length === 0) {
                return interaction.reply({ content: 'This user has no vouches!', ephemeral: true });
            }
            const totalRating = vouches.reduce((sum, v) => sum + v.rating, 0);
            const avgRating = (totalRating / vouches.length).toFixed(1);
            const vouchList = vouches.slice(0, 10).map((v, i) => {
                const stars = '⭐'.repeat(v.rating);
                return `**${i + 1}.** ${stars} - <@${v.voucher_id}>\n*${v.comment}*`;
            }).join('\n\n');
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.info)
                .setTitle(`${config_1.default.emojis.vouch} Vouches for ${user.username}`)
                .setDescription(vouchList)
                .addFields({ name: 'Total Vouches', value: vouches.length.toString(), inline: true }, { name: 'Average Rating', value: `${avgRating}/5 ⭐`, inline: true })
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Showing ${Math.min(10, vouches.length)} of ${vouches.length} vouches` });
            await interaction.reply({ embeds: [embed] });
        }
    }
};
