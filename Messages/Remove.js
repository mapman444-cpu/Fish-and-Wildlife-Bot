module.exports = {
  name: "remove",
  description: "Remove roles from your account. Usage: -remove @role1 @role2 …",
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
        "Usage: `-remove @role1 @role2 …`\nExample: `-remove @Member`"
      );
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await message.delete().catch(() => {});
      return;
    }

    const member = message.member;
    const removed = [];
    const failed = [];

    for (const roleId of roleIds) {
      try {
        await member.roles.remove(roleId);
        removed.push(roleId);
      } catch {
        failed.push(roleId);
      }
    }

    const removedNames = removed
      .map((id) => message.guild.roles.cache.get(id)?.name || id)
      .join(", ");

    const failedNames = failed
      .map((id) => message.guild.roles.cache.get(id)?.name || id)
      .join(", ");

    let content = "";
    if (removed.length) {
      content += `Removed **${removed.length}** role(s): ${removedNames}`;
    }
    if (failed.length) {
      content += `\nFailed to remove **${failed.length}** role(s): ${failedNames}`;
    }

    // Delete the user's command message
    await message.delete().catch(() => {});

    const confirm = await message.channel.send(content.trim());
    setTimeout(() => confirm.delete().catch(() => {}), 5000);
  },
};
