import { TextChannel, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import config from '../config';

export async function createTranscript(channel: TextChannel, closedBy: string, reason: string = 'No reason provided') {
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
    const attachment = new AttachmentBuilder(buffer, { 
      name: `transcript-${channel.name}-${Date.now()}.txt` 
    });

    return attachment;
  } catch (error) {
    return null;
  }
}

export async function sendTranscriptToLog(channel: TextChannel, transcript: AttachmentBuilder | null, closedBy: string, ticketType: string) {
  if (!transcript) return;

  try {
    const transcriptChannelId = ticketType === 'order' 
      ? config.channels.orderTranscriptChannel 
      : config.channels.ticketTranscriptChannel;
    
    const transcriptChannel = channel.guild.channels.cache.get(transcriptChannelId);
    
    if (transcriptChannel && transcriptChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(`${ticketType === 'order' ? config.emojis.order : config.emojis.ticket} ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Closed`)
        .setDescription(`**Channel:** ${channel.name}\n**Closed by:** ${closedBy}\n**Time:** ${new Date().toLocaleString()}`)
        .setTimestamp()
        .setFooter({ text: 'Syntrix Labs', iconURL: channel.client.user?.displayAvatarURL() });

      await (transcriptChannel as TextChannel).send({ 
        embeds: [embed], 
        files: [transcript] 
      });
    }
  } catch (error) {
    return;
  }
}
