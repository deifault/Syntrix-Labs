import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to lock')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for locking')
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
          SendMessages: false
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle(`${config.emojis.lock} Channel Locked`)
        .setDescription(`${channel} has been locked.\n**Reason:** ${reason}\n**Locked by:** ${interaction.user}`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ content: 'Failed to lock the channel.', ephemeral: true });
    }
  }
};
