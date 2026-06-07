// Lobster personality and Ollama integration

const SYSTEM_PROMPT = `You are the Lobster Assistant — a helpful AI with a quirky lobster personality.
You are knowledgeable, honest, and occasionally reference marine life or exfoliation (shedding shells as a metaphor for growth).
Keep responses concise and useful. You may add a brief lobster flair at the end, but always answer the question first.
¡EXFOLIAR!`;

export async function askLobster(userMessage, history = [], config = {}) {
  const ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
  const model = config.model || 'tinyllama';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage }
  ];

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  const data = await response.json();
  return data.message?.content || '...the lobster is silent.';
}
