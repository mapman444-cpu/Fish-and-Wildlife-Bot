const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  FileBuilder,
  MessageFlags,
} = require("discord.js");
const SupportModel = require("../../Database/Models/SupportModel");
const discordTranscripts = require("discord-html-transcripts");

const transcriptsChannelId = "1530284471297769512";
 
module.exports = {
  customID: "closeSupport:button",
  execute: async function (interaction, client, args) {
    try {
      await interaction.reply("- Closing ticket.");

      const ticket = await SupportModel.findOne({
        channelId: interaction.channel.id,
      });

      if (!ticket) {
        return interaction.editReply("Ticket not found.");
      }

      const transcriptChannel = await client.channels
        .fetch(transcriptsChannelId)
        .catch(() => null);

      const transcript = await discordTranscripts.createTranscript(
        interaction.channel,
        { poweredBy: false, footerText: `${interaction.guild.name}` },
      );

      const owner = await client.users.fetch(ticket.userId).catch(() => null);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## Ticket Transcript"),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Channel Name:** ${interaction.channel.name}\n**Channel ID:** ${interaction.channel.id}`,
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Owner:** ${owner ? owner.username : "Unknown"}\n**Mention:** <@${ticket.userId}>\n**User ID:** ${ticket.userId}`,
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Closed By:** ${interaction.user.username}\n**Mention:** ${interaction.user}\n**Opened On:** <t:${Math.floor(ticket.created / 1000)}:F>\n**Closure Reason:** Resolved.`,
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
        .addFileComponents(
          new FileBuilder().setURL(
            `attachment://transcript-${interaction.channel.id}.html`,
          ),
        );

      const filePayload = {
        components: [container],
        files: [
          {
            attachment: transcript.attachment,
            name: `transcript-${interaction.channel.id}.html`,
          },
        ],
        flags: MessageFlags.IsComponentsV2,
      };

      if (transcriptChannel) await transcriptChannel.send(filePayload);
      if (owner) await owner.send(filePayload).catch(() => {});

      const ticketChannel = interaction.channel;
      await SupportModel.deleteOne({ channelId: ticketChannel.id });
      await interaction.editReply("- Ticket closed.");
      setTimeout(async () => {
        await ticketChannel.delete().catch(() => {});
      }, 1000);
    } catch (error) {
      await interaction.editReply("An error occurred closing the ticket.");
      console.error(error);
    }
  },
};
