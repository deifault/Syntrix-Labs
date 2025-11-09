import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage ticket system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Setup the ticket system with a panel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to add')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to remove')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`${config.emojis.ticket} Support Tickets`)
        .setDescription('Need help? Click the button below to create a support ticket.')
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji(config.emojis.ticket)
        );

      if (interaction.channel && 'send' in interaction.channel) {
        await interaction.channel.send({ embeds: [embed], components: [row] });
      }
      await interaction.reply({ content: 'Ticket panel has been set up!', ephemeral: true });
    }

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user', true);
      const channel = interaction.channel;

      if (channel?.type !== ChannelType.GuildText) {
        return interaction.reply({ content: 'This command can only be used in text channels!', ephemeral: true });
      }

      const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
      
      if (!member) {
        return interaction.reply({ content: 'User not found!', ephemeral: true });
      }

      await channel.permissionOverwrites.create(member, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} ${member} has been added to this ticket.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'remove') {
      const user = interaction.options.getUser('user', true);
      const channel = interaction.channel;

      if (channel?.type !== ChannelType.GuildText) {
        return interaction.reply({ content: 'This command can only be used in text channels!', ephemeral: true });
      }

      const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
      
      if (!member) {
        return interaction.reply({ content: 'User not found!', ephemeral: true });
      }

      await channel.permissionOverwrites.delete(member);

      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setDescription(`${config.emojis.error} ${member} has been removed from this ticket.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
