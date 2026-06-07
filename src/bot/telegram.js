const TelegramBot = require('node-telegram-bot-api');
const { processMessage } = require('./lobster');

function initTelegram(token) {
  const bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const content = msg.text;
    if (!content) return;

    try {
      bot.sendChatAction(chatId, 'typing');
      const response = await processMessage(content, String(chatId), 'telegram');
      await bot.sendMessage(chatId, response);
    } catch (error) {
      console.error('Telegram error:', error);
      await bot.sendMessage(chatId, '❌ Error processing your message.');
    }
  });

  console.log('✅ Telegram bot ready');
  return bot;
}

module.exports = { initTelegram };
