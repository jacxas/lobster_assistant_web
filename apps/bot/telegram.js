import { Bot } from 'grammy';
import { getLobsterResponse } from './lobster.js';
import 'dotenv/config';

const token = process.env.TELEGRAM_TOKEN;

if (!token) {
    console.log('No se encontró TELEGRAM_TOKEN en el archivo .env');
} else {
    const bot = new Bot(token);

    bot.on('message:text', async (ctx) => {
        const userMessage = ctx.message.text;
        console.log(`Mensaje recibido en Telegram: ${userMessage}`);

        await ctx.replyWithChatAction('typing');

        const response = await getLobsterResponse(userMessage);
        await ctx.reply(response);
    });

    bot.on('message:voice', async (ctx) => {
        await ctx.reply('¡Burbujas! He recibido un mensaje de voz. Mis pinzas aún están aprendiendo a transcribir audio localmente, pero pronto podré escucharte perfectamente. ¡EXFOLIAR!');
    });

    console.log('Conector de Telegram listo para salir a la superficie...');
    bot.start();
}
