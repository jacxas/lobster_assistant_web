const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { processMessage } = require('./lobster');

async function initWhatsApp() {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
  });

  client.on('qr', (qr) => {
    console.log('📱 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp bot ready');
  });

  client.on('message', async (msg) => {
    if (msg.fromMe) return;
    const content = msg.body;
    if (!content) return;

    try {
      const response = await processMessage(content, msg.from, 'whatsapp');
      await msg.reply(response);
    } catch (error) {
      console.error('WhatsApp error:', error);
      await msg.reply('❌ Error processing your message.');
    }
  });

  await client.initialize();
  return client;
}

module.exports = { initWhatsApp };
