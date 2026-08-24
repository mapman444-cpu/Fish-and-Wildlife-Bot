const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  MessageFlags,
} = require("discord.js");

const AssistanceModel = require("../Database/Models/AssistanceModel");
const SupportModel = require("../Database/Models/SupportModel");


module.exports = {
  name: "cr",
  description: "Send a close request in the current ticket.",
  roles: ["1530278365506965624", "1539792807181418606"],

  allowedCategories: ["1530282852040577044", "1540862045384085514"],

  async execute(message) {
    const client = message.client;

    // Extract args from message content
    const args = message.content.split(" ").slice(1);

    const allowedCategories = module.exports.allowedCategories;

    // Check if channel is in allowed category
    if (!allowedCategories.includes(message.channel.parentId)) {
      const reply = await message.reply("This command cannot be used in this channel.");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await message.delete().catch(() => {});
      return;
    }

    // Check if channel is a ticket
    const ticket =
      (await AssistanceModel.findOne({ channelId: message.channel.id })) ??
      (await SupportModel.findOne({ channelId: message.channel.id }));

    if (!ticket) {
      const reply = await message.reply("This channel is not a ticket.");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await message.delete().catch(() => {});
      return;
    }

    // Delete the user's command message
    await message.delete().catch(() => {});

    // Reason handling
    const reason = args.length > 0 ? args.join(" ") : null;
    const acceptId = reason
      ? `crAccept:button_${reason.substring(0, 84)}`
      : "crAccept:button";

    // Build UI container
    const container = new ContainerBuilder()
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Has your issue been resolved?\n<@${ticket.userId}>, the support team is requesting to close this ticket.` +
            (reason ? `\n\n**Reason:** ${reason}` : "") +
            `\n\nIf everything is solved, click **Accept** to close the ticket.\nIf you still need help, click **Deny** to keep it open.`,
        ),
      )
      .addSeparatorComponents((s) => s.setDivider(true))
      .addTextDisplayComponents((t) =>
        t.setContent(`-# Requested by ${message.author}`),
      );

    // Buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(acceptId)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("crDeny:button")
        .setLabel("Deny")
        .setStyle(ButtonStyle.Danger),
    );

    // Send panel
    await message.channel.send({
      components: [container, row],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
