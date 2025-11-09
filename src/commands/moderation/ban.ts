import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../database';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('delete_days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'You cannot ban yourself!', ephemeral: true });
    }

    if (user.id === interaction.client.user.id) {
      return interaction.reply({ content: 'I cannot ban myself!', ephemeral: true });
    }

    try {
      await interaction.guild?.members.ban(user, { 
        reason: `${reason} | Banned by ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 86400
      });

      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle(`${config.emojis.ban} User Banned`)
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
      await interaction.reply({ content: 'Failed to ban the user. Make sure I have the necessary permissions and the user is not higher in role hierarchy.', ephemeral: true });
    }
  }
};
