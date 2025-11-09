import { Events, ActivityType } from 'discord.js';
import client from '../index';
import config from '../config';
import db from '../database';

export default {
  name: Events.ClientReady,
  once: true,
  execute(readyClient: typeof client) {
    readyClient.user?.setPresence({
      activities: [{ name: 'Syntrix Labs', type: ActivityType.Watching }],
      status: 'idle'
    });

    setInterval(() => {
      const stmt = db.prepare('SELECT * FROM mutes WHERE expires_at IS NOT NULL AND expires_at <= ?');
      const expiredMutes = stmt.all(Date.now());

      for (const mute of expiredMutes as any[]) {
        const guild = readyClient.guilds.cache.first();
        if (!guild) continue;

        guild.members.fetch(mute.user_id).then(member => {
          const mutedRole = guild.roles.cache.get(config.roles.mutedRole);
          if (mutedRole && member.roles.cache.has(mutedRole.id)) {
            member.roles.remove(mutedRole);
          }
        }).catch(() => {});

        db.prepare('DELETE FROM mutes WHERE id = ?').run(mute.id);
      }
    }, 30000);
  }
};
