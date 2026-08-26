const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { getRobloxInfo } = require("../Utils/docksystem");
const SupportModel = require("../Models/SupportModel");

const TICKET_ROLES = {
  Administrative_Support: ["1539792807181418606"],
  General_Support: ["1530278365506965624"],
};

const CATEGORIES = {
  General_Support: "1530282852040577044",
  Administrative_Support: "1540862045384085514"
};

const TYPE_LABELS = {
  General_Support: "General Support",
  Administrative_Support: "Administrative Support"
};

const BANNERS = {
  General_Support: "https://i.imgur.com/4AiXzf8.jpeg",
  Administrative_Support: "https://i.imgur.com/4AiXzf8.jpeg"
};

module.exports = {
  customID: "support:ticketreason",

  async execute(interaction, client, args) {
    const type = args[0]; // "General_Support" or "Administrative_Support"
    const { guild, user } = interaction;
    const label = TYPE_LABELS[type];
    const categoryId = CATEGORIES[type];
    const reason = interaction.fields.getTextInputValue("reason");

    await interaction.reply({
      content: `Creating your **${label}** ticket...`,
      ephemeral: true
    });

    const existing = await SupportModel.findOne({
      userId: user.id,
      type
    }).catch(() => null);

    if (existing) {
      return interaction.editReply({
        content: `You already have an open **${label}** ticket: <#${existing.channelId}>`
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
          PermissionFlagsBits.AttachFiles
        ]
      },
      ...TICKET_ROLES[type].map((roleId) => ({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      }))
    ];

    const channel = await guild.channels.create({
      name: `🔴・${user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId || null,
      permissionOverwrites
    });

    await SupportModel.create({
      userId: user.id,
      channelId: channel.id,
      type
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

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle(`${label} - ${user.username}`)
      .setDescription(`**Reason:** ${reason}\n\nPlease wait for a staff member to assist you.`)
      .setImage(BANNERS[type]);

    if (robloxUsername && robloxId) {
      embed.addFields({
        name: "Roblox Information",
        value:
          `**Profile:** https://www.roblox.com/users/${robloxId}/profile\n` +
          `**User ID:** ${robloxId}\n` +
          (robloxCreatedTs ? `**Created:** <t:${robloxCreatedTs}:D>` : "")
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("closeSupport:button")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({
      content: `@here | <@${user.id}>`,
      embeds: [embed],
      components: [row]
    });

    await interaction.editReply({
      content: `Your **${label}** ticket has been created: <#${channel.id}>`
    });
  }
};
