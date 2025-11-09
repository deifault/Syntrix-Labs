import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../database';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('promo')
    .setDescription('Manage promo codes')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new promo code')
        .addStringOption(option =>
          option
            .setName('code')
            .setDescription('Promo code name')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('discount')
            .setDescription('Discount percentage (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
        .addIntegerOption(option =>
          option
            .setName('max_uses')
            .setDescription('Maximum number of uses')
            .setRequired(true)
            .setMinValue(1)
        )
        .addIntegerOption(option =>
          option
            .setName('expires_days')
            .setDescription('Expires in X days (optional)')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check a promo code validity')
        .addStringOption(option =>
          option
            .setName('code')
            .setDescription('Promo code to check')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all active promo codes')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a promo code')
        .addStringOption(option =>
          option
            .setName('code')
            .setDescription('Promo code to delete')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const hasPermission = interaction.member?.permissions && 
        (interaction.member.permissions as any).has(PermissionFlagsBits.ManageGuild);

      if (!hasPermission) {
        return interaction.reply({ content: 'Only admins can create promo codes!', ephemeral: true });
      }

      const code = interaction.options.getString('code', true).toUpperCase();
      const discount = interaction.options.getInteger('discount', true);
      const maxUses = interaction.options.getInteger('max_uses', true);
      const expiresDays = interaction.options.getInteger('expires_days');

      const existing = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code);
      if (existing) {
        return interaction.reply({ content: 'This promo code already exists!', ephemeral: true });
      }

      const expiresAt = expiresDays ? Date.now() + (expiresDays * 86400000) : null;

      db.prepare('INSERT INTO promo_codes (code, discount, max_uses, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        code,
        discount,
        maxUses,
        interaction.user.id,
        Date.now(),
        expiresAt
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${config.emojis.success} Promo Code Created`)
        .setDescription(`**Code:** ${code}\n**Discount:** ${discount}%\n**Max Uses:** ${maxUses}\n**Expires:** ${expiresDays ? `${expiresDays} days` : 'Never'}`)
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'check') {
      const code = interaction.options.getString('code', true).toUpperCase();
      const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code) as any;

      if (!promo) {
        return interaction.reply({ content: 'Invalid promo code!', ephemeral: true });
      }

      if (promo.expires_at && promo.expires_at < Date.now()) {
        return interaction.reply({ content: 'This promo code has expired!', ephemeral: true });
      }

      if (promo.uses >= promo.max_uses) {
        return interaction.reply({ content: 'This promo code has reached its maximum uses!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(`${config.emojis.success} Valid Promo Code`)
        .setDescription(`**Code:** ${promo.code}\n**Discount:** ${promo.discount}%\n**Uses:** ${promo.uses}/${promo.max_uses}\n**Status:** Active`)
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'list') {
      const hasPermission = interaction.member?.permissions && 
        (interaction.member.permissions as any).has(PermissionFlagsBits.ManageGuild);

      if (!hasPermission) {
        return interaction.reply({ content: 'Only admins can view promo codes!', ephemeral: true });
      }

      const promos = db.prepare('SELECT * FROM promo_codes').all() as any[];

      if (promos.length === 0) {
        return interaction.reply({ content: 'No promo codes found!', ephemeral: true });
      }

      const activePromos = promos.filter(p => 
        (!p.expires_at || p.expires_at > Date.now()) && 
        p.uses < p.max_uses
      );

      if (activePromos.length === 0) {
        return interaction.reply({ content: 'No active promo codes!', ephemeral: true });
      }

      const promoList = activePromos.map(p => 
        `**${p.code}** - ${p.discount}% off (${p.uses}/${p.max_uses} uses)`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle('🎟️ Active Promo Codes')
        .setDescription(promoList)
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'delete') {
      const hasPermission = interaction.member?.permissions && 
        (interaction.member.permissions as any).has(PermissionFlagsBits.ManageGuild);

      if (!hasPermission) {
        return interaction.reply({ content: 'Only admins can delete promo codes!', ephemeral: true });
      }

      const code = interaction.options.getString('code', true).toUpperCase();
      const result = db.prepare('DELETE FROM promo_codes WHERE code = ?').run(code);

      if (result.changes === 0) {
        return interaction.reply({ content: 'Promo code not found!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${config.emojis.success} Promo Code Deleted`)
        .setDescription(`Successfully deleted promo code: **${code}**`)
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });
    }
  }
};
