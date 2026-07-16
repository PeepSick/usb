"""Build an animated terminal demo GIF: real curl | bash flow with multi-runtime autodetect.

Story:
  1) Empty prompt
  2) User types the install command
  3) Script detects multiple AI runtimes
  4) Asks the user which one to install into
  5) User picks #2 (claude)
  6) Install streams output
  7) Final badge
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
FPS = 220

def load(size, bold=False):
    paths = ['consolab.ttf' if bold else 'consola.ttf',
             'courbd.ttf' if bold else 'cour.ttf',
             'arialbd.ttf' if bold else 'arial.ttf']
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()

font_prompt = load(22, bold=True)
font_cmd    = load(20, bold=False)
font_out    = load(18, bold=False)
font_ok     = load(18, bold=True)
font_dim    = load(16, bold=False)
font_badge  = load(22, bold=True)
font_btitle = load(28, bold=True)
font_bsub   = load(14, bold=False)
font_input  = load(20, bold=False)

BG       = (15, 23, 42)
PANEL_BG = (2, 6, 23)
BORDER   = (51, 65, 85)
PROMPT   = (34, 211, 238)
CMD      = (255, 255, 255)
OK_GREEN = (74, 222, 128)
DIM      = (148, 163, 184)
WARN     = (250, 204, 21)
PINK     = (244, 114, 182)
HILIGHT  = (251, 191, 36)
SEL      = (244, 114, 182)

INSTALL_CMD = 'curl -fsSL https://usb.peepsicklabs.com/api/install?target=auto | bash'

DETECT_LINES = [
    ("🔍", "Detecting AI runtimes on this machine...",                 DIM),
    ("  ", "  ✓ /home/dev/.leosis/",                                  OK_GREEN),
    ("  ", "  ✓ /home/dev/.claude/",                                  OK_GREEN),
    ("  ", "  ✓ /home/dev/.opencode/",                                OK_GREEN),
]

DETECTED_NAMES = ["leosis", "claude", "opencode", "generic (custom path)"]
PROMPT_TEXT    = "Which one should USB install into? (number): "
PICK_INDEX    = 1  # user picks "2" -> claude (0-indexed: 1)

INSTALL_LINES = [
    ("📂", "Target: claude (selected by user)",                        DIM),
    ("📦", "Fetching 73 skills (preset: web-dev)...",                  DIM),
    ("   ", "  ✓ intent-router.md",                                    OK_GREEN),
    ("   ", "  ✓ react-state-build.md",                                OK_GREEN),
    ("   ", "  ✓ oauth-flows.md",                                      OK_GREEN),
    ("   ", "  ✓ ... 70 more",                                         DIM),
    ("   ", "Writing to ~/.claude/skills/web-dev/ ...",                DIM),
    ("   ", "  ✓ 73/73 files written",                                 OK_GREEN),
    ("",  "",                                                          None),
    ("✅", "Done. 73 skills installed for target: claude",             OK_GREEN),
]

def text_w(draw, txt, font):
    bbox = draw.textbbox((0, 0), txt, font=font)
    return bbox[2] - bbox[0]

def render_frame(state):
    img = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    for y in range(6):
        t = y / 6
        r = int(34 + (168 - 34) * t)
        g = int(211 - (211 - 85) * t)
        b = int(238 - (238 - 247) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    pad = 32
    panel_x1, panel_y1 = pad, pad + 12
    panel_x2, panel_y2 = W - pad, H - pad - 80
    draw.rounded_rectangle(
        [(panel_x1, panel_y1), (panel_x2, panel_y2)],
        radius=14, fill=PANEL_BG, outline=BORDER, width=1,
    )

    header_h = 36
    draw.rounded_rectangle(
        [(panel_x1, panel_y1), (panel_x2, panel_y1 + header_h)],
        radius=14, fill=(15, 23, 42),
    )
    for i, c in enumerate([(252, 101, 101), (250, 204, 21), (74, 222, 128)]):
        cx = panel_x1 + 22 + i * 22
        cy = panel_y1 + header_h // 2
        draw.ellipse([(cx - 6, cy - 6), (cx + 6, cy + 6)], fill=c)
    draw.text((panel_x1 + 110, panel_y1 + 8),
              "~/projects — usb install demo",
              fill=DIM, font=font_dim)

    cx = panel_x1 + 28
    cy = panel_y1 + header_h + 20
    line_h = 28

    # First prompt: type install command
    typed_cmd = state.get('typed_cmd', '')
    if typed_cmd is not None:
        prompt_text = '➜  '
        draw.text((cx, cy), prompt_text, fill=PROMPT, font=font_prompt)
        px = cx + text_w(draw, prompt_text, font_prompt) + 6
        draw.text((px, cy), typed_cmd, fill=CMD, font=font_cmd)
        if state.get('cmd_cursor', False):
            cw = text_w(draw, typed_cmd, font_cmd)
            draw.rectangle([(px + cw + 2, cy + 4), (px + cw + 6, cy + 24)], fill=CMD)
        cy += line_h + 4

    # Detect lines (stream)
    cy += 6
    for line in state.get('detect_lines', []):
        glyph, txt, color = line
        if glyph.strip():
            draw.text((cx, cy), glyph, fill=PROMPT, font=font_out)
            gx = cx + 24
        else:
            gx = cx
        if txt:
            draw.text((gx, cy), txt, fill=color or DIM, font=font_out)
        cy += line_h - 4

    # Detected summary line
    if state.get('show_detected', False):
        cy += 4
        draw.text((cx, cy), "Multiple AI runtimes detected:", fill=WARN, font=font_ok)
        cy += line_h
        summary = '  ' + '  '.join(DETECTED_NAMES[:3])
        draw.text((cx, cy), summary, fill=DIM, font=font_dim)
        cy += line_h

    # Interactive prompt
    if state.get('show_prompt', False):
        cy += 4
        draw.text((cx, cy), PROMPT_TEXT, fill=HILIGHT, font=font_ok)
        cy += line_h - 4
        for i, name in enumerate(DETECTED_NAMES):
            marker = '> ' if i == state.get('picked_index') else '  '
            line_color = SEL if (i == state.get('picked_index') and state.get('picked_done', False)) else DIM
            draw.text((cx + 8, cy), f"{marker}{i+1}) {name}", fill=line_color, font=font_input)
            cy += line_h - 4

    # Selected confirmation
    if state.get('show_selected', False):
        sel_name = DETECTED_NAMES[state.get('picked_index', PICK_INDEX)]
        draw.text((cx + 8, cy), f"  ✓ Selected: {sel_name}", fill=OK_GREEN, font=font_ok)
        cy += line_h + 4

    # Install output lines (post-pick)
    cy += 4
    for line in state.get('install_lines', []):
        glyph, txt, color = line
        if glyph.strip():
            draw.text((cx, cy), glyph, fill=PROMPT, font=font_out)
            gx = cx + 24
        else:
            gx = cx
        if txt:
            draw.text((gx, cy), txt, fill=color or DIM, font=font_out)
        cy += line_h - 4

    # Final badge
    if state.get('show_badge', False):
        badge_h = 56
        by = H - 64
        draw.rounded_rectangle(
            [(cx, by), (cx + 380, by + badge_h)],
            radius=12, fill=(2, 6, 23, 220), outline=PROMPT, width=2,
        )
        draw.text((cx + 16, by + 8), "✅ USB · 73 skills live (claude)", fill=OK_GREEN, font=font_btitle)
        draw.text((cx + 16, by + 36), "Run `usb search` or open /playground/intent-router", fill=DIM, font=font_bsub)

    return img

# ---- Timeline ---------------------------------------------------------------
timeline = []

# Phase A: empty prompt
timeline.append({'typed_cmd': '', 'cmd_cursor': True})

# Phase B: typing the install command (4 chars at a time)
typing_step = 4
for i in range(0, len(INSTALL_CMD) + 1, typing_step):
    timeline.append({'typed_cmd': INSTALL_CMD[:i], 'cmd_cursor': True})
for _ in range(2):
    timeline.append({'typed_cmd': INSTALL_CMD, 'cmd_cursor': True})

# Phase C: clear cursor + show empty detect
timeline.append({'typed_cmd': INSTALL_CMD, 'cmd_cursor': False})

# Phase D: stream detect lines
for end_idx in range(len(DETECT_LINES) + 1):
    timeline.append({
        'typed_cmd': INSTALL_CMD,
        'cmd_cursor': False,
        'detect_lines': DETECT_LINES[:end_idx],
    })

# Phase E: detected summary
timeline.append({
    'typed_cmd': INSTALL_CMD,
    'cmd_cursor': False,
    'detect_lines': DETECT_LINES,
    'show_detected': True,
})
for _ in range(2):
    timeline.append({
        'typed_cmd': INSTALL_CMD,
        'cmd_cursor': False,
        'detect_lines': DETECT_LINES,
        'show_detected': True,
    })

# Phase F: prompt + options (animate highlight moves to claude = index 1)
for picked in range(4):
    timeline.append({
        'typed_cmd': INSTALL_CMD,
        'cmd_cursor': False,
        'detect_lines': DETECT_LINES,
        'show_detected': True,
        'show_prompt': True,
        'picked_index': picked,
        'picked_done': False,
    })
# Hold position 2 (claude)
for _ in range(2):
    timeline.append({
        'typed_cmd': INSTALL_CMD,
        'cmd_cursor': False,
        'detect_lines': DETECT_LINES,
        'show_detected': True,
        'show_prompt': True,
        'picked_index': PICK_INDEX,
        'picked_done': False,
    })
# Confirm selection
for _ in range(2):
    timeline.append({
        'typed_cmd': INSTALL_CMD,
        'cmd_cursor': False,
        'detect_lines': DETECT_LINES,
        'show_detected': True,
        'show_prompt': True,
        'picked_index': PICK_INDEX,
        'picked_done': True,
        'show_selected': True,
    })

# Phase G: install lines stream
for end_idx in range(len(INSTALL_LINES) + 1):
    timeline.append({
        'typed_cmd': INSTALL_CMD,
        'cmd_cursor': False,
        'detect_lines': DETECT_LINES,
        'show_detected': True,
        'show_prompt': True,
        'picked_index': PICK_INDEX,
        'picked_done': True,
        'show_selected': True,
        'install_lines': INSTALL_LINES[:end_idx],
    })
    if end_idx == len(INSTALL_LINES):
        for _ in range(3):
            timeline.append(timeline[-1])

# Phase H: final badge
final_state = {
    'typed_cmd': INSTALL_CMD,
    'cmd_cursor': False,
    'detect_lines': DETECT_LINES,
    'show_detected': True,
    'show_prompt': True,
    'picked_index': PICK_INDEX,
    'picked_done': True,
    'show_selected': True,
    'install_lines': INSTALL_LINES,
    'show_badge': True,
}
for _ in range(4):
    timeline.append(final_state)

# Quantize + assemble GIF
quant_frames = []
for s in timeline:
    img = render_frame(s).convert('RGB')
    quant = img.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    quant_frames.append(quant)

out = r'C:\Users\bohem\Desktop\skillabs\public\usb-demo.gif'
quant_frames[0].save(
    out,
    format='GIF',
    save_all=True,
    append_images=quant_frames[1:],
    duration=FPS,
    loop=0,
    optimize=True,
    disposal=2,
)
size_kb = os.path.getsize(out) / 1024
print(f'Saved: {out}')
print(f'Size: {size_kb:.1f} KB ({len(timeline)} frames, {FPS}ms = {len(timeline)*FPS/1000:.1f}s)')