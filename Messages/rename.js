module.exports = {
  name: "rename",
  description: "Renames the current ticket channel.",

  users: ["1484677423625670761"],
  roles: ["1530278365506965624", "1539792807181418606"],

  async execute(message) {
    const client = message.client;

    // Extract args from message content
    const args = message.content.split(" ").slice(1);

    const name = args
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    if (!name) {
      const reply = await message.reply("Usage: `-rename <name>`");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    const channel = message.channel;
    const oldName = channel.name;

    try {
      await channel.setName(name, `Renamed by ${message.author.tag}`);
    } catch (err) {
      console.error(err);
      const fail = await message.channel.send("I couldn't rename the channel.");
      setTimeout(() => fail.delete().catch(() => {}), 5000);
      return;
    }

    // Delete the user's command message
    await message.delete().catch(() => {});

    const confirm = await channel.send(
      `Channel renamed from **${oldName}** to **${name}**`
    );

    setTimeout(() => confirm.delete().catch(() => {}), 5000);
  },
};
