import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../database';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'You cannot warn yourself!', ephemeral: true });
    }

    const warnId = db.prepare('INSERT INTO warnings (user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?)').run(
      user.id,
      interaction.user.id,
      reason,
      Date.now()
    ).lastInsertRowid;

    const warnings = db.prepare('SELECT COUNT(*) as count FROM warnings WHERE user_id = ?').get(user.id) as any;

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`${config.emojis.warning} User Warned`)
      .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}\n**Total Warnings:** ${warnings.count}`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: `Syntrix Labs | Warning ID: ${warnId}`, iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });

    const logChannel = interaction.guild?.channels.cache.get(config.channels.logChannel);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [embed] });
    }

    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`${config.emojis.warning} You have been warned`)
        .setDescription(`**Server:** ${interaction.guild?.name}\n**Reason:** ${reason}\n**Total Warnings:** ${warnings.count}`)
        .setTimestamp();

      await user.send({ embeds: [dmEmbed] });
    } catch (error) {}
  }
};
