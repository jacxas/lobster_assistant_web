import { Client, GatewayIntentBits } from 'discord.js';
import { askLobster } from './lobster.js';

const userHistories = new Map();

export function createDiscordBot(config) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ]
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user) && message.channel.type !== 1) return;

    const text = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!text) return;

    const userId = message.author.id;
    const history = userHistories.get(userId) || [];

    try {
      await message.channel.sendTyping();
      const reply = await askLobster(text, history, config);
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: reply });
      if (history.length > (config.contextWindow || 10) * 2) history.splice(0, 2);
      userHistories.set(userId, history);
      await message.reply(reply);
    } catch (err) {
      await message.reply('🦞 The lobster encountered a deep-sea error.');
      console.error('Discord error:', err.message);
    }
  });

  client.login(config.platforms.discord.token);
  return client;
}
