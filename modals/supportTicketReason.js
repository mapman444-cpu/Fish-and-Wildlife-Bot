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
} = require("discord.js");
const { getRobloxInfo } = require("../Utils/docksystem");
const SupportModel = require("../Database/Models/SupportModel");

const TICKET_ROLES = {
  report: ["WHO_CAN_SEE_THIS_TYPE_OF_TICKET"],
  administrative: ["WHO_CAN_SEE_THIS_TYPE_OF_TICKET"],
  general: ["WHO_CAN_SEE_THIS_TYPE_OF_TICKET"],
};

const CATEGORIES = {
  general: "THE_CATEGORY_ID_FOR_GENERAL_TICKETS",
  administrative: "THE_CATEGORY_ID_FOR_ADMINISTRATIVE_TICKETS",
  report: "THE_CATEGORY_ID_FOR_REPORT_TICKETS",
};
// IN THE () BELOW IS THE LABEL. OUTSIDE IS THE VALUE
const TYPE_LABELS = {
  general: "General Support",
  administrative: "Administrative Support",
  report: "Warden Report",
};

const BANNERS = {
  general: "YOUR_BANNER_HERE",
  administrative: "YOUR_BANNER_HERE",
  report: "YOUR_BANNER_HERE",
};

module.exports = {
  customID: "support:ticketreason",

  async execute(interaction, client, args) {
    const type = args[0];
    const { guild, user } = interaction;
    const label = TYPE_LABELS[type];
    const categoryId = CATEGORIES[type];
    const reason = interaction.fields.getTextInputValue("reason");

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const existing = await SupportModel.findOne({
      userId: user.id,
      type,
    }).catch(() => null);
    if (existing) {
      return interaction.editReply({
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

    const permissionOverwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      ...TICKET_ROLES[type].map((roleId) => ({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      })),
    ];

    const channel = await guild.channels.create({
      name: `🔴・${user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId || null,
      permissionOverwrites,
    });

    await SupportModel.create({
      userId: user.id,
      channelId: channel.id,
      type,
    });

    let robloxUsername = null;
    let robloxId = null;
    let robloxCreatedTs = null;
    try {
      const robux = await getRobloxInfo(user.id, interaction, client);
      if (!robux.error) {
        robloxUsername = robux.username;
        robloxId = robux.robloxId;
        robloxCreatedTs = robux.createdTs;
      }
    } catch {}

    const ticketContainer = new ContainerBuilder()
      .addTextDisplayComponents((t) => t.setContent(`@here | <@${user.id}>`))
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(BANNERS[type]),
        ),
      )
      .addSeparatorComponents((s) => s.setDivider(false))
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## ${label} - ${user.username}\n**Reason:** ${reason}\n\nPlease wait for a staff member to assist you.`,
        ),
      );

    if (robloxUsername && robloxId) {
      const profileLink = `https://www.roblox.com/users/${robloxId}/profile`;
      const joinedLine =
        robloxCreatedTs !== null ? `\n-# Joined <t:${robloxCreatedTs}:D>` : "";
      ticketContainer
        .addSeparatorComponents((s) => s.setDivider(false))
        .addTextDisplayComponents((s) =>
          s.setContent(
            `## Roblox Information\n-# **Roblox Profile:** [${robloxUsername}](${profileLink})\n-# **User ID:** ${robloxId}\n-# **Creation Date:** ${joinedLine}`,
          ),
        );
    }

    ticketContainer
      .addSeparatorComponents((s) => s.setDivider(false))
      .addTextDisplayComponents((s) =>
        s.setContent("-# Use the button below to close this ticket."),
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("closeSupport:button")
            .setLabel("Close Ticket")
            .setStyle(ButtonStyle.Secondary),
        ),
      );

    await channel.send({
      components: [ticketContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    await interaction.editReply({
      components: [
        new ContainerBuilder().addTextDisplayComponents((t) =>
          t.setContent(
            `Your **${label}** ticket has been created: <#${channel.id}>`,
          ),
        ),
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  },
};
