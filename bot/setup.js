const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(__dirname, '.env');

console.log(`
🦞 ¡BIENVENIDO AL CONFIGURADOR DE LA LANGOSTA ASISTENTE! 🦞
---------------------------------------------------------
Este asistente te guiará para conectar tus cuentas y 
asegurar que todo funcione localmente. ¡EXFOLIAR!
`);

const config = {};

async function startSetup() {
    config.TELEGRAM_TOKEN = await askQuestion('¿Cuál es tu Token de Bot de Telegram? (Déjalo en blanco para omitir): ');
    config.DISCORD_TOKEN = await askQuestion('¿Cuál es tu Token de Bot de Discord? (Déjalo en blanco para omitir): ');
    config.SLACK_TOKEN = await askQuestion('¿Cuál es tu Token de Slack? (Déjalo en blanco para omitir): ');
    config.WHATSAPP_ENABLED = (await askQuestion('¿Quieres habilitar WhatsApp? (s/n): ')).toLowerCase() === 's' ? 'true' : 'false';
    
    config.MODEL = await askQuestion('¿Qué modelo de Ollama quieres usar? (Por defecto: tinyllama): ') || 'tinyllama';

    let envContent = '';
    for (const [key, value] of Object.entries(config)) {
        if (value) {
            envContent += `${key}=${value}\n`;
        }
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`
✅ ¡Configuración guardada en .env!
Tus pinzas están listas. Para iniciar el asistente, usa:
node index.js

¡EXFOLIAR! 🦞
`);
    rl.close();
}

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

startSetup();
