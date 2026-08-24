module.exports = {
  name: "add",
  description: "Add roles to your account. Usage: -add @role1",
  roles: ["1530278365506965624", "1539792807181418606"],
  cooldown: 3,

  async execute(message) {
    const client = message.client;

    if (!message.guild) {
      return await message
        .reply("This command can only be used in a server.")
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    // Extract args from message content
    const args = message.content.split(" ").slice(1);

    const roleMentions = message.mentions.roles;
    const roleIds = [...roleMentions.values()].map((r) => r.id);

    if (roleIds.length === 0) {
      const reply = await message.reply(
        "Usage: `-add @role1`\nExample: `-add @Member`"
      );
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await message.delete().catch(() => {});
      return;
    }

    const member = message.member;
    const added = [];
    const failed = [];

    for (const roleId of roleIds) {
      try {
        await member.roles.add(roleId);
        added.push(roleId);
      } catch {
        failed.push(roleId);
      }
    }

    const addedNames = added
      .map((id) => message.guild.roles.cache.get(id)?.name || id)
      .join(", ");

    const failedNames = failed
      .map((id) => message.guild.roles.cache.get(id)?.name || id)
      .join(", ");

    let content = "";
    if (added.length) {
      content += `Added **${added.length}** role(s): ${addedNames}`;
    }
    if (failed.length) {
      content += `\nFailed to add **${failed.length}** role(s): ${failedNames}`;
    }

    // Delete the user's command message
    await message.delete().catch(() => {});

    const confirm = await message.channel.send(content.trim());
    setTimeout(() => confirm.delete().catch(() => {}), 5000);
  },
};
