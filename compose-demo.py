"""Compose a 3-frame demo strip from USB hero + playground screenshots."""
from PIL import Image, ImageDraw, ImageFont

hero = Image.open(r'C:\Users\bohem\Desktop\skillabs\public\usb-hero.png')
playground = Image.open(r'C:\Users\bohem\Desktop\skillabs\public\usb-playground.png')

# Resize both to the same height for the strip.
target_h = 720
def resize_to_h(img, h):
    w = int(img.width * h / img.height)
    return img.resize((w, h), Image.LANCZOS)

hero_r = resize_to_h(hero, target_h)
playground_r = resize_to_h(playground, target_h)

gap = 24
total_w = hero_r.width + playground_r.width + gap * 3
canvas = Image.new('RGB', (total_w, target_h + 80), (2, 6, 23))
canvas.paste(hero_r, (gap, 60))
canvas.paste(playground_r, (gap * 2 + hero_r.width, 60))

draw = ImageDraw.Draw(canvas)
try:
    font = ImageFont.truetype('arial.ttf', 28)
    small = ImageFont.truetype('arial.ttf', 18)
except OSError:
    font = ImageFont.load_default()
    small = ImageFont.load_default()

draw.text((gap, 16), '1) Browse the catalog', fill=(34, 211, 238), font=font)
draw.text((gap * 2 + hero_r.width, 16), '2) Try any skill live', fill=(34, 211, 238), font=font)
draw.text((gap, target_h + 60), 'Pick from 529 skills, 65 domains, 14 categories, or 6 curated presets.', fill=(148, 163, 184), font=small)
draw.text((gap * 2 + hero_r.width, target_h + 60), 'Inspect the prompt template, install with one curl command.', fill=(148, 163, 184), font=small)

out = r'C:\Users\bohem\Desktop\skillabs\public\usb-demo.png'
canvas.save(out, optimize=True)
print(f'Saved: {out} ({Image.open(out).size})')