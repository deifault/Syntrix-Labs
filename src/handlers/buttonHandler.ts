import { ButtonInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import db from '../database';
import config from '../config';
import { createTranscript, sendTranscriptToLog } from '../utils/transcript';

export default async function handleButton(interaction: ButtonInteraction) {
  if (interaction.customId === 'create_ticket') {
    const existing = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = ?').get(interaction.user.id, 'open');
    
    if (existing) {
      return interaction.reply({ content: 'You already have an open ticket!', ephemeral: true });
    }

    const guild = interaction.guild!;
    const ticketChannel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.channels.ticketCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: config.roles.staffRole,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    db.prepare('INSERT INTO tickets (channel_id, user_id, type, created_at) VALUES (?, ?, ?, ?)').run(
      ticketChannel.id,
      interaction.user.id,
      'general',
      Date.now()
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('Support Ticket')
      .setDescription(`Welcome ${interaction.user}!\nA staff member will be with you shortly. Please describe your issue in detail.`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(config.emojis.lock)
      );

    await ticketChannel.send({ embeds: [embed], components: [row] });

    await interaction.reply({ 
      content: `Ticket created! ${ticketChannel}`, 
      ephemeral: true 
    });
  }

  if (interaction.customId === 'create_order') {
    const existing = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = ? AND type = ?').get(interaction.user.id, 'open', 'order');
    
    if (existing) {
      return interaction.reply({ content: 'You already have an open order ticket!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('order_form')
      .setTitle('Order Request Form');

    const productInput = new TextInputBuilder()
      .setCustomId('product_input')
      .setLabel('What would you like to order?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., Discord Bot, Website, Graphics')
      .setRequired(true)
      .setMaxLength(100);

    const quantityInput = new TextInputBuilder()
      .setCustomId('quantity_input')
      .setLabel('How many?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., 1, 2, 3')
      .setRequired(true)
      .setMaxLength(50);

    const budgetInput = new TextInputBuilder()
      .setCustomId('budget_input')
      .setLabel('Your budget range')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., $50-$100')
      .setRequired(true)
      .setMaxLength(50);

    const detailsInput = new TextInputBuilder()
      .setCustomId('details_input')
      .setLabel('Additional details (mention promo code here)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Provide any additional information about your order...')
      .setRequired(false)
      .setMaxLength(1000);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(productInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(budgetInput);
    const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(detailsInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);

    await interaction.showModal(modal);
  }

  if (interaction.customId === 'close_ticket') {
    const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(interaction.channel!.id);

    if (!ticket) {
      return interaction.reply({ content: 'This is not a valid ticket channel!', ephemeral: true });
    }

    const hasPermission = interaction.member?.permissions && 
      (interaction.member.permissions as any).has(PermissionFlagsBits.ManageChannels);

    if (!hasPermission && (ticket as any).user_id !== interaction.user.id) {
      return interaction.reply({ content: 'Only staff or the ticket creator can close this ticket!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('Ticket Closing')
      .setDescription('Creating transcript and closing ticket in 5 seconds...')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const ticketData = ticket as any;
    const transcript = await createTranscript(
      interaction.channel as TextChannel, 
      interaction.user.tag,
      'Ticket closed'
    );

    await sendTranscriptToLog(
      interaction.channel as TextChannel,
      transcript,
      interaction.user.tag,
      ticketData.type
    );

    db.prepare('UPDATE tickets SET status = ?, closed_at = ? WHERE channel_id = ?').run(
      'closed',
      Date.now(),
      interaction.channel!.id
    );

    setTimeout(async () => {
      try {
        await interaction.channel?.delete();
      } catch (error) {}
    }, 5000);
  }

  if (interaction.customId === 'claim_order') {
    const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(interaction.channel!.id);

    if (!ticket) {
      return interaction.reply({ content: 'This is not a valid ticket channel!', ephemeral: true });
    }

    const hasPermission = interaction.member?.permissions && 
      (interaction.member.permissions as any).has(PermissionFlagsBits.ManageChannels);

    if (!hasPermission) {
      return interaction.reply({ content: 'Only staff members can claim orders!', ephemeral: true });
    }

    const ticketData = ticket as any;

    if (ticketData.claimed_by) {
      return interaction.reply({ content: `This order has already been claimed by <@${ticketData.claimed_by}>!`, ephemeral: true });
    }

    db.prepare('UPDATE tickets SET claimed_by = ?, claimed_at = ? WHERE channel_id = ?').run(
      interaction.user.id,
      Date.now(),
      interaction.channel!.id
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`${config.emojis.success} Order Claimed`)
      .setDescription(`This order has been claimed by ${interaction.user}!\n\nThey will be handling your request.`)
      .setTimestamp()
      .setFooter({ text: 'Syntrix Labs', iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });

    if (interaction.message && interaction.message.components.length > 0) {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('claim_order')
            .setLabel('Claimed')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Order')
            .setStyle(ButtonStyle.Danger)
            .setEmoji(config.emojis.lock)
        );

      await interaction.message.edit({ components: [disabledRow] });
    }
  }
}