import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option =>
      option
        .setName('user_id')
        .setDescription('The ID of the user to unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the unban')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      await interaction.guild?.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${config.emojis.success} User Unbanned`)
        .setDescription(`**User ID:** ${userId}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}`)
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });

      const logChannel = interaction.guild?.channels.cache.get(config.channels.logChannel);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      await interaction.reply({ content: 'Failed to unban the user. Make sure the user ID is correct and they are banned.', ephemeral: true });
    }
  }
};
