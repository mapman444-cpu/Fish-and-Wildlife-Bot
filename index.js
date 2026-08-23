const fs = require('fs');
const path = require('path');
const http = require('http');
const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
    ActivityType
} = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

// Log Discord.js version
console.log("Loaded Discord.js version:", require('discord.js').version);

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent   // REQUIRED for message commands
    ]
});

// Error handlers
process.on('unhandledRejection', reason => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});

client.on('error', err => {
    console.error('Discord client error:', err);
});

client.on('shardError', err => {
    console.error('Shard error:', err);
});

client.on('disconnect', () => {
    console.warn('Bot disconnected. Attempting to reconnect...');
});

client.on('reconnecting', () => {
    console.log('Bot reconnecting...');
});

// Heartbeat
setInterval(() => {
    console.log("Heartbeat: Bot is alive");
}, 5 * 60 * 1000);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch(err => console.error('MongoDB Error:', err));

// Command loader
client.commands = new Collection();
const commands = [];

// FIXED PATH — commands folder is NOT inside /src
const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`⚠️ Command at ${filePath} is missing "data" or "execute".`);
    }
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Refreshing slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('✅ Slash commands registered successfully.');
    } catch (error) {
        console.error(error);
    }
})();

// Interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ No command found for ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        const errorMessage = {
            content: '❌ There was an error while executing this command.',
            ephemeral: true
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// ---------------------------------------------------------
// 📌 MESSAGE COMMANDS (-support, -close, -rename) WITH AUTO-DELETE
// ---------------------------------------------------------
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const msg = message.content.trim();

    // -support
    if (msg.startsWith("-support")) {
        await message.delete().catch(() => {});
    }

    // -close
    if (msg.startsWith("-close")) {
        await message.delete().catch(() => {});
    }

    // -rename
    if (msg.startsWith("-rename")) {
        await message.delete().catch(() => {});

        const newName = msg.replace("-rename", "").trim();

        try {
            await message.channel.setName(newName);
            return message.channel.send(`Channel renamed to **${newName}**`);
        } catch (err) {
            console.error(err);
            return message.channel.send("I couldn't rename the channel.");
        }
    }
});

// Ready event
client.once('ready', () => {
    console.log(`🤖 Bot successfully logged in as ${client.user.tag}`);

    const statuses = [
        {
            name: 'Watching over Arizona Game & Fish',
            type: ActivityType.Watching
        },
    ];

    let currentStatus = 0;

    const updateStatus = () => {
        client.user.setPresence({
            activities: [statuses[currentStatus]],
            status: 'online'
        });
    };

    updateStatus();
});

// Render heartbeat server
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running");
}).listen(PORT, () => {
    console.log(`🌐 Render PORT active on ${PORT}`);
});

// Login
client.login(process.env.TOKEN);
