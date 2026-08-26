const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} = require("discord.js");

const STAFF_ROLES = ["1539794524048728154"];
const SUPPORT_CHANNEL_ID = "1406372387963801631";
const BANNER = "https://i.imgur.com/4AiXzf8.jpeg"; // temporary test banner

module.exports = {
  name: "support",
  description: "Message command: sends the support ticket panel.",

  async execute(message) {
    const client = message.client;

    // Permission check
    if (!message.member.roles.cache.some((r) => STAFF_ROLES.includes(r.id))) {
      const reply = await message.reply("You do not have permission to use this command.");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    // Delete the user's command message
    await message.delete().catch(() => {});

    // Find support channel
    const supportChannel = client.channels.cache.get(SUPPORT_CHANNEL_ID);
    if (!supportChannel) {
      return message.channel
        .send("Support channel not found.")
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    // Build embed panel
    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setImage(BANNER)
      .setTitle("Arizona Game & Fish Support Panel")
      .setDescription(
        "🛠️ **General Support**\n" +
        "• Questions & Assistance\n" +
        "• Discord Server Help\n" +
        "• Rules & Policy Clarification\n" +
        "• Department Resources\n\n" +
        "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
        "📝 **Warden Report**\n" +
        "• Officer Conduct Reports\n" +
        "• Policy Violations\n" +
        "• Disciplinary Appeals\n" +
        "• Internal Incident Reports\n\n" +
        "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
        "👑 **Leadership Ticket**\n" +
        "• Command Staff Contact\n" +
        "• Critical Incident Reports\n" +
        "• Operational Concerns\n" +
        "• Confidential Matters\n\n" +
        "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
        "⚠️ **Notice**\n" +
        "• Select the correct category.\n" +
        "• All tickets are reviewed by authorized AG&F Staff.\n" +
        "• Misuse of the ticket system may result in disciplinary action."
      );

   // Select menu
const row = new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId("support:menu")
    .setPlaceholder("Select support type.")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("General Support")
        .setValue("General_Support"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Administrative Support")
        .setValue("Administrative_Support")
    )
);


    // Send panel
    await supportChannel.send({
      embeds: [embed],
      components: [row]
    });
  },
};
