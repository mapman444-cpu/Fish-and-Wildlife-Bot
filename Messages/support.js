const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  MessageFlags,
} = require("discord.js");

const STAFF_ROLES = ["1539794524048728154"];

const SUPPORT_CHANNEL_ID = "1411868670300524756";

const BANNER = "https://cdn.discordapp.com/attachments/1525969237129298032/1532190239282434058/ssrp_60.png?ex=6a96cb9b&is=6a957a1b&hm=90f4d91032263b3c5dd62c43858b25dcccb85be6c1147723f87b4a366a815402&";

module.exports = {
  name: "support",
  description: "Send the support ticket panel to the support channel.",

  execute: async function (message, client, args) {
    if (!message.member.roles.cache.some((r) => STAFF_ROLES.includes(r.id))) {
      const reply = await message.reply(
        "You do not have permission to use this command.",
      );
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    await message.delete().catch(() => {});

    const supportChannel = client.channels.cache.get(SUPPORT_CHANNEL_ID);
    if (!supportChannel) {
      return message.channel
        .send("Support channel not found.")
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const container = new ContainerBuilder()
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(BANNER),
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
      .addTextDisplayComponents((t) => t.setContent("> YOUR TEXT HERE"))
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(1),
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("support:menu")
            .setPlaceholder("Select support type.")
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel("General Support")
                .setValue("general"),
                new StringSelectMenuOptionBuilder()
                .setLabel("Warden Report")
                .setValue("report"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Administrative Support")
                .setValue("administrative"),
            ),
        ),
      );

    await supportChannel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
