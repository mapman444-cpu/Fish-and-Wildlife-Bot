const {
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} = require("discord.js");
const SupportModel = require("../Models/SupportModel");

const TYPE_LABELS = {
  General_Support: "General Support",
  Administrative_Support: "Administrative Support",
};

module.exports = {
  customID: "support:menu",
  execute: async function (interaction, client, args) {
    const { user } = interaction;
    const type = interaction.values[0]; // now "General_Support" or "Administrative_Support"
    const label = TYPE_LABELS[type];

    const existing = await SupportModel.findOne({
      userId: user.id,
      type,
    }).catch(() => null);

    if (existing) {
      return interaction.reply({
        content: `You already have an open **${label}** ticket: <#${existing.channelId}>`,
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`support:ticketreason:${type}`)
      .setTitle(`${label} - Reason`);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Please describe your issue")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Enter the reason for your ticket...")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

    return interaction.showModal(modal);
  },
};
