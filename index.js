const fs = require("fs");
const path = require("path");
const http = require("http");

const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
    ActivityType
} = require("discord.js");

const mongoose = require("mongoose");

require("dotenv").config();

console.log("Loaded Discord.js version:", require("discord.js").version);

// ==========================================
// CLIENT
// ==========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==========================================
// ERROR HANDLING
// ==========================================

process.on("unhandledRejection", reason => {
    console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", err => {
    console.error("Uncaught Exception:", err);
});

client.on("error", err => {
    console.error("Discord client error:", err);
});

client.on("shardError", err => {
    console.error("Shard error:", err);
});

client.on("disconnect", () => {
    console.warn("Bot disconnected. Attempting to reconnect...");
});

client.on("reconnecting", () => {
    console.log("Bot reconnecting...");
});

// ==========================================
// MONGODB
// ==========================================

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("📦 Connected to MongoDB");
    })
    .catch(err => {
        console.error("MongoDB Error:", err);
    });

// ==========================================
// SLASH COMMANDS
// ==========================================

client.commands = new Collection();

const slashCommands = [];

const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ("data" in command && "execute" in command) {
                client.commands.set(command.data.name, command);
                slashCommands.push(command.data.toJSON());

                console.log(`✅ Loaded slash command: /${command.data.name}`);
            } else {
                console.log(
                    `⚠️ Slash command ${file} is missing "data" or "execute".`
                );
            }
        } catch (error) {
            console.error(`❌ Failed to load slash command ${file}:`, error);
        }
    }
} else {
    console.log("⚠️ Commands folder does not exist.");
}

// ==========================================
// REGISTER SLASH COMMANDS
// ==========================================

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("🔄 Refreshing slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: slashCommands
            }
        );

        console.log("✅ Slash commands registered successfully.");
    } catch (error) {
        console.error("❌ Failed to register slash commands:", error);
    }
})();

// ==========================================
// PREFIX / MESSAGE COMMANDS
// ==========================================

client.messageCommands = new Collection();

const messagesPath = path.join(__dirname, "messages");

// Commands that are loaded as prefix commands
const dashCommands = [
    "support.js",
    "rename.js",
    "add.js",
    "remove.js",
    "cr.js"
];

if (fs.existsSync(messagesPath)) {
    for (const file of dashCommands) {
        try {
            const filePath = path.join(messagesPath, file);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ Message command not found: ${file}`);
                continue;
            }

            const command = require(filePath);

            if ("name" in command && "execute" in command) {
                client.messageCommands.set(
                    command.name.toLowerCase(),
                    command
                );

                console.log(
                    `✅ Loaded prefix command: -${command.name.toLowerCase()}`
                );
            } else {
                console.log(
                    `⚠️ Dash command ${file} is missing "name" or "execute".`
                );
            }
        } catch (error) {
            console.error(
                `❌ Failed to load message command ${file}:`,
                error
            );
        }
    }
} else {
    console.log("⚠️ Messages folder does not exist.");
}

// ==========================================
// PREFIX COMMAND HANDLER
// ==========================================

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const prefix = process.env.PREFIX || "-";

    if (!message.content.startsWith(prefix)) return;

    const content = message.content
        .slice(prefix.length)
        .trim();

    if (!content) return;

    const args = content.split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.messageCommands.get(commandName);

    if (!command) return;

    console.log(
        `📨 Prefix command: ${prefix}${commandName} | User: ${message.author.tag}`
    );

    try {
        // message, client, args
        await command.execute(message, client, args);

    } catch (error) {
        console.error(
            `❌ Prefix command "${commandName}" error:`,
            error
        );

        try {
            await message.channel.send({
                content:
                    `❌ There was an error while executing \`${prefix}${commandName}\`.`
            });
        } catch (sendError) {
            console.error(
                "❌ Failed to send prefix command error:",
                sendError
            );
        }
    }
});

// ==========================================
// INTERACTION HANDLER
// ==========================================

client.on("interactionCreate", async interaction => {

    // ======================================
    // SLASH COMMANDS
    // ======================================

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(
                `❌ Error executing /${interaction.commandName}:`,
                error
            );

            const errorMessage = {
                content: "❌ There was an error while executing this command.",
                ephemeral: true
            };

            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (replyError) {
                console.error(
                    "❌ Failed to send slash command error:",
                    replyError
                );
            }
        }

        return;
    }

    // ======================================
    // SUPPORT SELECT MENU
    // ======================================

    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === "support:menu") {
            try {
                const panel = require("../menus/SupportPanel.js");

                return await panel.execute(
                    interaction,
                    client,
                    []
                );
            } catch (error) {
                console.error(
                    "❌ Support menu error:",
                    error
                );

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: "❌ There was an error processing this menu.",
                        ephemeral: true
                    });
                }
            }
        }
    } 

    // ======================================
    // SUPPORT MODALS
    // ======================================

    if (interaction.isModalSubmit()) {

        if (
            interaction.customId.startsWith(
                "support:ticketreason:"
            )
        ) {
            try {
                const handler = require(
                    "./messages/supportTicketReason.js"
                );

                const args = interaction.customId
                    .split(":")
                    .slice(1);

                // ["ticketreason", "General_Support"]
                return await handler.execute(
                    interaction,
                    client,
                    args.slice(1)
                );
            } catch (error) {
                console.error(
                    "❌ Support modal error:",
                    error
                );

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: "❌ There was an error processing your request.",
                        ephemeral: true
                    });
                }
            }
        }
    }
});

// ==========================================
// BOT READY
// ==========================================

client.once("ready", () => {

    console.log("==========================================");
    console.log(`🤖 Bot successfully logged in as ${client.user.tag}`);
    console.log(`🆔 Bot ID: ${client.user.id}`);
    console.log(`🏠 Servers: ${client.guilds.cache.size}`);
    console.log(`⚡ Prefix: ${process.env.PREFIX || "-"}`);
    console.log("==========================================");

    // ======================================
    // BOT STATUS
    // ======================================

    const statuses = [
        {
            name: "Watching over Arizona Game & Fish",
            type: ActivityType.Watching
        }
    ];

    let currentStatus = 0;

    const updateStatus = () => {

        client.user.setPresence({
            activities: [
                statuses[currentStatus]
            ],
            status: "online"
        });

    };

    updateStatus();

    setInterval(() => {

        currentStatus =
            (currentStatus + 1) % statuses.length;

        updateStatus();

    }, 15000);
});

// ==========================================
// LOGIN
// ==========================================

client.login(process.env.TOKEN);