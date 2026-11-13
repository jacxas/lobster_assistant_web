import 'dotenv/config';

// Cerebro unificado: el bot NO habla directo con Ollama.
// Llama al endpoint /api/chat del server Lobster (una sola personalidad,
// un solo historial en SQLite). Requiere el server corriendo: pnpm dev:server
const SERVER_URL = (process.env.LOBSTER_SERVER_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function getLobsterResponse(userMessage, { platform = 'discord', chatId } = {}) {
    try {
        const response = await fetch(`${SERVER_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(INTERNAL_API_KEY ? { 'x-internal-key': INTERNAL_API_KEY } : {}),
            },
            body: JSON.stringify({
                message: userMessage,
                platform,
                stream: false,
                ...(chatId ? { chatId: String(chatId) } : {}),
            })
        });
        if (!response.ok) {
            throw new Error(`Server respondio HTTP ${response.status}`);
        }
        const data = await response.json();
        return (data.reply || '').trim() || '...';
    } catch (error) {
        console.error('Error contactando al servidor Lobster:', error.message);
        return '¡Mis pinzas se han quedado trabadas! (No llego al servidor). ¿Está corriendo "pnpm dev:server"? ¡Necesito una exfoliación técnica!';
    }
}
