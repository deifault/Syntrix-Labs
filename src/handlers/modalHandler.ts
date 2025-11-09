import { ModalSubmitInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../database';
import config from '../config';

export default async function handleModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId === 'order_form') {
    const product = interaction.fields.getTextInputValue('product_input');
    const quantity = interaction.fields.getTextInputValue('quantity_input');
    const budget = interaction.fields.getTextInputValue('budget_input');
    const details = interaction.fields.getTextInputValue('details_input') || 'No additional details provided';

    const guild = interaction.guild!;
    const orderChannel = await guild.channels.create({
      name: `order-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: config.channels.orderCategory,
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
        },
        {
          id: config.roles.orderRole,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    const ticketId = db.prepare('INSERT INTO tickets (channel_id, user_id, type, created_at) VALUES (?, ?, ?, ?)').run(
      orderChannel.id,
      interaction.user.id,
      'order',
      Date.now()
    ).lastInsertRowid;

    const welcomeEmbed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`${config.emojis.order} Order Request #${ticketId}`)
      .setDescription(`${interaction.user} has submitted an order request!`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: `Syntrix Labs | Order #${ticketId}`, iconURL: interaction.client.user.displayAvatarURL() });

    const detailsEmbed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📋 Order Details')
      .setDescription(`📦 **Product:** ${product}\n🔢 **Quantity:** ${quantity}\n💰 **Budget:** ${budget}\n📝 **Details:** ${details}`)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('claim_order')
          .setLabel('Claim Order')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✋'),
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Order')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(config.emojis.lock)
      );

    await orderChannel.send({ 
      content: `<@&${config.roles.orderRole}>`,
      embeds: [welcomeEmbed, detailsEmbed], 
      components: [row] 
    });

    await interaction.reply({ 
      content: `Order ticket created! ${orderChannel}`, 
      ephemeral: true 
    });
  }
}
