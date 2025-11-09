"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const database_1 = __importDefault(require("../database"));
const config_1 = __importDefault(require("../config"));
exports.default = {
    name: discord_js_1.Events.GuildMemberAdd,
    async execute(member) {
        const stmt = database_1.default.prepare('SELECT role_id FROM autoroles WHERE guild_id = ?');
        const autoroles = stmt.all(member.guild.id);
        for (const autorole of autoroles) {
            const role = member.guild.roles.cache.get(autorole.role_id);
            if (role) {
                try {
                    await member.roles.add(role);
                }
                catch (error) { }
            }
        }
        const welcomeChannel = member.guild.channels.cache.get(config_1.default.channels.welcomeChannel);
        if (welcomeChannel && welcomeChannel.isTextBased()) {
            const memberCount = member.guild.memberCount;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.success)
                .setTitle(`Welcome to ${member.guild.name}!`)
                .setDescription(`**Hey ${member}! Welcome to our server!\nMake sure to read the rules and enjoy your stay!**`)
                .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: member.guild.iconURL() || undefined });
            try {
                await welcomeChannel.send({ embeds: [embed] });
            }
            catch (error) { }
        }
    }
};
