const { Client, GatewayIntentBits, Events } = require('discord.js');
const { processMessage } = require('./lobster');

let client;

function initDiscord(token) {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ]
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`✅ Discord bot ready as ${c.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user) && message.channel.type !== 1) return;

    const content = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!content) return;

    try {
      await message.channel.sendTyping();
      const response = await processMessage(content, message.author.id, 'discord');
      await message.reply(response);
    } catch (error) {
      console.error('Discord error:', error);
      await message.reply('❌ Error processing your message.');
    }
  });

  client.login(token);
  return client;
}

module.exports = { initDiscord };
