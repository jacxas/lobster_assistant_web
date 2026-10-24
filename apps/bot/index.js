import 'dotenv/config';

console.log(`
🦞 INICIANDO EL ASISTENTE LANGOSTA MULTI-PLATAFORMA 🦞
------------------------------------------------------
`);

// Cargar conectores según configuración en .env
if (process.env.TELEGRAM_TOKEN) {
    await import('./telegram.js');
}

if (process.env.DISCORD_TOKEN) {
    await import('./discord.js');
}

if (process.env.WHATSAPP_ENABLED === 'true') {
    await import('./whatsapp.js');
}

if (process.env.SLACK_TOKEN) {
    await import('./slack.js');
    console.log('Módulo de Slack cargado (requiere configuración de App en Slack API)');
}

console.log('¡Sistemas listos! El asistente está escuchando en las profundidades de tus dispositivos.');
