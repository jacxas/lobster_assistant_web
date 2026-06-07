import { createDiscordBot } from './discord.js';
import { createTelegramBot } from './telegram.js';
import { createWhatsAppBot } from './whatsapp.js';
import { readFileSync } from 'fs';

let config;
try {
  config = JSON.parse(readFileSync('./config.json', 'utf8'));
} catch {
  console.error('❌ No config.json found. Run: node src/bot/setup.js');
  process.exit(1);
}

console.log('🦞 Lobster Assistant starting up...');
console.log(`   Model: ${config.model}`);
console.log(`   Ollama: ${config.ollamaUrl}`);

if (config.platforms?.telegram?.enabled) {
  createTelegramBot(config);
  console.log('✅ Telegram bot started');
}

if (config.platforms?.discord?.enabled) {
  createDiscordBot(config);
  console.log('✅ Discord bot started');
}

if (config.platforms?.whatsapp?.enabled) {
  createWhatsAppBot(config);
  console.log('✅ WhatsApp bot starting (scan QR when prompted)...');
}

console.log('🦞 ¡EXFOLIAR! Lobster is ready.');
