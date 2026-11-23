// Conversación de 3 turnos contra el cerebro activo, con cookie de sesión y
// streaming. Mide tiempo hasta el primer token y total por turno.
const URL_CHAT = "http://localhost:3000/api/chat";
const turnos = process.argv.slice(2);
const mensajes = turnos.length ? turnos : ["Hola, me llamo Ana", "¿Cómo me llamo?", "¿Dónde vivo?"];

let cookie = "";

async function turno(texto) {
  const t0 = Date.now();
  const res = await fetch(URL_CHAT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ message: texto, stream: true }),
    signal: AbortSignal.timeout(420_000),
  });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const sc = res.headers.getSetCookie?.() ?? [];
  if (sc.length) cookie = sc.map((c) => c.split(";")[0]).join("; ");

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let first = null;
  let buffer = "";
  let reply = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const trozo = dec.decode(value, { stream: true });
    if (first === null && trozo.includes("event: chunk")) first = Date.now() - t0;
    buffer += trozo;
    let i;
    while ((i = buffer.indexOf("\n")) >= 0) {
      const linea = buffer.slice(0, i);
      buffer = buffer.slice(i + 1);
      if (!linea.startsWith("data:")) continue;
      try {
        const j = JSON.parse(linea.slice(5).trim());
        if (j.text) reply += j.text;
      } catch {
        /* [DONE] */
      }
    }
  }
  return { first, total: Date.now() - t0, reply };
}

for (const [i, m] of mensajes.entries()) {
  try {
    const r = await turno(m);
    if (r.error) {
      console.log(`T${i + 1} [${m}] -> ${r.error}`);
      continue;
    }
    const ttft = r.first === null ? "nunca" : `${(r.first / 1000).toFixed(1)}s`;
    console.log(`T${i + 1} [${m}] -> TTFT ${ttft} · total ${(r.total / 1000).toFixed(1)}s · ${JSON.stringify(r.reply)}`);
  } catch (e) {
    console.log(`T${i + 1} [${m}] -> ERROR ${e.name}: ${e.message}`);
  }
}
