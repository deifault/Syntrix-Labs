import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../database';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the unmute')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    const mutedRole = interaction.guild?.roles.cache.get(config.roles.mutedRole);

    if (!mutedRole) {
      return interaction.reply({ content: 'Muted role not configured!', ephemeral: true });
    }

    if (!member.roles.cache.has(mutedRole.id)) {
      return interaction.reply({ content: 'This user is not muted!', ephemeral: true });
    }

    try {
      await member.roles.remove(mutedRole);

      db.prepare('DELETE FROM mutes WHERE user_id = ?').run(user.id);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${config.emojis.unmute} User Unmuted`)
        .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}`)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });

      const logChannel = interaction.guild?.channels.cache.get(config.channels.logChannel);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      await interaction.reply({ content: 'Failed to unmute the user.', ephemeral: true });
    }
  }
};
