import { Client, GatewayIntentBits } from 'discord.js';
import { getLobsterResponse } from './lobster.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.log('No se encontró DISCORD_TOKEN en el archivo .env');
} else {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages
        ]
    });

    client.once('ready', () => {
        console.log(`🦞 Langosta conectada a Discord como ${client.user.tag}`);
    });

    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const isMentioned = message.mentions.has(client.user);
        const isDM = !message.guild;

        if (isMentioned || isDM) {
            console.log(`Mensaje recibido en Discord: ${message.content}`);
            message.channel.sendTyping();

            const response = await getLobsterResponse(message.content);
            await message.reply(response);
        }
    });

    client.login(token);
}
