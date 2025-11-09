"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTranscript = createTranscript;
exports.sendTranscriptToLog = sendTranscriptToLog;
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../config"));
async function createTranscript(channel, closedBy, reason = 'No reason provided') {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = Array.from(messages.values()).reverse();
        let transcript = `Transcript for ${channel.name}\n`;
        transcript += `Closed by: ${closedBy}\n`;
        transcript += `Reason: ${reason}\n`;
        transcript += `Date: ${new Date().toLocaleString()}\n`;
        transcript += `Total Messages: ${sortedMessages.length}\n`;
        transcript += `${'='.repeat(50)}\n\n`;
        for (const msg of sortedMessages) {
            const timestamp = msg.createdAt.toLocaleString();
            const author = msg.author.tag;
            const content = msg.content || '[No content]';
            transcript += `[${timestamp}] ${author}:\n${content}\n`;
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(attachment => {
                    transcript += `  [Attachment: ${attachment.url}]\n`;
                });
            }
            if (msg.embeds.length > 0) {
                transcript += `  [Embed: ${msg.embeds.length} embed(s)]\n`;
            }
            transcript += '\n';
        }
        const buffer = Buffer.from(transcript, 'utf-8');
        const attachment = new discord_js_1.AttachmentBuilder(buffer, {
            name: `transcript-${channel.name}-${Date.now()}.txt`
        });
        return attachment;
    }
    catch (error) {
        return null;
    }
}
async function sendTranscriptToLog(channel, transcript, closedBy, ticketType) {
    if (!transcript)
        return;
    try {
        const transcriptChannelId = ticketType === 'order'
            ? config_1.default.channels.orderTranscriptChannel
            : config_1.default.channels.ticketTranscriptChannel;
        const transcriptChannel = channel.guild.channels.cache.get(transcriptChannelId);
        if (transcriptChannel && transcriptChannel.isTextBased()) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config_1.default.colors.info)
                .setTitle(`${ticketType === 'order' ? config_1.default.emojis.order : config_1.default.emojis.ticket} ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Closed`)
                .setDescription(`**Channel:** ${channel.name}\n**Closed by:** ${closedBy}\n**Time:** ${new Date().toLocaleString()}`)
                .setTimestamp()
                .setFooter({ text: 'Syntrix Labs', iconURL: channel.client.user?.displayAvatarURL() });
            await transcriptChannel.send({
                embeds: [embed],
                files: [transcript]
            });
        }
    }
    catch (error) {
        return;
    }
}
