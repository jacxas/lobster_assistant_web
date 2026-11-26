"""Genera el icono de Lobster (ICO multi-tamaño): cuadrado naranja con monograma."""
import os
from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(REPO, "lobster.ico")
PREVIEW = os.path.join(REPO, "lobster-icono-preview.png")

NARANJA_ARRIBA = (251, 146, 60)
NARANJA_ABAJO = (234, 88, 12)
BLANCO = (255, 255, 255, 245)
FUENTE_B = r"C:\Windows\Fonts\segoeuib.ttf"


def dibujar(size):
    # fondo con degradado vertical
    img = Image.new("RGB", (size, size), NARANJA_ABAJO)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(1, size - 1)
        d.line(
            [(0, y), (size, y)],
            fill=(
                int(NARANJA_ARRIBA[0] + (NARANJA_ABAJO[0] - NARANJA_ARRIBA[0]) * t),
                int(NARANJA_ARRIBA[1] + (NARANJA_ABAJO[1] - NARANJA_ARRIBA[1]) * t),
                int(NARANJA_ARRIBA[2] + (NARANJA_ABAJO[2] - NARANJA_ARRIBA[2]) * t),
            ),
        )

    # esquinas redondeadas
    mascara = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.23), fill=255)
    img = img.convert("RGBA")
    img.putalpha(mascara)

    d = ImageDraw.Draw(img)
    # monograma "L" centrado ópticamente
    try:
        f = ImageFont.truetype(FUENTE_B, int(size * 0.68))
    except Exception:
        f = ImageFont.load_default()
    caja = d.textbbox((0, 0), "L", font=f)
    ancho, alto = caja[2] - caja[0], caja[3] - caja[1]
    d.text(
        ((size - ancho) / 2 - caja[0], (size - alto) / 2 - caja[1] - size * 0.03),
        "L",
        font=f,
        fill=BLANCO,
    )
    return img


tamanos = [256, 128, 64, 48, 32, 16]
imgs = [dibujar(t) for t in tamanos]
imgs[0].save(SALIDA, format="ICO", sizes=[(t, t) for t in tamanos])
imgs[0].save(PREVIEW)
print(f"ICO: {SALIDA} ({os.path.getsize(SALIDA)/1024:.0f} KB)")
