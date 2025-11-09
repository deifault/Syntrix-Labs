"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../config"));
const database_1 = __importDefault(require("../database"));
exports.default = {
    name: discord_js_1.Events.ClientReady,
    once: true,
    execute(readyClient) {
        readyClient.user?.setPresence({
            activities: [{ name: 'Syntrix Labs', type: discord_js_1.ActivityType.Watching }],
            status: 'idle'
        });
        setInterval(() => {
            const stmt = database_1.default.prepare('SELECT * FROM mutes WHERE expires_at IS NOT NULL AND expires_at <= ?');
            const expiredMutes = stmt.all(Date.now());
            for (const mute of expiredMutes) {
                const guild = readyClient.guilds.cache.first();
                if (!guild)
                    continue;
                guild.members.fetch(mute.user_id).then(member => {
                    const mutedRole = guild.roles.cache.get(config_1.default.roles.mutedRole);
                    if (mutedRole && member.roles.cache.has(mutedRole.id)) {
                        member.roles.remove(mutedRole);
                    }
                }).catch(() => { });
                database_1.default.prepare('DELETE FROM mutes WHERE id = ?').run(mute.id);
            }
        }, 30000);
    }
};
