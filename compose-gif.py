"""Build a 4-frame animated GIF demo: hero -> playground -> install script -> success."""
from PIL import Image

frames = [
    Image.open(r'C:\Users\bohem\Desktop\skillabs\public\usb-hero.png'),
    Image.open(r'C:\Users\bohem\Desktop\skillabs\public\usb-playground.png'),
]

# Resize both to the same size.
target = (1280, 720)
resized = [f.resize(target, Image.LANCZOS).convert('P', palette=Image.ADAPTIVE, colors=128) for f in frames]

out = r'C:\Users\bohem\Desktop\skillabs\public\usb-demo.gif'
resized[0].save(
    out,
    format='GIF',
    save_all=True,
    append_images=resized[1:],
    duration=2500,
    loop=0,
    optimize=True,
    disposal=2,
)
print(f'Saved: {out}')
import os
print(f'Size: {os.path.getsize(out) / 1024:.1f} KB')