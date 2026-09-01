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
  report: ["1539794524048728154"],
  administrative: ["WHO_CAN_SEE_THIS_TYPE_OF_TICKET"],
  general: ["WHO_CAN_SEE_THIS_TYPE_OF_TICKET"],
};

const CATEGORIES = {
  general: "1411868272898609182",
  administrative: "THE_CATEGORY_ID_FOR_ADMINISTRATIVE_TICKETS",
  report: "THE_CATEGORY_ID_FOR_REPORT_TICKETS",
};

const TYPE_LABELS = {
  general: "General Support",
  administrative: "Administrative Support",
  report: "Warden Report",
};

const BANNERS = {
  general: "https://cdn.discordapp.com/attachments/1525969237129298032/1532190239282434058/ssrp_60.png?ex=6a96cb9b&is=6a957a1b&hm=90f4d91032263b3c5dd62c43858b25dcccb85be6c1147723f87b4a366a815402&",
  administrative: "YOUR_BANNER_HERE",
  report: "YOUR_BANNER_HERE",
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
