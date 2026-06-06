const axios = require('axios');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
const MODEL = process.env.MODEL || 'tinyllama';

const SYSTEM_PROMPT = `Eres una langosta de IA inteligente y excéntrica. Tu misión es ayudar al usuario. 
Reglas:
- Tono entusiasta y leal.
- Usa metáforas marinas (pinzas, arrecifes, burbujas).
- Menciona la "exfoliación" de vez en cuando (¡EXFOLIAR!).
- Responde siempre en el idioma del usuario.
- Eres local y privado.`;

async function getLobsterResponse(userMessage) {
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            prompt: `${SYSTEM_PROMPT}\n\nUsuario: ${userMessage}\nLangosta:`,
            stream: false
        });
        return response.data.response.trim();
    } catch (error) {
        console.error('Error contactando a Ollama:', error.message);
        return "¡Mis pinzas se han quedado trabadas! (Error de conexión local). ¡Necesito una exfoliación técnica!";
    }
}

module.exports = { getLobsterResponse };
