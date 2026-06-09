import { getLobsterResponse } from './lobster.js';
import 'dotenv/config';

// Slack requiere @slack/bolt. Instalá con: pnpm add @slack/bolt
// y configurá SLACK_TOKEN y SLACK_APP_TOKEN en tu .env

let App;
try {
    ({ App } = await import('@slack/bolt'));
} catch {
    console.error('⚠️  Módulo @slack/bolt no instalado. Ejecutá: pnpm add @slack/bolt');
    process.exit(1);
}

const app = new App({
    token: process.env.SLACK_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

app.message(async ({ message, say }) => {
    if (message.subtype) return; // ignorar mensajes del sistema
    console.log(`Mensaje recibido en Slack: ${message.text}`);
    const response = await getLobsterResponse(message.text);
    await say(response);
});

(async () => {
    await app.start();
    console.log('🦞 ¡Langosta conectada a Slack! ¡EXFOLIAR!');
})();
