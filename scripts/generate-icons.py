"""
Generates the app's icon, splash and notification images into assets/.
Run: python scripts/generate-icons.py  (needs Pillow). Replace the outputs
with designed artwork any time - app.config.ts only references the files.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / 'assets'
SS = 4  # supersampling factor for smooth edges

CORAL = (255, 75, 85)
PEACH = (255, 138, 91)
WHITE = (255, 255, 255)


def gradient(size, start, end):
    """Diagonal gradient, top-left -> bottom-right."""
    image = Image.new('RGB', (size, size))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            pixels[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(start, end))
    return image


def draw_pin(draw, cx, cy, r, fill, hole=None):
    """A teardrop map pin: circle of radius r centred at (cx, cy) with its tip below."""
    d = r * 1.95
    alpha = math.acos(r / d)
    left = (cx - r * math.sin(alpha), cy + r * math.cos(alpha))
    right = (cx + r * math.sin(alpha), cy + r * math.cos(alpha))
    draw.polygon([left, (cx, cy + d), right], fill=fill)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)
    if hole:
        hr = r * 0.4
        draw.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=hole)


def map_lines(draw, size, color):
    """Faint folded-map creases behind the pin."""
    w = size * 0.035
    for fraction in (0.34, 0.66):
        x = size * fraction
        draw.line([(x, -10), (x + size * 0.06, size + 10)], fill=color, width=round(w))
    draw.line([(-10, size * 0.72), (size + 10, size * 0.6)], fill=color, width=round(w))


def mark(size, background=True, pin_color=WHITE, hole=CORAL, scale=1.0):
    big = size * SS
    if background:
        image = gradient(big, CORAL, PEACH).convert('RGBA')
        overlay = Image.new('RGBA', (big, big), (0, 0, 0, 0))
        map_lines(ImageDraw.Draw(overlay), big, (255, 255, 255, 38))
        image = Image.alpha_composite(image, overlay)
    else:
        image = Image.new('RGBA', (big, big), (0, 0, 0, 0))

    r = big * 0.2 * scale
    cx, cy = big / 2, big / 2 - r * 0.45
    if background:
        # Soft drop shadow under the pin.
        shadow = Image.new('RGBA', (big, big), (0, 0, 0, 0))
        draw_pin(ImageDraw.Draw(shadow), cx, cy + big * 0.015, r, (120, 20, 30, 90))
        image = Image.alpha_composite(image, shadow.filter(ImageFilter.GaussianBlur(big * 0.02)))
    draw_pin(ImageDraw.Draw(image), cx, cy, r, pin_color, hole)
    return image.resize((size, size), Image.LANCZOS)


def rounded(image, radius_fraction=0.225):
    size = image.size[0]
    m = Image.new('L', (size * SS, size * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size * SS, size * SS], radius=size * SS * radius_fraction, fill=255)
    m = m.resize((size, size), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(image, (0, 0), m)
    return out


def main():
    OUT.mkdir(exist_ok=True)
    # iOS / store icon: full-bleed, no transparency (the OS rounds the corners).
    mark(1024).convert('RGB').save(OUT / 'icon.png')
    # Android adaptive icon: the pin inside the safe zone, background color set in app.config.ts.
    mark(1024, background=False, scale=0.62).save(OUT / 'adaptive-icon.png')
    # Android 13+ themed icon: a single-color silhouette.
    mark(1024, background=False, hole=(0, 0, 0, 0), scale=0.62).save(OUT / 'adaptive-icon-monochrome.png')
    # Splash: the rounded icon mark on a plain background.
    rounded(mark(1024)).save(OUT / 'splash-icon.png')
    # Android notification small icon: white silhouette only.
    mark(96, background=False, hole=(0, 0, 0, 0), scale=1.15).save(OUT / 'notification-icon.png')
    rounded(mark(48)).save(OUT / 'favicon.png')
    print('Wrote icons to', OUT)


if __name__ == '__main__':
    main()
