import { Events, GuildMember, EmbedBuilder } from 'discord.js';
import db from '../database';
import config from '../config';

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const stmt = db.prepare('SELECT role_id FROM autoroles WHERE guild_id = ?');
    const autoroles = stmt.all(member.guild.id) as any[];

    for (const autorole of autoroles) {
      const role = member.guild.roles.cache.get(autorole.role_id);
      if (role) {
        try {
          await member.roles.add(role);
        } catch (error) {}
      }
    }

    const welcomeChannel = member.guild.channels.cache.get(config.channels.welcomeChannel);
    
    if (welcomeChannel && welcomeChannel.isTextBased()) {
      const memberCount = member.guild.memberCount;
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`Welcome to ${member.guild.name}!`)
        .setDescription(`**Hey ${member}! Welcome to our server!\nMake sure to read the rules and enjoy your stay!**`)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: member.guild.iconURL() || undefined });

      try {
        await welcomeChannel.send({ embeds: [embed] });
      } catch (error) {}
    }
  }
};
