import { StringSelectMenuInteraction } from 'discord.js';

export default async function handleSelect(interaction: StringSelectMenuInteraction) {
  if (interaction.customId === 'ticket_category') {
    const category = interaction.values[0];
    
    await interaction.reply({
      content: `You selected: ${category}. A staff member will assist you with this category.`,
      ephemeral: true
    });
  }
}
