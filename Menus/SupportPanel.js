const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  MessageFlags,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} = require("discord.js");
const { getRobloxInfo } = require("../Utils/docksystem");
const SupportModel = require("../Database/Models/SupportModel");

const TICKET_ROLES = {
  Administrative_Support: ["1539792807181418606"],
  General_Support: ["1530278365506965624"],
};

const CATEGORIES = {
  General_Support: "1530282852040577044",
  Administrative_Support: "1540862045384085514",
};

const TYPE_LABELS = {
  General_Support: "General Support",
  Administrative_Support: "Administrative Support",
};

const BANNERS = {
  General_Support: "YOUR_BANNER_HERE",
  Administrative_Support: "YOUR_BANNER_HERE",
};

module.exports = {
  customID: "support:menu",
  execute: async function (interaction, client, args) {
    const { user } = interaction;
    const type = interaction.values[0];
    const label = TYPE_LABELS[type];

    const existing = await SupportModel.findOne({
      userId: user.id,
      type,
    }).catch(() => null);
    if (existing) {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents((t) =>
            t.setContent(
              `You already have an open **${label}** ticket: <#${existing.channelId}>`,
            ),
          ),
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`support:ticketreason_${type}`)
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
