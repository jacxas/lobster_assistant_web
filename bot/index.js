require('dotenv').config();

console.log(`
🦞 INICIANDO EL ASISTENTE LANGOSTA MULTI-PLATAFORMA 🦞
------------------------------------------------------
`);

// Cargar conectores según configuración en .env
if (process.env.TELEGRAM_TOKEN) {
    require('./telegram.js');
}

if (process.env.DISCORD_TOKEN) {
    require('./discord.js');
}

if (process.env.WHATSAPP_ENABLED === 'true') {
    require('./whatsapp.js');
}

if (process.env.SLACK_TOKEN) {
    require('./slack.js'); // Nota: Slack requiere configuración adicional de App
    console.log('Módulo de Slack cargado (requiere configuración de App en Slack API)');
}

console.log('¡Sistemas listos! El asistente está escuchando en las profundidades de tus dispositivos.');
