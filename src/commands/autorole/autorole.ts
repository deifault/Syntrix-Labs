import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../database';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Manage automatic role assignment')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add an autorole')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to automatically assign')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an autorole')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('The role to remove from autoroles')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all autoroles')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const role = interaction.options.getRole('role', true);

      const existing = db.prepare('SELECT * FROM autoroles WHERE guild_id = ? AND role_id = ?').get(interaction.guild!.id, role.id);

      if (existing) {
        return interaction.reply({ content: 'This role is already an autorole!', ephemeral: true });
      }

      db.prepare('INSERT INTO autoroles (guild_id, role_id, created_at) VALUES (?, ?, ?)').run(
        interaction.guild!.id,
        role.id,
        Date.now()
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${config.emojis.success} Autorole Added`)
        .setDescription(`${role} will now be automatically assigned to new members.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'remove') {
      const role = interaction.options.getRole('role', true);

      const result = db.prepare('DELETE FROM autoroles WHERE guild_id = ? AND role_id = ?').run(
        interaction.guild!.id,
        role.id
      );

      if (result.changes === 0) {
        return interaction.reply({ content: 'This role is not an autorole!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle(`${config.emojis.error} Autorole Removed`)
        .setDescription(`${role} will no longer be automatically assigned to new members.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'list') {
      const autoroles = db.prepare('SELECT role_id FROM autoroles WHERE guild_id = ?').all(interaction.guild!.id) as any[];

      if (autoroles.length === 0) {
        return interaction.reply({ content: 'No autoroles configured!', ephemeral: true });
      }

      const roleList = autoroles.map(ar => `<@&${ar.role_id}>`).join('\n');

      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle('Autoroles')
        .setDescription(roleList)
        .setTimestamp()
        .setFooter({ text: `${autoroles.length} autorole(s) configured` });

      await interaction.reply({ embeds: [embed] });
    }
  }
};
