import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to unlock')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for unlocking')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: 'Invalid channel!', ephemeral: true });
    }

    try {
      if ('permissionOverwrites' in channel) {
        await channel.permissionOverwrites.edit(interaction.guild!.id, {
          SendMessages: null
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${config.emojis.unlock} Channel Unlocked`)
        .setDescription(`${channel} has been unlocked.\n**Reason:** ${reason}\n**Unlocked by:** ${interaction.user}`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ content: 'Failed to unlock the channel.', ephemeral: true });
    }
  }
};
