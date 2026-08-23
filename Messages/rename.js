module.exports = {
  name: "rename",
  description: "Renames the current ticket channel.",

  users: ["1484677423625670761"],
  roles: ["1530278365506965624", "1539792807181418606"],

  execute: async function (message, client, args) {
    const name = args
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    if (!name) {
      const reply = await message.reply("Usage: `rename <name>`");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    const channel = message.channel;
    const oldName = channel.name;
    await channel.setName(name, `Renamed by ${message.author.tag}`);
    await message.delete().catch(() => {});

    const confirm = await channel.send(
      `Channel renamed from **${oldName}** to **${name}**`,
    );
    setTimeout(() => confirm.delete().catch(() => {}), 5000);
  },
};
