import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../database';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to mute')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Duration in minutes (leave empty for permanent)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the mute')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'You cannot mute yourself!', ephemeral: true });
    }

    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    const mutedRole = interaction.guild?.roles.cache.get(config.roles.mutedRole);

    if (!mutedRole) {
      return interaction.reply({ content: 'Muted role not configured! Please set up the muted role first.', ephemeral: true });
    }

    try {
      await member.roles.add(mutedRole);

      const expiresAt = duration ? Date.now() + (duration * 60000) : null;

      db.prepare('INSERT INTO mutes (user_id, moderator_id, reason, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
        user.id,
        interaction.user.id,
        reason,
        expiresAt,
        Date.now()
      );

      const durationText = duration ? `${duration} minutes` : 'Permanent';

      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`${config.emojis.mute} User Muted`)
        .setDescription(`**User:** ${user.tag}\n**Duration:** ${durationText}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}`)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });

      const logChannel = interaction.guild?.channels.cache.get(config.channels.logChannel);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      await interaction.reply({ content: 'Failed to mute the user. Make sure I have the necessary permissions.', ephemeral: true });
    }
  }
};
