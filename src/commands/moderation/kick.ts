import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (user.id === interaction.user.id) {
      return interaction.reply({ content: 'You cannot kick yourself!', ephemeral: true });
    }

    if (user.id === interaction.client.user.id) {
      return interaction.reply({ content: 'I cannot kick myself!', ephemeral: true });
    }

    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    try {
      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`${config.emojis.kick} User Kicked`)
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
      await interaction.reply({ content: 'Failed to kick the user. Make sure I have the necessary permissions and the user is not higher in role hierarchy.', ephemeral: true });
    }
  }
};
