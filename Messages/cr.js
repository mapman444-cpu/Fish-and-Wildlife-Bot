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
  roles: ["WHO_CAN_USE_THIS_COMMAND_ROLE_ID"],

  allowedCategories: ["CATEGORY_ID_1", "CATEGORY_ID_2"],

  execute: async function (message, client, args) {
    const allowedCategories = module.exports.allowedCategories;
    if (!allowedCategories.includes(message.channel.parentId)) {
      const reply = await message.reply(
        "This command cannot be used in this channel.",
      );
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await message.delete().catch(() => {});
      return;
    }

    const ticket =
      (await AssistanceModel.findOne({ channelId: message.channel.id })) ??
      (await SupportModel.findOne({ channelId: message.channel.id }));

    if (!ticket) {
      const reply = await message.reply("This channel is not a ticket.");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await message.delete().catch(() => {});
      return;
    }

    await message.delete().catch(() => {});

    const reason = args.length > 0 ? args.join(" ") : null;
    const acceptId = reason
      ? `crAccept:button_${reason.substring(0, 84)}`
      : "crAccept:button";

    const container = new ContainerBuilder()
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## Has your issue been resolved?\n<@${ticket.userId}>, the staff team is requesting to close this ticket.${reason ? `\n\n**Reason:** ${reason}` : ""}\n\nIf everything is solved, click **Accept** to close the ticket.\nIf you still need help, click **Deny** to keep it open.`,
        ),
      )
      .addSeparatorComponents((s) => s.setDivider(true))
      .addTextDisplayComponents((t) =>
        t.setContent(`-# Requested by ${message.author}`),
      );

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

    await message.channel.send({
      components: [container, row],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
