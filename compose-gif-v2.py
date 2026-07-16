"""Build a polished 3-frame demo GIF with USB branding overlays.

Frames:
  1) Browse the catalog (hero)
  2) Try any skill live (playground)
  3) One curl command (install script)
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
base = r'C:\Users\bohem\Desktop\skillabs'

steps = [
    (rf"{base}\public\usb-hero.png",       "Step 1", "Browse the catalog",     "529 skills · 65 domains · 14 categories · 6 curated presets"),
    (rf"{base}\public\usb-playground.png", "Step 2", "Try any skill live",     "Inspect prompt template, inputs, outputs & examples before installing"),
    (rf"{base}\public\usb-install.png",    "Step 3", "One npm install, done",  "npm install -g @peepsick/usb-cli — no raw curl | bash, auditable like any package"),
]

try:
    font_step  = ImageFont.truetype('arialbd.ttf', 22)
    font_title = ImageFont.truetype('arialbd.ttf', 38)
    font_sub   = ImageFont.truetype('arial.ttf',  18)
    font_brand = ImageFont.truetype('arialbd.ttf', 16)
except OSError:
    font_step = font_title = font_sub = font_brand = ImageFont.load_default()

frames = []
for path, step_no, title, subtitle in steps:
    img = Image.open(path).convert('RGB')
    img = img.resize((W, H), Image.LANCZOS)

    # Cyan->purple gradient border (8 px total, 4 px each side)
    bordered = Image.new('RGB', (W + 8, H + 8), (2, 6, 23))
    bordered.paste(img, (4, 4))
    overlay = Image.new('RGBA', (W + 8, H + 8), (0, 0, 0, 0))
    draw_o = ImageDraw.Draw(overlay)
    for y in range(H + 8):
        t = y / max(1, H + 8)
        r = int(34 + (168 - 34) * t)
        g = int(211 - (211 - 85) * t)
        b = int(238 - (238 - 247) * t)
        draw_o.line([(0, y), (3, y)], fill=(r, g, b, 255))
        draw_o.line([(W + 4, y), (W + 7, y)], fill=(r, g, b, 255))
    bordered = Image.alpha_composite(bordered.convert('RGBA'), overlay).convert('RGB')

    # Top-left overlay card
    overlay2 = Image.new('RGBA', bordered.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay2)
    pad = 28
    card_w, card_h = 720, 132
    draw.rounded_rectangle(
        [(pad, pad), (pad + card_w, pad + card_h)],
        radius=18, fill=(2, 6, 23, 220),
    )
    draw.rounded_rectangle(
        [(pad + 16, pad + 16), (pad + 110, pad + 50)],
        radius=12, fill=(34, 211, 238, 255),
    )
    draw.text((pad + 26, pad + 20), step_no, fill=(2, 6, 23, 255), font=font_step)
    draw.text((pad + 124, pad + 22), "USB  ·  Universal Skill Bridge", fill=(148, 163, 184, 255), font=font_brand)
    draw.text((pad + 16, pad + 60), title, fill=(255, 255, 255, 255), font=font_title)
    draw.text((pad + 16, pad + 106), subtitle, fill=(203, 213, 225, 255), font=font_sub)

    framed = Image.alpha_composite(bordered.convert('RGBA'), overlay2).convert('RGB')
    quant = framed.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    frames.append(quant)

out = rf"{base}\public\usb-demo.gif"
frames[0].save(
    out,
    format='GIF',
    save_all=True,
    append_images=frames[1:],
    duration=3000,
    loop=0,
    optimize=True,
    disposal=2,
)
print(f'Saved: {out}')
print(f'Size: {os.path.getsize(out) / 1024:.1f} KB ({len(frames)} frames, 3.0s each)')