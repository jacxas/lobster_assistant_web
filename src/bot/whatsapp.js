import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { askLobster } from './lobster.js';

const userHistories = new Map();

export function createWhatsAppBot(config) {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  });

  client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp client ready!');
  });

  client.on('message', async (message) => {
    if (message.fromMe) return;
    const text = message.body;
    if (!text) return;

    const chatId = message.from;
    const history = userHistories.get(chatId) || [];

    try {
      const reply = await askLobster(text, history, config);
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: reply });
      if (history.length > (config.contextWindow || 10) * 2) history.splice(0, 2);
      userHistories.set(chatId, history);
      await message.reply(reply);
    } catch (err) {
      await message.reply('🦞 The lobster got tangled in seaweed.');
      console.error('WhatsApp error:', err.message);
    }
  });

  client.initialize();
  return client;
}
