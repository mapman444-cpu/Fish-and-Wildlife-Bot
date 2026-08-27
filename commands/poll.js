const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create a poll with multiple options")
        .addStringOption(o =>
            o.setName("question")
             .setDescription("Poll question")
             .setRequired(true))
        .addStringOption(o =>
            o.setName("options")
             .setDescription("Comma-separated list of options (e.g., Yes,No,Maybe)")
             .setRequired(false)
        ),

    async execute(interaction) {
        const question = interaction.options.getString("question");
        const rawOptions = interaction.options.getString("options");

        // Default to Yes/No if no options provided
        const options = rawOptions
            ? rawOptions.split(",").map(o => o.trim()).filter(Boolean)
            : ["Yes", "No"];

        if (options.length > 10) {
            return interaction.reply({
                content: "Please limit polls to **10 options**.",
                ephemeral: true
            });
        }

        const numberEmojis = [
            "1️⃣","2️⃣","3️⃣","4️⃣","5️⃣",
            "6️⃣","7️⃣","8️⃣","9️⃣","🔟"
        ];

        const description = options
            .map((opt, i) => `${numberEmojis[i]} — ${opt}`)
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle("📊 AZG&F Poll")
            .setDescription(`**${question}**\n\n${description}`);

        const message = await interaction.reply({
            embeds: [embed],
            fetchReply: true
        });

        // React with number emojis
        for (let i = 0; i < options.length; i++) {
            await message.react(numberEmojis[i]);
        }
    }
};
