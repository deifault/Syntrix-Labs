"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handleSelect;
async function handleSelect(interaction) {
    if (interaction.customId === 'ticket_category') {
        const category = interaction.values[0];
        await interaction.reply({
            content: `You selected: ${category}. A staff member will assist you with this category.`,
            ephemeral: true
        });
    }
}
