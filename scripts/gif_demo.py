"""Compone el GIF de producto a partir de las capturas reales del panel."""
import os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.join(os.path.dirname(__file__), "..", ".data", "demo")
SALIDA = os.path.join(os.path.dirname(__file__), "..", "..", "lobster-demo.gif")
ANCHO = 820
BARRA = 58
ALTO_IMG = round(640 * ANCHO / 1000)
ALTO = ALTO_IMG + BARRA
FONDO = (11, 11, 13)
NARANJA = (249, 115, 22)
BLANCO = (255, 255, 255)
GRIS = (160, 160, 170)

FUENTE = r"C:\Windows\Fonts\segoeui.ttf"
FUENTE_B = r"C:\Windows\Fonts\segoeuib.ttf"


def font(ruta, size):
    try:
        return ImageFont.truetype(ruta, size)
    except Exception:
        return ImageFont.load_default()


def frame_captura(png, titulo, subtitulo=None):
    img = Image.open(os.path.join(BASE, png)).convert("RGB")
    img = img.resize((ANCHO, ALTO_IMG), Image.LANCZOS)
    lienzo = Image.new("RGB", (ANCHO, ALTO), FONDO)
    lienzo.paste(img, (0, 0))
    d = ImageDraw.Draw(lienzo)
    d.rectangle([0, ALTO_IMG, ANCHO, ALTO], fill=(18, 18, 22))
    d.rectangle([0, ALTO_IMG, ANCHO, ALTO_IMG + 3], fill=NARANJA)
    d.text((24, ALTO_IMG + 11), titulo, font=font(FUENTE_B, 19), fill=BLANCO)
    if subtitulo:
        d.text((24, ALTO_IMG + 33), subtitulo, font=font(FUENTE, 14), fill=GRIS)
    return lienzo


def frame_texto(titulo, sub, pie=None, tam=40):
    lienzo = Image.new("RGB", (ANCHO, ALTO), FONDO)
    d = ImageDraw.Draw(lienzo)
    f_t = font(FUENTE_B, tam)
    d.text(((ANCHO - d.textlength(titulo, font=f_t)) / 2, ALTO / 2 - 80), titulo, font=f_t, fill=BLANCO)
    f_s = font(FUENTE, 20)
    d.text(((ANCHO - d.textlength(sub, font=f_s)) / 2, ALTO / 2 - 18), sub, font=f_s, fill=GRIS)
    if pie:
        f_p = font(FUENTE_B, 22)
        d.text(((ANCHO - d.textlength(pie, font=f_p)) / 2, ALTO / 2 + 62), pie, font=f_p, fill=NARANJA)
    return lienzo


frames = [
    (frame_texto("Lobster", "El asistente que vive en tu PC. Con manos y ojos.", "v1.0.0 · Windows"), 2600),
    (frame_captura("01-dashboard.png", "Todo el panel corre en tu máquina", "chat · agente · visión · modelos"), 3200),
    (frame_captura("02-chat.png", "Chat con memoria por sesión", "el historial queda en tu disco (SQLite)"), 2800),
    (frame_captura("03-escribiendo.png", "Le hablás en tus palabras", "no hay comandos que memorizar"), 2400),
    (frame_captura("04-generando.png", "El agente trabaja con 23 herramientas", "archivos · comandos permitidos · web · pantalla"), 2600),
    (frame_captura("05-respuesta.png", "Respuesta en segundos", "cerebro en la nube gratuita (Gemini)"), 3800),
    (frame_captura("06-selector.png", "O cambiás al motor local", "llama.cpp incluido: sin internet, nada sale de tu PC"), 4200),
    (frame_captura("07-modelos.png", "Modelos con descarga bajo demanda", "379 MB a 1,8 GB según tu RAM"), 3200),
    (frame_texto("Descargalo gratis", "Windows 10/11 · Node.js 20+ · 25 MB", "lobster.xo.je", tam=36), 3200),
]

# Paleta común: sin ella, cada frame se cuantiza distinto y el GIF parpadea.
base = frames[0][0].convert("P", palette=Image.ADAPTIVE, colors=128)
paletas = [f[0].convert("RGB").quantize(palette=base, dither=Image.FLOYDSTEINBERG) for f in frames]
duraciones = [f[1] for f in frames]

destino = os.path.abspath(SALIDA)
paletas[0].save(
    destino,
    save_all=True,
    append_images=paletas[1:],
    duration=duraciones,
    loop=0,
    optimize=False,
    disposal=1,
)

kb = os.path.getsize(destino) / 1024
print(f"GIF: {destino}")
print(f"{len(frames)} frames / {sum(duraciones)/1000:.1f} s / {kb:.0f} KB")
