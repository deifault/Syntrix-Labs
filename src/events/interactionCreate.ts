import { Events, Interaction } from 'discord.js';
import { commands } from '../index';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        const reply = {
          content: 'There was an error executing this command.',
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    } else if (interaction.isButton()) {
      const buttonHandlers = await import('../handlers/buttonHandler');
      await buttonHandlers.default(interaction);
    } else if (interaction.isStringSelectMenu()) {
      const selectHandlers = await import('../handlers/selectHandler');
      await selectHandlers.default(interaction);
    } else if (interaction.isModalSubmit()) {
      const modalHandlers = await import('../handlers/modalHandler');
      await modalHandlers.default(interaction);
    }
  }
};
