// ---------------------------------------------------------
// Discord Bot with Slash + "-" Message Commands
// ---------------------------------------------------------
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
        GatewayIntentBits.MessageContent
    ]
});

// Error handlers
process.on('unhandledRejection', reason => console.error('Unhandled Rejection:', reason));
process.on('uncaughtException', err => console.error('Uncaught Exception:', err));
client.on('error', err => console.error('Discord client error:', err));
client.on('shardError', err => console.error('Shard error:', err));
client.on('disconnect', () => console.warn('Bot disconnected. Attempting to reconnect...'));
client.on('reconnecting', () => console.log('Bot reconnecting...'));

// MongoDB connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch(err => console.error('MongoDB Error:', err));

// ---------------------------------------------------------
// Slash Command Loader
// ---------------------------------------------------------
client.commands = new Collection();
const slashCommands = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
    }
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Refreshing slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: slashCommands }
        );
        console.log('✅ Slash commands registered successfully.');
    } catch (error) {
        console.error(error);
    }
})();

// ---------------------------------------------------------
// Message Commands (for "-" prefix)
// ---------------------------------------------------------
client.messageCommands = new Collection();

const messagesPath = path.join(__dirname, "messages");
const dashCommands = ["support.js", "rename.js", "add.js", "remove.js", "cr.js"];

for (const file of dashCommands) {
    const filePath = path.join(messagesPath, file);
    const command = require(filePath);

    if ("name" in command && "execute" in command) {
        client.messageCommands.set(command.name.toLowerCase(), command);
    } else {
        console.log(`⚠️ Dash command ${file} is missing "name" or "execute".`);
    }
}


// ---------------------------------------------------------
// Slash Command Handler
// ---------------------------------------------------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

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
// "-" Message Command Handler
// ---------------------------------------------------------
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const msg = message.content.trim();
    if (!msg.startsWith("-")) return;

    const commandName = msg.split(" ")[0].slice(1).toLowerCase();
    const command = client.messageCommands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message);
        await message.delete().catch(() => {});
    } catch (error) {
        console.error(error);
        message.channel.send("❌ There was an error executing that command.");
    }
});

// ---------------------------------------------------------
// Ready Event
// ---------------------------------------------------------
client.once('clientReady', () => {
    console.log(`🤖 Bot successfully logged in as ${client.user.tag}`);

    const statuses = [
        { name: 'Watching over Arizona Game & Fish', type: ActivityType.Watching },
    ];
    let currentStatus = 0;

    const updateStatus = () => {
        client.user.setPresence({
            activities: [statuses[currentStatus]],
            status: 'online'
        });
    };

    updateStatus();
    setInterval(() => {
        currentStatus = (currentStatus + 1) % statuses.length;
        updateStatus();
    }, 15000);
});

// ---------------------------------------------------------
// Render Heartbeat Server
// ---------------------------------------------------------
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running");
}).listen(PORT, () => {
    console.log(`🌐 Render PORT active on ${PORT}`);
});

// ---------------------------------------------------------
// Login
// ---------------------------------------------------------
client.login(process.env.TOKEN);
