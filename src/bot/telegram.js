import TelegramBot from 'node-telegram-bot-api';
import { askLobster } from './lobster.js';

const userHistories = new Map();

export function createTelegramBot(config) {
  const bot = new TelegramBot(config.platforms.telegram.token, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;

    const history = userHistories.get(chatId) || [];

    try {
      const reply = await askLobster(text, history, config);
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: reply });
      if (history.length > (config.contextWindow || 10) * 2) history.splice(0, 2);
      userHistories.set(chatId, history);
      await bot.sendMessage(chatId, reply);
    } catch (err) {
      await bot.sendMessage(chatId, '🦞 The lobster is temporarily indisposed.');
      console.error('Telegram error:', err.message);
    }
  });

  return bot;
}
