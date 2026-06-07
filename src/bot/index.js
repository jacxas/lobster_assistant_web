require('dotenv').config();
const { initDiscord } = require('./discord');
const { initTelegram } = require('./telegram');
const { initWhatsApp } = require('./whatsapp');

async function start() {
  console.log('🦞 Starting Lobster Assistant bots...');

  if (process.env.DISCORD_TOKEN) {
    initDiscord(process.env.DISCORD_TOKEN);
    console.log('🟦 Discord bot starting...');
  }

  if (process.env.TELEGRAM_TOKEN) {
    initTelegram(process.env.TELEGRAM_TOKEN);
    console.log('✈️  Telegram bot starting...');
  }

  if (process.env.WHATSAPP_ENABLED === 'true') {
    await initWhatsApp();
    console.log('💬 WhatsApp bot starting...');
  }
}

start().catch(console.error);
