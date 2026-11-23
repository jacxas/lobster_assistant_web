// Mide tiempo hasta el primer token y total, contra el chat en streaming.
const t0 = Date.now();
const res = await fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: process.argv[2] || "Responde solo: hola", stream: true }),
});
if (!res.ok) {
  console.log("HTTP", res.status, await res.text());
  process.exit(1);
}
const reader = res.body.getReader();
const dec = new TextDecoder();
let first = null;
let texto = "";
let eventos = 0;
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  const trozo = dec.decode(value, { stream: true });
  if (first === null && trozo.includes("event: chunk")) first = Date.now() - t0;
  eventos += (trozo.match(/event:/g) || []).length;
  for (const linea of trozo.split("\n")) {
    if (linea.startsWith("data:")) {
      try {
        const j = JSON.parse(linea.slice(5).trim());
        if (j.text) texto += j.text;
      } catch {
        /* [DONE] o línea parcial */
      }
    }
  }
}
const total = Date.now() - t0;
console.log(`TTFT=${first === null ? "nunca" : (first / 1000).toFixed(1) + "s"} total=${(total / 1000).toFixed(1)}s eventos=${eventos}`);
console.log(`respuesta: ${JSON.stringify(texto)}`);
