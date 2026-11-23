// Catálogo curado de modelos locales (descarga bajo demanda, un perfil por tipo de PC).
// Menos es más: perfiles con rol claro. Las URLs se verifican con HEAD en el endpoint /api/models.
export interface CatalogEntry {
  id: string;
  name: string;
  role: "eco" | "estandar" | "ligero";
  sizeBytes: number;
  ramGb: number;
  contextLength: number;
  uncensored: boolean;
  url: string;
  sha256?: string;
  notes: string;
}

export const MODEL_CATALOG: CatalogEntry[] = [
  {
    id: "eco-qwen05",
    name: "Qwen 2.5 0.5B Instruct (Q4_K_M)",
    role: "eco",
    sizeBytes: 397_808_192,
    ramGb: 1,
    contextLength: 32768,
    uncensored: false,
    url: "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf",
    notes:
      "El más rápido en PCs de 3-4 GB y CPUs viejas (la mitad de peso que el 1B). Respuestas simples: sirve para frases cortas y tareas de una herramienta.",
  },
  {
    id: "eco-qwen15",
    name: "Qwen 2.5 1.5B Instruct (Q4_K_M)",
    role: "eco",
    sizeBytes: 986_000_000,
    ramGb: 2,
    contextLength: 32768,
    uncensored: false,
    url: "https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf",
    notes: "Mejor seguimiento de instrucciones en tamaño mínimo. Ideal para el plan Eco y PCs de 4 GB.",
  },
  {
    id: "ligero-llama32-1b",
    name: "Llama 3.2 1B Instruct (Q4_K_M)",
    role: "ligero",
    sizeBytes: 808_000_000,
    ramGb: 2,
    contextLength: 131072,
    uncensored: false,
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    notes: "El más liviano: arranca en cualquier PC y en teléfonos. Menos preciso con las herramientas.",
  },
  {
    id: "estandar-qwen25-3b",
    name: "Qwen 2.5 3B Instruct (Q4_K_M)",
    role: "estandar",
    sizeBytes: 1_930_000_000,
    ramGb: 4,
    contextLength: 32768,
    uncensored: false,
    url: "https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    notes: "Salto real de calidad para PCs con 8 GB. Sigue instrucciones y usa herramientas con bastante más fiabilidad.",
  },
];

export const findModel = (id: string): CatalogEntry | undefined => MODEL_CATALOG.find((entry) => entry.id === id);
