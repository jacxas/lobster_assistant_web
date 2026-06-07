#!/usr/bin/env node
import { createInterface } from 'readline';
import { writeFileSync } from 'fs';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

console.log('🦞 Lobster Assistant Setup Wizard');
console.log('================================\n');

const config = {
  model: 'tinyllama',
  ollamaUrl: 'http://localhost:11434',
  personality: 'medium',
  contextWindow: 10,
  maxResponseLength: 500,
  platforms: {
    telegram: { enabled: false },
    discord: { enabled: false },
    whatsapp: { enabled: false },
    slack: { enabled: false }
  }
};

const model = await ask('Which model? (tinyllama/llama3/mistral) [tinyllama]: ');
config.model = model.trim() || 'tinyllama';

const tg = await ask('Enable Telegram? (y/n) [n]: ');
if (tg.toLowerCase() === 'y') {
  const token = await ask('Telegram Bot Token: ');
  config.platforms.telegram = { enabled: true, token: token.trim() };
}

const dc = await ask('Enable Discord? (y/n) [n]: ');
if (dc.toLowerCase() === 'y') {
  const token = await ask('Discord Bot Token: ');
  config.platforms.discord = { enabled: true, token: token.trim() };
}

const wa = await ask('Enable WhatsApp? (y/n) [n]: ');
if (wa.toLowerCase() === 'y') {
  config.platforms.whatsapp = { enabled: true };
  console.log('  ℹ️  A QR code will appear when you start the bot. Scan with WhatsApp → Linked Devices.');
}

writeFileSync('./config.json', JSON.stringify(config, null, 2));
console.log('\n✅ config.json saved!');
console.log('🦞 Run: node src/bot/index.js');
rl.close();
