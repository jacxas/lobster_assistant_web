const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function setup() {
  console.log('🦞 Lobster Assistant Setup');
  console.log('==========================\n');

  const config = {};

  config.API_URL = await question('API URL [http://localhost:3000]: ') || 'http://localhost:3000';

  const useDiscord = await question('Enable Discord bot? (y/n): ');
  if (useDiscord.toLowerCase() === 'y') {
    config.DISCORD_TOKEN = await question('Discord Bot Token: ');
  }

  const useTelegram = await question('Enable Telegram bot? (y/n): ');
  if (useTelegram.toLowerCase() === 'y') {
    config.TELEGRAM_TOKEN = await question('Telegram Bot Token: ');
  }

  const useWhatsApp = await question('Enable WhatsApp bot? (y/n): ');
  if (useWhatsApp.toLowerCase() === 'y') {
    config.WHATSAPP_ENABLED = 'true';
  }

  const envContent = Object.entries(config)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration saved to .env');
  rl.close();
}

setup().catch(console.error);
