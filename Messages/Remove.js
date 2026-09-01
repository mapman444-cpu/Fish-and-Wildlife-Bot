module.exports = {
  name: "remove",
  description: "Remove roles from your account. Usage: -remove @role1 @role2 …",
  roles: ["WHO_CAN_USE_THIS_COMMAND_ROLE_ID"],
  cooldown: 3,

  execute: async function (message, client, args) {
    if (!message.guild) {
      return await message
        .reply("This command can only be used in a server.")
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const roleMentions = message.mentions.roles;

    const roleIds = [...roleMentions.values()].map((r) => r.id);

    if (roleIds.length === 0) {
      const reply = await message.reply(
        "Usage: `-remove @role1 @role2 …`\nExample: `-remove @Member`",
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

    await message.delete().catch(() => {});
    const confirm = await message.channel.send(content.trim());
    setTimeout(() => confirm.delete().catch(() => {}), 5000);
  },
};
