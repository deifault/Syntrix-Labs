import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../../database';
import config from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Check warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);

    const warnings = db.prepare('SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC').all(user.id) as any[];

    if (warnings.length === 0) {
      return interaction.reply({ content: 'This user has no warnings!', ephemeral: true });
    }

    const warningList = warnings.slice(0, 10).map((w, i) => {
      const date = new Date(w.created_at).toLocaleDateString();
      return `**${i + 1}.** ${w.reason}\n*By <@${w.moderator_id}> on ${date}*`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`${config.emojis.warning} Warnings for ${user.username}`)
      .setDescription(warningList)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: `Total warnings: ${warnings.length}` });

    await interaction.reply({ embeds: [embed] });
  }
};
